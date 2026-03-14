/**
 * Excel Parser for Wine Compass inventory import
 * Supports two formats:
 *   A) バーガンディ在庫 — columns: [空, 区分, 取り置き先, 倉庫, 国, 産地, Vt, 商品名, 生産者, タイプ, 容量, 在庫数, 単価, 金額, インポーター, 備考]
 *   B) 5社在庫一覧    — columns: [空, 店舗, ヴィンテージ, 正商品名（カナ）, 在庫数, 単価, 仕入先, 金額]
 *
 * 棚卸し7分類:
 *   ① シャンパーニュ (catId=1)
 *   ② ブルゴーニュ白 (catId=8)
 *   ③ ブルゴーニュ赤 (catId=15)
 *   ④ その他ワイン   (catId=4)  — 白・赤・ロゼ・黄・オレンジ・甘・マディラ・ポート等
 *   ⑤ スピリッツ     (catId=21) — ウイスキー・マール・グラッパ・フィーヌ等
 *   ⑥ その他アルコール(catId=6) — 日本酒・紹興酒・ビール
 *   ⑦ ソフトドリンク  (catId=7)
 */

// Sheet name → category mapping (matches both file formats)
// Key patterns: any sheet name containing these keywords maps to the category
const SHEET_CATEGORY_MAP = {
  'シャンパーニュ':     { catId: 1,  label: '① シャンパーニュ' },
  'ブルゴーニュ白':     { catId: 8,  label: '② ブルゴーニュ白' },
  'ブルゴーニュ赤':     { catId: 15, label: '③ ブルゴーニュ赤' },
  'その他':             { catId: 4,  label: '④ その他ワイン' },
  'スピリッツ':         { catId: 21, label: '⑤ スピリッツ' },
  'その他アルコール':   { catId: 6,  label: '⑥ その他アルコール' },
  'ソフトドリンク':     { catId: 7,  label: '⑦ ソフトドリンク' },
};

// English/alternative sheet name patterns → category mapping
// Checked AFTER SHEET_CATEGORY_MAP (for the new Excel file formats with English sheet names)
const SHEET_NAME_PATTERNS = [
  { pattern: /champagne/i,                            catId: 1,  label: '① シャンパーニュ' },
  { pattern: /bourgogne\s*blanc|burgundy\s*white/i,   catId: 8,  label: '② ブルゴーニュ白' },
  { pattern: /white\s*other/i,                         catId: 8,  label: '② ブルゴーニュ白' },
  { pattern: /bourgogne\s*rouge|burgundy\s*red/i,     catId: 15, label: '③ ブルゴーニュ赤' },
  { pattern: /red\s*other/i,                           catId: 15, label: '③ ブルゴーニュ赤' },
  { pattern: /france\s*outher|france\s*other|outher\s*wine|other\s*wine/i, catId: 4, label: '④ その他ワイン' },
  { pattern: /japan\s*wine/i,                          catId: 4,  label: '④ その他ワイン' },
  { pattern: /spirit/i,                                catId: 21, label: '⑤ スピリッツ' },
  { pattern: /日本酒|sake/i,                           catId: 6,  label: '⑥ その他アルコール' },
  { pattern: /グラスドリンク|glass\s*drink/i,          catId: 6,  label: '⑥ その他アルコール' },
  { pattern: /ソフトドリンク|soft\s*drink/i,           catId: 7,  label: '⑦ ソフトドリンク' },
];

// Skip these sheets
const SKIP_SHEETS = ['合計', '凡例', '売り上げ', 'グラス備品', 'Sheet', 'summary', 'Total'];

// Store name (Japanese) → store_id mapping
const STORE_NAME_MAP = {
  '白寧': 'hakune',
  'はくね': 'hakune',
  '桃仙閣': 'tousenkaku',
  'とうせんかく': 'tousenkaku',
  '明寂': 'myoujyaku',
  'みょうじゃく': 'myoujyaku',
  '寛心': 'kanshin',
  'かんしん': 'kanshin',
  '一平飯店': 'ippei',
  'いっぺい': 'ippei',
};

// ── Utility ──────────────────────────────────────────────────
function parseVintage(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  const s = String(raw).trim();
  if (s === 'NV' || s === 'nv' || s === 'N.V.') return null;
  // Handle "NV（2021）" → extract 2021
  const paren = s.match(/\((\d{4})\)|\（(\d{4})\）/);
  if (paren) {
    const yr = parseInt(paren[1] || paren[2]);
    if (yr >= 1900 && yr <= 2100) return yr;
  }
  const num = parseInt(s);
  if (!isNaN(num) && num >= 1900 && num <= 2100) return num;
  return null;
}

function parseNumber(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  const n = parseFloat(String(raw).replace(/[,¥￥\s]/g, ''));
  return isNaN(n) ? null : n;
}

function parseInt0(raw) {
  const n = parseNumber(raw);
  return n === null ? 0 : Math.round(n);
}

function isSkipName(name) {
  if (!name || typeof name !== 'string') return true;
  const t = name.trim();
  if (t === '' || t.length <= 1) return true;
  if (/^(正商品名|ヴィンテージ|商品名|合計|小計|在庫|店舗|カテゴリ|区分)/.test(t)) return true;
  return false;
}

// ── Format A: バーガンディ在庫 ──────────────────────────────
// Columns: [空(0), 区分(1), 取り置き先(2), 倉庫(3), 国(4), 産地(5), Vt(6), 商品名(7), 生産者(8), タイプ(9), 容量(10), 在庫数(11), 単価(12), 金額(13), インポーター(14), 備考(15)]
function parseBurgundyRow(row) {
  const name = row[7];
  if (isSkipName(name)) return null;

  const kubun     = row[1] ? String(row[1]).trim() : '';
  const toroki    = row[2] ? String(row[2]).trim() : '';
  const warehouse = row[3] ? String(row[3]).trim() : '';
  const country   = row[4] ? String(row[4]).trim() : '';
  const region    = row[5] ? String(row[5]).trim() : '';
  const vintage   = parseVintage(row[6]);
  const producer  = row[8] ? String(row[8]).trim() : '';
  const type      = row[9] ? String(row[9]).trim() : '';
  const sizeMl    = parseInt0(row[10]) || 750;
  const quantity  = parseInt0(row[11]);
  const costPrice = parseNumber(row[12]);
  const importer  = row[14] ? String(row[14]).trim() : '';
  const memo      = row[15] ? String(row[15]).trim() : '';

  // Build notes
  const noteParts = [];
  if (kubun && kubun !== '社内在庫') noteParts.push(kubun);
  if (toroki) noteParts.push(`取置: ${toroki}`);
  if (importer) noteParts.push(`仕入: ${importer}`);
  if (memo) noteParts.push(memo);

  return {
    name: String(name).trim(),
    vintage,
    producer: producer || null,
    region: [country, region].filter(Boolean).join(' ') || null,
    type: type || null,
    size_ml: sizeMl,
    quantity,
    price: null,
    cost_price: costPrice ? Math.round(costPrice) : null,
    notes: noteParts.length > 0 ? noteParts.join(' / ') : null,
    _format: 'burgundy',
  };
}

// ── Format B: 5社在庫一覧 ──────────────────────────────────
// Columns: [空(0), 店舗(1), ヴィンテージ(2), 正商品名カナ(3), 在庫数(4), 単価(5), 仕入先(6), 金額(7)]
function parseStoreRow(row) {
  const name = row[3];
  if (isSkipName(name)) return null;

  const storeName = row[1] ? String(row[1]).trim() : '';
  const vintage   = parseVintage(row[2]);
  const quantity  = parseInt0(row[4]);
  const costPrice = parseNumber(row[5]);
  const supplier  = row[6] ? String(row[6]).trim() : '';

  // Resolve store_id from Japanese name
  const storeId = STORE_NAME_MAP[storeName] || null;

  return {
    name: String(name).trim(),
    vintage,
    producer: null,
    region: null,
    size_ml: 750,
    quantity,
    price: null,
    cost_price: costPrice ? Math.round(costPrice) : null,
    notes: supplier ? `仕入: ${supplier}` : null,
    _format: 'store',
    _storeName: storeName,
    _storeId: storeId,
  };
}

// ── Format detection ─────────────────────────────────────────
function detectFormat(workbook, XLSX) {
  // Check first data sheet's header rows (check first 5 rows for headers)
  for (const sheetName of workbook.SheetNames) {
    if (SKIP_SHEETS.some(s => sheetName.trim().includes(s))) continue;
    const ws = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    if (!data || data.length === 0) continue;
    // Check up to 5 rows for headers
    for (let i = 0; i < Math.min(5, data.length); i++) {
      const headerStr = data[i].map(h => String(h).trim()).join('|');
      // Format A: has "区分" and "生産者"
      if (headerStr.includes('区分') && headerStr.includes('生産者')) return 'burgundy';
      // Format B: has "店舗" and "正商品名" or "商品名"
      if (headerStr.includes('店舗') && (headerStr.includes('商品名') || headerStr.includes('在庫'))) return 'store';
    }
    // Also check: if col[7] has long wine-ish names and col[8] has producer-ish names → burgundy
    const sampleRows = data.slice(1, 10);
    const hasBurgCols = sampleRows.some(r => r[7] && String(r[7]).trim().length > 3 && r[8] && String(r[8]).trim().length > 1);
    if (hasBurgCols) return 'burgundy';
    // Check if col[1] has store names and col[3] has item names → store
    const hasStoreCols = sampleRows.some(r => {
      const s = r[1] ? String(r[1]).trim() : '';
      return (STORE_NAME_MAP[s] || s === '') && r[3] && String(r[3]).trim().length > 3;
    });
    if (hasStoreCols) return 'store';
    break;
  }
  // Fallback: check if any sheet has known category names (Japanese or English)
  if (workbook.SheetNames.some(s => s.includes('その他アルコール') || s.includes('ソフトドリンク'))) return 'store';
  if (workbook.SheetNames.some(s => s.includes('ブルゴーニュ') || s.includes('シャンパーニュ'))) return 'burgundy';
  // English sheet names
  if (workbook.SheetNames.some(s => /日本酒|グラスドリンク/i.test(s) && /champagne|bourgogne/i.test(s))) return 'store';
  if (workbook.SheetNames.some(s => /bourgogne\s*(blanc|rouge)|champagne/i.test(s))) {
    // Could be either — check if store-related sheets also exist
    if (workbook.SheetNames.some(s => /日本酒|グラスドリンク|ソフトドリンク|sake/i.test(s))) return 'store';
    return 'burgundy';
  }
  return 'unknown';
}

// ── Main parser ──────────────────────────────────────────────
/**
 * Parse an inventory Excel file. Returns array of groups:
 *   { sheet, label, catId, items[], _storeGroups? }
 *
 * For 5-store format, items include _storeId per row.
 */
export function parseInventoryExcel(workbook, XLSX) {
  const format = detectFormat(workbook, XLSX);
  const results = [];

  for (const sheetName of workbook.SheetNames) {
    const trimmed = sheetName.trim();
    if (SKIP_SHEETS.some(s => trimmed.includes(s))) continue;
    if (/^\d{1,3}$/.test(trimmed)) continue; // skip numeric-only sheets like "00", "01"

    // Find matching category (flexible: Japanese map first, then English regex patterns)
    const normalized = trimmed.replace(/[\s　・_\-\(\)（）\d]/g, '');
    let meta = null;

    // 1) Japanese SHEET_CATEGORY_MAP
    const mapping = Object.entries(SHEET_CATEGORY_MAP).find(([k]) => {
      const nk = k.replace(/[\s　・_\-]/g, '');
      return trimmed === k || trimmed.includes(k) || k.includes(trimmed) || normalized === nk || normalized.includes(nk) || nk.includes(normalized);
    });
    if (mapping) {
      meta = mapping[1];
    } else {
      // 2) English/alternative regex patterns
      const patMatch = SHEET_NAME_PATTERNS.find(p => p.pattern.test(trimmed));
      if (patMatch) {
        meta = { catId: patMatch.catId, label: patMatch.label };
      }
    }

    if (!meta) {
      console.log('[ExcelParser] Skipping unmatched sheet:', sheetName);
      continue;
    }
    const ws = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    const items = [];
    let currentStore = null;

    for (const row of data) {
      let parsed = null;

      if (format === 'burgundy') {
        parsed = parseBurgundyRow(row);
      } else {
        parsed = parseStoreRow(row);
        // Track current store for rows that have a store name
        if (parsed && parsed._storeId) {
          currentStore = parsed._storeId;
        } else if (parsed && !parsed._storeId && currentStore) {
          // Inherit store from previous row (store name only appears on first row of group)
          parsed._storeId = currentStore;
          parsed._storeName = '';
        }
        // Handle empty store name rows (store shown once, then blank for same store)
        if (parsed && !parsed._storeId) {
          // Check if the store column has a name we haven't mapped
          const rawStore = row[1] ? String(row[1]).trim() : '';
          if (rawStore && !STORE_NAME_MAP[rawStore]) {
            // Unknown store — skip or keep with raw name
            parsed._storeId = rawStore;
          } else if (!rawStore && currentStore) {
            parsed._storeId = currentStore;
          }
        }
      }

      if (parsed) {
        parsed.category_id = meta.catId;
        parsed._categoryLabel = meta.label;
        items.push(parsed);
      }
    }

    if (items.length > 0) {
      // For store format, group by store for display
      const storeGroups = {};
      if (format === 'store') {
        items.forEach(item => {
          const sid = item._storeId || 'unknown';
          if (!storeGroups[sid]) storeGroups[sid] = { name: item._storeName || sid, count: 0 };
          storeGroups[sid].count++;
        });
      }

      results.push({
        sheet: sheetName,
        label: meta.label,
        catId: meta.catId,
        items,
        _format: format,
        _storeGroups: format === 'store' ? storeGroups : null,
      });
    }
  }

  return results;
}

/**
 * Detect if file is multi-store format
 */
export function isMultiStoreFormat(workbook, XLSX) {
  return detectFormat(workbook, XLSX) === 'store';
}

/**
 * Get unique store IDs from parsed results (for multi-store files)
 */
export function getStoresFromResults(results) {
  const stores = new Set();
  for (const group of results) {
    for (const item of group.items) {
      if (item._storeId) stores.add(item._storeId);
    }
  }
  return [...stores];
}

// ══════════════════════════════════════════════════════════════
// Wine List Excel Parser
// Supports 3 store formats (auto-detected):
//   A) 桃仙閣/一平飯店: col[1]=vintage, col[3]=name, col[4]=producer, col[5]=price_excl, col[7]=cost
//   B) 寛心:           col[0]=vintage, col[2]=name, col[4]=price_excl, col[6]=cost
//   C) 明寂:           col[0]=vintage, col[1]=name, col[7]=price_excl
//   D) ドリンク系:     col[0]=name_jp, col[1]=name_en, col[2|3]=price_excl, col[3|4]=price_incl
// All wine formats use paired rows: EN row + JP row (+ blank row)
// ══════════════════════════════════════════════════════════════

// Section name mapping from sheet names
const WINE_LIST_SECTIONS = {
  // Japanese section names
  'シャンパーニュ':   { section: 'シャンパーニュ', section_en: 'Champagne', order: 10 },
  'ブルゴーニュ白':   { section: 'ブルゴーニュ白', section_en: 'Bourgogne Blanc', order: 20 },
  'ブルゴーニュ赤':   { section: 'ブルゴーニュ赤', section_en: 'Bourgogne Rouge', order: 40 },
  'その他産地白':     { section: 'その他産地白', section_en: 'Other White', order: 30 },
  'ボルドー赤':       { section: 'ボルドー赤', section_en: 'Bordeaux Rouge', order: 50 },
  'その他産地赤':     { section: 'その他産地赤', section_en: 'Other Red', order: 60 },
  // English sheet names (桃仙閣/寛心/一平飯店)
  'champagne':     { section: 'シャンパーニュ', section_en: 'Champagne', order: 10 },
  'ch':            { section: 'シャンパーニュ', section_en: 'Champagne', order: 10 },
  'bourgogne blanc': { section: 'ブルゴーニュ白', section_en: 'Bourgogne Blanc', order: 20 },
  'bb':            { section: 'ブルゴーニュ白', section_en: 'Bourgogne Blanc', order: 20 },
  'white other':   { section: 'その他白', section_en: 'Other White', order: 30 },
  'france other white': { section: 'フランスその他白', section_en: 'France Other White', order: 30 },
  'other white':   { section: 'その他白', section_en: 'Other White', order: 30 },
  'bourgogne rouge': { section: 'ブルゴーニュ赤', section_en: 'Bourgogne Rouge', order: 40 },
  'br':            { section: 'ブルゴーニュ赤', section_en: 'Bourgogne Rouge', order: 40 },
  'france other red': { section: 'フランスその他赤', section_en: 'France Other Red', order: 50 },
  'other red':     { section: 'その他赤', section_en: 'Other Red', order: 50 },
  'red other':     { section: 'その他赤', section_en: 'Other Red', order: 50 },
  'france outher': { section: 'フランスその他', section_en: 'France Other', order: 55 },
  'outher wine':   { section: 'その他ワイン', section_en: 'Other Wine', order: 56 },
  'japan wine':    { section: '日本ワイン', section_en: 'Japan Wine', order: 57 },
  // Drink menu sections
  'グラスドリンク':  { section: 'グラスドリンク', section_en: 'Glass Drinks', order: 5 },
  'ソフトドリンク':  { section: 'ソフトドリンク', section_en: 'Soft Drinks', order: 8 },
  '日本酒':         { section: '日本酒', section_en: 'Sake', order: 6 },
};

function matchWineListSection(sheetName) {
  const trimmed = sheetName.trim();
  // Remove trailing numbers, parentheses, spaces: "CH 1" → "CH", "Champagne(1)" → "Champagne"
  const base = trimmed.replace(/[\s　]*[\(\（]?\d+[\)\）]?[\s　]*$/g, '').replace(/[\s　]+\d+$/g, '').trim();
  const lower = base.toLowerCase();

  // Direct match
  if (WINE_LIST_SECTIONS[trimmed]) return WINE_LIST_SECTIONS[trimmed];
  if (WINE_LIST_SECTIONS[base]) return WINE_LIST_SECTIONS[base];
  if (WINE_LIST_SECTIONS[lower]) return WINE_LIST_SECTIONS[lower];

  // Partial match
  for (const [key, val] of Object.entries(WINE_LIST_SECTIONS)) {
    if (lower.includes(key) || key.includes(lower)) return val;
  }
  // Regex fallback
  if (/champagne/i.test(trimmed) || /^ch\b/i.test(trimmed)) return WINE_LIST_SECTIONS['champagne'];
  if (/bourgogne\s*blanc/i.test(trimmed) || /^bb\b/i.test(trimmed)) return WINE_LIST_SECTIONS['bourgogne blanc'];
  if (/bourgogne\s*rouge/i.test(trimmed) || /^br\b/i.test(trimmed)) return WINE_LIST_SECTIONS['bourgogne rouge'];
  if (/white\s*other|other\s*white|france\s*other\s*white/i.test(trimmed)) return WINE_LIST_SECTIONS['white other'];
  if (/red\s*other|other\s*red|france\s*other\s*red/i.test(trimmed)) return WINE_LIST_SECTIONS['other red'];
  if (/france\s*outher/i.test(trimmed)) return WINE_LIST_SECTIONS['france outher'];
  if (/outher\s*wine|other\s*wine/i.test(trimmed)) return WINE_LIST_SECTIONS['outher wine'];
  if (/japan\s*wine/i.test(trimmed)) return WINE_LIST_SECTIONS['japan wine'];
  if (/グラスドリンク|glass/i.test(trimmed)) return WINE_LIST_SECTIONS['グラスドリンク'];
  if (/ソフトドリンク|soft/i.test(trimmed)) return WINE_LIST_SECTIONS['ソフトドリンク'];
  if (/日本酒|sake/i.test(trimmed)) return WINE_LIST_SECTIONS['日本酒'];

  return null;
}

/**
 * Detect wine list column layout from data rows.
 * Returns: { vintageCol, nameCol, producerCol, priceCol, costCol, format }
 */
function detectWineListLayout(rows) {
  // Find rows with vintage-like values and price-like values
  for (const row of rows) {
    const cells = row.map(c => String(c).trim());

    // Look for vintage (N.V. or 4-digit year) to find vintage column
    let vintageCol = -1;
    for (let i = 0; i < Math.min(5, cells.length); i++) {
      if (/^(N\.?V\.?|n\.?v\.?|\d{4})$/.test(cells[i])) {
        vintageCol = i;
        break;
      }
    }
    if (vintageCol < 0) continue;

    // Find name column: first column after vintage with text > 5 chars
    let nameCol = -1;
    for (let i = vintageCol + 1; i < Math.min(8, cells.length); i++) {
      if (cells[i].length > 3 && !/^\d/.test(cells[i])) {
        nameCol = i;
        break;
      }
    }
    // If vintage at col 0, name might be at col 1 (明寂) or col 2 (寛心)
    if (nameCol < 0 && vintageCol === 0) {
      for (let i = 1; i < 4; i++) {
        if (cells[i] && cells[i].length > 3 && !/^\d/.test(cells[i])) {
          nameCol = i;
          break;
        }
      }
    }
    if (nameCol < 0) continue;

    // Find producer column: next text column after name
    let producerCol = -1;
    for (let i = nameCol + 1; i < Math.min(nameCol + 3, cells.length); i++) {
      if (cells[i].length > 1 && !/^\d/.test(cells[i])) {
        producerCol = i;
        break;
      }
    }

    // Find price column: first numeric column > 1000 after name
    let priceCol = -1;
    let costCol = -1;
    for (let i = nameCol + 1; i < cells.length; i++) {
      const n = parseFloat(cells[i]);
      if (!isNaN(n) && n >= 500) {
        if (priceCol < 0) { priceCol = i; }
        else if (costCol < 0 && i > priceCol + 1) { costCol = i; break; }
      }
    }

    if (nameCol >= 0 && priceCol >= 0) {
      return { vintageCol, nameCol, producerCol, priceCol, costCol };
    }
  }
  return null;
}

/**
 * Parse wine list paired rows (EN line + JP line).
 */
function parseWineListPairedRows(data, layout) {
  const items = [];
  let sortOrder = 10;

  for (let i = 0; i < data.length; i++) {
    const row1 = data[i];
    const cells1 = row1.map(c => String(c).trim());

    // Check if this row has a vintage
    const vtStr = cells1[layout.vintageCol] || '';
    if (!/^(N\.?V\.?|n\.?v\.?|\d{4})$/i.test(vtStr)) continue;

    const vintage = /^\d{4}$/.test(vtStr) ? vtStr : 'N.V.';
    const name_en = cells1[layout.nameCol] || '';
    if (!name_en || name_en.length < 2) continue;

    const producer_en = layout.producerCol >= 0 ? (cells1[layout.producerCol] || '') : '';
    const priceRaw = parseFloat(cells1[layout.priceCol]) || 0;
    const sell_price = priceRaw > 100 ? Math.round(priceRaw) : null;
    const cost_price = layout.costCol >= 0 ? (parseFloat(cells1[layout.costCol]) || null) : null;

    // Next non-empty row is JP
    let name_jp = '';
    let producer_jp = '';
    let sell_price_incl = null;
    for (let j = i + 1; j < Math.min(i + 3, data.length); j++) {
      const cells2 = data[j].map(c => String(c).trim());
      const jpName = cells2[layout.nameCol] || '';
      if (jpName && /[\u3000-\u9FFF\u30A0-\u30FF\u3040-\u309F]/.test(jpName)) {
        name_jp = jpName;
        producer_jp = layout.producerCol >= 0 ? (cells2[layout.producerCol] || '') : '';
        // Tax-included price on JP row
        const jpPrice = parseFloat(cells2[layout.priceCol]) || 0;
        if (jpPrice > 100) sell_price_incl = Math.round(jpPrice);
        break;
      }
    }

    items.push({
      vintage: vintage === 'N.V.' ? null : vintage,
      name_en,
      name_jp: name_jp || null,
      producer_en: producer_en || null,
      producer_jp: producer_jp || null,
      sell_price,
      sell_price_incl,
      cost_price: cost_price ? Math.round(cost_price) : null,
      sort_order: sortOrder,
    });
    sortOrder += 10;
  }
  return items;
}

/**
 * Parse drink menu rows (グラスドリンク, ソフトドリンク, 日本酒).
 * Format: [name_jp, name_en, price1, price2, ...]
 */
function parseDrinkMenuRows(data) {
  const items = [];
  let sortOrder = 10;
  let subsection = null;

  for (let i = 0; i < data.length; i++) {
    const cells = data[i].map(c => String(c).trim());
    const first = cells[0] || '';
    if (!first || first.length < 2) continue;

    // Check if this is a section header (only col 0 has text, rest empty or short)
    const otherCols = cells.slice(1).filter(c => c.length > 0);
    if (otherCols.length === 0 && first.length > 2) {
      subsection = first;
      continue;
    }

    // Find prices (numbers > 100)
    let sell_price = null;
    let sell_price_incl = null;
    for (let j = 1; j < cells.length; j++) {
      const n = parseFloat(cells[j]);
      if (!isNaN(n) && n >= 100) {
        if (!sell_price) sell_price = Math.round(n);
        else if (!sell_price_incl) { sell_price_incl = Math.round(n); break; }
      }
    }

    // name_en is the second column with text
    let name_en = '';
    for (let j = 1; j < cells.length; j++) {
      if (cells[j].length > 1 && isNaN(parseFloat(cells[j]))) {
        name_en = cells[j];
        break;
      }
    }

    if (sell_price || sell_price_incl) {
      items.push({
        vintage: null,
        name_en: name_en || first,
        name_jp: /[\u3000-\u9FFF\u30A0-\u30FF\u3040-\u309F]/.test(first) ? first : null,
        producer_en: null,
        producer_jp: null,
        sell_price,
        sell_price_incl,
        cost_price: null,
        sort_order: sortOrder,
        _subsection: subsection,
      });
      sortOrder += 10;
    }
  }
  return items;
}

/**
 * Parse a wine list Excel file.
 * Returns array of section groups:
 *   { sheet, section, section_en, section_order, items[] }
 */
export function parseWineListExcel(workbook, XLSX) {
  const results = [];

  for (const sheetName of workbook.SheetNames) {
    const trimmed = sheetName.trim();
    if (SKIP_SHEETS.some(s => trimmed.includes(s))) continue;
    if (/^\d{1,3}$/.test(trimmed)) continue;

    // Match section
    const sec = matchWineListSection(trimmed);
    if (!sec) {
      // Check if it's a title/cover page (扉, etc.)
      if (/扉|cover|title|index/i.test(trimmed)) continue;
      // Check if it's a purely numeric sub-sheet like "1", "2" used as section dividers
      if (/^\d+$/.test(trimmed)) continue;
      console.log('[WineListParser] Skipping unmatched sheet:', sheetName);
      continue;
    }

    const ws = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    if (!data || data.length < 2) continue;

    let items;

    // Check if it's a drink menu (グラスドリンク, ソフトドリンク, 日本酒)
    const isDrinkMenu = /グラスドリンク|ソフトドリンク|日本酒|glass|soft|sake/i.test(trimmed);
    if (isDrinkMenu) {
      items = parseDrinkMenuRows(data);
    } else {
      // Wine list: detect column layout from data
      const sampleRows = data.filter(r => r.some(c => {
        const s = String(c).trim();
        return /^(N\.?V\.?|\d{4})$/i.test(s);
      }));

      if (sampleRows.length === 0) continue;

      const layout = detectWineListLayout(sampleRows);
      if (!layout) {
        console.log('[WineListParser] Could not detect layout for:', sheetName);
        continue;
      }

      items = parseWineListPairedRows(data, layout);
    }

    if (items.length > 0) {
      // Check if this section already exists in results (multiple sheets per section)
      const existing = results.find(r => r.section === sec.section);
      if (existing) {
        // Adjust sort_order to continue from existing
        const maxSort = Math.max(...existing.items.map(i => i.sort_order), 0);
        items.forEach((item, idx) => { item.sort_order = maxSort + 10 + idx * 10; });
        existing.items.push(...items);
      } else {
        results.push({
          sheet: sheetName,
          section: sec.section,
          section_en: sec.section_en,
          section_order: sec.order,
          items,
        });
      }
    }
  }

  // Sort sections by order
  results.sort((a, b) => a.section_order - b.section_order);
  return results;
}
