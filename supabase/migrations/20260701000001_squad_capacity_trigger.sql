-- Prevent squad from exceeding target_size via concurrent accepts
CREATE OR REPLACE FUNCTION check_squad_capacity()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  current_count INT;
  max_size INT;
BEGIN
  -- Only enforce on accepted members
  IF NEW.status != 'accepted' THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO current_count
  FROM squad_members
  WHERE squad_id = NEW.squad_id AND status = 'accepted';

  SELECT target_size INTO max_size
  FROM squads
  WHERE id = NEW.squad_id;

  IF current_count >= max_size THEN
    RAISE EXCEPTION 'squad_full' USING HINT = 'Squad is at maximum capacity';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_squad_capacity ON squad_members;
CREATE TRIGGER trg_check_squad_capacity
  BEFORE INSERT ON squad_members
  FOR EACH ROW
  EXECUTE FUNCTION check_squad_capacity();
