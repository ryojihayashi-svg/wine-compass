import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const sb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const SYSTEM_PROMPT = `あなたはワインボトルのラベルを読み取るソムリエAIです。
写真からワインを特定し、以下の情報をJSONで返してください。

- name: 正式名称（英語/フランス語）
- name_ja: 日本語名
- vintage: ヴィンテージ年（数字。NVならnull）
- producer: 生産者
- region: 産地
- appellation: アペラシオン（AOC）
- type: 種類（red/white/sparkling/rose/sake/beer）
- confidence: 確信度（0-1）

JSONオブジェクト1つのみ返してください。`;

export async function POST(req) {
  try {
    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { image, store_id } = body;

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    let mediaType = 'image/jpeg';
    if (image.startsWith('data:')) {
      const match = image.match(/^data:([^;]+);base64,/);
      if (match) mediaType = match[1];
    }
    const base64Data = image.replace(/^data:[^;]+;base64,/, '');

    // Call Claude Vision API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: base64Data },
              },
              {
                type: 'text',
                text: 'このワインボトルのラベルから銘柄を特定してください。JSONで返してください。',
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `Claude API error: ${response.status}`, details: errText }, { status: 502 });
    }

    const result = await response.json();
    const text = result.content?.[0]?.text || '';

    let identified = null;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) identified = JSON.parse(jsonMatch[0]);
    } catch (e) {
      return NextResponse.json({ error: 'Failed to parse AI response', raw: text }, { status: 422 });
    }

    if (!identified) {
      return NextResponse.json({ error: 'Could not identify wine', raw: text }, { status: 422 });
    }

    // Try to find matching items in inventory
    const supabase = sb();
    let query = supabase
      .from('wc_beverages')
      .select('*')
      .eq('is_deleted', false)
      .gt('quantity', 0);

    if (store_id) query = query.eq('store_id', store_id);

    // Search by name (fuzzy)
    const searchName = identified.name || identified.name_ja || '';
    if (searchName) {
      // Try multiple search strategies
      const searchTerms = searchName.split(/[\s,]+/).filter(t => t.length > 2).slice(0, 3);
      if (searchTerms.length > 0) {
        const orClauses = searchTerms.map(t => `name.ilike.%${t}%`).join(',');
        query = query.or(orClauses);
      }
    }

    if (identified.vintage) {
      query = query.eq('vintage', identified.vintage);
    }

    const { data: matches } = await query.limit(10);

    return NextResponse.json({
      identified,
      matches: matches || [],
      raw: text,
    });
  } catch (err) {
    console.error('Identify error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
