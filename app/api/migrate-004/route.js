import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import pg from 'pg';

const SQL = `
CREATE TABLE IF NOT EXISTS wc_pairings (
  id          BIGSERIAL PRIMARY KEY,
  beverage_id BIGINT NOT NULL REFERENCES wc_beverages(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  store_id    TEXT REFERENCES wc_stores(id),
  dish        TEXT NOT NULL,
  description TEXT,
  staff       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wc_pair_bev ON wc_pairings(beverage_id, created_at DESC);

CREATE TABLE IF NOT EXISTS wc_comments (
  id          BIGSERIAL PRIMARY KEY,
  beverage_id BIGINT NOT NULL REFERENCES wc_beverages(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  author      TEXT DEFAULT '匿名',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wc_comm_bev ON wc_comments(beverage_id, created_at DESC);
`;

const RLS = `
DO $$ BEGIN
  ALTER TABLE wc_pairings ENABLE ROW LEVEL SECURITY;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='wc_pairings' AND policyname='wc_pair_all') THEN
    CREATE POLICY "wc_pair_all" ON wc_pairings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
  ALTER TABLE wc_comments ENABLE ROW LEVEL SECURITY;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='wc_comments' AND policyname='wc_comm_all') THEN
    CREATE POLICY "wc_comm_all" ON wc_comments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;
`;

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const errors = [];

  // Method 1: DATABASE_URL
  if (dbUrl) {
    try {
      const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
      await client.connect();
      await client.query(SQL);
      try { await client.query(RLS); } catch(e) { errors.push({ rls: e.message }); }
      await client.end();
      return NextResponse.json({ ok: true, message: 'Migration 004 done via DATABASE_URL', errors });
    } catch(e) {
      errors.push({ method: 'DATABASE_URL', error: e.message });
    }
  }

  // Method 2: Supabase pooler
  if (projectUrl && serviceKey) {
    const refMatch = projectUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    const ref = refMatch?.[1];
    if (ref) {
      const connStrings = [
        `postgresql://postgres.${ref}:${serviceKey}@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`,
        `postgresql://postgres.${ref}:${serviceKey}@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres`,
        `postgresql://postgres:${serviceKey}@db.${ref}.supabase.co:5432/postgres`,
      ];
      for (const cs of connStrings) {
        try {
          const client = new pg.Client({ connectionString: cs, ssl: { rejectUnauthorized: false } });
          await client.connect();
          await client.query(SQL);
          try { await client.query(RLS); } catch(e) { errors.push({ rls: e.message }); }
          await client.end();
          return NextResponse.json({ ok: true, message: 'Migration 004 done via pooler', errors });
        } catch(e) {
          errors.push({ error: e.message });
        }
      }
    }
  }

  return NextResponse.json({ ok: false, errors }, { status: 500 });
}
