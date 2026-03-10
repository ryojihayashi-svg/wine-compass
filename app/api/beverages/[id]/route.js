import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const sb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Allowed fields for PATCH updates
const ALLOWED_FIELDS = new Set([
  'name', 'name_kana', 'producer', 'vintage', 'region', 'appellation',
  'grape', 'size_ml', 'quantity', 'price', 'cost_price', 'notes',
  'category_id', 'is_deleted', 'deleted_at', 'store_id',
]);

function filterFields(body) {
  const filtered = {};
  for (const key of Object.keys(body)) {
    if (ALLOWED_FIELDS.has(key)) filtered[key] = body[key];
  }
  return filtered;
}

// GET /api/beverages/123
export async function GET(req, ctx) {
  const { id } = await ctx.params;
  const supabase = sb();
  const { data, error } = await supabase
    .from('wc_beverages')
    .select('*, wc_categories(name, name_en, parent_id)')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

// PATCH /api/beverages/123
export async function PATCH(req, ctx) {
  const { id } = await ctx.params;
  const rawBody = await req.json();
  const body = filterFields(rawBody);

  if (Object.keys(body).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const supabase = sb();

  // If quantity change, try atomic RPC first
  if ('quantity' in body && Object.keys(body).length === 1) {
    // Get current quantity to compute delta
    const { data: prev } = await supabase
      .from('wc_beverages')
      .select('quantity')
      .eq('id', id)
      .single();

    if (prev) {
      const delta = body.quantity - (prev.quantity || 0);
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('wc_update_quantity', { p_beverage_id: Number(id), p_delta: delta, p_reason: 'manual' });

      if (!rpcError && rpcResult && rpcResult.length > 0) {
        // RPC succeeded — return updated beverage
        const { data: updated } = await supabase
          .from('wc_beverages')
          .select('*')
          .eq('id', id)
          .single();
        return NextResponse.json(updated);
      }
      // If RPC fails (function doesn't exist yet), fall through to standard update
    }
  }

  // Get current state for logging
  const { data: prev } = await supabase
    .from('wc_beverages')
    .select('*')
    .eq('id', id)
    .single();

  const { data, error } = await supabase
    .from('wc_beverages')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log changes
  for (const key of Object.keys(body)) {
    if (prev && prev[key] !== body[key]) {
      await supabase.from('wc_inventory_log').insert({
        beverage_id: Number(id),
        action: key === 'quantity' ? (body[key] > prev[key] ? 'add' : 'remove') : 'update',
        field: key,
        old_value: String(prev[key] ?? ''),
        new_value: String(body[key] ?? ''),
        quantity_change: key === 'quantity' ? body[key] - prev[key] : 0,
      });
    }
  }

  return NextResponse.json(data);
}

// DELETE /api/beverages/123 (soft delete)
export async function DELETE(req, ctx) {
  const { id } = await ctx.params;
  const supabase = sb();

  const { data, error } = await supabase
    .from('wc_beverages')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('wc_inventory_log').insert({
    beverage_id: Number(id),
    action: 'delete',
    old_value: data.name,
  });

  return NextResponse.json({ success: true });
}
