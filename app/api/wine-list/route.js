import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const sb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET /api/wine-list?store=hakune — get wine list for a store
// GET /api/wine-list?store=hakune&category=2 — filter by category
export async function GET(req) {
  const url = new URL(req.url);
  const storeId = url.searchParams.get('store');
  const category = url.searchParams.get('category') ? parseInt(url.searchParams.get('category')) : null;

  const supabase = sb();

  let query = supabase
    .from('wc_wine_list')
    .select(`
      id,
      store_id,
      beverage_id,
      sell_price,
      sort_order,
      is_active,
      notes,
      created_at,
      wc_beverages (
        id, name, producer, vintage, region, appellation, grape,
        size_ml, quantity, price, cost_price, category_id, store_id,
        wc_categories ( id, name, name_en, parent_id )
      )
    `)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (storeId) query = query.eq('store_id', storeId);

  const { data, error } = await query;

  if (error) {
    // Table might not exist yet — return empty
    if (error.message.includes('does not exist') || error.message.includes('schema cache') || error.code === '42P01') {
      return NextResponse.json({ items: [], total: 0 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let items = (data || []).map(wl => ({
    ...wl,
    beverage: wl.wc_beverages,
    category: wl.wc_beverages?.wc_categories,
  }));

  // Filter by category if specified
  if (category) {
    items = items.filter(wl => {
      const catId = wl.beverage?.category_id;
      const parentId = wl.category?.parent_id;
      return catId === category || parentId === category;
    });
  }

  return NextResponse.json({
    items,
    total: items.length,
  });
}

// POST /api/wine-list — add item(s) to wine list
export async function POST(req) {
  const body = await req.json();
  const supabase = sb();

  // Support single or batch add
  const entries = body.items || [body];
  const results = [];

  for (const entry of entries) {
    const { store_id, beverage_id, sell_price, sort_order, notes } = entry;

    if (!store_id || !beverage_id) {
      results.push({ beverage_id, ok: false, error: 'store_id and beverage_id required' });
      continue;
    }

    // Get max sort_order for this store if not specified
    let finalSortOrder = sort_order;
    if (finalSortOrder == null) {
      const { data: maxData } = await supabase
        .from('wc_wine_list')
        .select('sort_order')
        .eq('store_id', store_id)
        .eq('is_active', true)
        .order('sort_order', { ascending: false })
        .limit(1);
      finalSortOrder = (maxData?.[0]?.sort_order || 0) + 10;
    }

    // Upsert: if already exists for this store+beverage, reactivate
    const { data, error } = await supabase
      .from('wc_wine_list')
      .upsert({
        store_id,
        beverage_id,
        sell_price: sell_price || null,
        sort_order: finalSortOrder,
        is_active: true,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'store_id,beverage_id',
      })
      .select()
      .single();

    if (error) {
      results.push({ beverage_id, ok: false, error: error.message });
    } else {
      results.push({ beverage_id, ok: true, data });
    }
  }

  return NextResponse.json({
    results,
    added: results.filter(r => r.ok).length,
    errors: results.filter(r => !r.ok).length,
  }, { status: 201 });
}

// PATCH /api/wine-list — update wine list item(s)
export async function PATCH(req) {
  const body = await req.json();
  const supabase = sb();

  // Support single or batch update
  const updates = body.items || [body];
  const results = [];

  for (const entry of updates) {
    const { id, sell_price, sort_order, is_active, notes } = entry;
    if (!id) {
      results.push({ id, ok: false, error: 'id required' });
      continue;
    }

    const update = { updated_at: new Date().toISOString() };
    if (sell_price !== undefined) update.sell_price = sell_price;
    if (sort_order !== undefined) update.sort_order = sort_order;
    if (is_active !== undefined) update.is_active = is_active;
    if (notes !== undefined) update.notes = notes;

    const { data, error } = await supabase
      .from('wc_wine_list')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      results.push({ id, ok: false, error: error.message });
    } else {
      results.push({ id, ok: true, data });
    }
  }

  return NextResponse.json({ results });
}

// DELETE /api/wine-list — remove from wine list (soft delete by setting is_active=false)
export async function DELETE(req) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const supabase = sb();
  const { error } = await supabase
    .from('wc_wine_list')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
