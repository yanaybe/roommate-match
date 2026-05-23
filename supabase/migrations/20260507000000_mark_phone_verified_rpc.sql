-- SECURITY DEFINER function so the guard_profile_sensitive_fields trigger
-- cannot block phone_verified updates that come from a verified OTP flow.
CREATE OR REPLACE FUNCTION mark_phone_verified(p_user_id uuid, p_phone text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE profiles
  SET phone_verified = true,
      phone_number   = p_phone
  WHERE user_id = p_user_id;
END;
$$;

-- Only the authenticated user can call this for their own row.
REVOKE ALL ON FUNCTION mark_phone_verified(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mark_phone_verified(uuid, text) TO authenticated;
