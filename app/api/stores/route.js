import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const sb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
  const supabase = sb();
  const { data, error } = await supabase
    .from('wc_stores')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req) {
  const body = await req.json();
  const supabase = sb();

  const { data, error } = await supabase
    .from('wc_stores')
    .insert({
      id: body.id,
      name: body.name,
      name_en: body.name_en || null,
      color: body.color || '#4A6352',
      sort_order: body.sort_order || 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/stores — batch update stores
export async function PATCH(req) {
  const body = await req.json();
  const supabase = sb();
  const results = [];

  for (const store of (body.stores || [])) {
    const update = {};
    if (store.name) update.name = store.name;
    if (store.name_en) update.name_en = store.name_en;
    if (store.sort_order != null) update.sort_order = store.sort_order;
    if (store.color) update.color = store.color;

    const { data, error } = await supabase
      .from('wc_stores')
      .update(update)
      .eq('id', store.id)
      .select()
      .single();

    results.push({ id: store.id, ok: !error, error: error?.message });
  }

  return NextResponse.json({ results });
}
