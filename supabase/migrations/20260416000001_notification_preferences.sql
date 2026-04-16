-- Add notification preference columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notify_on_match    BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_on_message  BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_on_squad_invite BOOLEAN NOT NULL DEFAULT true;
