import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const sb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const SQL = `
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
`.trim();

// POST /api/setup — create wc_wine_list table
export async function POST() {
  const supabase = sb();

  // Test if table already exists
  const { error: testErr } = await supabase
    .from('wc_wine_list')
    .select('id')
    .limit(1);

  if (!testErr) {
    return NextResponse.json({ ok: true, message: 'Table already exists' });
  }

  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const errors = [];

  if (projectUrl && serviceKey) {
    // Method 1: pg-meta /query endpoint (used by Supabase SQL Editor internally)
    try {
      const resp = await fetch(`${projectUrl}/pg/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'x-connection-encrypted': 'true',
        },
        body: JSON.stringify({ query: SQL }),
      });
      if (resp.ok) {
        return NextResponse.json({ ok: true, message: 'Table created via pg/query', method: 1 });
      }
      errors.push({ method: 1, status: resp.status, body: await resp.text().catch(() => '') });
    } catch(e) {
      errors.push({ method: 1, error: e.message });
    }

    // Method 2: pg-meta /sql endpoint
    try {
      const resp = await fetch(`${projectUrl}/pg/sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ sql: SQL }),
      });
      if (resp.ok) {
        return NextResponse.json({ ok: true, message: 'Table created via pg/sql', method: 2 });
      }
      errors.push({ method: 2, status: resp.status, body: await resp.text().catch(() => '') });
    } catch(e) {
      errors.push({ method: 2, error: e.message });
    }

    // Method 3: Direct REST RPC
    try {
      const resp = await fetch(`${projectUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ sql_text: SQL }),
      });
      if (resp.ok) {
        return NextResponse.json({ ok: true, message: 'Table created via RPC', method: 3 });
      }
      errors.push({ method: 3, status: resp.status, body: await resp.text().catch(() => '') });
    } catch(e) {
      errors.push({ method: 3, error: e.message });
    }
  }

  return NextResponse.json({
    error: 'Could not auto-create table',
    errors,
    sql: SQL,
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
