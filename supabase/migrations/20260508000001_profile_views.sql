CREATE TABLE IF NOT EXISTS profile_views (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewer_id   uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can record views"
  ON profile_views FOR INSERT
  WITH CHECK (viewer_id IS NULL OR viewer_id = auth.uid());

CREATE POLICY "Users see views of their own profile"
  ON profile_views FOR SELECT
  USING (profile_id = auth.uid());
