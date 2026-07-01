-- The DB webhook for messages should call notify-message-webhook, not notify directly.
-- This is a comment migration — update the webhook URL in Supabase Dashboard:
-- Database > Webhooks > messages_notify webhook
-- Change URL from: /functions/v1/notify
-- Change URL to:   /functions/v1/notify-message-webhook
--
-- The notify-message-webhook function reformats the raw DB webhook payload
-- into the proper format expected by the notify function.
COMMENT ON TABLE messages IS 'Webhook: notify-message-webhook (see supabase/functions/notify-message-webhook/index.ts)';
