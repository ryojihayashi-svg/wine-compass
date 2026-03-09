import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const sb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// POST /api/import — bulk insert beverages
export async function POST(req) {
  try {
    const body = await req.json();
    const { items, store_id } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }
    if (!store_id) {
      return NextResponse.json({ error: 'store_id required' }, { status: 400 });
    }

    const supabase = sb();
    const results = { inserted: 0, errors: [] };

    // Batch insert in chunks of 50
    const CHUNK = 50;
    for (let i = 0; i < items.length; i += CHUNK) {
      const chunk = items.slice(i, i + CHUNK).map(item => ({
        store_id,
        category_id: item.category_id || null,
        name: item.name,
        name_kana: item.name_kana || null,
        producer: item.producer || null,
        vintage: item.vintage || null,
        region: item.region || null,
        appellation: item.appellation || null,
        grape: item.grape || null,
        size_ml: item.size_ml || 750,
        quantity: item.quantity != null ? item.quantity : 0,
        price: item.price || null,
        cost_price: item.cost_price || null,
        notes: item.notes || null,
      }));

      const { data, error } = await supabase
        .from('wc_beverages')
        .insert(chunk)
        .select('id');

      if (error) {
        results.errors.push({ chunk: i, error: error.message, details: error.details || null });
      } else {
        results.inserted += (data?.length || 0);

        // Log imports (don't fail if logging fails)
        try {
          const logs = (data || []).map(d => ({
            beverage_id: d.id,
            action: 'import',
            new_value: JSON.stringify({ source: 'excel_import' }),
          }));
          if (logs.length > 0) {
            await supabase.from('wc_inventory_log').insert(logs);
          }
        } catch (logErr) {
          // ignore logging errors
        }
      }
    }

    return NextResponse.json({
      success: true,
      inserted: results.inserted,
      total: items.length,
      errors: results.errors,
    });
  } catch (err) {
    console.error('Import error:', err);
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
