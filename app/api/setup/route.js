import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const sb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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

  const sql = `
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
  `;

  // Extract project ref from URL
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (projectUrl && serviceKey) {
    // Extract project ref from URL (e.g., https://xyz.supabase.co -> xyz)
    const refMatch = projectUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    const projectRef = refMatch ? refMatch[1] : null;

    // Method 1: Try Supabase Management API v1 SQL endpoint
    if (projectRef) {
      try {
        const resp = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({ query: sql }),
        });
        if (resp.ok) {
          return NextResponse.json({ ok: true, message: 'Table created via Management API' });
        }
        const errText = await resp.text();
        // Don't fail yet, try other methods
      } catch(e) {}
    }

    // Method 2: Try the /pg/query endpoint (newer Supabase versions)
    for (const endpoint of ['/pg/query', '/rest/v1/rpc/exec_sql']) {
      try {
        const resp = await fetch(`${projectUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({ query: sql }),
        });
        if (resp.ok) {
          return NextResponse.json({ ok: true, message: `Table created via ${endpoint}` });
        }
      } catch(e) {}
    }

    // Method 3: Try creating via individual SQL statements through the supabase-js client
    // First create a helper RPC function, then use it
    try {
      // Try to create the exec_ddl function first
      const createFnResp = await fetch(`${projectUrl}/rest/v1/rpc/exec_ddl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ ddl_command: sql }),
      });

      if (createFnResp.ok) {
        return NextResponse.json({ ok: true, message: 'Table created via exec_ddl' });
      }
    } catch(e) {}
  }

  return NextResponse.json({
    error: 'Could not auto-create table. Please run this SQL in Supabase Dashboard > SQL Editor:',
    sql: sql.trim(),
    testError: testErr?.message,
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
