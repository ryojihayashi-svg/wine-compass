-- ============================================================
-- WINE LIST ITEMS (for print/export)
-- Stores parsed wine list data with EN/JP names
-- ============================================================

CREATE TABLE IF NOT EXISTS wc_wine_list_items (
  id              BIGSERIAL PRIMARY KEY,
  store_id        TEXT NOT NULL,
  section         TEXT NOT NULL,          -- JP section: "シャンパーニュ"
  section_en      TEXT,                   -- EN section: "Champagne"
  section_order   SMALLINT DEFAULT 0,     -- section display order
  subsection      TEXT,                   -- JP sub-section: "コート・ド・ニュイ"
  subsection_en   TEXT,                   -- EN sub-section: "Côte de Nuits"
  name_en         TEXT NOT NULL,          -- English wine name
  name_jp         TEXT,                   -- Japanese wine name
  producer_en     TEXT,                   -- English producer
  producer_jp     TEXT,                   -- Japanese producer
  vintage         TEXT,                   -- "2020", "N.V.", null
  sell_price      INTEGER,               -- Tax-exclusive price
  sell_price_incl INTEGER,               -- Tax-inclusive price
  cost_price      INTEGER,               -- Cost price
  region          TEXT,                   -- Region (for "Other" items)
  glass_price     INTEGER,               -- Glass pour price
  sort_order      SMALLINT DEFAULT 0,    -- item order within section
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wli_store ON wc_wine_list_items(store_id);
CREATE INDEX IF NOT EXISTS idx_wli_section ON wc_wine_list_items(store_id, section_order, sort_order);

-- RLS
ALTER TABLE wc_wine_list_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wc_wli_all" ON wc_wine_list_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
