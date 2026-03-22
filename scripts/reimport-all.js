/**
 * Full re-import script:
 *  1. Soft-delete all existing beverages
 *  2. Parse both Excel files with new parser
 *  3. AI-translate katakana → original language (batched)
 *  4. Insert into DB with name (original), name_kana (katakana), producer
 */

const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const fs = require('fs');

// ── Config ──────────────────────────────────────────────
const env = fs.readFileSync('.env.production.local', 'utf8');
const V = {};
env.split('\n').forEach(l => {
  const m = l.match(/^([^=]+)="?([^"\n]+)"?/);
  if (m) V[m[1].trim()] = m[2].replace(/\\n$/, '').trim();
});

const sb = createClient(V.NEXT_PUBLIC_SUPABASE_URL, V.SUPABASE_SERVICE_ROLE_KEY);
const ANTHROPIC_KEY = V.ANTHROPIC_API_KEY;

const BURGUNDY_FILE = 'C:/Users/RyojiHayashi/Downloads/202603_バーガンディ在庫_全角v3.xlsx';
const STORE_FILE = 'C:/Users/RyojiHayashi/Downloads/202602_5社_在庫一覧.xlsx';

// ── Sheet → catId mapping ───────────────────────────────
const SHEET_CAT = {
  'シャンパーニュ': 1,
  'ブルゴーニュ白': 8,
  'ブルゴーニュ赤': 15,
  'その他': 4,
  'スピリッツ': 21,
  'その他アルコール': 6,
  'ソフトドリンク': 7,
};
const SKIP = ['合計', '凡例', '売り上げ'];
const STORE_MAP = { '白寧': 'hakune', '桃仙閣': 'tousenkaku', '明寂': 'myoujyaku', '寛心': 'kanshin', '一平飯店': 'ippei' };

// ── Parsing helpers ─────────────────────────────────────
function parseVintage(raw) {
  if (!raw || raw === '') return null;
  const s = String(raw).trim();
  if (s === 'NV' || s === 'nv' || s === 'N.V.') return null;
  const p = s.match(/\((\d{4})\)|（(\d{4})）/);
  if (p) { const yr = parseInt(p[1] || p[2]); if (yr >= 1900 && yr <= 2100) return yr; }
  const num = parseInt(s);
  return (!isNaN(num) && num >= 1900 && num <= 2100) ? num : null;
}

function pNum(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  const n = parseFloat(String(raw).replace(/[,¥￥\s]/g, ''));
  return isNaN(n) ? null : Math.round(n);
}

function skip(name) {
  if (!name || typeof name !== 'string') return true;
  const t = name.trim();
  return t === '' || t.length <= 1 || /^(正商品名|ヴィンテージ|商品名|合計|小計|在庫|店舗|カテゴリ|区分)/.test(t);
}

// ── Parse Burgundy Excel ────────────────────────────────
function parseBurgundy() {
  const wb = XLSX.readFile(BURGUNDY_FILE);
  const items = [];
  for (const sn of wb.SheetNames) {
    if (SKIP.some(s => sn.includes(s))) continue;
    const catId = Object.entries(SHEET_CAT).find(([k]) => sn.trim() === k || sn.includes(k))?.[1];
    if (!catId) { console.log('  SKIP unknown sheet:', sn); continue; }
    const data = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, defval: '' });
    let count = 0;
    for (const row of data) {
      const name = row[7];
      if (skip(name)) continue;
      const kubun = row[1] ? String(row[1]).trim() : '';
      const toroki = row[2] ? String(row[2]).trim() : '';
      const country = row[4] ? String(row[4]).trim() : '';
      const region = row[5] ? String(row[5]).trim() : '';
      const producer = row[8] ? String(row[8]).trim() : '';
      const type = row[9] ? String(row[9]).trim() : '';
      const sizeMl = pNum(row[10]) || 750;
      const qty = pNum(row[11]) || 0;
      const cost = pNum(row[12]);
      const importer = row[14] ? String(row[14]).trim() : '';
      const memo = row[15] ? String(row[15]).trim() : '';

      const notes = [
        kubun && kubun !== '社内在庫' ? kubun : '',
        toroki ? `取置: ${toroki}` : '',
        importer ? `仕入: ${importer}` : '',
        memo || '',
      ].filter(Boolean).join(' / ');

      items.push({
        store_id: 'burgundy',
        category_id: catId,
        name_kana: String(name).trim(),
        producer_kana: producer || null,
        region: [country, region].filter(Boolean).join(' ') || null,
        type: type || null,
        vintage: parseVintage(row[6]),
        size_ml: sizeMl,
        quantity: qty,
        cost_price: cost,
        notes: notes || null,
        _sheet: sn,
      });
      count++;
    }
    console.log(`  ${sn}: ${count} items`);
  }
  return items;
}

// ── Parse 5-store Excel ─────────────────────────────────
function parseStores() {
  const wb = XLSX.readFile(STORE_FILE);
  const items = [];
  for (const sn of wb.SheetNames) {
    if (SKIP.some(s => sn.includes(s))) continue;
    const catId = Object.entries(SHEET_CAT).find(([k]) => sn.trim() === k || sn.includes(k))?.[1];
    if (!catId) { console.log('  SKIP unknown sheet:', sn); continue; }
    const data = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, defval: '' });
    let count = 0;
    let curStore = null;
    for (const row of data) {
      const rawStore = row[1] ? String(row[1]).trim() : '';
      if (rawStore && STORE_MAP[rawStore]) curStore = STORE_MAP[rawStore];
      const name = row[3];
      if (skip(name)) continue;
      if (!curStore) continue;

      items.push({
        store_id: curStore,
        category_id: catId,
        name_kana: String(name).trim(),
        producer_kana: null,
        region: null,
        type: null,
        vintage: parseVintage(row[2]),
        size_ml: 750,
        quantity: pNum(row[4]) || 0,
        cost_price: pNum(row[5]),
        notes: row[6] ? `仕入: ${String(row[6]).trim()}` : null,
        _sheet: sn,
      });
      count++;
    }
    console.log(`  ${sn}: ${count} items`);
  }
  return items;
}

// ── AI Translation (batched) ────────────────────────────
async function aiTranslate(batch) {
  // batch = [{ name_kana, producer_kana, type, category_id, vintage }]
  const lines = batch.map((item, i) => {
    const parts = [item.name_kana];
    if (item.producer_kana) parts.push(`生産者: ${item.producer_kana}`);
    if (item.type) parts.push(`タイプ: ${item.type}`);
    if (item.vintage) parts.push(`VT: ${item.vintage}`);
    return `${i}: ${parts.join(' / ')}`;
  }).join('\n');

  const prompt = `You are a wine expert. Convert these Japanese (katakana) wine/beverage names to their original language (French, Italian, English, etc.).

For each item, return ONLY a JSON array. Each element: {"i": index, "name": "original language name", "producer": "producer in original language"}

Rules:
- Wine names: Use French/Italian/German/etc. as appropriate (e.g., シャブリ → Chablis, エシェゾー → Échézeaux)
- Champagne houses: Use official French names (e.g., ルイロデレール → Louis Roederer)
- Japanese sake/beer: Keep in Japanese/Romaji (e.g., サッポロ黒ラベル → Sapporo Black Label)
- Spirits: Use original language (e.g., アードベッグ → Ardbeg)
- If producer is in the name with （ ）or ( ), extract it as producer
- Accents matter: Méo-Camuzet, not Meo-Camuzet; Échézeaux, not Echezeaux
- If unsure, keep katakana as-is in name field

Items:
${lines}

Return ONLY valid JSON array, no markdown, no explanation.`;

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`AI API error ${resp.status}: ${err}`);
  }

  const data = await resp.json();
  const text = data.content[0].text.trim();

  // Parse JSON - handle potential markdown wrapping
  const jsonStr = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('JSON parse error, raw:', text.slice(0, 200));
    return [];
  }
}

async function translateAll(items) {
  const BATCH = 40;
  const total = items.length;
  let done = 0;
  const results = new Array(total);

  for (let i = 0; i < total; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    const batchNum = Math.floor(i / BATCH) + 1;
    const totalBatches = Math.ceil(total / BATCH);
    process.stdout.write(`\r  AI翻訳: ${batchNum}/${totalBatches} (${done}/${total})...`);

    try {
      const translated = await aiTranslate(batch);
      for (const t of translated) {
        if (t.i !== undefined && t.i >= 0 && t.i < batch.length) {
          results[i + t.i] = { name: t.name, producer: t.producer };
        }
      }
    } catch (err) {
      console.error(`\n  Batch ${batchNum} error:`, err.message);
    }

    done += batch.length;

    // Rate limit: ~1 req/sec
    if (i + BATCH < total) await new Promise(r => setTimeout(r, 1200));
  }

  console.log(`\r  AI翻訳完了: ${total}件                      `);
  return results;
}

// ── DB Operations ───────────────────────────────────────
async function softDeleteAll() {
  const now = new Date().toISOString();
  let total = 0;
  for (const storeId of ['burgundy', 'hakune', 'tousenkaku', 'myoujyaku', 'kanshin', 'ippei']) {
    const { data } = await sb
      .from('wc_beverages')
      .update({ is_deleted: true, deleted_at: now })
      .eq('store_id', storeId)
      .eq('is_deleted', false)
      .select('id');
    const cnt = data?.length || 0;
    total += cnt;
    if (cnt > 0) console.log(`  ${storeId}: ${cnt} deleted`);
  }
  console.log(`  Total soft-deleted: ${total}`);
}

async function insertItems(items) {
  const CHUNK = 50;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < items.length; i += CHUNK) {
    const chunk = items.slice(i, i + CHUNK).map(item => ({
      store_id: item.store_id,
      category_id: item.category_id,
      name: item.name || item.name_kana,
      name_kana: item.name_kana,
      producer: item.producer || null,
      vintage: item.vintage,
      region: item.region || null,
      appellation: null,
      grape: null,
      size_ml: item.size_ml || 750,
      quantity: item.quantity || 0,
      price: null,
      cost_price: item.cost_price || null,
      notes: item.notes || null,
    }));

    const { data, error } = await sb.from('wc_beverages').insert(chunk).select('id');
    if (error) {
      console.error(`  Insert error at ${i}:`, error.message);
      errors++;
    } else {
      inserted += data.length;
    }

    if ((i / CHUNK) % 20 === 0) {
      process.stdout.write(`\r  Insert: ${inserted}/${items.length}...`);
    }
  }
  console.log(`\r  Insert完了: ${inserted} inserted, ${errors} errors          `);
  return inserted;
}

// ── Main ────────────────────────────────────────────────
async function main() {
  console.log('=== Beverage 全データ再インポート ===\n');

  // 1. Parse both Excel files
  console.log('1. バーガンディ在庫を解析...');
  const burgItems = parseBurgundy();
  console.log(`   → ${burgItems.length} items\n`);

  console.log('2. 5社在庫一覧を解析...');
  const storeItems = parseStores();
  console.log(`   → ${storeItems.length} items\n`);

  const allItems = [...burgItems, ...storeItems];
  console.log(`合計: ${allItems.length} items\n`);

  // 2. AI translate all items
  console.log('3. AI翻訳（カナ→現地語）...');
  const translations = await translateAll(allItems);

  // Apply translations
  let translated = 0;
  for (let i = 0; i < allItems.length; i++) {
    if (translations[i]) {
      allItems[i].name = translations[i].name || allItems[i].name_kana;
      allItems[i].producer = translations[i].producer || allItems[i].producer_kana || null;
      translated++;
    } else {
      allItems[i].name = allItems[i].name_kana;
      allItems[i].producer = allItems[i].producer_kana || null;
    }
  }
  console.log(`   翻訳適用: ${translated}/${allItems.length}\n`);

  // 3. Soft-delete existing data
  console.log('4. 既存データをソフトデリート...');
  await softDeleteAll();
  console.log('');

  // 4. Insert new data
  console.log('5. 新データを登録...');
  const count = await insertItems(allItems);
  console.log('');

  // Summary
  console.log('=== 完了 ===');
  console.log(`登録: ${count} items`);
  const byStore = {};
  allItems.forEach(r => { byStore[r.store_id] = (byStore[r.store_id] || 0) + 1; });
  console.log('店舗別:', JSON.stringify(byStore, null, 2));

  // Show samples
  console.log('\nサンプル（変換結果）:');
  const samples = [0, 100, 500, 1000, 2052, 2100, 3000];
  for (const idx of samples) {
    if (idx < allItems.length) {
      const item = allItems[idx];
      console.log(`  [${item.store_id}] ${item.name} | ${item.name_kana} | ${item.producer || '-'}`);
    }
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
