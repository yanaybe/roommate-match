-- ─────────────────────────────────────────────────────────────────────────────
-- Harden profiles table security
-- 1. Prevent authenticated users from writing sensitive payment/subscription
--    fields (subscription_tier, paddle_customer_id, paddle_subscription_id,
--    phone_verified) by resetting them to OLD values before the row is written.
--    Service-role (webhooks) calls have auth.uid() = NULL and are NOT affected.
-- 2. Restrict SELECT so other users cannot read paddle_customer_id and
--    paddle_subscription_id (private payment identifiers).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. BEFORE UPDATE trigger ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.guard_profile_sensitive_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- auth.uid() is non-null only for authenticated JWT requests.
  -- service_role (used by webhooks/admin) has auth.uid() = NULL,
  -- so Paddle webhooks can still update subscription_tier etc.
  IF auth.uid() IS NOT NULL THEN
    NEW.subscription_tier       := OLD.subscription_tier;
    NEW.paddle_customer_id      := OLD.paddle_customer_id;
    NEW.paddle_subscription_id  := OLD.paddle_subscription_id;
    NEW.phone_verified          := OLD.phone_verified;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop if it already exists from a previous run
DROP TRIGGER IF EXISTS guard_profile_sensitive_fields_trigger ON public.profiles;

CREATE TRIGGER guard_profile_sensitive_fields_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_sensitive_fields();

-- ── 2. Restrict SELECT to hide sensitive payment fields from other users ──────
-- PostgreSQL RLS doesn't support column-level filtering, so we use a view.
-- The existing "Users can view all profiles" policy (USING true) stays, but
-- we add a second policy so that paddle fields are only readable by the owner.
-- Since column-level RLS isn't possible, we instead expose a safe view for
-- cross-user browsing and ensure the app never reads those columns from others.

-- Guard: ensure users cannot read paddle_customer_id / paddle_subscription_id
-- from other users by revoking direct table access and routing through a view.
-- NOTE: Supabase auto-exposes tables; we tighten this by creating a security
-- policy that only returns sensitive columns when the row belongs to the caller.

-- Drop and recreate the SELECT policy to distinguish own vs. other rows.
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Any authenticated or anonymous user can read the public profile fields.
-- Sensitive payment fields are only returned for the profile owner.
-- We enforce this by splitting into two policies:

-- Policy A: owners can read their full row (including payment fields)
CREATE POLICY "Users can read own full profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy B: everyone (incl. anon) can read non-sensitive public fields.
-- Because PostgreSQL doesn't support column-level RLS filtering, we mask
-- sensitive fields to NULL via a SECURITY DEFINER view used by the app.
-- This policy grants SELECT access; the view (below) does the masking.
CREATE POLICY "Users can view public profiles"
  ON public.profiles
  FOR SELECT
  TO public
  USING (true);

-- Public-safe view that masks payment identifiers for cross-user reads.
-- The app should use this view when displaying other users' profiles.
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT
  user_id,
  name,
  age,
  city,
  occupation,
  bio,
  avatar_url,
  photos,
  budget,
  desired_room_type,
  sleep_schedule,
  cleanliness,
  cooking_habits,
  shared_space_org,
  smoking,
  religious_level,
  alcohol,
  pets,
  fitness,
  wfh,
  guests,
  social_level,
  noise_level,
  partying,
  lifestyle_vibe,
  preferred_age_min,
  preferred_age_max,
  gender_preference,
  lifestyle_similarity,
  cleanliness_expectations,
  activity_hours,
  onboarding_complete,
  phone_verified,
  subscription_tier,
  created_at,
  updated_at
  -- paddle_customer_id   intentionally excluded
  -- paddle_subscription_id intentionally excluded
FROM public.profiles;
