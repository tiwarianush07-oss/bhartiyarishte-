-- Fix for public_profiles_safe view security
-- This recreates the view with SECURITY INVOKER true
-- which ensures RLS policies apply correctly based on the calling user rather than the view owner.

-- Drop the existing view
DROP VIEW IF EXISTS public_profiles_safe;

-- Recreate with security_invoker
CREATE OR REPLACE VIEW public_profiles_safe WITH (security_invoker = true) AS
SELECT 
  id, 
  full_name, 
  EXTRACT(YEAR FROM age(dob)) as age,
  gender, 
  religion, 
  city, 
  profession,
  (SELECT url FROM photos WHERE photos.user_id = profiles.user_id AND is_primary = true LIMIT 1) as primary_photo
FROM public.profiles
WHERE is_approved = true;

-- Re-grant access to public roles
GRANT SELECT ON public_profiles_safe TO anon, authenticated;
