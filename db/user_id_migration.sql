-- ============================================================
-- USER DISPLAY ID SYSTEM (BR0001 format)
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create counter table for atomic auto-increment
CREATE TABLE IF NOT EXISTS public.user_id_counter (
    id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- single-row table
    last_number integer NOT NULL DEFAULT 0
);

-- Seed the counter if empty
INSERT INTO public.user_id_counter (id, last_number)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- 2. Add user_display_id and photo columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS user_display_id text UNIQUE,
ADD COLUMN IF NOT EXISTS photo_url text,
ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2.1 Create synchronization function to keep photo_url and avatar_url in sync
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

-- 2.2 Create trigger to run BEFORE INSERT OR UPDATE on public.profiles
DROP TRIGGER IF EXISTS sync_profile_photos_trigger ON public.profiles;
CREATE TRIGGER sync_profile_photos_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_photo_urls();

-- 3. Create atomic ID generation function
CREATE OR REPLACE FUNCTION public.generate_next_user_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_number integer;
  display_id text;
BEGIN
  -- Atomically increment and return (FOR UPDATE locks the row)
  UPDATE public.user_id_counter
  SET last_number = last_number + 1
  WHERE id = 1
  RETURNING last_number INTO next_number;

  -- Format: BR + 4-digit zero-padded number
  display_id := 'BR' || LPAD(next_number::text, 4, '0');

  RETURN display_id;
END;
$$ SET search_path = '';

-- 4. Update handle_new_user trigger to auto-assign user_display_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_display_id text;
BEGIN
  -- Generate the next user display ID
  new_display_id := public.generate_next_user_id();

  -- Insert into public.users
  INSERT INTO public.users (id, email, role, is_admin)
  VALUES (
    new.id,
    new.email,
    'user',
    false
  ) ON CONFLICT (id) DO NOTHING;

  -- Insert into public.profiles with user_display_id
  INSERT INTO public.profiles (id, user_id, full_name, is_approved, is_verified, user_display_id)
  VALUES (
    new.id,
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', substring(new.email from '(.*)@')),
    true,
    false,
    new_display_id
  ) ON CONFLICT (id) DO UPDATE SET
    user_display_id = COALESCE(public.profiles.user_display_id, new_display_id);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Re-create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Update admin_add_profile RPC to auto-assign user_display_id + optional phone
CREATE OR REPLACE FUNCTION admin_add_profile(
  user_email text,
  user_password text,
  user_name text,
  user_role text,
  user_photos text[] DEFAULT '{}',
  user_phone text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  auth_user_id uuid;
  photo_url_val text;
  i integer;
  new_display_id text;
BEGIN
  -- Authorization Check
  IF NOT EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = (SELECT auth.uid()) 
      AND (is_admin = true OR role IN ('admin', 'super_admin'))
  ) AND (SELECT auth.jwt()->>'email') != 'bhartiyarishte03@gmail.com' THEN
      RAISE EXCEPTION 'Unauthorized.';
  END IF;

  -- Generate ID beforehand
  auth_user_id := extensions.gen_random_uuid();

  -- Generate the next user display ID
  new_display_id := public.generate_next_user_id();

  -- Create Auth User
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, phone)
  VALUES (
    auth_user_id,
    user_email, 
    extensions.crypt(user_password, extensions.gen_salt('bf')), 
    now(), 
    '{"provider":"email","providers":["email"]}', 
    jsonb_build_object('full_name', user_name),
    'authenticated',
    'authenticated',
    user_phone
  );

  -- Update public.users (Trigger handle_new_user already inserted the initial row)
  UPDATE public.users 
  SET 
    is_admin = (user_role IN ('admin', 'super_admin')),
    role = user_role
  WHERE id = auth_user_id;

  -- Get the first photo URL for profile photo_url, or use default avatar
  IF array_length(user_photos, 1) > 0 THEN
    photo_url_val := user_photos[1];
  ELSE
    photo_url_val := 'https://ui-avatars.com/api/?name=' || replace(user_name, ' ', '+') || '&background=E11D48&color=fff&size=400&bold=true&format=png';
  END IF;

  -- Update public.profiles (Trigger handle_new_user already inserted the initial row)
  UPDATE public.profiles
  SET 
    full_name = user_name,
    is_approved = true,
    is_verified = true,
    is_admin = (user_role IN ('admin', 'super_admin')),
    photo_url = photo_url_val,
    user_display_id = COALESCE(user_display_id, new_display_id)
  WHERE user_id = auth_user_id;

  -- Insert photos into photos table
  IF array_length(user_photos, 1) > 0 THEN
    FOR i IN 1..array_length(user_photos, 1) LOOP
      INSERT INTO public.photos (user_id, url, is_primary)
      VALUES (auth_user_id, user_photos[i], (i = 1));
    END LOOP;
  END IF;
  
  INSERT INTO public.audit_logs (admin_id, action, target_id, details)
  VALUES ((SELECT auth.uid()), 'CREATE_USER', auth_user_id, jsonb_build_object('email', user_email, 'role', user_role, 'user_display_id', new_display_id));
END;
$$ SET search_path = '';

-- 6. Backfill existing profiles that don't have a user_display_id
DO $$
DECLARE
  rec RECORD;
  new_id text;
BEGIN
  FOR rec IN 
    SELECT id FROM public.profiles 
    WHERE user_display_id IS NULL 
    ORDER BY created_at ASC NULLS FIRST, id ASC
  LOOP
    new_id := public.generate_next_user_id();
    UPDATE public.profiles SET user_display_id = new_id WHERE id = rec.id;
  END LOOP;
END;
$$;

-- 7. Grant necessary permissions
GRANT SELECT ON public.user_id_counter TO authenticated;
GRANT SELECT ON public.user_id_counter TO anon;
