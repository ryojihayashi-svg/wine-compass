-- ============================================================
-- PAIRING HISTORY + TASTING COMMENTS
-- ============================================================

-- 1. PAIRING HISTORY
CREATE TABLE IF NOT EXISTS wc_pairings (
  id          BIGSERIAL PRIMARY KEY,
  beverage_id BIGINT NOT NULL REFERENCES wc_beverages(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  store_id    TEXT REFERENCES wc_stores(id),
  dish        TEXT NOT NULL,
  description TEXT,
  staff       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wc_pair_bev ON wc_pairings(beverage_id, created_at DESC);

ALTER TABLE wc_pairings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wc_pair_all" ON wc_pairings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 2. TASTING COMMENTS
CREATE TABLE IF NOT EXISTS wc_comments (
  id          BIGSERIAL PRIMARY KEY,
  beverage_id BIGINT NOT NULL REFERENCES wc_beverages(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  author      TEXT DEFAULT '匿名',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wc_comm_bev ON wc_comments(beverage_id, created_at DESC);

ALTER TABLE wc_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wc_comm_all" ON wc_comments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
