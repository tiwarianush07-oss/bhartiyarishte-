-- ============================================================
-- SECURE PROFILE FETCH RPC
-- Returns profile data with contact fields ONLY if:
--   1. The caller has an accepted interest with the profile owner, OR
--   2. The caller IS the profile owner
-- Otherwise, phone/email are stripped at the database level.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_profile_with_contact(p_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  has_accepted_interest boolean;
  profile_result jsonb;
  target_user_id uuid;
BEGIN
  -- Get the user_id of the target profile
  SELECT user_id INTO target_user_id
  FROM public.profiles WHERE id = p_profile_id;

  IF target_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Check if current user has an accepted interest with this profile's owner
  SELECT EXISTS (
    SELECT 1 FROM public.interests
    WHERE (
      (sender_id = auth.uid() AND receiver_id = target_user_id)
      OR
      (receiver_id = auth.uid() AND sender_id = target_user_id)
    )
    AND status = 'accepted'
  ) INTO has_accepted_interest;

  IF has_accepted_interest OR target_user_id = auth.uid() THEN
    -- Full profile including contact fields
    SELECT to_jsonb(p) INTO profile_result FROM public.profiles p WHERE id = p_profile_id;
  ELSE
    -- Profile WITHOUT sensitive contact fields (phone, email stripped)
    SELECT to_jsonb(sub) INTO profile_result FROM (
      SELECT id, user_id, full_name, date_of_birth, gender, religion, caste, sub_caste,
             city, state, height, education, profession, annual_income, marital_status,
             bio, is_approved, verification_status, is_verified, user_display_id, avatar_url,
             time_of_birth, place_of_birth, fathers_occupation, mothers_occupation,
             brothers, sisters, address, created_at
      FROM public.profiles WHERE id = p_profile_id
    ) sub;
  END IF;

  RETURN profile_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_profile_with_contact(uuid) TO authenticated;
