#!/usr/bin/env node
/**
 * Import Excel inventory files into Wine Compass (Supabase)
 * Usage: node scripts/import-excel.js <path-to-xlsx> <store_id>
 *   or:  node scripts/import-excel.js --all <directory>
 */

const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// --- Config ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rfuuhelnojqgnfkhpyxn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  // Try loading from .env.local
  try {
    const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
    for (const line of envFile.split('\n')) {
      const [k, ...v] = line.split('=');
      if (k && v.length) process.env[k.trim()] = v.join('=').trim();
    }
  } catch (e) {}
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// --- Sheet name → category_id mapping ---
const SHEET_CAT_MAP = {
  // シャンパン系
  'シャンパン': 1,
  'ワインリスト泡': 1,

  // 白ワイン系
  'ブルゴーニュ白': 8,
  '白ワイン': 2,
  'フランス白': 2,
  'その他白・オレンジ': 14,
  'その他産地白ワイン': 2,
  'ワインリスト白': 2,
  'ワインリスト白とロゼ': 2,

  // 赤ワイン系
  'ブルゴーニュ赤': 15,
  '赤ワイン': 3,
  'フランス赤': 3,
  'その他赤': 3,
  'その他産地赤ワイン': 3,
  '日本ワイン': 3,
  'ワインリスト赤': 3,

  // 財産 (investment wines - usually red)
  '財産': 3,

  // 日本酒
  '日本酒': 5,

  // ビール・スピリッツ
  'ビール 蒸留酒': 6,
  'ビール蒸留酒': 6,
  'その他ドリンク': 6,
  'その他飲料': 6,

  // ソフトドリンク
  'ノンアルコール': 7,

  // グラスワイン系 — include but mark
  'グラスワイン、ペアリングアイテム': 7,
  'グラスワイン': 7,
  'グラス': 7,
  'グラスペアリング': 7,
};

// Sheets to skip
const SKIP_SHEETS = new Set([
  '合計',
  '林さん持参',
  '白寧移動ワイン',
  'バーガンディ在庫',
]);

// File → store_id mapping
const FILE_STORE_MAP = {
  '白寧': 'hakune',
  '桃仙閣': 'tousenkaku',
  '明寂': 'myoujyaku',
  '寛心': 'kanshin',
  '一平飯店': 'ippei',
};

function guessStoreId(filename) {
  for (const [key, storeId] of Object.entries(FILE_STORE_MAP)) {
    if (filename.includes(key)) return storeId;
  }
  return null;
}

function parseVintage(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (s === 'NV' || s === 'nv') return null;
  // Handle "NV（2021）" format
  const m = s.match(/(\d{4})/);
  return m ? parseInt(m[1]) : null;
}

function parseNameProducer(rawName) {
  if (!rawName) return { name: '', producer: '' };
  let name = String(rawName).trim();

  // Extract producer from parentheses: "ワイン名　（生産者）"
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

  // Find header row
  let headerIdx = -1;
  for (let i = 0; i < Math.min(5, data.length); i++) {
    const row = data[i] || [];
    if (row.some(c => String(c || '').includes('商品名') || String(c || '').includes('正商品名'))) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx < 0) headerIdx = 0; // assume first row is header

  // Map columns
  const header = (data[headerIdx] || []).map(h => String(h || '').trim());
  const colMap = {};
  for (let i = 0; i < header.length; i++) {
    const h = header[i];
    if (h.includes('ヴィンテージ') || h === 'VT') colMap.vintage = i;
    if (h.includes('商品名') || h.includes('正商品名')) colMap.name = i;
    if (h.includes('在庫数') || h === '数量') colMap.quantity = i;
    if (h.includes('単価') || h.includes('仕入')) colMap.price = i;
    if (h.includes('仕入先')) colMap.supplier = i;
  }

  // Default column positions if not found
  if (colMap.vintage === undefined) colMap.vintage = 1;
  if (colMap.name === undefined) colMap.name = 2;
  if (colMap.quantity === undefined) colMap.quantity = 3;
  if (colMap.price === undefined) colMap.price = 4;

  // Parse rows
  for (let i = headerIdx + 1; i < data.length; i++) {
    const row = data[i] || [];
    const rawName = row[colMap.name];
    if (!rawName) continue;

    const nameStr = String(rawName).trim();
    // Skip summary/header rows
    if (nameStr === '参考（合計外）' || nameStr === '合計' || nameStr.includes('小計')) continue;
    if (nameStr.length < 2) continue;

    const { name, producer } = parseNameProducer(nameStr);
    if (!name) continue;

    const vintage = parseVintage(row[colMap.vintage]);
    const quantity = parseInt(row[colMap.quantity]) || 0;
    const price = parseInt(row[colMap.price]) || null;

    items.push({
      store_id: storeId,
      category_id: categoryId,
      name,
      producer: producer || null,
      vintage,
      quantity,
      price,
      cost_price: price,
      size_ml: 750,
      is_deleted: false,
    });
  }

  return items;
}

async function importFile(filePath, storeId) {
  console.log(`\n📂 Importing: ${path.basename(filePath)} → store: ${storeId}`);
  const wb = XLSX.readFile(filePath);

  let allItems = [];

  for (const sheetName of wb.SheetNames) {
    if (SKIP_SHEETS.has(sheetName)) {
      console.log(`  ⏭  Skip: ${sheetName}`);
      continue;
    }

    const catId = SHEET_CAT_MAP[sheetName];
    if (catId === undefined) {
      console.log(`  ⚠️  Unknown sheet: "${sheetName}" — skipping`);
      continue;
    }

    const ws = wb.Sheets[sheetName];
    const items = parseSheet(ws, catId, storeId);
    console.log(`  📋 ${sheetName} → cat ${catId}: ${items.length} items`);
    allItems = allItems.concat(items);
  }

  console.log(`  📊 Total items to import: ${allItems.length}`);

  // Soft-delete existing items for this store
  console.log(`  🗑️  Soft-deleting existing items for store ${storeId}...`);
  const { error: delErr } = await supabase
    .from('wc_beverages')
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq('store_id', storeId)
    .eq('is_deleted', false);

  if (delErr) {
    console.log(`  ❌ Delete error: ${delErr.message}`);
  }

  // Insert in batches of 50
  const BATCH = 50;
  let inserted = 0, errors = 0;

  for (let i = 0; i < allItems.length; i += BATCH) {
    const batch = allItems.slice(i, i + BATCH);
    const { data, error } = await supabase
      .from('wc_beverages')
      .insert(batch)
      .select('id');

    if (error) {
      console.log(`  ❌ Batch ${Math.floor(i / BATCH) + 1} error: ${error.message}`);
      // Try one by one
      for (const item of batch) {
        const { error: e2 } = await supabase.from('wc_beverages').insert(item);
        if (e2) {
          errors++;
          if (errors <= 5) console.log(`    ❌ ${item.name}: ${e2.message}`);
        } else {
          inserted++;
        }
      }
    } else {
      inserted += (data || []).length;
    }

    if ((i + BATCH) % 200 === 0 || i + BATCH >= allItems.length) {
      process.stdout.write(`  ✅ ${inserted}/${allItems.length} inserted...\r`);
    }
  }

  console.log(`\n  ✅ Done: ${inserted} inserted, ${errors} errors`);
  return { inserted, errors, total: allItems.length };
}

async function main() {
  const args = process.argv.slice(2);

  if (args[0] === '--all') {
    const dir = args[1] || '.';
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx'));

    console.log(`🍷 Wine Compass Excel Importer`);
    console.log(`Found ${files.length} Excel files in ${dir}\n`);

    let grandTotal = 0, grandInserted = 0, grandErrors = 0;

    for (const file of files) {
      const storeId = guessStoreId(file);
      if (!storeId) {
        console.log(`⚠️  Cannot determine store for: ${file} — skipping`);
        continue;
      }
      const result = await importFile(path.join(dir, file), storeId);
      grandTotal += result.total;
      grandInserted += result.inserted;
      grandErrors += result.errors;
    }

    console.log(`\n🎉 All done! ${grandInserted}/${grandTotal} items imported (${grandErrors} errors)`);
  } else if (args.length >= 2) {
    const [file, storeId] = args;
    await importFile(file, storeId);
  } else {
    console.log('Usage:');
    console.log('  node scripts/import-excel.js --all <directory>');
    console.log('  node scripts/import-excel.js <file.xlsx> <store_id>');
  }
}

main().catch(console.error);
