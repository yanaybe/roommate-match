-- Enforce 2000-char cap on squad messages at the DB level.
-- Client-side .substring(0,2000) can be bypassed via direct API calls.
ALTER TABLE squad_messages
  DROP CONSTRAINT IF EXISTS squad_messages_content_len;
ALTER TABLE squad_messages
  ADD CONSTRAINT squad_messages_content_len
  CHECK (char_length(content) <= 2000);
