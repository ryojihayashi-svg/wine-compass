-- Atomic quantity update function for Wine Compass
-- Prevents race conditions by using SELECT FOR UPDATE
-- Run this in Supabase Dashboard SQL editor

CREATE OR REPLACE FUNCTION wc_update_quantity(
  p_beverage_id BIGINT,
  p_delta INTEGER,
  p_reason TEXT DEFAULT 'manual'
)
RETURNS TABLE(new_quantity INTEGER, old_quantity INTEGER, beverage_name TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_old INT;
  v_new INT;
  v_name TEXT;
BEGIN
  -- Lock the row to prevent concurrent updates
  SELECT quantity, name INTO v_old, v_name
    FROM wc_beverages
    WHERE id = p_beverage_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Beverage % not found', p_beverage_id;
  END IF;

  -- Calculate new quantity (floor at 0)
  v_new := GREATEST(0, v_old + p_delta);

  -- Update the quantity
  UPDATE wc_beverages
    SET quantity = v_new
    WHERE id = p_beverage_id;

  -- Log the change
  INSERT INTO wc_inventory_log(beverage_id, action, field, old_value, new_value, quantity_change)
    VALUES(
      p_beverage_id,
      CASE WHEN p_delta > 0 THEN 'add' ELSE 'remove' END,
      'quantity',
      v_old::TEXT,
      v_new::TEXT,
      p_delta
    );

  RETURN QUERY SELECT v_new, v_old, v_name;
END;
$$;
