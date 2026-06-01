-- ============================================================
-- FIX: ADD MISSING COLUMNS TO PROFILES TABLE
-- ============================================================
-- The following columns are required by the frontend but might be missing
-- from your Supabase database schema. Run this script in your Supabase SQL Editor.

-- 1. Add missing fields to public.profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS time_of_birth text,
ADD COLUMN IF NOT EXISTS place_of_birth text,
ADD COLUMN IF NOT EXISTS sub_caste text,
ADD COLUMN IF NOT EXISTS income_rs text,
ADD COLUMN IF NOT EXISTS fathers_occupation text,
ADD COLUMN IF NOT EXISTS mothers_occupation text,
ADD COLUMN IF NOT EXISTS brothers text,
ADD COLUMN IF NOT EXISTS sisters text,
ADD COLUMN IF NOT EXISTS current_address text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS photo_url text,
ADD COLUMN IF NOT EXISTS avatar_url text;

-- 1.1 Create synchronization function to keep photo_url and avatar_url in sync
CREATE OR REPLACE FUNCTION public.sync_profile_photo_urls()
RETURNS trigger AS $$
BEGIN
  IF NEW.photo_url IS DISTINCT FROM OLD.photo_url AND (NEW.avatar_url IS NOT DISTINCT FROM OLD.avatar_url OR NEW.avatar_url IS NULL) THEN
    NEW.avatar_url := NEW.photo_url;
  ELSIF NEW.avatar_url IS DISTINCT FROM OLD.avatar_url AND (NEW.photo_url IS NOT DISTINCT FROM OLD.photo_url OR NEW.photo_url IS NULL) THEN
    NEW.photo_url := NEW.avatar_url;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1.2 Create trigger to run BEFORE INSERT OR UPDATE on public.profiles
DROP TRIGGER IF EXISTS sync_profile_photos_trigger ON public.profiles;
CREATE TRIGGER sync_profile_photos_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_photo_urls();

-- 2. Add Unique Constraint to user_id if missing (Required for upsert)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_id_key') THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- 2. Add is_admin to public.users if missing (consistency check)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- ============================================================
-- IMPORTANT: AFTER RUNNING THIS SCRIPT
-- ============================================================
-- 1. Go to Supabase Dashboard > Settings > API
-- 2. Click "Reload Schema" (or save any setting there) to refresh the cache.
-- 3. Verify the error "Could not find column... in schema cache" is resolved.
