#!/usr/bin/env node
/**
 * Wine List Import Script
 * Parses wine list Excel files for all stores and imports via API
 *
 * Usage: node scripts/import-wine-list.js [store1] [store2] ...
 *   node scripts/import-wine-list.js myoujyaku tousenkaku kanshin ippei
 *   node scripts/import-wine-list.js myoujyaku  (single store)
 */
const XLSX = require('xlsx');
const https = require('https');

const BASE_URL = 'https://wine-compass.vercel.app';
const DIR = 'C:/Users/RyojiHayashi/Downloads';

const FILES = {
  myoujyaku: `${DIR}/20260301明寂ワインリスト.xlsx`,
  tousenkaku: `${DIR}/20260301桃仙閣ワインリスト.xlsx`,
  kanshin: `${DIR}/20260301寛心ワインリスト.xlsx`,
  ippei: `${DIR}/20260301一平飯店ワインリスト.xlsx`,
};

// ======== Helpers ========

function str(v) {
  if (v == null) return '';
  return String(v).trim();
}
function num(v) {
  if (v == null) return null;
  const n = parseInt(String(v).replace(/[,¥\\]/g, ''));
  return isNaN(n) ? null : n;
}
function isEmptyRow(row) {
  return !row || row.every(c => c == null || String(c).trim() === '');
}
function isVintageOrNV(s) {
  if (!s) return false;
  const t = str(s);
  return /^\d{4}$/.test(t) || /^n\.?v\.?$/i.test(t);
}

function apiCall(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const opts = {
      hostname: url.hostname, path: url.pathname + url.search,
      method, headers: { 'Content-Type': 'application/json' }, timeout: 60000,
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

// ======== Store Parsers ========

/**
 * MYOUJYAKU (明寂)
 * Sheets: 扉 (skip), シャンパーニュ, ブルゴーニュ白, その他産地白, ブルゴーニュ赤, ボルドー赤, その他産地赤
 * Layout: A=vintage, B=name(EN/JP paired rows), H=price
 * No producer column, no cost price
 */
function parseMyoujyaku(file) {
  const wb = XLSX.readFile(file);
  const sections = [
    { sheet: 'シャンパーニュ', en: 'Champagne', order: 1 },
    { sheet: 'ブルゴーニュ白', en: 'Bourgogne Blanc', order: 2 },
    { sheet: 'その他産地白', en: 'Other White', order: 3 },
    { sheet: 'ブルゴーニュ赤', en: 'Bourgogne Rouge', order: 4 },
    { sheet: 'ボルドー赤', en: 'Bordeaux Rouge', order: 5 },
    { sheet: 'その他産地赤', en: 'Other Red', order: 6 },
  ];

  const allItems = [];

  for (const sec of sections) {
    const ws = wb.Sheets[sec.sheet];
    if (!ws) continue;
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    let sortOrder = 0;
    let currentSubsection = null;
    let currentSubsectionEn = null;

    for (let i = 0; i < data.length; i++) {
      const row = data[i] || [];
      if (isEmptyRow(row)) continue;

      const colA = str(row[0]);
      const colB = str(row[1]);
      const colH = num(row[7]);

      // Skip section title rows (first 1-2 rows with section headers)
      if (i < 3 && !colH && colB.length < 5) continue;

      // Detect sub-section headers: text in A or B with no price
      // Sub-sections like "コート・ド・ニュイ", "Côte de Nuits"
      if (!colH && colB && colB.length > 2 && !isVintageOrNV(colA)) {
        // Could be subsection header
        if (/^[A-Za-zÀ-ÿ\s\-'.]+$/.test(colB) && colB.length > 3) {
          currentSubsectionEn = colB;
        } else if (/[\u3000-\u9FFF]/.test(colB)) {
          currentSubsection = colB;
        }
        continue;
      }

      // Main data: EN row with vintage in A, name in B, price in H
      if (colH && colB) {
        const vintage = isVintageOrNV(colA) ? colA.replace(/\./g, '') : null;
        const nameEn = colB;

        // Next row should be JP
        const jpRow = data[i + 1] || [];
        const nameJp = str(jpRow[1]) || null;
        const priceIncl = num(jpRow[7]);

        sortOrder += 10;
        allItems.push({
          section: sec.sheet,
          section_en: sec.en,
          section_order: sec.order,
          subsection: currentSubsection,
          subsection_en: currentSubsectionEn,
          name_en: nameEn,
          name_jp: nameJp,
          producer_en: null,
          producer_jp: null,
          vintage: vintage === 'NV' ? 'N.V.' : vintage,
          sell_price: colH,
          sell_price_incl: priceIncl || Math.round(colH * 1.1),
          cost_price: null,
          sort_order: sortOrder,
        });

        i++; // skip JP row
      }
    }
  }

  return allItems;
}

/**
 * TOUSENKAKU (桃仙閣)
 * Skip numbered sheets (1-7 = title pages)
 * Data sheets: B=vintage, D=name, E=producer, F=price, H=cost, I=ratio
 * Exception: "Other White ・Orange" and "Other Red": F=region, G=price, I=cost
 */
function parseTousenkaku(file) {
  const wb = XLSX.readFile(file);

  const sections = [
    { sheets: ['CH 1', 'CH 2'], section: 'シャンパーニュ', en: 'Champagne', order: 1 },
    { sheets: ['BB 1', 'BB2 '], section: 'ブルゴーニュ白', en: 'Bourgogne Blanc', order: 2 },
    { sheets: ['France Other White'], section: 'フランスその他白', en: 'France Other White', order: 3 },
    { sheets: ['Other White ・Orange '], section: 'その他白・オレンジ', en: 'Other White & Orange', order: 4, isOther: true },
    { sheets: ['BR1', 'BR2', 'BR3'], section: 'ブルゴーニュ赤', en: 'Bourgogne Rouge', order: 5 },
    { sheets: ['France Other Red '], section: 'フランスその他赤', en: 'France Other Red', order: 6 },
    { sheets: ['Other Red'], section: 'その他赤', en: 'Other Red', order: 7, isOther: true },
  ];

  const allItems = [];

  for (const sec of sections) {
    let globalSort = 0;

    for (const sheetName of sec.sheets) {
      const ws = wb.Sheets[sheetName];
      if (!ws) {
        // Try trimmed versions
        const match = wb.SheetNames.find(s => s.trim() === sheetName.trim());
        if (match) {
          const ws2 = wb.Sheets[match];
          if (ws2) {
            const data = XLSX.utils.sheet_to_json(ws2, { header: 1 });
            const items = parseTousenkakuSheet(data, sec, globalSort, sec.isOther);
            allItems.push(...items);
            globalSort += items.length * 10;
          }
        }
        continue;
      }
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const items = parseTousenkakuSheet(data, sec, globalSort, sec.isOther);
      allItems.push(...items);
      globalSort += items.length * 10;
    }
  }

  return allItems;
}

function parseTousenkakuSheet(data, sec, startSort, isOther) {
  const items = [];
  let sortOrder = startSort;

  for (let i = 0; i < data.length; i++) {
    const row = data[i] || [];
    if (isEmptyRow(row)) continue;

    if (isOther) {
      // Other format: B=vintage, D=name, E=appellation, F=region(EN/JP), G=price, I=cost
      const vintage = str(row[1]);
      const nameVal = str(row[3]);
      const regionVal = str(row[5]);
      const priceVal = num(row[6]);
      const costVal = num(row[8]);

      if (!nameVal || !priceVal) continue;
      if (!isVintageOrNV(vintage) && !/[a-zA-Z]/.test(nameVal)) continue;

      // Check if this looks like an EN row (has Latin chars in name)
      if (/[a-zA-Z]/.test(nameVal)) {
        const jpRow = data[i + 1] || [];
        const nameJp = str(jpRow[3]) || null;
        const regionJp = str(jpRow[5]) || null;
        const priceIncl = num(jpRow[6]);

        sortOrder += 10;
        items.push({
          section: sec.section,
          section_en: sec.en,
          section_order: sec.order,
          name_en: nameVal,
          name_jp: nameJp,
          producer_en: null,
          producer_jp: null,
          vintage: isVintageOrNV(vintage) ? vintage.replace(/\./g, '').replace(/^nv$/i, 'N.V.') : null,
          sell_price: priceVal,
          sell_price_incl: priceIncl || Math.round(priceVal * 1.1),
          cost_price: costVal,
          region: regionVal || null,
          sort_order: sortOrder,
        });
        i++; // skip JP row
      }
    } else {
      // Standard format: B=vintage, D=name, E=producer, F=price, H=cost, I=ratio
      const vintage = str(row[1]);
      const nameVal = str(row[3]);
      const producerVal = str(row[4]);
      const priceVal = num(row[5]);
      const costVal = num(row[7]);

      if (!nameVal || !priceVal) continue;

      // Check if EN row (has Latin chars)
      if (/[a-zA-Z]/.test(nameVal)) {
        const jpRow = data[i + 1] || [];
        const nameJp = str(jpRow[3]) || null;
        const producerJp = str(jpRow[4]) || null;
        const priceIncl = num(jpRow[5]);

        sortOrder += 10;
        items.push({
          section: sec.section,
          section_en: sec.en,
          section_order: sec.order,
          name_en: nameVal,
          name_jp: nameJp,
          producer_en: producerVal || null,
          producer_jp: producerJp || null,
          vintage: isVintageOrNV(vintage) ? vintage.replace(/\./g, '').replace(/^nv$/i, 'N.V.') : null,
          sell_price: priceVal,
          sell_price_incl: priceIncl || Math.round(priceVal * 1.1),
          cost_price: costVal,
          sort_order: sortOrder,
        });
        i++; // skip JP row
      }
    }
  }

  return items;
}

/**
 * KANSHIN (寛心)
 * Skip: グラスドリンク, ソフトドリンク
 * Sake: 日本酒 sheets (special format, JP first then EN)
 * Wine: vintage in A/B, name in C/D (producer embedded), price in E/F, cost in G/H
 * Column offset varies between sheets
 */
function parseKanshin(file) {
  const wb = XLSX.readFile(file);
  const allItems = [];

  // Define sections
  const wineSections = [
    { sheets: ['Champagne (1)', 'Champagne (2)'], section: 'シャンパーニュ', en: 'Champagne', order: 1 },
    { sheets: ['Bourgogne Blanc(1)', 'Bourgogne Blanc (2)', 'Bourgogne Blanc (3)'], section: 'ブルゴーニュ白', en: 'Bourgogne Blanc', order: 2 },
    { sheets: ['Bourgogne Rouge(1)', 'Bourgogne Rouge(2)', 'Bourgogne Rouge(3)'], section: 'ブルゴーニュ赤', en: 'Bourgogne Rouge', order: 3 },
    { sheets: ['France outher'], section: 'フランスその他', en: 'France Other', order: 4 },
    { sheets: ['outher wine'], section: 'その他ワイン', en: 'Other Wine', order: 5 },
    { sheets: ['Japan wine'], section: '日本ワイン', en: 'Japan Wine', order: 6 },
  ];

  // Parse sake sheets
  const sakeSheets = wb.SheetNames.filter(s => s.startsWith('日本酒'));
  if (sakeSheets.length > 0) {
    let sakeSort = 0;
    for (const sheetName of sakeSheets) {
      const ws = wb.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

      for (let i = 0; i < data.length; i++) {
        const row = data[i] || [];
        if (isEmptyRow(row)) continue;

        // Sake format: C=name, D=grade, E=origin, F=serving, G=price(tax-excl), H=price(tax-incl)
        const nameVal = str(row[2]);
        const gradeVal = str(row[3]);
        const priceVal = num(row[6]) || num(row[7]);

        if (!nameVal || !priceVal) continue;

        // JP row comes first for sake, check if it has Japanese chars
        if (/[\u3000-\u9FFF\u30A0-\u30FF]/.test(nameVal)) {
          const enRow = data[i + 1] || [];
          const nameEn = str(enRow[2]) || null;
          const gradeEn = str(enRow[3]) || null;

          sakeSort += 10;
          allItems.push({
            section: '日本酒',
            section_en: 'Japanese Sake',
            section_order: 7,
            name_en: nameEn || nameVal,
            name_jp: nameVal + (gradeVal ? ` ${gradeVal}` : ''),
            producer_en: gradeEn || null,
            producer_jp: gradeVal || null,
            vintage: null,
            sell_price: num(row[6]),
            sell_price_incl: num(row[7]) || (num(row[6]) ? Math.round(num(row[6]) * 1.1) : null),
            cost_price: null,
            region: str(row[4]) || null,
            sort_order: sakeSort,
          });
          i++; // skip EN row
        }
      }
    }
  }

  // Parse wine sections
  for (const sec of wineSections) {
    let globalSort = 0;

    for (const sheetName of sec.sheets) {
      // Find sheet (handle whitespace variations)
      const match = wb.SheetNames.find(s => s.trim() === sheetName.trim());
      if (!match) continue;
      const ws = wb.Sheets[match];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

      // Detect column offset: find which column has the vintage
      let vintageCol = 0, nameCol = 2, priceCol = 4, costCol = 6;

      // Check first few data rows to detect layout
      for (let i = 0; i < Math.min(10, data.length); i++) {
        const row = data[i] || [];
        // If col B has vintage, offset by 1
        if (isVintageOrNV(str(row[1])) && !isVintageOrNV(str(row[0]))) {
          vintageCol = 1; nameCol = 3; priceCol = 5; costCol = 7;
          break;
        }
        if (isVintageOrNV(str(row[0]))) {
          vintageCol = 0; nameCol = 2; priceCol = 4; costCol = 6;
          break;
        }
      }

      for (let i = 0; i < data.length; i++) {
        const row = data[i] || [];
        if (isEmptyRow(row)) continue;

        const vintage = str(row[vintageCol]);
        const nameVal = str(row[nameCol]);
        const priceVal = num(row[priceCol]);

        if (!nameVal || !priceVal) continue;

        // Check if EN row
        if (/[a-zA-Z]/.test(nameVal) && nameVal.length > 3) {
          const jpRow = data[i + 1] || [];
          const nameJp = str(jpRow[nameCol]) || null;
          const priceIncl = num(jpRow[priceCol]);
          const costVal = num(row[costCol]);

          // Split producer from name (Kanshin embeds producer after comma)
          let prodEn = null, prodJp = null, wineName = nameVal, wineNameJp = nameJp;
          const commaIdx = nameVal.lastIndexOf(',');
          if (commaIdx > 0) {
            wineName = nameVal.substring(0, commaIdx).trim();
            prodEn = nameVal.substring(commaIdx + 1).trim();
          }
          if (nameJp) {
            const commaIdx2 = nameJp.lastIndexOf('、');
            const commaIdx3 = nameJp.lastIndexOf(',');
            const ci = Math.max(commaIdx2, commaIdx3);
            if (ci > 0) {
              wineNameJp = nameJp.substring(0, ci).trim();
              prodJp = nameJp.substring(ci + 1).trim();
            }
          }

          globalSort += 10;
          allItems.push({
            section: sec.section,
            section_en: sec.en,
            section_order: sec.order,
            name_en: wineName,
            name_jp: wineNameJp,
            producer_en: prodEn,
            producer_jp: prodJp,
            vintage: isVintageOrNV(vintage) ? vintage.replace(/\./g, '').replace(/^nv$/i, 'N.V.') : null,
            sell_price: priceVal,
            sell_price_incl: priceIncl || Math.round(priceVal * 1.1),
            cost_price: costVal,
            sort_order: globalSort,
          });
          i++; // skip JP row
        }
      }
    }
  }

  return allItems;
}

/**
 * IPPEI (一平飯店)
 * Skip: "00", "01" (title sheets)
 * Pattern A (most sheets): B=vintage, D=name, E=producer, F=price, H=cost
 * Pattern B (Rouge 1,2): may shift columns
 * Pattern C (Other): B=vintage, D=name, E=appellation, F=region, G=price, I=cost
 */
function parseIppei(file) {
  const wb = XLSX.readFile(file);

  const sections = [
    {
      sheets: ['Champagne(1)', 'Champagne (2)', 'Champagne(3)'],
      section: 'シャンパーニュ', en: 'Champagne', order: 1,
    },
    {
      sheets: ['Bourgogne Blanc(1) ', 'Bourgogne Blanc(2)', 'Bourgogne Blanc(３)'],
      section: 'ブルゴーニュ白', en: 'Bourgogne Blanc', order: 2,
    },
    {
      sheets: ['White Other'],
      section: 'その他白', en: 'White Other', order: 3, isOther: true,
    },
    {
      sheets: ['Bourgogne Rouge (1)', 'Bourgogne Rouge（２）', 'Bourgogne Rouge (3)', 'Bourgogne Rouge(4)'],
      section: 'ブルゴーニュ赤', en: 'Bourgogne Rouge', order: 4,
    },
    {
      sheets: ['Red Other'],
      section: 'その他赤', en: 'Red Other', order: 5, isOther: true,
    },
  ];

  const allItems = [];

  for (const sec of sections) {
    let globalSort = 0;

    for (const sheetName of sec.sheets) {
      // Find sheet (handle whitespace and fullwidth chars)
      const match = wb.SheetNames.find(s =>
        s.trim() === sheetName.trim() ||
        s.replace(/\s/g, '') === sheetName.replace(/\s/g, '') ||
        s.replace(/[（）３]/g, m => ({ '（': '(', '）': ')', '３': '3' }[m] || m)).trim() === sheetName.replace(/[（）３]/g, m => ({ '（': '(', '）': ')', '３': '3' }[m] || m)).trim()
      );
      if (!match) continue;
      const ws = wb.Sheets[match];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

      if (sec.isOther) {
        // Other pattern: B=vintage, D=name, E=appellation, F=region, G=price, I=cost
        for (let i = 0; i < data.length; i++) {
          const row = data[i] || [];
          if (isEmptyRow(row)) continue;

          const vintage = str(row[1]);
          const nameVal = str(row[3]);
          const appellationVal = str(row[4]);
          const regionVal = str(row[5]);
          const priceVal = num(row[6]);
          const costVal = num(row[8]);

          if (!nameVal || !priceVal) continue;
          if (!/[a-zA-Z]/.test(nameVal)) continue;

          const jpRow = data[i + 1] || [];
          const nameJp = str(jpRow[3]) || null;
          const regionJp = str(jpRow[5]) || null;
          const priceIncl = num(jpRow[6]);

          globalSort += 10;
          allItems.push({
            section: sec.section,
            section_en: sec.en,
            section_order: sec.order,
            name_en: nameVal,
            name_jp: nameJp,
            producer_en: appellationVal || null,
            producer_jp: null,
            vintage: isVintageOrNV(vintage) ? vintage.replace(/\./g, '').replace(/^nv$/i, 'N.V.') : null,
            sell_price: priceVal,
            sell_price_incl: priceIncl || Math.round(priceVal * 1.1),
            cost_price: costVal,
            region: (regionVal || regionJp) || null,
            sort_order: globalSort,
          });
          i++; // skip JP row
        }
      } else {
        // Standard pattern - detect column layout
        let vintageCol = 1, nameCol = 3, producerCol = 4, priceCol = 5, costCol = 7;

        // Check first few data rows to detect if offset
        for (let i = 0; i < Math.min(15, data.length); i++) {
          const row = data[i] || [];
          // If A has vintage data, use offset 0
          if (isVintageOrNV(str(row[0])) && str(row[2]) && /[a-zA-Z]/.test(str(row[2]))) {
            vintageCol = 0; nameCol = 2; producerCol = 3; priceCol = 4; costCol = 6;
            break;
          }
          // If B has vintage data, use offset 1
          if (isVintageOrNV(str(row[1])) && str(row[3]) && /[a-zA-Z]/.test(str(row[3]))) {
            vintageCol = 1; nameCol = 3; producerCol = 4; priceCol = 5; costCol = 7;
            break;
          }
        }

        for (let i = 0; i < data.length; i++) {
          const row = data[i] || [];
          if (isEmptyRow(row)) continue;

          const vintage = str(row[vintageCol]);
          const nameVal = str(row[nameCol]);
          const producerVal = str(row[producerCol]);
          const priceVal = num(row[priceCol]);
          const costVal = num(row[costCol]);

          if (!nameVal || !priceVal) continue;
          if (!/[a-zA-Z]/.test(nameVal)) continue;

          const jpRow = data[i + 1] || [];
          const nameJp = str(jpRow[nameCol]) || null;
          const producerJp = str(jpRow[producerCol]) || null;
          const priceIncl = num(jpRow[priceCol]);

          globalSort += 10;
          allItems.push({
            section: sec.section,
            section_en: sec.en,
            section_order: sec.order,
            name_en: nameVal,
            name_jp: nameJp,
            producer_en: producerVal || null,
            producer_jp: producerJp || null,
            vintage: isVintageOrNV(vintage) ? vintage.replace(/\./g, '').replace(/^nv$/i, 'N.V.') : null,
            sell_price: priceVal,
            sell_price_incl: priceIncl || Math.round(priceVal * 1.1),
            cost_price: costVal,
            sort_order: globalSort,
          });
          i++; // skip JP row
        }
      }
    }
  }

  return allItems;
}

// ======== Main ========

const PARSERS = {
  myoujyaku: parseMyoujyaku,
  tousenkaku: parseTousenkaku,
  kanshin: parseKanshin,
  ippei: parseIppei,
};

async function importStore(storeId) {
  const file = FILES[storeId];
  const parser = PARSERS[storeId];
  if (!file || !parser) {
    console.log(`Unknown store: ${storeId}`);
    return;
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Parsing ${storeId}: ${file}`);
  console.log('='.repeat(50));

  let items;
  try {
    items = parser(file);
  } catch (e) {
    console.error(`Parse error: ${e.message}`);
    return;
  }

  // Print summary
  const sectionCounts = {};
  for (const item of items) {
    const key = `${item.section_order}. ${item.section} (${item.section_en})`;
    sectionCounts[key] = (sectionCounts[key] || 0) + 1;
  }
  for (const [k, v] of Object.entries(sectionCounts)) {
    console.log(`  ${k}: ${v} items`);
  }
  console.log(`  TOTAL: ${items.length} items`);

  // Show first 3 items as sample
  console.log('\n  Sample items:');
  for (const item of items.slice(0, 3)) {
    console.log(`    ${item.vintage || 'NV'} | ${item.name_en} | ${item.name_jp || '-'} | ¥${item.sell_price_incl}`);
  }

  // Clear existing wine list items for this store
  console.log(`\n  Clearing existing items for ${storeId}...`);
  try {
    const del = await apiCall('DELETE', `/api/wine-list-items?store=${storeId}`);
    console.log(`  Cleared: ${del.deleted || 0} items`);
  } catch (e) {
    console.log(`  Clear failed: ${e.message} (table may not exist yet)`);
  }

  // Import items
  console.log(`  Importing ${items.length} items...`);
  try {
    const res = await apiCall('POST', '/api/wine-list-items', { store_id: storeId, items });
    console.log(`  Imported: ${res.inserted || 0} items`);
    if (res.errors) console.log(`  Errors: ${JSON.stringify(res.errors)}`);
  } catch (e) {
    console.error(`  Import error: ${e.message}`);
  }
}

async function main() {
  const stores = process.argv.slice(2);
  if (stores.length === 0) {
    console.log('Usage: node scripts/import-wine-list.js [store1] [store2] ...');
    console.log('Available stores: myoujyaku, tousenkaku, kanshin, ippei');
    console.log('\nRunning all stores...');
    for (const s of ['myoujyaku', 'tousenkaku', 'kanshin', 'ippei']) {
      await importStore(s);
    }
  } else {
    for (const s of stores) {
      await importStore(s);
    }
  }
  console.log('\nDone!');
}

main().catch(console.error);
