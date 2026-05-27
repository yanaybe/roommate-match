-- ─────────────────────────────────────────────────────────────────────────────
-- Add columns that exist in client code but were missing from the schema:
--
--   profiles:
--     neighborhood       — shown on SwipeCard, saved during onboarding
--     move_in_date       — desired move-in date, captured in onboarding
--     is_admin           — admin panel access flag (service-role only)
--     is_banned          — content moderation ban flag (service-role only)
--
--   apartments:
--     listing_type       — 'room' or 'entire_place' (PostApartment form)
--
--   reports:
--     status             — moderation state ('pending' | 'dismissed' | 'warned' | 'banned')
--
--   saved_searches       — persists filter searches per user (cross-device)
--
--   public_activity      — social proof feed (populated by server/edge functions)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── profiles ────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS neighborhood        text        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS move_in_date        date,
  ADD COLUMN IF NOT EXISTS is_admin            boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_banned           boolean     NOT NULL DEFAULT false;

-- ── apartments ──────────────────────────────────────────────────────────────

ALTER TABLE public.apartments
  ADD COLUMN IF NOT EXISTS listing_type text NOT NULL DEFAULT 'room'
    CHECK (listing_type IN ('room', 'entire_place'));

-- ── reports ─────────────────────────────────────────────────────────────────

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'dismissed', 'warned', 'banned'));

-- ── saved_searches ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.saved_searches (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label        text        NOT NULL,
  filters      jsonb       NOT NULL DEFAULT '{}',
  notify_email boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved searches"
  ON public.saved_searches
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_saved_searches_user
  ON public.saved_searches (user_id, created_at DESC);

-- ── public_activity ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.public_activity (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  display_text text        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.public_activity ENABLE ROW LEVEL SECURITY;

-- Everyone can read; only service_role can write
CREATE POLICY "Anyone can view activity"
  ON public.public_activity FOR SELECT
  USING (true);

-- ── guard: protect is_admin and is_banned from client writes ─────────────────
-- Extend the existing guard trigger to also cover the new admin fields.
-- Service-role callers (edge functions, admin tools) are allowed through via
-- the JWT claim check — PostgREST sets request.jwt.claim.role for each request.

CREATE OR REPLACE FUNCTION public.guard_profile_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  -- Service-role and internal calls bypass all guards
  v_role := COALESCE(current_setting('request.jwt.claim.role', true), '');
  IF v_role IN ('service_role', 'supabase_admin', '') THEN
    RETURN NEW;
  END IF;

  -- Authenticated clients cannot touch payment or admin fields
  IF NEW.subscription_tier       IS DISTINCT FROM OLD.subscription_tier
  OR NEW.paddle_customer_id      IS DISTINCT FROM OLD.paddle_customer_id
  OR NEW.paddle_subscription_id  IS DISTINCT FROM OLD.paddle_subscription_id
  OR NEW.phone_verified          IS DISTINCT FROM OLD.phone_verified
  OR NEW.instant_message_credits IS DISTINCT FROM OLD.instant_message_credits
  OR NEW.highlighted_until       IS DISTINCT FROM OLD.highlighted_until
  OR NEW.weekly_boosts_remaining IS DISTINCT FROM OLD.weekly_boosts_remaining
  OR NEW.is_admin                IS DISTINCT FROM OLD.is_admin
  OR NEW.is_banned               IS DISTINCT FROM OLD.is_banned
  THEN
    RAISE EXCEPTION 'permission_denied'
      USING HINT = 'Subscription, payment, verification, and admin fields can only be modified by the server.';
  END IF;

  RETURN NEW;
END;
$$;
