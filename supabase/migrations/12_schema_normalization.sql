-- ============================================================
-- PHASE 12: SCHEMA NORMALIZATION
-- Run in Supabase SQL Editor with service_role key.
-- This migration repairs inconsistencies by standardizing keys.
-- ============================================================

-- 1. ADD NEW COLUMNS
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS date_of_birth text,
ADD COLUMN IF NOT EXISTS phone_number text;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS phone_number text;

-- 2. MIGRATE EXISTING DATA
UPDATE public.profiles
SET 
  avatar_url = COALESCE(avatar_url, photo_url),
  date_of_birth = COALESCE(date_of_birth, dob),
  phone_number = COALESCE(phone_number, (SELECT phone FROM public.users WHERE id = profiles.user_id))
WHERE photo_url IS NOT NULL OR dob IS NOT NULL;

UPDATE public.users
SET phone_number = COALESCE(phone_number, phone)
WHERE phone IS NOT NULL;

-- 3. DROP OLD TRIGGERS
DROP TRIGGER IF EXISTS sync_profile_photos_trigger ON public.profiles;
DROP FUNCTION IF EXISTS public.sync_profile_photo_urls();

-- 4. UPDATE VIEW TO USE NEW COLUMNS
DROP VIEW IF EXISTS public_profiles_safe;

CREATE OR REPLACE VIEW public_profiles_safe WITH (security_invoker = true) AS
SELECT
    p.id,
    p.user_id,
    p.full_name,
    p.gender,
    p.date_of_birth,
    p.age,
    p.height,
    p.religion,
    p.caste,
    p.sub_caste,
    p.city,
    p.state,
    p.current_address,
    p.education,
    p.profession,
    p.time_of_birth,
    p.place_of_birth,
    p.income_rs,
    p.fathers_occupation,
    p.mothers_occupation,
    p.brothers,
    p.sisters,
    p.marital_status,
    p.bio,
    p.user_display_id,
    p.is_approved,
    p.verification_status,
    p.is_verified,
    p.avatar_url,
    p.phone_number,
    p.created_at,
    p.profile_completed
FROM public.profiles p
WHERE p.is_approved = true;

-- 5. UPDATE RPC FUNCTIONS
CREATE OR REPLACE FUNCTION admin_add_profile(
  user_email text,
  user_password text,
  user_name text,
  user_role text,
  user_photos text[] DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  auth_user_id uuid;
  avatar_url_val text;
  i integer;
BEGIN
  IF NOT EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = (SELECT auth.uid()) 
      AND (is_admin = true OR role IN ('admin', 'super_admin'))
  ) AND (SELECT auth.jwt()->>'email') != 'bhartiyarishte03@gmail.com' THEN
      RAISE EXCEPTION 'Unauthorized.';
  END IF;

  auth_user_id := extensions.gen_random_uuid();

  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (
    auth_user_id,
    user_email, 
    extensions.crypt(user_password, extensions.gen_salt('bf')), 
    now(), 
    '{"provider":"email","providers":["email"]}', 
    jsonb_build_object('full_name', user_name),
    'authenticated',
    'authenticated'
  );

  UPDATE public.users 
  SET 
    is_admin = (user_role IN ('admin', 'super_admin')),
    role = user_role
  WHERE id = auth_user_id;

  IF array_length(user_photos, 1) > 0 THEN
    avatar_url_val := user_photos[1];
  ELSE
    avatar_url_val := NULL;
  END IF;

  UPDATE public.profiles
  SET 
    full_name = user_name,
    is_approved = true,
    is_verified = true,
    is_admin = (user_role IN ('admin', 'super_admin')),
    avatar_url = avatar_url_val
  WHERE user_id = auth_user_id;

  IF array_length(user_photos, 1) > 0 THEN
    FOR i IN 1..array_length(user_photos, 1) LOOP
      INSERT INTO public.photos (user_id, url, is_primary)
      VALUES (auth_user_id, user_photos[i], (i = 1));
    END LOOP;
  END IF;
  
  INSERT INTO public.audit_logs (admin_id, action, target_id, details)
  VALUES ((SELECT auth.uid()), 'CREATE_USER', auth_user_id, jsonb_build_object('email', user_email, 'role', user_role));
END;
$$ SET search_path = '';

-- 6. DROP OLD COLUMNS (Schema enforces the new mapping)
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS photo_url,
DROP COLUMN IF EXISTS dob;

ALTER TABLE public.users 
DROP COLUMN IF EXISTS phone;
