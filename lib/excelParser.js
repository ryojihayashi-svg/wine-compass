/**
 * Excel Parser for Wine Compass inventory import
 * Handles 明寂飲料在庫 format
 */

// Sheet name → category mapping
// Uses the category IDs from the database
const SHEET_CATEGORY_MAP = {
  'ワインリスト泡': { catId: 1, label: 'シャンパーニュ' },
  'ブルゴーニュ白': { catId: 8, label: 'ブルゴーニュ(白)' },
  'その他産地白ワイン': { catId: 14, label: 'その他(白)', subRegions: true },
  'ブルゴーニュ赤': { catId: 15, label: 'ブルゴーニュ(赤)' },
  '日本ワイン': { catId: 14, label: '日本ワイン' },
  'その他産地赤ワイン': { catId: 20, label: 'その他(赤)' },
  'グラスワイン': { catId: null, label: 'グラスワイン', isGlass: true },
  'グラスワイン ': { catId: null, label: 'グラスワイン', isGlass: true },
  'バーガンディー取り置き在庫': { catId: null, label: 'バーガンディ取置' },
  'バーガンディー取り置き在庫 ': { catId: null, label: 'バーガンディ取置' },
  '日本酒': { catId: 5, label: '日本酒' },
  'ビール　焼酎類': { catId: 6, label: 'ビール・焼酎' },
};

// Skip these sheets (not item data)
const SKIP_SHEETS = ['合計', '売り上げ', 'グラス備品'];

/**
 * Parse a single row from the inventory spreadsheet
 * Column layouts vary by sheet type
 */
function parseWineRow(row, sheetName) {
  // Standard layout: ヴィンテージ, 正商品名, 在庫, 販売価格, 単価, 原価率, インポーター, 仕入れ先, 合計
  const vintage = row[0];
  const name = row[1];
  const qty = row[2];
  const price = row[3];
  const costPrice = row[4];
  const costRatio = row[5];
  const importer = row[6];
  const supplier = row[7];

  // Skip empty, header, or summary rows
  if (!name || typeof name !== 'string' || name.trim() === '') return null;
  if (name.includes('正商品名') || name.includes('ヴィンテージ')) return null;
  if (name.includes('合計') || name.includes('小計')) return null;

  // Parse vintage
  let v = null;
  if (vintage !== null && vintage !== undefined && vintage !== '') {
    const vs = String(vintage).trim();
    if (vs === 'NV' || vs === 'nv') v = null;
    else {
      const num = parseInt(vs);
      if (!isNaN(num) && num >= 1900 && num <= 2100) v = num;
    }
  }

  // Parse quantity (can be decimal like 0.9 for sake)
  let q = 0;
  if (qty !== null && qty !== undefined && qty !== '') {
    const qn = parseFloat(qty);
    if (!isNaN(qn) && qn >= 0) q = Math.round(qn); // Round to integer
  }

  // Parse price
  let p = null;
  if (price !== null && price !== undefined && price !== '') {
    const pn = parseInt(String(price).replace(/[,¥]/g, ''));
    if (!isNaN(pn) && pn > 0) p = pn;
  }

  // Parse cost price
  let cp = null;
  if (costPrice !== null && costPrice !== undefined && costPrice !== '') {
    const cpn = parseInt(String(costPrice).replace(/[,¥]/g, ''));
    if (!isNaN(cpn) && cpn > 0) cp = cpn;
  }

  // Build notes from importer and supplier
  const notes = [
    importer ? `仕入: ${String(importer).trim()}` : '',
    supplier ? `業者: ${String(supplier).trim()}` : '',
  ].filter(Boolean).join(' / ');

  return {
    name: String(name).trim(),
    vintage: v,
    quantity: q,
    price: p,
    cost_price: cp,
    notes: notes || null,
    _sheet: sheetName,
  };
}

/**
 * Parse 日本酒 sheet (different column layout)
 * Layout: 正商品名, 在庫, 単価, 仕入れ先, 合計
 */
function parseSakeRow(row) {
  const name = row[0];
  const qty = row[1];
  const costPrice = row[2];
  const supplier = row[3];

  if (!name || typeof name !== 'string' || name.trim() === '') return null;
  if (name.includes('正商品名')) return null;

  let q = 0;
  if (qty !== null && qty !== undefined) {
    const qn = parseFloat(qty);
    if (!isNaN(qn) && qn >= 0) q = Math.round(qn);
  }

  let cp = null;
  if (costPrice !== null && costPrice !== undefined) {
    const cpn = parseInt(String(costPrice).replace(/[,¥]/g, ''));
    if (!isNaN(cpn) && cpn > 0) cp = cpn;
  }

  return {
    name: String(name).trim(),
    vintage: null,
    quantity: q,
    price: null,
    cost_price: cp,
    notes: supplier ? `業者: ${String(supplier).trim()}` : null,
    _sheet: '日本酒',
  };
}

/**
 * Parse バーガンディー取り置き在庫 sheet
 * Layout: ヴィンテージ, 正商品名, 在庫, 単価
 */
function parseBaruRow(row) {
  const vintage = row[0];
  const name = row[1];
  const qty = row[2];
  const costPrice = row[3];

  if (!name || typeof name !== 'string' || name.trim() === '') return null;
  if (name.includes('正商品名')) return null;

  let v = null;
  if (vintage) {
    const vs = String(vintage).trim();
    if (vs !== 'NV') {
      const num = parseInt(vs);
      if (!isNaN(num) && num >= 1900 && num <= 2100) v = num;
    }
  }

  let q = 0;
  if (qty !== null && qty !== undefined) {
    const qn = parseFloat(qty);
    if (!isNaN(qn) && qn >= 0) q = Math.round(qn);
  }

  let cp = null;
  if (costPrice !== null && costPrice !== undefined) {
    const cpn = parseInt(String(costPrice).replace(/[,¥]/g, ''));
    if (!isNaN(cpn) && cpn > 0) cp = cpn;
  }

  return {
    name: String(name).trim(),
    vintage: v,
    quantity: q,
    price: null,
    cost_price: cp,
    notes: 'バーガンディ取置',
    _sheet: 'バーガンディー取り置き在庫',
  };
}

/**
 * Parse グラスワイン sheet
 * Layout: 国, ヴィンテージ, 正商品名, 在庫, 販売価格, 単価, 原価率, 仕入れ先
 */
function parseGlassRow(row) {
  const region = row[0];
  const vintage = row[1];
  const name = row[2];
  const qty = row[3];
  const price = row[4];
  const costPrice = row[5];
  const costRatio = row[6];
  const supplier = row[7];

  if (!name || typeof name !== 'string' || name.trim() === '') return null;
  if (name.includes('正商品名')) return null;

  let v = null;
  if (vintage) {
    const vs = String(vintage).trim();
    if (vs !== 'NV') {
      const num = parseInt(vs);
      if (!isNaN(num) && num >= 1900 && num <= 2100) v = num;
    }
  }

  let q = 0;
  if (qty !== null && qty !== undefined) {
    const qn = parseFloat(qty);
    if (!isNaN(qn) && qn >= 0) q = Math.round(qn);
  }

  let cp = null;
  if (costPrice !== null && costPrice !== undefined) {
    const cpn = parseInt(String(costPrice).replace(/[,¥]/g, ''));
    if (!isNaN(cpn) && cpn > 0) cp = cpn;
  }

  return {
    name: String(name).trim(),
    vintage: v,
    quantity: q,
    price: null,
    cost_price: cp,
    region: region && typeof region === 'string' ? region.trim() : null,
    notes: supplier ? `業者: ${String(supplier).trim()}` : 'グラスワイン',
    _sheet: 'グラスワイン',
  };
}

/**
 * Main parser: takes XLSX module + workbook object, returns parsed items grouped by sheet
 */
export function parseInventoryExcel(workbook, XLSX) {
  const results = [];

  for (const sheetName of workbook.SheetNames) {
    // Skip non-data sheets
    if (SKIP_SHEETS.includes(sheetName.trim())) continue;

    const mapping = Object.entries(SHEET_CATEGORY_MAP).find(([k]) =>
      sheetName.trim() === k.trim() || sheetName.includes(k.trim()) || k.trim().includes(sheetName.trim())
    );

    if (!mapping) continue;

    const [, meta] = mapping;
    const ws = workbook.Sheets[sheetName];

    // Get raw data
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    const items = [];
    for (const row of data) {
      let parsed = null;

      if (sheetName.trim() === '日本酒') {
        parsed = parseSakeRow(row);
      } else if (sheetName.trim().includes('バーガンディー取り置き')) {
        parsed = parseBaruRow(row);
      } else if (sheetName.trim().includes('グラスワイン')) {
        parsed = parseGlassRow(row);
      } else {
        parsed = parseWineRow(row, sheetName);
      }

      if (parsed) {
        parsed.category_id = meta.catId;
        parsed._categoryLabel = meta.label;
        items.push(parsed);
      }
    }

    if (items.length > 0) {
      results.push({
        sheet: sheetName,
        label: meta.label,
        catId: meta.catId,
        items,
      });
    }
  }

  return results;
}
