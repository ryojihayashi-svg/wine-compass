import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const sb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// POST /api/setup — create wc_wine_list table if not exists
export async function POST() {
  const supabase = sb();

  // Create wc_wine_list table via raw SQL
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS wc_wine_list (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        store_id TEXT NOT NULL REFERENCES wc_stores(id),
        beverage_id UUID NOT NULL REFERENCES wc_beverages(id),
        sell_price INTEGER,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(store_id, beverage_id)
      );
      CREATE INDEX IF NOT EXISTS idx_wl_store ON wc_wine_list(store_id);
      CREATE INDEX IF NOT EXISTS idx_wl_beverage ON wc_wine_list(beverage_id);
      CREATE INDEX IF NOT EXISTS idx_wl_active ON wc_wine_list(is_active);
    `
  });

  if (error) {
    // Try direct SQL if RPC doesn't exist
    // Fallback: try to create via insert/select to test if table exists
    const { error: testErr } = await supabase
      .from('wc_wine_list')
      .select('id')
      .limit(1);

    if (testErr && testErr.message.includes('does not exist')) {
      return NextResponse.json({
        error: 'Table does not exist. Please run this SQL in Supabase dashboard:',
        sql: `
CREATE TABLE wc_wine_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES wc_stores(id),
  beverage_id UUID NOT NULL REFERENCES wc_beverages(id),
  sell_price INTEGER,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(store_id, beverage_id)
);
CREATE INDEX idx_wl_store ON wc_wine_list(store_id);
CREATE INDEX idx_wl_beverage ON wc_wine_list(beverage_id);
CREATE INDEX idx_wl_active ON wc_wine_list(is_active);
        `.trim()
      }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: 'Table already exists' });
  }

  return NextResponse.json({ ok: true, message: 'Setup complete' });
}
