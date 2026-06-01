-- Fix the RPC get_profile_with_contact that was incorrectly querying "user_interests" instead of "interests".

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
    SELECT p.* INTO v_profile
    FROM public.profiles p
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
                ((i.sender_id = v_caller_id AND i.receiver_id = v_profile.user_id) 
                 OR (i.sender_id = v_profile.user_id AND i.receiver_id = v_caller_id))
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
            'photo_url', v_profile.avatar_url,
            'created_at', v_profile.created_at,
            'profile_completed', v_profile.profile_completed,
            'email', v_email,
            'phone_number', v_phone
        )
    );
END;
$$;
