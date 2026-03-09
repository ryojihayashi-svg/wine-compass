import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const sb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET /api/stats — returns all stores' stats in one call
// GET /api/stats?store=hakune — returns single store stats
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const storeId = url.searchParams.get('store') || null;

    const supabase = sb();

    // Get all categories
    const { data: categories } = await supabase
      .from('wc_categories')
      .select('id, name, name_en, parent_id, sort_order')
      .order('sort_order');

    // Get all items (with price for value calc)
    // Supabase default limit is 1000 — fetch all with pagination
    let allItems = [];
    let from = 0;
    const PAGE = 5000;

    while (true) {
      let query = supabase
        .from('wc_beverages')
        .select('category_id, quantity, store_id, price, cost_price')
        .eq('is_deleted', false)
        .range(from, from + PAGE - 1);

      if (storeId) query = query.eq('store_id', storeId);

      const { data: batch, error: batchErr } = await query;
      if (batchErr) return NextResponse.json({ error: batchErr.message }, { status: 500 });
      if (!batch || batch.length === 0) break;
      allItems = allItems.concat(batch);
      if (batch.length < PAGE) break;
      from += PAGE;
    }

    const items = allItems;
    const error = null;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Build parent-child map
    const parentChildren = {};
    for (const cat of (categories || [])) {
      if (cat.parent_id) {
        if (!parentChildren[cat.parent_id]) parentChildren[cat.parent_id] = [];
        parentChildren[cat.parent_id].push(cat.id);
      }
    }

    // Group by store_id
    const storeItems = {};
    for (const item of (items || [])) {
      const sid = item.store_id || '_none';
      if (!storeItems[sid]) storeItems[sid] = [];
      storeItems[sid].push(item);
    }

    // Helper: aggregate category stats
    const aggregateCategories = (storeItemList) => {
      const directCounts = {};
      let total = 0, totalQty = 0, totalValue = 0;

      for (const item of storeItemList) {
        const cid = item.category_id || 0;
        if (!directCounts[cid]) directCounts[cid] = { count: 0, qty: 0, value: 0 };
        directCounts[cid].count++;
        directCounts[cid].qty += (item.quantity || 0);
        const itemValue = (item.quantity || 0) * (item.price || 0);
        directCounts[cid].value += itemValue;
        total++;
        totalQty += (item.quantity || 0);
        totalValue += itemValue;
      }

      // Build top-level category results
      const catResult = {};
      for (const cat of (categories || [])) {
        if (cat.parent_id) continue;
        const childIds = parentChildren[cat.id] || [];
        let count = (directCounts[cat.id]?.count || 0);
        let qty = (directCounts[cat.id]?.qty || 0);
        let value = (directCounts[cat.id]?.value || 0);
        for (const childId of childIds) {
          count += (directCounts[childId]?.count || 0);
          qty += (directCounts[childId]?.qty || 0);
          value += (directCounts[childId]?.value || 0);
        }
        if (count > 0) {
          catResult[cat.id] = { count, qty, value, name: cat.name, name_en: cat.name_en };
        }
      }

      return { total, totalQty, totalValue, categories: catResult };
    };

    // Per-store stats
    const stores = {};
    for (const [sid, sitems] of Object.entries(storeItems)) {
      stores[sid] = aggregateCategories(sitems);
    }

    // Global stats
    const global = aggregateCategories(items || []);

    return NextResponse.json({
      ...global,
      stores,
      storeCount: Object.keys(storeItems).length,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
