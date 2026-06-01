-- ==========================================
-- BHARATIYA RISHTEY: MOCK MATCH DATA SEEDER
-- ==========================================
-- Execute inside Supabase SQL Editor
-- This generates 10 dummy profiles to accurately test the Matching Algorithm's boundaries.

-- Clean up any existing dummy accounts first to prevent overlap
DELETE FROM auth.users WHERE email LIKE 'dummy%@test.com';

DO $$
DECLARE
    dummy_auth_uid UUID;
    i INT;
    names TEXT[] := ARRAY['Aarav Sharma', 'Priya Patel', 'Vihaan Gupta', 'Ananya Singh', 'Rahul Verma', 'Sneha Reddy', 'Aditya Joshi', 'Riya Desai', 'Karan Nair', 'Nisha Mehra'];
    dobs TEXT[] := ARRAY['1995-05-12', '1998-08-22', '1990-11-03', '1997-01-15', '1992-06-30', '1996-09-18', '1993-04-05', '1999-12-08', '1991-02-14', '1994-07-25'];
    genders TEXT[] := ARRAY['Male', 'Female', 'Male', 'Female', 'Male', 'Female', 'Male', 'Female', 'Male', 'Female'];
    religions TEXT[] := ARRAY['Hindu', 'Hindu', 'Jain', 'Hindu', 'Sikh', 'Hindu', 'Hindu', 'Hindu', 'Hindu', 'Muslim'];
    castes TEXT[] := ARRAY['Brahmin', 'Patel', 'Bania', 'Rajput', 'Jat', 'Reddy', 'Brahmin', 'Desai', 'Nair', 'Syed'];
    cities TEXT[] := ARRAY['Mumbai', 'Ahmedabad', 'Delhi', 'Jaipur', 'Chandigarh', 'Hyderabad', 'Pune', 'Surat', 'Kochi', 'Lucknow'];
    educations TEXT[] := ARRAY['Post Graduate', 'Graduate', 'Graduate', 'Post Graduate', 'Graduate', 'Doctorate', 'Post Graduate', 'Graduate', 'Graduate', 'Post Graduate'];
    professions TEXT[] := ARRAY['Software Engineer', 'Marketing Manager', 'Business Analyst', 'Doctor', 'Entrepreneur', 'Professor', 'Architect', 'Fashion Designer', 'Data Scientist', 'Lawyer'];
    heights TEXT[] := ARRAY['5''10"', '5''4"', '6''0"', '5''5"', '5''11"', '5''3"', '5''9"', '5''2"', '6''1"', '5''6"'];
BEGIN
    FOR i IN 1..10 LOOP
        -- 1. Create Mock Auth User
        dummy_auth_uid := gen_random_uuid();
        
        INSERT INTO auth.users (
            id, email, encrypted_password, email_confirmed_at, role
        ) VALUES (
            dummy_auth_uid, 
            'dummy' || i || '@test.com', 
            crypt('password123', gen_salt('bf')),
            now(),
            'authenticated'
        );

        -- 2. Create Profile Data (Auto verified to test Top Picks properly!)
        INSERT INTO public.profiles (
            user_id, full_name, dob, gender, religion, caste, city, state, country, 
            education, profession, income_rs, height, marital_status, 
            is_approved, verification_status, profile_completed
        ) VALUES (
            dummy_auth_uid,
            names[i], dobs[i], genders[i], religions[i], castes[i], cities[i], 'Test State', 'India',
            educations[i], professions[i], (i * 500000), heights[i], 'Never Married',
            true, 'verified', true
        );

        -- 3. Mock Partner Preferences for them
        INSERT INTO public.partner_preferences (
            user_id, min_age, max_age, min_height, max_height, religions, castes, educations, marital_statuses
        ) VALUES (
            dummy_auth_uid, 22, 35, '5''0"', '6''2"', ARRAY['Hindu', 'Doesn''t Matter'], ARRAY[]::TEXT[], ARRAY['Graduate', 'Post Graduate'], ARRAY['Never Married']
        );

        -- 4. Inject a generic Mock Photo
        INSERT INTO public.photos (
            user_id, url, is_primary
        ) VALUES (
            dummy_auth_uid,
            'https://i.pravatar.cc/600?u=' || dummy_auth_uid,
            true
        );

    END LOOP;
END $$;
