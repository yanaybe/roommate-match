-- Add Paddle billing fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS paddle_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS paddle_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Index for webhook lookups by paddle customer id
CREATE INDEX IF NOT EXISTS idx_profiles_paddle_customer_id
  ON public.profiles (paddle_customer_id);
