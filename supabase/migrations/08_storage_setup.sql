-- Enable storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- Enable storage bucket for profile_photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile_photos', 'profile_photos', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- Ensure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Cleanup existing conflicting policies to allow re-running
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars." ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars." ON storage.objects;
DROP POLICY IF EXISTS "Profile photos are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload a profile photo." ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile photos." ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile photos." ON storage.objects;

-- Policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

CREATE POLICY "Anyone can upload an avatar."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'avatars' );

CREATE POLICY "Users can update their own avatars."
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'avatars' );

CREATE POLICY "Users can delete their own avatars."
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'avatars' );

-- Policies for profile_photos bucket
CREATE POLICY "Profile photos are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'profile_photos' );

CREATE POLICY "Anyone can upload a profile photo."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'profile_photos' );

CREATE POLICY "Users can update their own profile photos."
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'profile_photos' );

CREATE POLICY "Users can delete their own profile photos."
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'profile_photos' );
