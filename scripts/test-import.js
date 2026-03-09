/**
 * Test script: parse Excel and POST to import API
 * Usage: node scripts/test-import.js [--import URL storeId]
 */
const XLSX = require('xlsx');
const fs = require('fs');

// ===== Parser (synced with lib/excelParser.js) =====
const SHEET_CATEGORY_MAP = {
  'ワインリスト泡': { catId: 1, label: 'シャンパーニュ' },
  'ブルゴーニュ白': { catId: 8, label: 'ブルゴーニュ(白)' },
  'その他産地白ワイン': { catId: 14, label: 'その他(白)', subRegions: true },
  'ブルゴーニュ赤': { catId: 15, label: 'ブルゴーニュ(赤)' },
  '日本ワイン': { catId: 14, label: '日本ワイン' },
  'その他産地赤ワイン': { catId: 20, label: 'その他(赤)' },
  'グラスワイン': { catId: 2, label: 'グラスワイン', isGlass: true },
  'グラスワイン ': { catId: 2, label: 'グラスワイン', isGlass: true },
  'バーガンディー取り置き在庫': { catId: 15, label: 'バーガンディ取置' },
  'バーガンディー取り置き在庫 ': { catId: 15, label: 'バーガンディ取置' },
  '日本酒': { catId: 5, label: '日本酒' },
  'ビール　焼酎類': { catId: 6, label: 'ビール・焼酎' },
};
const SKIP_SHEETS = ['合計', '売り上げ', 'グラス備品'];

function parseWineRow(row, sheetName) {
  const vintage = row[0]; const name = row[1]; const qty = row[2]; const price = row[3];
  const costPrice = row[4]; const importer = row[6]; const supplier = row[7];
  if (!name || typeof name !== 'string' || name.trim() === '') return null;
  if (name.includes('正商品名') || name.includes('ヴィンテージ')) return null;
  if (name.includes('合計') || name.includes('小計')) return null;
  const trimmed = String(name).trim();
  if (trimmed === '在庫' || trimmed.length <= 1) return null;
  let v = null;
  if (vintage !== null && vintage !== undefined && vintage !== '') {
    const vs = String(vintage).trim();
    if (vs !== 'NV' && vs !== 'nv') { const num = parseInt(vs); if (!isNaN(num) && num >= 1900 && num <= 2100) v = num; }
  }
  let q = 0;
  if (qty !== null && qty !== undefined && qty !== '') { const qn = parseFloat(qty); if (!isNaN(qn) && qn >= 0) q = Math.round(qn); }
  let p = null;
  if (price !== null && price !== undefined && price !== '') { const pn = parseInt(String(price).replace(/[,¥]/g, '')); if (!isNaN(pn) && pn > 0) p = pn; }
  let cp = null;
  if (costPrice !== null && costPrice !== undefined && costPrice !== '') { const cpn = parseInt(String(costPrice).replace(/[,¥]/g, '')); if (!isNaN(cpn) && cpn > 0) cp = cpn; }
  const notes = [importer ? `仕入: ${String(importer).trim()}` : '', supplier ? `業者: ${String(supplier).trim()}` : ''].filter(Boolean).join(' / ');
  return { name: trimmed, vintage: v, quantity: q, price: p, cost_price: cp, notes: notes || null, _sheet: sheetName };
}

function parseSakeRow(row) {
  const name = row[0]; const qty = row[1]; const costPrice = row[2]; const supplier = row[3];
  if (!name || typeof name !== 'string' || name.trim() === '') return null;
  if (name.includes('正商品名') || name.includes('合計') || name.includes('小計')) return null;
  const trimmed = String(name).trim();
  if (trimmed === '在庫' || trimmed.length <= 1) return null;
  let q = 0;
  if (qty !== null && qty !== undefined) { const qn = parseFloat(qty); if (!isNaN(qn) && qn >= 0) q = Math.round(qn); }
  let cp = null;
  if (costPrice !== null && costPrice !== undefined) { const cpn = parseInt(String(costPrice).replace(/[,¥]/g, '')); if (!isNaN(cpn) && cpn > 0) cp = cpn; }
  return { name: trimmed, vintage: null, quantity: q, price: null, cost_price: cp, notes: supplier ? `業者: ${String(supplier).trim()}` : null, _sheet: '日本酒' };
}

function parseBaruRow(row) {
  const vintage = row[0]; const name = row[1]; const qty = row[2]; const costPrice = row[3];
  if (!name || typeof name !== 'string' || name.trim() === '') return null;
  if (name.includes('正商品名')) return null;
  const trimmed = String(name).trim();
  if (trimmed === '在庫' || trimmed.length <= 1) return null;
  let v = null;
  if (vintage) { const vs = String(vintage).trim(); if (vs !== 'NV') { const num = parseInt(vs); if (!isNaN(num) && num >= 1900 && num <= 2100) v = num; } }
  let q = 0;
  if (qty !== null && qty !== undefined) { const qn = parseFloat(qty); if (!isNaN(qn) && qn >= 0) q = Math.round(qn); }
  let cp = null;
  if (costPrice !== null && costPrice !== undefined) { const cpn = parseInt(String(costPrice).replace(/[,¥]/g, '')); if (!isNaN(cpn) && cpn > 0) cp = cpn; }
  return { name: trimmed, vintage: v, quantity: q, price: null, cost_price: cp, notes: 'バーガンディ取置', _sheet: 'バーガンディー取り置き在庫' };
}

function parseGlassRow(row) {
  const region = row[0]; const vintage = row[1]; const name = row[2]; const qty = row[3];
  const costPrice = row[5]; const supplier = row[7];
  if (!name || typeof name !== 'string' || name.trim() === '') return null;
  if (name.includes('正商品名')) return null;
  const trimmed = String(name).trim();
  if (trimmed === '在庫' || trimmed.length <= 1) return null;
  let v = null;
  if (vintage) { const vs = String(vintage).trim(); if (vs !== 'NV') { const num = parseInt(vs); if (!isNaN(num) && num >= 1900 && num <= 2100) v = num; } }
  let q = 0;
  if (qty !== null && qty !== undefined) { const qn = parseFloat(qty); if (!isNaN(qn) && qn >= 0) q = Math.round(qn); }
  let cp = null;
  if (costPrice !== null && costPrice !== undefined) { const cpn = parseInt(String(costPrice).replace(/[,¥]/g, '')); if (!isNaN(cpn) && cpn > 0) cp = cpn; }
  return { name: trimmed, vintage: v, quantity: q, price: null, cost_price: cp, region: region && typeof region === 'string' ? region.trim() : null, notes: supplier ? `業者: ${String(supplier).trim()}` : 'グラスワイン', _sheet: 'グラスワイン' };
}

function parseInventoryExcel(workbook) {
  const results = [];
  for (const sheetName of workbook.SheetNames) {
    if (SKIP_SHEETS.includes(sheetName.trim())) continue;
    const mapping = Object.entries(SHEET_CATEGORY_MAP).find(([k]) =>
      sheetName.trim() === k.trim() || sheetName.includes(k.trim()) || k.trim().includes(sheetName.trim())
    );
    if (!mapping) continue;
    const [, meta] = mapping;
    const ws = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    const items = [];
    for (const row of data) {
      let parsed = null;
      if (sheetName.trim() === '日本酒') parsed = parseSakeRow(row);
      else if (sheetName.trim().includes('バーガンディー取り置き')) parsed = parseBaruRow(row);
      else if (sheetName.trim().includes('グラスワイン')) parsed = parseGlassRow(row);
      else parsed = parseWineRow(row, sheetName);
      if (parsed) {
        parsed.category_id = meta.catId;
        parsed._categoryLabel = meta.label;
        items.push(parsed);
      }
    }
    if (items.length > 0) results.push({ sheet: sheetName, label: meta.label, catId: meta.catId, items });
  }
  return results;
}

// ===== Main =====
async function main() {
  const filePath = 'C:/Users/RyojiHayashi/Downloads/明寂飲料在庫 2026.01.xlsx';
  console.log('Reading:', filePath);
  const buf = fs.readFileSync(filePath);
  const wb = XLSX.read(buf);

  const results = parseInventoryExcel(wb);

  let totalItems = 0;
  for (const group of results) {
    console.log(`\n📋 ${group.label} (${group.sheet}): ${group.items.length} items, catId=${group.catId}`);
    totalItems += group.items.length;
    for (let i = 0; i < Math.min(2, group.items.length); i++) {
      const it = group.items[i];
      console.log(`   ${it.vintage || 'NV'} ${it.name} | qty=${it.quantity} price=${it.price} cost=${it.cost_price}`);
    }
  }
  console.log(`\n✅ Total: ${totalItems} items across ${results.length} sheets`);

  const mode = process.argv[2];
  if (mode === '--import') {
    const API_URL = process.argv[3] || 'https://wine-compass.vercel.app';
    const storeId = process.argv[4] || 'hakune';

    // Import sheet by sheet to avoid timeout
    let totalInserted = 0;
    let totalErrors = 0;

    for (const group of results) {
      const items = group.items;
      console.log(`\n🚀 Importing ${group.label}: ${items.length} items...`);

      try {
        const resp = await fetch(`${API_URL}/api/import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items, store_id: storeId }),
        });
        const text = await resp.text();
        try {
          const data = JSON.parse(text);
          console.log(`   ✅ ${data.inserted || 0} inserted, ${data.errors?.length || 0} errors`);
          totalInserted += (data.inserted || 0);
          totalErrors += (data.errors?.length || 0);
          if (data.errors?.length > 0) {
            for (const e of data.errors) console.log(`   ❌ Chunk ${e.chunk}: ${e.error}`);
          }
        } catch (parseErr) {
          console.log(`   ❌ Bad response (status ${resp.status}): ${text.substring(0, 200)}`);
          totalErrors++;
        }
      } catch (fetchErr) {
        console.log(`   ❌ Fetch error: ${fetchErr.message}`);
        totalErrors++;
      }
    }

    console.log(`\n🏁 Import complete: ${totalInserted} inserted, ${totalErrors} errors`);
  } else {
    console.log('\nRun with --import to actually import to DB:');
    console.log('  node scripts/test-import.js --import https://wine-compass.vercel.app hakune');
  }
}

main().catch(console.error);
