
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Basic Info
  name TEXT NOT NULL DEFAULT '',
  age INTEGER,
  city TEXT NOT NULL DEFAULT '',
  occupation TEXT NOT NULL DEFAULT '',
  budget INTEGER NOT NULL DEFAULT 0,
  desired_room_type TEXT NOT NULL DEFAULT 'Private',
  avatar_url TEXT,
  
  -- Living Habits
  sleep_schedule TEXT NOT NULL DEFAULT 'Flexible',
  cleanliness INTEGER NOT NULL DEFAULT 3 CHECK (cleanliness BETWEEN 1 AND 5),
  cooking_habits TEXT NOT NULL DEFAULT 'Sometimes',
  shared_space_org TEXT NOT NULL DEFAULT 'Moderate',
  
  -- Lifestyle
  smoking BOOLEAN NOT NULL DEFAULT false,
  religious_level TEXT NOT NULL DEFAULT 'Not religious',
  alcohol TEXT NOT NULL DEFAULT 'Socially',
  pets BOOLEAN NOT NULL DEFAULT false,
  fitness TEXT NOT NULL DEFAULT 'Sometimes',
  wfh BOOLEAN NOT NULL DEFAULT false,
  guests TEXT NOT NULL DEFAULT 'Occasionally',
  
  -- Personality
  social_level INTEGER NOT NULL DEFAULT 3 CHECK (social_level BETWEEN 1 AND 5),
  noise_level INTEGER NOT NULL DEFAULT 3 CHECK (noise_level BETWEEN 1 AND 5),
  partying TEXT NOT NULL DEFAULT 'Occasionally',
  lifestyle_vibe TEXT NOT NULL DEFAULT 'Balanced',
  
  -- Roommate Preferences
  preferred_age_min INTEGER NOT NULL DEFAULT 18,
  preferred_age_max INTEGER NOT NULL DEFAULT 40,
  gender_preference TEXT NOT NULL DEFAULT 'No preference',
  lifestyle_similarity TEXT NOT NULL DEFAULT 'Somewhat similar',
  cleanliness_expectations INTEGER NOT NULL DEFAULT 3 CHECK (cleanliness_expectations BETWEEN 1 AND 5),
  activity_hours TEXT NOT NULL DEFAULT 'Flexible',
  
  -- Bio
  bio TEXT NOT NULL DEFAULT '',
  
  -- Onboarding complete
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO public USING (true);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
