import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const sb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET /api/beverages?store=hakune&category=2&q=meursault&page=1&limit=50&stock=true
export async function GET(req) {
  const url = new URL(req.url);
  const store = url.searchParams.get('store') || null;
  const category = url.searchParams.get('category') ? parseInt(url.searchParams.get('category')) : null;
  const q = url.searchParams.get('q') || null;
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 250);
  const stock = url.searchParams.get('stock');
  const offset = (page - 1) * limit;

  const supabase = sb();

  // Try RPC first, fall back to direct query
  const { data, error } = await supabase.rpc('wc_search_beverages', {
    p_store_id: store,
    p_category_id: category,
    p_query: q,
    p_in_stock: stock === 'true' ? true : stock === 'false' ? false : null,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    // Fallback: direct query if RPC not yet created
    let query = supabase
      .from('wc_beverages')
      .select('*, wc_categories(name, name_en, parent_id)', { count: 'exact' })
      .eq('is_deleted', false)
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (store) query = query.eq('store_id', store);
    if (category) query = query.eq('category_id', category);
    if (q) query = query.or(`name.ilike.%${q}%,producer.ilike.%${q}%`);
    if (stock === 'true') query = query.gt('quantity', 0);

    const { data: items, count, error: err2 } = await query;
    if (err2) return NextResponse.json({ error: err2.message }, { status: 500 });

    return NextResponse.json({
      items: items || [],
      total: count || 0,
      page,
      pageSize: limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  }

  const total = data?.[0]?.total_count || 0;
  return NextResponse.json({
    items: data || [],
    total: Number(total),
    page,
    pageSize: limit,
    totalPages: Math.ceil(Number(total) / limit),
  });
}

// POST /api/beverages — create new item
export async function POST(req) {
  const body = await req.json();
  const supabase = sb();

  const { data, error } = await supabase
    .from('wc_beverages')
    .insert({
      store_id: body.store_id,
      category_id: body.category_id || null,
      name: body.name,
      name_kana: body.name_kana || null,
      producer: body.producer || null,
      vintage: body.vintage || null,
      region: body.region || null,
      appellation: body.appellation || null,
      grape: body.grape || null,
      size_ml: body.size_ml || 750,
      quantity: body.quantity || 0,
      price: body.price || null,
      cost_price: body.cost_price || null,
      notes: body.notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log creation
  await supabase.from('wc_inventory_log').insert({
    beverage_id: data.id,
    action: 'create',
    new_value: JSON.stringify(data),
  });

  return NextResponse.json(data, { status: 201 });
}
