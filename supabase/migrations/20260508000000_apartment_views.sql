CREATE TABLE IF NOT EXISTS apartment_views (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id uuid        NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  viewer_id    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE apartment_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Insert own views"
  ON apartment_views FOR INSERT
  WITH CHECK (viewer_id IS NULL OR viewer_id = auth.uid());

CREATE POLICY "Owners see their listing views"
  ON apartment_views FOR SELECT
  USING (
    apartment_id IN (SELECT id FROM apartments WHERE user_id = auth.uid())
  );
