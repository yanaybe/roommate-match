ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_visibility text DEFAULT 'everyone' CHECK (profile_visibility IN ('everyone', 'hidden'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gold_boost_used_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS platinum_boost_used_at_1 timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS platinum_boost_used_at_2 timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS platinum_boost_used_at_3 timestamptz;
