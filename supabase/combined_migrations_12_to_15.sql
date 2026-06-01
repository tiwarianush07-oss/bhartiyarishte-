-- ============================================================
-- BHARATJODI / BHARTIYA RISHTEY: COMBINED MIGRATIONS (12 to 15)
-- Run this script in the Supabase Dashboard SQL Editor
-- to synchronize schema, harden RLS, and fix contact RPC errors.
-- ============================================================

BEGIN;

-- ============================================================
-- MIGRATION 12: SCHEMA NORMALIZATION
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

-- ============================================================
-- MIGRATION 13: RLS PRODUCTION HARDENING
-- ============================================================

-- 1. PROFILE UPDATE POLICY
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING ( auth.uid() = user_id )
WITH CHECK ( auth.uid() = user_id );

-- 2. PROFILE SELECT POLICY
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING ( auth.uid() = user_id );

-- 3. STORAGE BUCKET POLICIES (Avatars)
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

-- ============================================================
-- MIGRATION 14: SCHEMA ALIGNMENT — FRONTEND PAYLOAD SYNCHRONIZATION
-- ============================================================

-- 1. Add missing frontend payload columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS mother_tongue text,
ADD COLUMN IF NOT EXISTS occupation text,
ADD COLUMN IF NOT EXISTS annual_income text,
ADD COLUMN IF NOT EXISTS address text;

-- 2. Migrate existing redundant data (e.g. mapping income_rs to annual_income)
UPDATE public.profiles
SET 
  annual_income = COALESCE(annual_income, income_rs),
  occupation = COALESCE(occupation, profession),
  address = COALESCE(address, current_address)
WHERE income_rs IS NOT NULL OR profession IS NOT NULL OR current_address IS NOT NULL;

-- 3. Update view to use new normalized columns
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
    p.mother_tongue,
    p.city,
    p.state,
    p.current_address,
    p.address,
    p.education,
    p.profession,
    p.occupation,
    p.time_of_birth,
    p.place_of_birth,
    p.income_rs,
    p.annual_income,
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

-- Update admin_add_profile to use new normalized columns
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

-- DROP OLD REDUNDANT COLUMNS
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS photo_url,
DROP COLUMN IF EXISTS dob;

ALTER TABLE public.users 
DROP COLUMN IF EXISTS phone;

-- ============================================================
-- MIGRATION 15: FIX RPC GET_PROFILE_WITH_CONTACT
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_profile_with_contact(p_profile_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_caller_id uuid := auth.uid();
    v_profile record;
    v_is_admin boolean := false;
    v_has_accepted_interest boolean := false;
    v_email text;
    v_phone text;
BEGIN
    -- 1. Get the profile and user info
    SELECT p.*, u.email, u.phone_number INTO v_profile
    FROM public.profiles p
    LEFT JOIN public.users u ON p.user_id = u.id
    WHERE p.id = p_profile_id AND p.is_approved = true;

    IF v_profile IS NULL THEN
        RAISE EXCEPTION 'Profile not found or not approved';
    END IF;

    -- 2. Check if caller is admin
    IF v_caller_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = v_caller_id AND (is_admin = true OR role IN ('admin', 'super_admin'))
        ) INTO v_is_admin;
    END IF;

    -- 3. Check if there is an accepted interest using public.interests
    IF v_caller_id IS NOT NULL AND v_caller_id != v_profile.user_id AND NOT v_is_admin THEN
        SELECT EXISTS (
            SELECT 1 FROM public.interests i
            WHERE 
                ((i.from_user_id = v_caller_id AND i.to_user_id = v_profile.user_id) 
                 OR (i.from_user_id = v_profile.user_id AND i.to_user_id = v_caller_id))
                AND i.status = 'accepted'
        ) INTO v_has_accepted_interest;
    END IF;

    -- 4. Set contact info depending on permissions
    IF v_is_admin OR v_has_accepted_interest OR v_caller_id = v_profile.user_id THEN
        v_email := v_profile.email;
        v_phone := v_profile.phone_number;
    ELSE
        v_email := NULL;
        v_phone := NULL;
    END IF;

    -- Return JSON combining safe profile data and conditional contact info
    RETURN (
        SELECT json_build_object(
            'id', v_profile.id,
            'user_id', v_profile.user_id,
            'full_name', v_profile.full_name,
            'gender', v_profile.gender,
            'date_of_birth', v_profile.date_of_birth,
            'age', v_profile.age,
            'height', v_profile.height,
            'religion', v_profile.religion,
            'caste', v_profile.caste,
            'sub_caste', v_profile.sub_caste,
            'city', v_profile.city,
            'state', v_profile.state,
            'current_address', v_profile.current_address,
            'address', v_profile.address,
            'education', v_profile.education,
            'profession', v_profile.profession,
            'occupation', v_profile.occupation,
            'time_of_birth', v_profile.time_of_birth,
            'place_of_birth', v_profile.place_of_birth,
            'income_rs', v_profile.income_rs,
            'annual_income', v_profile.annual_income,
            'fathers_occupation', v_profile.fathers_occupation,
            'mothers_occupation', v_profile.mothers_occupation,
            'brothers', v_profile.brothers,
            'sisters', v_profile.sisters,
            'marital_status', v_profile.marital_status,
            'bio', v_profile.bio,
            'user_display_id', v_profile.user_display_id,
            'is_approved', v_profile.is_approved,
            'verification_status', v_profile.verification_status,
            'is_verified', v_profile.is_verified,
            'avatar_url', v_profile.avatar_url,
            'phone_number', v_profile.phone_number,
            'created_at', v_profile.created_at,
            'profile_completed', v_profile.profile_completed,
            'email', v_email,
            'phone_number', v_phone
        )
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_profile_with_contact(uuid) TO authenticated;

COMMIT;
