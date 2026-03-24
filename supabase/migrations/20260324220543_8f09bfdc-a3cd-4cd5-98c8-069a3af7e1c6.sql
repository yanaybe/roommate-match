
CREATE TABLE public.liked_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  liked_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, liked_user_id)
);

ALTER TABLE public.liked_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own likes" ON public.liked_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own likes" ON public.liked_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON public.liked_profiles
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.saved_apartments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  apartment_id uuid REFERENCES public.apartments(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, apartment_id)
);

ALTER TABLE public.saved_apartments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own saves" ON public.saved_apartments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own saves" ON public.saved_apartments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own saves" ON public.saved_apartments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
