import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const sb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// POST /api/beverages/bulk-update
// Body: { updates: [{ id, name, name_kana, producer, ... }] }
export async function POST(req) {
  try {
    const { updates } = await req.json();
    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: 'updates array required' }, { status: 400 });
    }

    const supabase = sb();
    let updated = 0;
    let failed = 0;
    const errors = [];

    // Process in chunks of 50
    const chunkSize = 50;
    for (let i = 0; i < updates.length; i += chunkSize) {
      const chunk = updates.slice(i, i + chunkSize);

      const promises = chunk.map(async (item) => {
        const { id, ...fields } = item;
        if (!id) return { error: 'missing id' };

        const { error } = await supabase
          .from('wc_beverages')
          .update(fields)
          .eq('id', id);

        if (error) {
          return { id, error: error.message };
        }
        return { id, ok: true };
      });

      const results = await Promise.all(promises);
      for (const r of results) {
        if (r.ok) updated++;
        else {
          failed++;
          errors.push(r);
        }
      }
    }

    return NextResponse.json({
      success: true,
      updated,
      failed,
      total: updates.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
