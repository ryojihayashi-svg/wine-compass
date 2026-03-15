import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const sb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET /api/wine-list/stats — returns wine list stats per store
// Combines data from wc_wine_list (beverage-linked) and wc_wine_list_items (standalone imported)
export async function GET() {
  const supabase = sb();

  const stores = {};
  let globalTotal = 0;
  let globalValue = 0;

  // === Source 1: wc_wine_list (beverage-linked) ===
  let wlItems = [];
  {
    const PAGE_SIZE = 1000;
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from('wc_wine_list')
        .select('id, store_id, beverage_id, sell_price')
        .eq('is_active', true)
        .range(from, from + PAGE_SIZE - 1);

      if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01' || error.message.includes('schema cache')) break;
        // Non-fatal, continue to wc_wine_list_items
        break;
      }
      if (!data || data.length === 0) break;
      wlItems = wlItems.concat(data);
      if (data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }
  }

  // Get beverage prices for wc_wine_list items
  if (wlItems.length > 0) {
    const bevIds = [...new Set(wlItems.map(i => i.beverage_id))];
    const { data: beverages } = await supabase
      .from('wc_beverages')
      .select('id, price')
      .in('id', bevIds);
    const bevMap = {};
    for (const b of (beverages || [])) bevMap[b.id] = b;

    for (const item of wlItems) {
      const sid = item.store_id || '_none';
      if (!stores[sid]) stores[sid] = { total: 0, totalValue: 0 };
      stores[sid].total++;
      const price = item.sell_price || bevMap[item.beverage_id]?.price || 0;
      stores[sid].totalValue += price;
      globalTotal++;
      globalValue += price;
    }
  }

  // === Source 2: wc_wine_list_items (standalone imported) ===
  let wliItems = [];
  {
    const PAGE_SIZE = 1000;
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from('wc_wine_list_items')
        .select('id, store_id, sell_price, sell_price_incl')
        .eq('is_active', true)
        .range(from, from + PAGE_SIZE - 1);

      if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01' || error.message.includes('schema cache')) break;
        break;
      }
      if (!data || data.length === 0) break;
      wliItems = wliItems.concat(data);
      if (data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }
  }

  // Add wc_wine_list_items stats (avoid double-counting by using wli data as-is)
  for (const item of wliItems) {
    const sid = item.store_id || '_none';
    if (!stores[sid]) stores[sid] = { total: 0, totalValue: 0 };
    stores[sid].total++;
    const price = item.sell_price_incl || item.sell_price || 0;
    stores[sid].totalValue += price;
    globalTotal++;
    globalValue += price;
  }

  return NextResponse.json({
    stores,
    total: globalTotal,
    totalValue: globalValue,
  });
}
