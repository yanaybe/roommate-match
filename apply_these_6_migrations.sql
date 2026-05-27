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
-- ─────────────────────────────────────────────────────────────────────────────
-- Enforce mutual match before allowing conversation creation.
--
-- The current RLS policies allow any authenticated user to create a
-- conversation with any other user — no mutual like required. This means
-- anyone can cold-message anyone, violating the app's core safety model.
--
-- Fix strategy:
--   1. Replace the open INSERT policy on conversations with a SECURITY DEFINER
--      function (find_or_create_conversation) that validates mutual like.
--   2. Revoke direct INSERT on conversations and conversation_participants
--      from authenticated users — all conversation creation must go through
--      the RPC, which enforces the mutual-like check.
--   3. Keep the existing RPC logic but add the mutual-like guard.
--
-- Exception: Platinum subscribers may message before matching (Instant Message
-- feature). This is handled via instant_message_credits — the guard checks for
-- either a mutual like OR a positive credit balance (and decrements on use).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Drop the open INSERT policies ────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated users can create conversations"
  ON public.conversations;

DROP POLICY IF EXISTS "Authenticated users can add participants"
  ON public.conversation_participants;

-- ── 2. Replace find_or_create_conversation with mutual-match guard ───────────

CREATE OR REPLACE FUNCTION find_or_create_conversation(other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller             uuid := auth.uid();
  v_conv_id            uuid;
  v_mutual_like        boolean;
  v_has_im_credits     boolean;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_caller = other_user_id THEN
    RAISE EXCEPTION 'Cannot start a conversation with yourself';
  END IF;

  -- ── Return existing conversation if one already exists ───────────────────
  SELECT cp1.conversation_id INTO v_conv_id
  FROM conversation_participants cp1
  JOIN conversation_participants cp2
    ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.user_id = v_caller
    AND cp2.user_id = other_user_id
  LIMIT 1;

  IF v_conv_id IS NOT NULL THEN
    RETURN v_conv_id;
  END IF;

  -- ── Check for mutual like ─────────────────────────────────────────────────
  SELECT EXISTS (
    SELECT 1 FROM liked_profiles
    WHERE user_id = v_caller AND liked_user_id = other_user_id
  ) AND EXISTS (
    SELECT 1 FROM liked_profiles
    WHERE user_id = other_user_id AND liked_user_id = v_caller
  ) INTO v_mutual_like;

  -- ── Check for Instant Message credit (bypass mutual-like requirement) ─────
  SELECT COALESCE((
    SELECT instant_message_credits > 0
    FROM profiles
    WHERE user_id = v_caller
  ), false) INTO v_has_im_credits;

  IF NOT v_mutual_like AND NOT v_has_im_credits THEN
    RAISE EXCEPTION 'mutual_like_required'
      USING HINT = 'A mutual like is required to start a conversation, or use an Instant Message credit.';
  END IF;

  -- ── Consume one Instant Message credit if used ───────────────────────────
  IF NOT v_mutual_like AND v_has_im_credits THEN
    UPDATE profiles
    SET instant_message_credits = instant_message_credits - 1
    WHERE user_id = v_caller
      AND instant_message_credits > 0;

    IF NOT FOUND THEN
      -- Credit was consumed between check and update (race condition)
      RAISE EXCEPTION 'mutual_like_required'
        USING HINT = 'Instant Message credit was already used.';
    END IF;
  END IF;

  -- ── Create the conversation atomically ───────────────────────────────────
  INSERT INTO conversations DEFAULT VALUES RETURNING id INTO v_conv_id;

  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (v_conv_id, v_caller), (v_conv_id, other_user_id);

  RETURN v_conv_id;
END;
$$;

REVOKE ALL ON FUNCTION find_or_create_conversation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION find_or_create_conversation(uuid) TO authenticated;

-- ── 3. Restricted INSERT policies via RPC only ───────────────────────────────
-- Conversations can only be created through the RPC above (SECURITY DEFINER).
-- The RPC uses service-level access; we block direct INSERTs from clients.
-- Note: service_role is exempt from RLS, so the RPC still works.

CREATE POLICY "Conversations created via RPC only"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "Participants added via RPC only"
  ON public.conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Allow users to delete their own participant record (for conversation "deletion")
-- We add this so the existing deleteConversation client code can still remove
-- the current user's participation record. The new soft-delete migration
-- (20260526000004) replaces this fully.
CREATE POLICY "Users can delete own participation"
  ON public.conversation_participants FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ── 4. Redirect legacy create_conversation_with_participant to the new RPC ───
-- The MatchModal still calls this function. Delegate to find_or_create_conversation
-- so the mutual-like guard is applied everywhere. This is a backwards-compatible
-- change — callers get the same return type (uuid).
CREATE OR REPLACE FUNCTION public.create_conversation_with_participant(other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delegate to find_or_create_conversation, which enforces mutual like.
  RETURN find_or_create_conversation(other_user_id);
END;
$$;
-- Maintain the same grant as the original function.
GRANT EXECUTE ON FUNCTION public.create_conversation_with_participant(uuid) TO authenticated;
-- ─────────────────────────────────────────────────────────────────────────────
-- DB-level rate-limit for the reports table.
--
-- The client-side guard in useBlockReport.ts (10 reports/day) can be bypassed
-- via direct API calls, multiple tabs, or scripted requests. Moving the limit
-- to a BEFORE INSERT trigger makes it impossible to circumvent from the client.
--
-- Limit: 10 reports per reporter per 24-hour rolling window.
-- Violation: raises SQLSTATE 'P0001' with message 'report_rate_limit_exceeded'
-- so the client can map the error to a user-friendly message.
--
-- Implementation notes:
--   • SECURITY DEFINER + search_path = public prevents search_path hijacking.
--   • The function uses auth.uid() — the RLS INSERT policy already ensures
--     reporter_id = auth.uid(), so the rate limit is tied to the authenticated
--     user, not a client-supplied field.
--   • The existing RLS policy is kept; the trigger adds an additional layer.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_check_report_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_limit constant integer := 10;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM reports
  WHERE reporter_id = NEW.reporter_id
    AND created_at  > now() - interval '24 hours';

  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'report_rate_limit_exceeded'
      USING HINT = 'You can submit at most 10 reports per 24 hours.',
            ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_report_rate_limit ON public.reports;

CREATE TRIGGER trg_report_rate_limit
  BEFORE INSERT ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION fn_check_report_rate_limit();

-- ── Supporting index (covers the rate-limit query) ───────────────────────────
-- reporter_id + created_at (DESC) — needed by both the trigger and any admin
-- queries that audit recent reports per user.
CREATE INDEX IF NOT EXISTS idx_reports_reporter_created
  ON public.reports (reporter_id, created_at DESC);
-- ─────────────────────────────────────────────────────────────────────────────
-- Missing performance indexes.
--
-- These tables are hit on every page load / swipe and were missing indexes on
-- their most common lookup columns, causing sequential scans at scale.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── liked_profiles ───────────────────────────────────────────────────────────
-- UNIQUE(user_id, liked_user_id) covers forward-direction lookups
-- (who did I like?).  The reverse direction — "who liked me?" — is used by:
--   • useProfileStats (likes-received count)
--   • find_or_create_conversation mutual-like guard
--   • Roommates.tsx mutual-like check after a right swipe
-- Without this index those queries scan the entire table.
CREATE INDEX IF NOT EXISTS idx_liked_profiles_liked_user
  ON public.liked_profiles (liked_user_id);

-- Additional index on created_at for ordered pagination of likes received.
CREATE INDEX IF NOT EXISTS idx_liked_profiles_user_created
  ON public.liked_profiles (user_id, created_at DESC);

-- ── profile_views ────────────────────────────────────────────────────────────
-- useProfileStats queries: SELECT COUNT(*) FROM profile_views WHERE profile_id = $1
-- Without an index this is a full-table scan that grows unbounded.
CREATE INDEX IF NOT EXISTS idx_profile_views_profile
  ON public.profile_views (profile_id, viewed_at DESC);
-- ─────────────────────────────────────────────────────────────────────────────
-- Soft-delete conversations by removing only the current user's participation.
--
-- Problem: The previous deleteConversation client code deleted ALL messages
-- and the conversations row, destroying the other participant's history.
--
-- Fix strategy:
--   1. When a user "deletes" a conversation, they delete only their own
--      conversation_participants row (already allowed by the DELETE policy
--      added in 20260526000003).
--   2. A AFTER DELETE trigger on conversation_participants automatically
--      garbage-collects conversations that have zero remaining participants,
--      avoiding orphaned rows.
--   3. Messages are never deleted — they stay as the other user's history
--      until both users remove themselves (at which point the GC trigger
--      cascades the deletion via FK ON DELETE CASCADE on messages).
--
-- The conversations table already has:
--   messages.conversation_id → ON DELETE CASCADE
--   conversation_participants.conversation_id → ON DELETE CASCADE
-- So deleting the conversations row removes all messages/participants.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Orphaned-conversation garbage collector ──────────────────────────────────
CREATE OR REPLACE FUNCTION fn_gc_empty_conversation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- After a participant row is deleted, check if the conversation is now empty.
  -- If yes, delete the conversation — FK cascades clean up messages and any
  -- remaining read receipts.
  IF NOT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = OLD.conversation_id
  ) THEN
    DELETE FROM conversations WHERE id = OLD.conversation_id;
  END IF;

  RETURN NULL; -- AFTER trigger return value is ignored
END;
$$;

DROP TRIGGER IF EXISTS trg_gc_empty_conversation ON public.conversation_participants;

CREATE TRIGGER trg_gc_empty_conversation
  AFTER DELETE ON public.conversation_participants
  FOR EACH ROW
  EXECUTE FUNCTION fn_gc_empty_conversation();
