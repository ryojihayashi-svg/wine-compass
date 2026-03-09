import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const sb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET /api/stats?store=hakune
// Returns category counts with parent aggregation
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

    // Get counts grouped by category_id and store_id
    let query = supabase
      .from('wc_beverages')
      .select('category_id, quantity, store_id')
      .eq('is_deleted', false);

    if (storeId) query = query.eq('store_id', storeId);

    const { data: items, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Build parent-child map
    const childToParent = {};
    const parentChildren = {};
    for (const cat of (categories || [])) {
      if (cat.parent_id) {
        childToParent[cat.id] = cat.parent_id;
        if (!parentChildren[cat.parent_id]) parentChildren[cat.parent_id] = [];
        parentChildren[cat.parent_id].push(cat.id);
      }
    }

    // Count items per category (direct), then aggregate into parents
    const directCounts = {}; // { catId: { count: N, qty: N } }
    for (const item of (items || [])) {
      const cid = item.category_id || 0;
      if (!directCounts[cid]) directCounts[cid] = { count: 0, qty: 0 };
      directCounts[cid].count++;
      directCounts[cid].qty += (item.quantity || 0);
    }

    // Build result for top-level categories
    const result = {};
    for (const cat of (categories || [])) {
      if (cat.parent_id) continue; // skip children
      const childIds = parentChildren[cat.id] || [];
      let count = (directCounts[cat.id]?.count || 0);
      let qty = (directCounts[cat.id]?.qty || 0);
      for (const childId of childIds) {
        count += (directCounts[childId]?.count || 0);
        qty += (directCounts[childId]?.qty || 0);
      }
      result[cat.id] = { count, qty, name: cat.name, name_en: cat.name_en };
    }

    return NextResponse.json({
      categories: result,
      total: (items || []).length,
      totalQty: (items || []).reduce((s, i) => s + (i.quantity || 0), 0),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
