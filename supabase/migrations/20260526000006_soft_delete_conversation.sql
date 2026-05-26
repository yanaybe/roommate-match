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
