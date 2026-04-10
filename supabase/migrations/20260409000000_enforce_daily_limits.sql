-- =============================================================================
-- Enforce daily like and save limits at the database level
-- Free tier: 8 likes/day, 10 saves/day
-- Paid tiers (plus, gold, platinum): unlimited
-- =============================================================================

-- -------------------------
-- Daily like limit trigger
-- -------------------------
CREATE OR REPLACE FUNCTION enforce_daily_like_limit()
RETURNS TRIGGER AS $$
DECLARE
  today_start timestamptz := date_trunc('day', now() AT TIME ZONE 'UTC');
  today_count int;
  user_tier text;
BEGIN
  -- Get subscription tier
  SELECT subscription_tier INTO user_tier
  FROM profiles
  WHERE user_id = NEW.user_id;

  -- Skip limit for paid tiers
  IF user_tier IS NOT NULL AND user_tier != 'free' THEN
    RETURN NEW;
  END IF;

  -- Count today's likes
  SELECT COUNT(*) INTO today_count
  FROM liked_profiles
  WHERE user_id = NEW.user_id
    AND created_at >= today_start;

  IF today_count >= 8 THEN
    RAISE EXCEPTION 'Daily like limit of 8 reached. Upgrade to Plus or higher for unlimited likes.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_daily_like_limit ON liked_profiles;
CREATE TRIGGER trg_enforce_daily_like_limit
  BEFORE INSERT ON liked_profiles
  FOR EACH ROW EXECUTE FUNCTION enforce_daily_like_limit();

-- -------------------------
-- Daily save limit trigger
-- -------------------------
CREATE OR REPLACE FUNCTION enforce_daily_save_limit()
RETURNS TRIGGER AS $$
DECLARE
  today_start timestamptz := date_trunc('day', now() AT TIME ZONE 'UTC');
  today_count int;
  user_tier text;
BEGIN
  -- Get subscription tier
  SELECT subscription_tier INTO user_tier
  FROM profiles
  WHERE user_id = NEW.user_id;

  -- Skip limit for paid tiers
  IF user_tier IS NOT NULL AND user_tier != 'free' THEN
    RETURN NEW;
  END IF;

  -- Count today's saves
  SELECT COUNT(*) INTO today_count
  FROM saved_apartments
  WHERE user_id = NEW.user_id
    AND created_at >= today_start;

  IF today_count >= 10 THEN
    RAISE EXCEPTION 'Daily save limit of 10 reached. Upgrade to Plus or higher for unlimited saves.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_daily_save_limit ON saved_apartments;
CREATE TRIGGER trg_enforce_daily_save_limit
  BEFORE INSERT ON saved_apartments
  FOR EACH ROW EXECUTE FUNCTION enforce_daily_save_limit();
