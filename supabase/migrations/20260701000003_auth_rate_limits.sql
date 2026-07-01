CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,       -- phone number or email
  action TEXT NOT NULL,           -- 'otp_verify', 'password_reset', 'email_resend'
  attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS auth_rate_limits_identifier_action
  ON public.auth_rate_limits (identifier, action);

-- No RLS — only accessible via service role (edge function)
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies = service role only

-- Auto-cleanup old entries (older than 24h)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM public.auth_rate_limits
  WHERE updated_at < now() - interval '24 hours';
END;
$$;
