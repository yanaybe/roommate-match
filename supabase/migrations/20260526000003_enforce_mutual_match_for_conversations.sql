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
