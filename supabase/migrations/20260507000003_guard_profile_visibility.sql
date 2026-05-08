-- Prevent free-tier users from hiding their profile via direct DB updates.
-- The client-side tier check is a UX guard only; this trigger enforces it at the DB layer.
CREATE OR REPLACE FUNCTION guard_profile_visibility()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.profile_visibility = 'hidden'
     AND COALESCE(OLD.subscription_tier, 'free') NOT IN ('plus', 'gold', 'platinum') THEN
    NEW.profile_visibility := OLD.profile_visibility;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profile_visibility ON profiles;
CREATE TRIGGER trg_guard_profile_visibility
  BEFORE UPDATE OF profile_visibility ON profiles
  FOR EACH ROW EXECUTE FUNCTION guard_profile_visibility();
