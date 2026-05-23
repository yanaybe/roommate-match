-- Allow users to see who liked them (liked_user_id = me)
CREATE POLICY "Users can view likes received"
  ON public.liked_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = liked_user_id);
