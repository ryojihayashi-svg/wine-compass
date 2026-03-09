#!/usr/bin/env node
/**
 * Import Excel inventory files via Wine Compass API
 * Usage: node scripts/import-via-api.js --all <directory>
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const https = require('https');

const BASE_URL = 'https://wine-compass.vercel.app';

const SHEET_CAT_MAP = {
  'シャンパン': 1, 'ワインリスト泡': 1,
  'ブルゴーニュ白': 8, '白ワイン': 2, 'フランス白': 2,
  'その他白・オレンジ': 14, 'その他産地白ワイン': 2,
  'ワインリスト白': 2, 'ワインリスト白とロゼ': 2,
  'ブルゴーニュ赤': 15, '赤ワイン': 3, 'フランス赤': 3,
  'その他赤': 3, 'その他産地赤ワイン': 3, '日本ワイン': 3, 'ワインリスト赤': 3,
  '財産': 3,
  '日本酒': 5,
  'ビール 蒸留酒': 6, 'ビール蒸留酒': 6, 'その他ドリンク': 6, 'その他飲料': 6,
  'ノンアルコール': 7,
  'グラスワイン、ペアリングアイテム': 7, 'グラスワイン': 7, 'グラス': 7, 'グラスペアリング': 7,
};

const SKIP_SHEETS = new Set(['合計', '林さん持参', '白寧移動ワイン', 'バーガンディ在庫']);

const FILE_STORE_MAP = {
  '白寧': 'hakune', '桃仙閣': 'tousenkaku', '明寂': 'myoujyaku',
  '寛心': 'kanshin', '一平飯店': 'ippei',
};

function guessStoreId(fn) {
  for (const [k, v] of Object.entries(FILE_STORE_MAP)) { if (fn.includes(k)) return v; }
  return null;
}

function parseVintage(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (s === 'NV' || s === 'nv') return null;
  const m = s.match(/(\d{4})/);
  return m ? parseInt(m[1]) : null;
}

function parseNameProducer(rawName) {
  if (!rawName) return { name: '', producer: '' };
  let name = String(rawName).trim();
  let producer = '';
  const pMatch = name.match(/[（(]([^）)]+)[）)]\s*$/);
  if (pMatch) {
    producer = pMatch[1].trim();
    name = name.replace(/\s*[（(][^）)]+[）)]\s*$/, '').trim();
  }
  return { name, producer };
}

function parseSheet(ws, categoryId, storeId) {
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  const items = [];
  let headerIdx = 0;
  for (let i = 0; i < Math.min(5, data.length); i++) {
    if ((data[i] || []).some(c => String(c || '').includes('商品名'))) { headerIdx = i; break; }
  }
  const header = (data[headerIdx] || []).map(h => String(h || '').trim());
  const col = { vintage: 1, name: 2, quantity: 3, price: 4 };
  for (let i = 0; i < header.length; i++) {
    if (header[i].includes('ヴィンテージ')) col.vintage = i;
    if (header[i].includes('商品名')) col.name = i;
    if (header[i].includes('在庫数')) col.quantity = i;
    if (header[i].includes('単価')) col.price = i;
  }

  for (let i = headerIdx + 1; i < data.length; i++) {
    const row = data[i] || [];
    const rawName = row[col.name];
    if (!rawName) continue;
    const nameStr = String(rawName).trim();
    if (['参考（合計外）', '合計'].includes(nameStr) || nameStr.includes('小計') || nameStr.length < 2) continue;
    const { name, producer } = parseNameProducer(nameStr);
    if (!name) continue;
    items.push({
      category_id: categoryId,
      name, producer: producer || null,
      vintage: parseVintage(row[col.vintage]),
      quantity: parseInt(row[col.quantity]) || 0,
      price: parseInt(row[col.price]) || null,
      cost_price: parseInt(row[col.price]) || null,
      size_ml: 750,
    });
  }
  return items;
}

function apiCall(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const opts = {
      hostname: url.hostname, path: url.pathname + url.search,
      method, headers: { 'Content-Type': 'application/json' },
      timeout: 60000,
    };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve({ raw: d }); } });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function importFile(filePath, storeId) {
  console.log(`\n📂 ${path.basename(filePath)} → ${storeId}`);
  const wb = XLSX.readFile(filePath);
  let allItems = [];

  for (const sn of wb.SheetNames) {
    if (SKIP_SHEETS.has(sn)) { console.log(`  ⏭  ${sn}`); continue; }
    const catId = SHEET_CAT_MAP[sn];
    if (catId === undefined) { console.log(`  ⚠️  Unknown: "${sn}"`); continue; }
    const items = parseSheet(wb.Sheets[sn], catId, storeId);
    console.log(`  📋 ${sn} → cat ${catId}: ${items.length}`);
    allItems = allItems.concat(items);
  }
  console.log(`  📊 Total: ${allItems.length}`);

  // Step 1: Delete existing
  console.log(`  🗑️  Clearing ${storeId}...`);
  try {
    const delRes = await apiCall('DELETE', `/api/import?store=${storeId}`);
    console.log(`  🗑️  Cleared: ${delRes.deleted || 0} items`);
  } catch (e) {
    console.log(`  ⚠️  Clear failed: ${e.message}`);
  }

  // Step 2: Import in chunks of 200 (API handles sub-batching)
  const CHUNK = 200;
  let totalInserted = 0, totalErrors = 0;

  for (let i = 0; i < allItems.length; i += CHUNK) {
    const chunk = allItems.slice(i, i + CHUNK);
    try {
      const res = await apiCall('POST', '/api/import', { store_id: storeId, items: chunk });
      totalInserted += (res.inserted || 0);
      if (res.errors?.length) totalErrors += res.errors.length;
      process.stdout.write(`  ✅ ${totalInserted}/${allItems.length}\r`);
    } catch (e) {
      console.log(`  ❌ Chunk ${Math.floor(i/CHUNK)}: ${e.message}`);
      totalErrors += chunk.length;
    }
  }

  console.log(`  ✅ Done: ${totalInserted}/${allItems.length} (${totalErrors} err)`);
  return { inserted: totalInserted, errors: totalErrors, total: allItems.length };
}

async function main() {
  const args = process.argv.slice(2);
  if (args[0] !== '--all' || !args[1]) {
    console.log('Usage: node scripts/import-via-api.js --all <directory>');
    return;
  }
  const dir = args[1];
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx'));
  console.log(`🍷 Wine Compass Importer (via API)\nFound ${files.length} files\n`);

  let gt = 0, gi = 0, ge = 0;
  for (const f of files) {
    const sid = guessStoreId(f);
    if (!sid) { console.log(`⚠️  Unknown: ${f}`); continue; }
    const r = await importFile(path.join(dir, f), sid);
    gt += r.total; gi += r.inserted; ge += r.errors;
  }
  console.log(`\n🎉 Done! ${gi}/${gt} imported (${ge} errors)`);
}

main().catch(console.error);
