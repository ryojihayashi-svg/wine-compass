import { NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const PROMPTS = {
  taste: (wine) => `Wine: ${wine}. Return JSON: {"sweetness":"dry/off-dry/medium/sweet","acidity":"low/medium-/medium/medium+/high","tannin":"low/medium-/medium/medium+/high","alcohol":"low/medium/high","body":"light/medium/full","intensity":"light/medium/pronounced","finish":"short/medium/long","aromas":[list of aroma descriptors in EN],"description":"tasting description in Japanese 3-4 sentences"}`,
  terroir: (wine) => `Wine: ${wine}. Return JSON: {"country":"...","region":"...","subregion":"...","village":"...","vineyard":"if known or null","soil":"soil types","climate":"climate description","elevation":"if known or null","description":"terroir description in Japanese 3-4 sentences"}`,
  producer: (wine) => `Wine: ${wine}. Return JSON: {"name":"producer name","founded":"year or era","owner":"current owner","winemaker":"chef de cave/winemaker","philosophy":"organic/biodynamic/conventional etc","history":"4-5 sentence history in Japanese","notable":"notable facts in Japanese"}`,
  vintage: (wine) => `Wine: ${wine}. Return JSON: {"year":"vintage year","climate":"vintage climate summary in Japanese","harvest":"harvest conditions in Japanese","rating":"excellent/very good/good/average","aging":"aging potential in Japanese","description":"vintage overview in Japanese 3-4 sentences"}`,
  pairing: (wine) => `Wine: ${wine}. Return JSON: {"ideal":["3-4 ideal pairings in Japanese"],"classic":"classic pairing description in Japanese","avoid":"what to avoid in Japanese","description":"pairing philosophy in Japanese 2-3 sentences"}`,
  service: (wine) => `Wine: ${wine}. Return JSON: {"temperature":"serving temp range","glass":"recommended glass type in Japanese","decant":"decanting recommendation in Japanese","timing":"when to open in Japanese","description":"service notes in Japanese 2-3 sentences"}`,
  market: (wine) => `Wine: ${wine}. Return JSON: {"avgPrice":"estimated avg market price JPY","priceRange":"low-high range JPY","trend":"rising/stable/declining","rarity":"common/limited/rare/very rare","critic":"critic score range if known","description":"market analysis in Japanese 2-3 sentences"}`,
};

export async function POST(req) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    const { wine, section } = await req.json();

    if (!wine || !section || !PROMPTS[section]) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const prompt = PROMPTS[section](wine);
    const systemPrompt = 'You are a master sommelier and wine expert. ' + prompt + '. Return ONLY valid JSON. No markdown, no backticks.';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 800,
        messages: [{ role: 'user', content: systemPrompt }],
      }),
    });

    const data = await response.json();
    const text = (data.content || []).map(c => c.text || '').join('');
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());

    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
