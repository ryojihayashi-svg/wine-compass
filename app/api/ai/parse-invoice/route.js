import { NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = `あなたはワイン・飲料の納品書/伝票を読み取るエキスパートです。
画像またはPDFから以下の情報を抽出し、JSON配列で返してください。

各アイテムについて:
- name: 正式商品名（日本語カタカナの場合は英語/フランス語の正式名に変換。例: エグリ・ウーリエ → Egly-Ouriet）
- name_ja: 日本語名（元の表記をそのまま）
- vintage: ヴィンテージ年（数字。NVの場合はnull）
- quantity: 数量（数字。不明の場合は1）
- cost_price: 仕入単価（数字、税抜。不明の場合はnull）
- producer: 生産者名（英語/フランス語）
- region: 産地（例: Champagne, Bourgogne, Bordeaux, Rhône, Loire, Alsace, 日本）
- type: 種類（red/white/sparkling/rose/sake/beer/spirits）

注意事項:
- 日本語のワイン名はフランス語/英語の正式名称に変換すること
- ドメーヌ名と畑名を正確に分離すること
- AOC/アペラシオン情報があれば含めること
- 数量が明記されていない場合は1とすること
- 合計行、送料、消費税の行は除外すること

JSON配列のみを返してください。他の説明は不要です。`;

export async function POST(req) {
  try {
    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured. Add it in Vercel environment variables.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { image, document: pdfDoc } = body;

    if (!image && !pdfDoc) {
      return NextResponse.json({ error: 'No image or document provided' }, { status: 400 });
    }

    // Build content block based on input type
    let contentBlock;
    if (pdfDoc) {
      // PDF document
      let mediaType = 'application/pdf';
      let base64Data = pdfDoc;
      if (pdfDoc.startsWith('data:')) {
        const match = pdfDoc.match(/^data:([^;]+);base64,/);
        if (match) mediaType = match[1];
        base64Data = pdfDoc.replace(/^data:[^;]+;base64,/, '');
      }
      contentBlock = {
        type: 'document',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: base64Data,
        },
      };
    } else {
      // Image
      let mediaType = 'image/jpeg';
      if (image.startsWith('data:')) {
        const match = image.match(/^data:([^;]+);base64,/);
        if (match) mediaType = match[1];
      }
      const base64Data = image.replace(/^data:[^;]+;base64,/, '');
      contentBlock = {
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: base64Data,
        },
      };
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              contentBlock,
              {
                type: 'text',
                text: 'この納品書/伝票からワイン・飲料アイテムを抽出してください。JSON配列で返してください。',
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: `Claude API error: ${response.status}`, details: errText },
        { status: 502 }
      );
    }

    const result = await response.json();
    const text = (result.content || []).map(c => c.text || '').join('');

    // Extract JSON array from response
    let items = [];
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        items = JSON.parse(jsonMatch[0]);
      }
    } catch (parseErr) {
      return NextResponse.json(
        { error: 'Failed to parse AI response', raw: text },
        { status: 422 }
      );
    }

    return NextResponse.json({ items, raw: text });
  } catch (err) {
    console.error('AI parse error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
