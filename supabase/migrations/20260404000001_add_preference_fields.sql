ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS smoking_preference TEXT NOT NULL DEFAULT 'Non-smoker, okay with smokers'
  CHECK (smoking_preference IN ('I smoke', 'Non-smoker, okay with smokers', 'Non-smoker, prefer no smoking'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pet_preference TEXT NOT NULL DEFAULT 'No pets, but okay with them'
  CHECK (pet_preference IN ('I have pets', 'No pets, but okay with them', 'Prefer no pets'));
