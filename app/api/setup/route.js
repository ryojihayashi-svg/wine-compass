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
`.trim();

// POST /api/setup — create wc_wine_list table
export async function POST(req) {
  const supabase = sb();

  // Test if table already exists
  const { error: testErr } = await supabase
    .from('wc_wine_list')
    .select('id')
    .limit(1);

  if (!testErr) {
    return NextResponse.json({ ok: true, message: 'Table already exists' });
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

  // Method 3: Body may contain db_url from user
  try {
    const body = await req.json().catch(() => ({}));
    if (body.db_url) {
      const client = new pg.Client({ connectionString: body.db_url, ssl: { rejectUnauthorized: false } });
      await client.connect();
      await client.query(SQL);
      await client.end();
      return NextResponse.json({ ok: true, message: 'Table created via provided db_url' });
    }
  } catch(e) {
    errors.push({ method: 'body.db_url', error: e.message });
  }

  return NextResponse.json({
    error: 'Could not auto-create table',
    errors,
    sql: SQL,
    hint: 'Add DATABASE_URL env var in Vercel, or POST with {"db_url":"postgresql://..."}'
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
