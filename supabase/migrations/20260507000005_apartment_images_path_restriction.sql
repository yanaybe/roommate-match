-- Restrict apartment-images uploads to the authenticated user's own folder.
-- The profile-photos bucket already has this policy; apply the same to apartment-images.
-- PostApartment.tsx already prefixes paths with `${user.id}/` — this enforces it at DB.
DROP POLICY IF EXISTS "Authenticated users can upload apartment images" ON storage.objects;
DROP POLICY IF EXISTS "Users upload apartment images to own folder" ON storage.objects;

CREATE POLICY "Users upload apartment images to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'apartment-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
