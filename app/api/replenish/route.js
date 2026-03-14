import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const sb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// POST /api/replenish — check if a wine needs replenishment after stock hits 0
// Body: { beverage_id, store_id }
// Returns: { needsAction, onWineList, burgundyMatch, aiSuggestions }
export async function POST(req) {
  try {
    const { beverage_id, store_id } = await req.json();
    if (!beverage_id || !store_id) {
      return NextResponse.json({ error: 'beverage_id and store_id required' }, { status: 400 });
    }

    const supabase = sb();

    // 1. Get the beverage details
    const { data: bev, error: bevErr } = await supabase
      .from('wc_beverages')
      .select('id, name, name_kana, producer, vintage, region, category_id, quantity, price, cost_price, store_id')
      .eq('id', beverage_id)
      .single();

    if (bevErr || !bev) {
      return NextResponse.json({ error: 'Beverage not found' }, { status: 404 });
    }

    // Only trigger if quantity is 0
    if (bev.quantity > 0) {
      return NextResponse.json({ needsAction: false, reason: 'still_in_stock' });
    }

    // 2. Check if this beverage is on any wine list for this store
    const { data: wlEntries } = await supabase
      .from('wc_wine_list')
      .select('id, store_id, sell_price, is_active')
      .eq('beverage_id', beverage_id)
      .eq('store_id', store_id)
      .eq('is_active', true);

    const onWineList = (wlEntries && wlEntries.length > 0);

    // 3. Search Burgundy warehouse for the same or similar wine
    let burgundyMatch = null;
    if (store_id !== 'burgundy') {
      // Search by name similarity
      const searchTerms = (bev.name || '').split(/[\s,/·]+/).filter(t => t.length > 2).slice(0, 3);
      if (searchTerms.length > 0) {
        const orClauses = searchTerms.map(t => `name.ilike.%${t}%`).join(',');
        const { data: bMatches } = await supabase
          .from('wc_beverages')
          .select('id, name, name_kana, producer, vintage, quantity, price, cost_price, category_id')
          .eq('store_id', 'burgundy')
          .eq('is_deleted', false)
          .gt('quantity', 0)
          .or(orClauses)
          .limit(5);

        if (bMatches && bMatches.length > 0) {
          // Try to find exact match (same name + vintage)
          const exact = bMatches.find(m =>
            m.name === bev.name && (m.vintage === bev.vintage || (!m.vintage && !bev.vintage))
          );
          if (exact) {
            burgundyMatch = { type: 'exact', item: exact };
          } else {
            // Partial match — same wine different vintage, or similar name
            burgundyMatch = { type: 'similar', items: bMatches };
          }
        }
      }
    }

    // 4. AI alternative suggestions (only if on wine list and no exact Burgundy match)
    let aiSuggestions = null;
    if (onWineList && (!burgundyMatch || burgundyMatch.type !== 'exact') && ANTHROPIC_API_KEY) {
      // Get some in-stock wines from the same category in this store
      const { data: alternatives } = await supabase
        .from('wc_beverages')
        .select('id, name, producer, vintage, quantity, price, cost_price, category_id')
        .eq('store_id', store_id)
        .eq('is_deleted', false)
        .gt('quantity', 0)
        .eq('category_id', bev.category_id)
        .neq('id', bev.id)
        .limit(20);

      if (alternatives && alternatives.length > 0) {
        const altList = alternatives.map(a =>
          `${a.name} ${a.vintage || 'NV'} (${a.producer || '-'}, 在庫${a.quantity}本, 仕入¥${a.cost_price || a.price || '?'})`
        ).join('\n');

        const prompt = `ワイン「${bev.name} ${bev.vintage || 'NV'}」(${bev.producer || '-'}, カテゴリ同一)の在庫が0になりました。ワインリストの代替として、以下の在庫から最大3本おすすめしてください。理由も簡潔に。\n\n在庫:\n${altList}\n\nJSON配列で返してください: [{"name":"...", "reason":"..."}]`;

        try {
          const aiResp = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-sonnet-4-5-20250929',
              max_tokens: 500,
              messages: [{ role: 'user', content: prompt }],
            }),
          });

          if (aiResp.ok) {
            const aiData = await aiResp.json();
            const text = (aiData.content || []).map(c => c.text || '').join('');
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              aiSuggestions = JSON.parse(jsonMatch[0]);
              // Match with actual beverage IDs
              aiSuggestions = aiSuggestions.map(s => {
                const match = alternatives.find(a => a.name.includes(s.name) || s.name.includes(a.name));
                return { ...s, beverage: match || null };
              });
            }
          }
        } catch (e) {
          // AI suggestion is best-effort, don't fail the request
        }
      }
    }

    return NextResponse.json({
      needsAction: true,
      beverage: { id: bev.id, name: bev.name, vintage: bev.vintage, producer: bev.producer },
      onWineList,
      wineListEntryId: wlEntries?.[0]?.id || null,
      burgundyMatch,
      aiSuggestions,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
