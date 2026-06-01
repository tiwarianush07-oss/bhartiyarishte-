-- ============================================================
-- PHASE 14: SCHEMA ALIGNMENT — FRONTEND PAYLOAD SYNCHRONIZATION
-- Run in Supabase SQL Editor.
-- This aligns the DB schema with the types.ts Profile interface.
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

-- 3. Update the view to include these new columns so they return in SELECTs
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
    p.mother_tongue, -- [NEW]
    p.city,
    p.state,
    p.current_address,
    p.address, -- [NEW]
    p.education,
    p.profession,
    p.occupation, -- [NEW]
    p.time_of_birth,
    p.place_of_birth,
    p.income_rs,
    p.annual_income, -- [NEW]
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
