import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import pg from 'pg';

const sb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const SQL = `
CREATE TABLE IF NOT EXISTS wc_wine_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES wc_stores(id),
  beverage_id BIGINT NOT NULL REFERENCES wc_beverages(id),
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

CREATE TABLE IF NOT EXISTS wc_wine_list_items (
  id BIGSERIAL PRIMARY KEY,
  store_id TEXT NOT NULL,
  section TEXT NOT NULL,
  section_en TEXT,
  section_order SMALLINT DEFAULT 0,
  subsection TEXT,
  subsection_en TEXT,
  name_en TEXT NOT NULL,
  name_jp TEXT,
  producer_en TEXT,
  producer_jp TEXT,
  vintage TEXT,
  sell_price INTEGER,
  sell_price_incl INTEGER,
  cost_price INTEGER,
  region TEXT,
  glass_price INTEGER,
  sort_order SMALLINT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wli_store ON wc_wine_list_items(store_id);
CREATE INDEX IF NOT EXISTS idx_wli_section ON wc_wine_list_items(store_id, section_order, sort_order);
`.trim();

// POST /api/setup — create wc_wine_list table
export async function POST(req) {
  const supabase = sb();

  // Test if tables already exist
  const { error: testErr1 } = await supabase.from('wc_wine_list').select('id').limit(1);
  const { error: testErr2 } = await supabase.from('wc_wine_list_items').select('id').limit(1);

  if (!testErr1 && !testErr2) {
    return NextResponse.json({ ok: true, message: 'Tables already exist' });
  }

  // Try direct Postgres connection
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const dbUrl = process.env.DATABASE_URL;
  const errors = [];

  // Method 1: Use DATABASE_URL if available
  if (dbUrl) {
    try {
      const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
      await client.connect();
      await client.query(SQL);
      await client.end();
      return NextResponse.json({ ok: true, message: 'Table created via DATABASE_URL' });
    } catch(e) {
      errors.push({ method: 'DATABASE_URL', error: e.message });
    }
  }

  // Method 2: Try Supabase pooler with service role key as password (token mode)
  if (projectUrl && serviceKey) {
    const refMatch = projectUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    const ref = refMatch ? refMatch[1] : null;

    if (ref) {
      // Try multiple connection patterns
      const connStrings = [
        // Transaction mode pooler with JWT
        `postgresql://postgres.${ref}:${serviceKey}@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`,
        // Session mode pooler with JWT
        `postgresql://postgres.${ref}:${serviceKey}@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres`,
        // Direct connection with JWT
        `postgresql://postgres:${serviceKey}@db.${ref}.supabase.co:5432/postgres`,
      ];

      for (const cs of connStrings) {
        try {
          const client = new pg.Client({ connectionString: cs, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
          await client.connect();
          await client.query(SQL);
          await client.end();
          return NextResponse.json({ ok: true, message: 'Table created via direct Postgres' });
        } catch(e) {
          errors.push({ method: cs.replace(serviceKey, '***'), error: e.message });
        }
      }
    }
  }

  return NextResponse.json({
    error: 'Could not auto-create table',
    errors,
    sql: SQL,
    hint: 'Add DATABASE_URL env var in Vercel, or run the SQL manually in Supabase Dashboard'
  }, { status: 400 });
}

// GET /api/setup — check table status
export async function GET() {
  const supabase = sb();
  const { error } = await supabase
    .from('wc_wine_list')
    .select('id')
    .limit(1);

  return NextResponse.json({
    wc_wine_list: !error ? 'exists' : 'missing',
    error: error?.message,
  });
}
