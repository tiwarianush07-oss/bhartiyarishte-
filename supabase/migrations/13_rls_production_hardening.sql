-- ============================================================
-- PHASE 13: RLS PRODUCTION HARDENING
-- Restores secure self-service capabilities for the Uploader architecture.
-- ============================================================

-- 1. PROFILE UPDATE POLICY
-- Allow authenticated users to UPDATE their own profile rows. 
-- Required for the MagicUploader and SuperUploader UPDATE flow after trigger execution.
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING ( auth.uid() = user_id )
WITH CHECK ( auth.uid() = user_id );

-- 2. PROFILE SELECT POLICY
-- Allow users to SELECT their own profile (needed for the retry sync loop)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING ( auth.uid() = user_id );

-- 3. STORAGE BUCKET POLICIES (Avatars)
-- Ensure 'avatars' bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO NOTHING;

-- Allow users to upload their own avatars
DROP POLICY IF EXISTS "Users can upload own avatars" ON storage.objects;
CREATE POLICY "Users can upload own avatars" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own avatars
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
CREATE POLICY "Users can update own avatars" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public access to read avatars
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
CREATE POLICY "Avatars are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING ( bucket_id = 'avatars' );
