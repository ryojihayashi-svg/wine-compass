import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const sb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET /api/beverages/123
export async function GET(req, { params }) {
  const supabase = sb();
  const { data, error } = await supabase
    .from('wc_beverages')
    .select('*, wc_categories(name, name_en, parent_id)')
    .eq('id', params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

// PATCH /api/beverages/123
export async function PATCH(req, { params }) {
  const body = await req.json();
  const supabase = sb();

  // Get current state for logging
  const { data: prev } = await supabase
    .from('wc_beverages')
    .select('*')
    .eq('id', params.id)
    .single();

  const { data, error } = await supabase
    .from('wc_beverages')
    .update(body)
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log changes
  for (const key of Object.keys(body)) {
    if (prev && prev[key] !== body[key]) {
      await supabase.from('wc_inventory_log').insert({
        beverage_id: Number(params.id),
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
export async function DELETE(req, { params }) {
  const supabase = sb();

  const { data, error } = await supabase
    .from('wc_beverages')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('wc_inventory_log').insert({
    beverage_id: Number(params.id),
    action: 'delete',
    old_value: data.name,
  });

  return NextResponse.json({ success: true });
}
