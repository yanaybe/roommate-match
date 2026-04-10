-- =============================================================================
-- In-app notifications table + DB triggers
-- Types: match, squad_invite
-- (Messages use existing message_read_receipts system)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('match', 'squad_invite')),
  actor_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reference_id UUID,   -- squad_id for squad_invite, liked_user_id for match
  title        TEXT NOT NULL,
  body         TEXT,
  read         BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id, read, created_at DESC);

-- =============================================================================
-- Trigger: detect match on liked_profiles INSERT
-- A match = both users liked each other
-- =============================================================================
CREATE OR REPLACE FUNCTION trg_create_match_notification()
RETURNS TRIGGER AS $$
DECLARE
  actor_name   TEXT;
  target_name  TEXT;
BEGIN
  -- Check if the other person already liked back
  IF NOT EXISTS (
    SELECT 1 FROM liked_profiles
    WHERE user_id = NEW.liked_user_id
      AND liked_user_id = NEW.user_id
  ) THEN
    RETURN NEW; -- not a match yet
  END IF;

  -- Get names for notification body
  SELECT name INTO actor_name  FROM profiles WHERE user_id = NEW.user_id       LIMIT 1;
  SELECT name INTO target_name FROM profiles WHERE user_id = NEW.liked_user_id LIMIT 1;

  -- Notify the person who was just liked
  INSERT INTO public.notifications (user_id, type, actor_id, reference_id, title, body)
  VALUES (
    NEW.liked_user_id,
    'match',
    NEW.user_id,
    NEW.user_id,
    '🎉 It''s a Match!',
    'You and ' || COALESCE(actor_name, 'someone') || ' liked each other'
  )
  ON CONFLICT DO NOTHING;

  -- Also notify the person who just liked (they caused the match)
  INSERT INTO public.notifications (user_id, type, actor_id, reference_id, title, body)
  VALUES (
    NEW.user_id,
    'match',
    NEW.liked_user_id,
    NEW.liked_user_id,
    '🎉 It''s a Match!',
    'You and ' || COALESCE(target_name, 'someone') || ' liked each other'
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_match_notification ON public.liked_profiles;
CREATE TRIGGER trg_match_notification
  AFTER INSERT ON public.liked_profiles
  FOR EACH ROW EXECUTE FUNCTION trg_create_match_notification();

-- =============================================================================
-- Trigger: squad invite notification
-- =============================================================================
CREATE OR REPLACE FUNCTION trg_create_squad_invite_notification()
RETURNS TRIGGER AS $$
DECLARE
  squad_name   TEXT;
  inviter_name TEXT;
BEGIN
  SELECT name INTO squad_name   FROM squads   WHERE id      = NEW.squad_id   LIMIT 1;
  SELECT name INTO inviter_name FROM profiles WHERE user_id = NEW.inviter_id LIMIT 1;

  INSERT INTO public.notifications (user_id, type, actor_id, reference_id, title, body)
  VALUES (
    NEW.invitee_id,
    'squad_invite',
    NEW.inviter_id,
    NEW.squad_id,
    '👥 Squad Invite',
    COALESCE(inviter_name, 'Someone') || ' invited you to join "' || COALESCE(squad_name, 'a squad') || '"'
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_squad_invite_notification ON public.squad_invites;
CREATE TRIGGER trg_squad_invite_notification
  AFTER INSERT ON public.squad_invites
  FOR EACH ROW EXECUTE FUNCTION trg_create_squad_invite_notification();
