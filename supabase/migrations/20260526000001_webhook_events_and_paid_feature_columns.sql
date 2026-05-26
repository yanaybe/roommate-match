-- ─────────────────────────────────────────────────────────────────────────────
-- Webhook event idempotency table.
-- The Paddle webhook handler inserts a row for every processed event.
-- If the same event_id arrives again (Paddle retry), the INSERT fails on the
-- primary-key constraint and the handler returns 200 without double-processing.
-- Rows older than 7 days are pruned automatically.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS webhook_events (
  id           text        PRIMARY KEY,           -- Paddle notification_id / event_id
  event_type   text        NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- No RLS needed — only accessible via service_role (edge functions).
-- Public users have no direct access to this table.
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
-- Deny all client access; only service_role (edge functions) can write.
CREATE POLICY "No public access" ON webhook_events USING (false);

-- Auto-prune events older than 7 days to keep the table small.
CREATE OR REPLACE FUNCTION fn_prune_webhook_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM webhook_events WHERE processed_at < now() - interval '7 days';
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_prune_webhook_events ON webhook_events;
CREATE TRIGGER trg_prune_webhook_events
  AFTER INSERT ON webhook_events
  FOR EACH STATEMENT
  EXECUTE FUNCTION fn_prune_webhook_events();

-- ─────────────────────────────────────────────────────────────────────────────
-- Profile columns for paid one-time features.
-- These are set by the Paddle webhook on transaction.completed and consumed
-- by client-side guards (Chats.tsx, useAllProfiles, BoostListingSheet).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS instant_message_credits  integer    NOT NULL DEFAULT 0 CHECK (instant_message_credits >= 0),
  ADD COLUMN IF NOT EXISTS highlighted_until        timestamptz,
  ADD COLUMN IF NOT EXISTS weekly_boosts_remaining  integer    NOT NULL DEFAULT 0 CHECK (weekly_boosts_remaining >= 0);

-- Guard: prevent clients from directly inflating their own credits/boosts.
-- (The trigger guard_profile_sensitive_fields already blocks subscription_tier;
-- we extend it to cover these new monetised columns.)
CREATE OR REPLACE FUNCTION public.guard_profile_sensitive_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    -- Payment / subscription fields — only writable by service_role (webhooks)
    NEW.subscription_tier            := OLD.subscription_tier;
    NEW.paddle_customer_id           := OLD.paddle_customer_id;
    NEW.paddle_subscription_id       := OLD.paddle_subscription_id;
    NEW.phone_verified               := OLD.phone_verified;
    -- Paid feature credits — prevent self-inflation
    NEW.instant_message_credits      := OLD.instant_message_credits;
    NEW.highlighted_until            := OLD.highlighted_until;
    NEW.weekly_boosts_remaining      := OLD.weekly_boosts_remaining;
  END IF;
  RETURN NEW;
END;
$$;
-- Trigger already exists from 20260416000000; no need to recreate.

-- Index to efficiently find highlighted profiles in discovery feed.
CREATE INDEX IF NOT EXISTS idx_profiles_highlighted
  ON profiles (highlighted_until DESC NULLS LAST)
  WHERE highlighted_until IS NOT NULL;
