-- Expand notifications.type constraint to cover all types used in the app.
-- The original constraint only allowed 'match' and 'squad_invite'.
-- SquadHub sends 'squad_deleted'; the notify edge function accepts 'message'.
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('match', 'squad_invite', 'squad_deleted', 'message'));
