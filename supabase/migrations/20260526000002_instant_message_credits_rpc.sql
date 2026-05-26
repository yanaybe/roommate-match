-- Atomic increment for instant_message_credits.
-- Called by the Paddle webhook (service_role) when a user purchases an Instant Message.
-- Using an RPC with SECURITY DEFINER ensures we bypass RLS while still being auditable.
CREATE OR REPLACE FUNCTION increment_instant_message_credits(
  p_user_id uuid,
  p_amount  integer DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'p_amount must be positive';
  END IF;
  UPDATE profiles
  SET instant_message_credits = instant_message_credits + p_amount
  WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile not found for user_id %', p_user_id;
  END IF;
END;
$$;

-- Only service_role (edge functions) should call this.
REVOKE ALL ON FUNCTION increment_instant_message_credits(uuid, integer) FROM PUBLIC;
-- Grant to authenticated is intentionally omitted — only service_role bypasses RLS.
