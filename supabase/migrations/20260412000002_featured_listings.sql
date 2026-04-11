-- Add featured/boost columns to apartments
ALTER TABLE public.apartments
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ DEFAULT NULL;

-- Auto-expire: a cron could flip is_featured back to false,
-- but we handle it in the query layer (check featured_until > now()).
