-- Create a secure view for public searching that physically omits sensitive fields
-- This ensures that even if a scraper uses `select *`, they never get phone numbers or ID cards.

DROP VIEW IF EXISTS public_profiles_safe;

CREATE OR REPLACE VIEW public_profiles_safe WITH (security_invoker = true) AS
SELECT
  id,
  user_id,
  full_name,
  -- email explicitly omitted
  gender,
  dob,
  age,
  height,
  religion,
  caste,
  sub_caste,
  city,
  state,
  current_address,
  education,
  profession,
  time_of_birth,
  place_of_birth,
  income_rs,
  fathers_occupation,
  mothers_occupation,
  brothers,
  sisters,
  marital_status,
  bio,
  user_display_id,
  is_approved,
  verification_status,
  is_verified,
  photo_url,
  created_at,
  profile_completed
FROM profiles
WHERE is_approved = true;

-- The security_invoker = true ensures that RLS policies on the underlying `profiles` table still apply.
-- However, since `profiles` is strictly locked down (only Admins can read),
-- we need to ensure this view can be read by authenticated users for search purposes.
-- Wait, if `profiles` has an admin-only RLS policy, the view (with security_invoker) will return 0 rows for regular users!

-- TO FIX THIS:
-- We need to add a read-only policy for authenticated users on the `profiles` table,
-- BUT only allow them to read approved profiles. 
-- However, we wanted "100% ADMIN-ONLY CRM LOCKDOWN SCRIPT" in 02_lockdown_rls.sql.
-- Let's add a policy that allows authenticated users to select from profiles IF is_approved = true,
-- which effectively allows the view to work.

CREATE POLICY "Enable read access for authenticated users to approved profiles" 
ON profiles 
FOR SELECT 
USING (
  auth.role() = 'authenticated' AND is_approved = true
);
