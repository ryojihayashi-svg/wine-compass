import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const sb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Paginated fetch to avoid Supabase 1000-row default limit
async function fetchAllBeverages(supabase, storeId) {
  const PAGE_SIZE = 1000;
  let allItems = [];
  let from = 0;

  while (true) {
    let query = supabase
      .from('wc_beverages')
      .select('*, wc_categories(name)')
      .eq('is_deleted', false)
      .order('category_id', { ascending: true })
      .order('name', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (storeId) query = query.eq('store_id', storeId);

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) break;
    allItems = allItems.concat(data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allItems;
}

// GET /api/export?store=hakune&format=csv
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const storeId = url.searchParams.get('store') || null;
    const format = url.searchParams.get('format') || 'csv';

    const supabase = sb();
    const items = await fetchAllBeverages(supabase, storeId);

    if (format === 'json') {
      return NextResponse.json(items);
    }

    // CSV format
    const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
    const headers = [
      'カテゴリ', 'ヴィンテージ', '商品名', '生産者', '産地', 'アペラシオン',
      'ブドウ品種', 'サイズ(ml)', '在庫数', '販売価格', '仕入値', 'メモ',
    ];

    const rows = (items || []).map(item => [
      item.wc_categories?.name || '',
      item.vintage || 'NV',
      item.name || '',
      item.producer || '',
      item.region || '',
      item.appellation || '',
      item.grape || '',
      item.size_ml || 750,
      item.quantity || 0,
      item.price || '',
      item.cost_price || '',
      (item.notes || '').replace(/[\r\n]+/g, ' '),
    ]);

    const csvContent = BOM + [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        const s = String(cell);
        return s.includes(',') || s.includes('"') || s.includes('\n')
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      }).join(',')),
    ].join('\r\n');

    const fileName = `beverage-inventory${storeId ? '-' + storeId : ''}-${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
