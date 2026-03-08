-- ============================================================
-- WINE COMPASS SCHEMA
-- Prefix: wc_ (coexists with Team Compass in same Supabase)
-- ============================================================

-- 1. STORES
CREATE TABLE wc_stores (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  name_en     TEXT,
  color       TEXT DEFAULT '#4A6352',
  sort_order  SMALLINT DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO wc_stores (id, name, name_en, color, sort_order) VALUES
  ('hakune', '白寧', 'Hakunei', '#4A6352', 1),
  ('ippei', '一平飯店', 'Ippei Hanten', '#9B8969', 2);

-- 2. CATEGORIES (self-referencing parent/child)
CREATE TABLE wc_categories (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  name_en     TEXT,
  parent_id   INTEGER REFERENCES wc_categories(id) ON DELETE SET NULL,
  sort_order  SMALLINT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO wc_categories (id, name, name_en, sort_order) VALUES
  (1, 'シャンパーニュ', 'Champagne', 1),
  (2, '白ワイン', 'White Wine', 2),
  (3, '赤ワイン', 'Red Wine', 3),
  (4, 'ロゼ', 'Rosé', 4),
  (5, '日本酒', 'Sake', 5),
  (6, 'ビール・スピリッツ', 'Beer & Spirits', 6),
  (7, 'ソフトドリンク', 'Non-Alcoholic', 7);

-- Subcategories
INSERT INTO wc_categories (name, name_en, parent_id, sort_order) VALUES
  ('ブルゴーニュ', 'Burgundy', 2, 1),
  ('ボルドー', 'Bordeaux', 2, 2),
  ('ロワール', 'Loire', 2, 3),
  ('アルザス', 'Alsace', 2, 4),
  ('その他フランス', 'Other France', 2, 5),
  ('イタリア', 'Italy', 2, 6),
  ('その他', 'Other', 2, 7),
  ('ブルゴーニュ', 'Burgundy', 3, 1),
  ('ボルドー', 'Bordeaux', 3, 2),
  ('ローヌ', 'Rhône', 3, 3),
  ('その他フランス', 'Other France', 3, 5),
  ('イタリア', 'Italy', 3, 6),
  ('その他', 'Other', 3, 7);

SELECT setval('wc_categories_id_seq', (SELECT MAX(id) FROM wc_categories));

-- 3. BEVERAGES (main item table, 50K+ rows)
CREATE TABLE wc_beverages (
  id          BIGSERIAL PRIMARY KEY,
  store_id    TEXT NOT NULL REFERENCES wc_stores(id) ON DELETE RESTRICT,
  category_id INTEGER REFERENCES wc_categories(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  name_kana   TEXT,
  producer    TEXT,
  vintage     SMALLINT,
  region      TEXT,
  appellation TEXT,
  grape       TEXT,
  size_ml     SMALLINT DEFAULT 750,
  quantity    INTEGER NOT NULL DEFAULT 0,
  price       INTEGER,
  cost_price  INTEGER,
  notes       TEXT,
  barcode     TEXT,
  image_url   TEXT,
  is_deleted  BOOLEAN DEFAULT FALSE,
  deleted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Full-text search vector (auto-maintained)
ALTER TABLE wc_beverages ADD COLUMN search_vector TSVECTOR
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', COALESCE(name, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(producer, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(name_kana, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(region, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(appellation, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(grape, '')), 'D') ||
    setweight(to_tsvector('simple', COALESCE(CAST(vintage AS TEXT), '')), 'B')
  ) STORED;

-- Performance indexes
CREATE INDEX idx_wc_bev_store ON wc_beverages(store_id) WHERE NOT is_deleted;
CREATE INDEX idx_wc_bev_cat ON wc_beverages(category_id) WHERE NOT is_deleted;
CREATE INDEX idx_wc_bev_name ON wc_beverages(name) WHERE NOT is_deleted;
CREATE INDEX idx_wc_bev_producer ON wc_beverages(producer) WHERE NOT is_deleted;
CREATE INDEX idx_wc_bev_vintage ON wc_beverages(vintage) WHERE NOT is_deleted;
CREATE INDEX idx_wc_bev_deleted ON wc_beverages(is_deleted, deleted_at);
CREATE INDEX idx_wc_bev_search ON wc_beverages USING GIN(search_vector);

-- Trigram index for partial/fuzzy match
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_wc_bev_name_trgm ON wc_beverages USING GIN(name gin_trgm_ops);
CREATE INDEX idx_wc_bev_producer_trgm ON wc_beverages USING GIN(producer gin_trgm_ops);

-- 4. INVENTORY LOG
CREATE TABLE wc_inventory_log (
  id          BIGSERIAL PRIMARY KEY,
  beverage_id BIGINT NOT NULL REFERENCES wc_beverages(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,
  field       TEXT,
  old_value   TEXT,
  new_value   TEXT,
  quantity_change INTEGER DEFAULT 0,
  note        TEXT,
  user_label  TEXT DEFAULT 'staff',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wc_invlog_bev ON wc_inventory_log(beverage_id, created_at DESC);

-- 5. IMPORT JOBS
CREATE TABLE wc_import_jobs (
  id          BIGSERIAL PRIMARY KEY,
  store_id    TEXT REFERENCES wc_stores(id),
  file_name   TEXT NOT NULL,
  status      TEXT DEFAULT 'pending',
  total_rows  INTEGER DEFAULT 0,
  imported    INTEGER DEFAULT 0,
  skipped     INTEGER DEFAULT 0,
  errors      JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================================
-- ROW LEVEL SECURITY (permissive for staff-only app)
-- ============================================================
ALTER TABLE wc_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE wc_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE wc_beverages ENABLE ROW LEVEL SECURITY;
ALTER TABLE wc_inventory_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE wc_import_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wc_stores_all" ON wc_stores FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "wc_cat_all" ON wc_categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "wc_bev_all" ON wc_beverages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "wc_log_all" ON wc_inventory_log FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "wc_imp_all" ON wc_import_jobs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- RPC: Search beverages with pagination
-- ============================================================
CREATE OR REPLACE FUNCTION wc_search_beverages(
  p_store_id TEXT DEFAULT NULL,
  p_category_id INTEGER DEFAULT NULL,
  p_query TEXT DEFAULT NULL,
  p_vintage_min SMALLINT DEFAULT NULL,
  p_vintage_max SMALLINT DEFAULT NULL,
  p_in_stock BOOLEAN DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id BIGINT,
  store_id TEXT,
  category_id INTEGER,
  name TEXT,
  producer TEXT,
  vintage SMALLINT,
  region TEXT,
  appellation TEXT,
  grape TEXT,
  size_ml SMALLINT,
  quantity INTEGER,
  price INTEGER,
  cost_price INTEGER,
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  total_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id, b.store_id, b.category_id,
    b.name, b.producer, b.vintage,
    b.region, b.appellation, b.grape,
    b.size_ml, b.quantity, b.price, b.cost_price,
    b.notes, b.image_url,
    b.created_at, b.updated_at,
    COUNT(*) OVER() AS total_count
  FROM wc_beverages b
  WHERE b.is_deleted = FALSE
    AND (p_store_id IS NULL OR b.store_id = p_store_id)
    AND (p_category_id IS NULL OR b.category_id = p_category_id)
    AND (p_query IS NULL OR p_query = ''
         OR b.search_vector @@ plainto_tsquery('simple', p_query)
         OR b.name ILIKE '%' || p_query || '%'
         OR b.producer ILIKE '%' || p_query || '%')
    AND (p_vintage_min IS NULL OR b.vintage >= p_vintage_min)
    AND (p_vintage_max IS NULL OR b.vintage <= p_vintage_max)
    AND (p_in_stock IS NULL OR (p_in_stock = TRUE AND b.quantity > 0) OR p_in_stock = FALSE)
  ORDER BY
    CASE WHEN p_query IS NOT NULL AND p_query != '' AND b.search_vector @@ plainto_tsquery('simple', p_query)
         THEN ts_rank(b.search_vector, plainto_tsquery('simple', p_query)) ELSE 0 END DESC,
    b.name ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- Trigger: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION wc_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_wc_beverages_updated
  BEFORE UPDATE ON wc_beverages
  FOR EACH ROW EXECUTE FUNCTION wc_update_timestamp();

CREATE TRIGGER trg_wc_stores_updated
  BEFORE UPDATE ON wc_stores
  FOR EACH ROW EXECUTE FUNCTION wc_update_timestamp();
