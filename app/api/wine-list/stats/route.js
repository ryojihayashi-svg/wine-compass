import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const sb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET /api/wine-list/stats — returns wine list stats per store
export async function GET() {
  const supabase = sb();

  // Get categories for parent-child mapping
  const { data: categories } = await supabase
    .from('wc_categories')
    .select('id, name, name_en, parent_id, sort_order')
    .order('sort_order');

  // Step 1: Get all active wine list items (NO join — avoids schema cache issues)
  const { data: wlItems, error } = await supabase
    .from('wc_wine_list')
    .select('id, store_id, beverage_id, sell_price')
    .eq('is_active', true);

  if (error) {
    if (error.message.includes('does not exist') || error.code === '42P01' || error.message.includes('schema cache')) {
      return NextResponse.json({ stores: {}, total: 0 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!wlItems || wlItems.length === 0) {
    return NextResponse.json({ stores: {}, total: 0, totalValue: 0 });
  }

  // Step 2: Get beverage data for category mapping
  const bevIds = [...new Set(wlItems.map(i => i.beverage_id))];
  const { data: beverages } = await supabase
    .from('wc_beverages')
    .select('id, category_id, price')
    .in('id', bevIds);

  // Build beverage lookup map
  const bevMap = {};
  for (const b of (beverages || [])) {
    bevMap[b.id] = b;
  }

  // Build parent-child map
  const parentChildren = {};
  for (const cat of (categories || [])) {
    if (cat.parent_id) {
      if (!parentChildren[cat.parent_id]) parentChildren[cat.parent_id] = [];
      parentChildren[cat.parent_id].push(cat.id);
    }
  }

  // Group by store
  const storeItems = {};
  for (const item of wlItems) {
    const sid = item.store_id || '_none';
    if (!storeItems[sid]) storeItems[sid] = [];
    storeItems[sid].push(item);
  }

  // Aggregate per store
  const aggregateStore = (items) => {
    const directCounts = {};
    let total = 0, totalValue = 0;

    for (const item of items) {
      const bev = bevMap[item.beverage_id];
      const cid = bev?.category_id || 0;
      if (!directCounts[cid]) directCounts[cid] = { count: 0, value: 0 };
      directCounts[cid].count++;
      const price = item.sell_price || bev?.price || 0;
      directCounts[cid].value += price;
      total++;
      totalValue += price;
    }

    // Build top-level category results
    const catResult = {};
    for (const cat of (categories || [])) {
      if (cat.parent_id) continue;
      const childIds = parentChildren[cat.id] || [];
      let count = (directCounts[cat.id]?.count || 0);
      let value = (directCounts[cat.id]?.value || 0);
      for (const childId of childIds) {
        count += (directCounts[childId]?.count || 0);
        value += (directCounts[childId]?.value || 0);
      }
      if (count > 0) {
        catResult[cat.id] = { count, value, name: cat.name, name_en: cat.name_en };
      }
    }

    return { total, totalValue, categories: catResult };
  };

  const stores = {};
  for (const [sid, sitems] of Object.entries(storeItems)) {
    stores[sid] = aggregateStore(sitems);
  }

  // Global totals
  const globalTotal = wlItems.length;
  const globalValue = wlItems.reduce((s, i) => {
    const bev = bevMap[i.beverage_id];
    return s + (i.sell_price || bev?.price || 0);
  }, 0);

  return NextResponse.json({
    stores,
    total: globalTotal,
    totalValue: globalValue,
  });
}
