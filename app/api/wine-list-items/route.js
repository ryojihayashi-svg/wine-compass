import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const sb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET /api/wine-list-items?store=myoujyaku
// GET /api/wine-list-items?store=myoujyaku&section=シャンパーニュ
// GET /api/wine-list-items?store=myoujyaku&include_inactive=1  (includes deactivated)
export async function GET(req) {
  const url = new URL(req.url);
  const storeId = url.searchParams.get('store');
  const includeInactive = url.searchParams.get('include_inactive');

  const supabase = sb();

  let query = supabase
    .from('wc_wine_list_items')
    .select('*')
    .order('section_order', { ascending: true })
    .order('sort_order', { ascending: true });

  if (!includeInactive) query = query.eq('is_active', true);
  if (storeId) query = query.eq('store_id', storeId);

  // Paginate (Supabase limit = 1000)
  let allItems = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data: batch, error } = await query.range(from, from + PAGE - 1);
    if (error) {
      if (error.message.includes('does not exist') || error.code === '42P01') {
        return NextResponse.json({ items: [], sections: [], total: 0 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!batch || batch.length === 0) break;
    allItems = allItems.concat(batch);
    if (batch.length < PAGE) break;
    from += PAGE;
  }

  // Group by section
  const sectionMap = {};
  for (const item of allItems) {
    const key = `${item.section_order}:${item.section}`;
    if (!sectionMap[key]) {
      sectionMap[key] = {
        section: item.section,
        section_en: item.section_en,
        section_order: item.section_order,
        items: [],
      };
    }
    sectionMap[key].items.push(item);
  }

  const sections = Object.values(sectionMap).sort((a, b) => a.section_order - b.section_order);

  return NextResponse.json({
    items: allItems,
    sections,
    total: allItems.length,
  });
}

// POST /api/wine-list-items — bulk insert
export async function POST(req) {
  const body = await req.json();
  const { store_id, items } = body;

  if (!store_id || !items || !items.length) {
    return NextResponse.json({ error: 'store_id and items[] required' }, { status: 400 });
  }

  const supabase = sb();

  // Insert in chunks
  let totalInserted = 0;
  const errors = [];

  for (let i = 0; i < items.length; i += 200) {
    const chunk = items.slice(i, i + 200).map(item => ({
      store_id,
      section: item.section,
      section_en: item.section_en || null,
      section_order: item.section_order || 0,
      subsection: item.subsection || null,
      subsection_en: item.subsection_en || null,
      name_en: item.name_en,
      name_jp: item.name_jp || null,
      producer_en: item.producer_en || null,
      producer_jp: item.producer_jp || null,
      vintage: item.vintage || null,
      sell_price: item.sell_price || null,
      sell_price_incl: item.sell_price_incl || null,
      cost_price: item.cost_price || null,
      region: item.region || null,
      glass_price: item.glass_price || null,
      sort_order: item.sort_order || 0,
      is_active: true,
    }));

    const { data, error } = await supabase
      .from('wc_wine_list_items')
      .insert(chunk)
      .select('id');

    if (error) {
      errors.push({ chunk: i, error: error.message });
    } else {
      totalInserted += (data?.length || 0);
    }
  }

  return NextResponse.json({
    inserted: totalInserted,
    errors: errors.length ? errors : undefined,
  }, { status: 201 });
}

// DELETE /api/wine-list-items?store=myoujyaku — clear store's wine list items
// DELETE /api/wine-list-items?id=123 — delete single item
export async function DELETE(req) {
  const url = new URL(req.url);
  const storeId = url.searchParams.get('store');
  const itemId = url.searchParams.get('id');

  const supabase = sb();

  // Single item delete
  if (itemId) {
    const { data, error } = await supabase
      .from('wc_wine_list_items')
      .delete()
      .eq('id', itemId)
      .select('id');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ deleted: data?.length || 0 });
  }

  // Bulk delete by store
  if (!storeId) {
    return NextResponse.json({ error: 'store or id param required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('wc_wine_list_items')
    .delete()
    .eq('store_id', storeId)
    .select('id');

  if (error) {
    if (error.message.includes('does not exist') || error.code === '42P01') {
      return NextResponse.json({ deleted: 0 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: data?.length || 0 });
}

// PATCH /api/wine-list-items — update single item or bulk reorder
// Body: { id, updates: { sell_price_incl, name_en, ... } }
// Body: { reorder: [{ id, sort_order }, ...] }
export async function PATCH(req) {
  const body = await req.json();
  const supabase = sb();

  // Bulk reorder
  if (body.reorder && Array.isArray(body.reorder)) {
    const errors = [];
    let updated = 0;
    for (const item of body.reorder) {
      const { error } = await supabase
        .from('wc_wine_list_items')
        .update({ sort_order: item.sort_order })
        .eq('id', item.id);
      if (error) errors.push({ id: item.id, error: error.message });
      else updated++;
    }
    return NextResponse.json({ updated, errors: errors.length ? errors : undefined });
  }

  // Single item update
  const { id, updates } = body;
  if (!id || !updates) {
    return NextResponse.json({ error: 'id and updates required' }, { status: 400 });
  }

  // Whitelist allowed fields
  const allowed = ['name_en', 'name_jp', 'producer_en', 'producer_jp', 'vintage',
    'sell_price', 'sell_price_incl', 'cost_price', 'glass_price', 'region',
    'section', 'section_en', 'section_order', 'sort_order', 'is_active'];
  const clean = {};
  for (const k of allowed) {
    if (updates[k] !== undefined) clean[k] = updates[k];
  }

  if (Object.keys(clean).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('wc_wine_list_items')
    .update(clean)
    .eq('id', id)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ item: data?.[0] || null });
}
