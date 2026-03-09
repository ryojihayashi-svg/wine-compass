-- Add name_kana to wc_search_beverages RPC return type
-- Run this on Supabase SQL Editor

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
  name_kana TEXT,
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
    b.name, b.name_kana, b.producer, b.vintage,
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
         OR b.producer ILIKE '%' || p_query || '%'
         OR b.name_kana ILIKE '%' || p_query || '%')
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
