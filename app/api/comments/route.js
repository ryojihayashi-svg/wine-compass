import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const sb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET /api/comments?beverage_id=N
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const bevId = url.searchParams.get('beverage_id');
    if (!bevId) return NextResponse.json({ error: 'beverage_id required' }, { status: 400 });

    const { data, error } = await sb()
      .from('wc_comments')
      .select('*')
      .eq('beverage_id', bevId)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/comments
export async function POST(req) {
  try {
    const body = await req.json();
    const { beverage_id, text, author } = body;

    if (!beverage_id || !text?.trim()) {
      return NextResponse.json({ error: 'beverage_id and text required' }, { status: 400 });
    }

    const { data, error } = await sb()
      .from('wc_comments')
      .insert({ beverage_id, text: text.trim(), author: author?.trim() || '匿名' })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
