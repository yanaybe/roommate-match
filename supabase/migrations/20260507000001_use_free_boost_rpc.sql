-- SECURITY DEFINER RPC for free boosts.
-- Checks subscription tier and cooldown server-side so users cannot reset
-- timestamps via direct client queries to get unlimited free boosts.
CREATE OR REPLACE FUNCTION use_free_boost(p_apartment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id   uuid := auth.uid();
  v_tier      text;
  v_slot      text;
  v_now       timestamptz := now();
  v_one_week  timestamptz := v_now - interval '7 days';
  v_expires   timestamptz := v_now + interval '7 days';
  v_apt_owner uuid;
BEGIN
  -- Verify the apartment belongs to the caller
  SELECT user_id INTO v_apt_owner FROM apartments WHERE id = p_apartment_id;
  IF v_apt_owner IS DISTINCT FROM v_user_id THEN
    RETURN jsonb_build_object('error', 'not_owner');
  END IF;

  -- Fetch tier and current boost timestamps
  SELECT subscription_tier INTO v_tier FROM profiles WHERE user_id = v_user_id;

  IF v_tier = 'gold' THEN
    -- Gold: 1 boost per week
    IF EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = v_user_id AND gold_boost_used_at > v_one_week
    ) THEN
      RETURN jsonb_build_object('error', 'no_boosts_available');
    END IF;
    UPDATE profiles SET gold_boost_used_at = v_now WHERE user_id = v_user_id;

  ELSIF v_tier = 'platinum' THEN
    -- Platinum: 3 boosts per week, use first expired/empty slot
    SELECT CASE
      WHEN platinum_boost_used_at_1 IS NULL OR platinum_boost_used_at_1 <= v_one_week THEN 'platinum_boost_used_at_1'
      WHEN platinum_boost_used_at_2 IS NULL OR platinum_boost_used_at_2 <= v_one_week THEN 'platinum_boost_used_at_2'
      WHEN platinum_boost_used_at_3 IS NULL OR platinum_boost_used_at_3 <= v_one_week THEN 'platinum_boost_used_at_3'
      ELSE NULL
    END INTO v_slot
    FROM profiles WHERE user_id = v_user_id;

    IF v_slot IS NULL THEN
      RETURN jsonb_build_object('error', 'no_boosts_available');
    END IF;

    EXECUTE format(
      'UPDATE profiles SET %I = $1 WHERE user_id = $2',
      v_slot
    ) USING v_now, v_user_id;

  ELSE
    RETURN jsonb_build_object('error', 'tier_not_eligible');
  END IF;

  -- Apply boost to the apartment
  UPDATE apartments
  SET is_featured = true, featured_until = v_expires
  WHERE id = p_apartment_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION use_free_boost(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION use_free_boost(uuid) TO authenticated;
