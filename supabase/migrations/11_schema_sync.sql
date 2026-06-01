-- ============================================================
-- PHASE 11: SCHEMA SYNC — RECOVERY & STABILIZATION
-- Run in Supabase SQL Editor with service_role key.
-- This migration is IDEMPOTENT — safe to run multiple times.
-- ============================================================

-- ============================================================
-- 1. CREATE MISSING TABLES
-- ============================================================

-- 1a. partner_preferences
CREATE TABLE IF NOT EXISTS public.partner_preferences (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    min_age integer DEFAULT 21,
    max_age integer DEFAULT 35,
    min_height text DEFAULT '5''0"',
    max_height text DEFAULT '6''2"',
    marital_statuses text[] DEFAULT ARRAY['Never Married'],
    religions text[] DEFAULT '{}',
    castes text[] DEFAULT '{}',
    educations text[] DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT unique_partner_preferences_user UNIQUE (user_id)
);

-- 1b. profile_boosts
CREATE TABLE IF NOT EXISTS public.profile_boosts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    boost_type text DEFAULT 'standard' CHECK (boost_type IN ('standard', 'premium', 'spotlight')),
    started_at timestamptz DEFAULT now(),
    expires_at timestamptz DEFAULT (now() + interval '24 hours'),
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- 1c. shortlists
CREATE TABLE IF NOT EXISTS public.shortlists (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    from_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    to_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT unique_shortlist UNIQUE (from_user_id, to_user_id)
);

-- 1d. success_stories
CREATE TABLE IF NOT EXISTS public.success_stories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_names text NOT NULL,
    story text NOT NULL,
    photo_url text,
    is_published boolean DEFAULT false,
    wedding_date date,
    created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 2. ADD MISSING COLUMNS
-- ============================================================

-- 2a. profiles.photo_url — needed by sync trigger and admin_add_profile
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS photo_url text;

-- 2b. users.is_premium — referenced by send_chat_message and AuthContext
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false;

-- 2c. users.phone — referenced by seed.sql and AuthContext fallback
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone text;

-- ============================================================
-- 3. ENABLE RLS ON NEW TABLES
-- ============================================================

ALTER TABLE public.partner_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shortlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;

-- partner_preferences: users can manage their own
DROP POLICY IF EXISTS "Users manage own preferences" ON public.partner_preferences;
CREATE POLICY "Users manage own preferences" ON public.partner_preferences
FOR ALL TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- profile_boosts: users can read their own, insert their own
DROP POLICY IF EXISTS "Users manage own boosts" ON public.profile_boosts;
CREATE POLICY "Users manage own boosts" ON public.profile_boosts
FOR ALL TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- shortlists: users can manage their own shortlists
DROP POLICY IF EXISTS "Users manage own shortlists" ON public.shortlists;
CREATE POLICY "Users manage own shortlists" ON public.shortlists
FOR ALL TO authenticated
USING (from_user_id = (SELECT auth.uid()))
WITH CHECK (from_user_id = (SELECT auth.uid()));

-- shortlists: users can see if they were shortlisted (read-only)
DROP POLICY IF EXISTS "Users can see shortlists targeting them" ON public.shortlists;
CREATE POLICY "Users can see shortlists targeting them" ON public.shortlists
FOR SELECT TO authenticated
USING (to_user_id = (SELECT auth.uid()));

-- success_stories: everyone can read published stories
DROP POLICY IF EXISTS "Anyone can read published stories" ON public.success_stories;
CREATE POLICY "Anyone can read published stories" ON public.success_stories
FOR SELECT TO authenticated
USING (is_published = true);

-- success_stories: admins can manage all stories
DROP POLICY IF EXISTS "Admins manage stories" ON public.success_stories;
CREATE POLICY "Admins manage stories" ON public.success_stories
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = (SELECT auth.uid())
        AND (is_admin = true OR role IN ('admin', 'super_admin'))
    )
);

-- ============================================================
-- 4. RECREATE public_profiles_safe VIEW
-- Adds all 19 columns the frontend selects + user_id for neq filter
-- ============================================================

DROP VIEW IF EXISTS public_profiles_safe;

CREATE OR REPLACE VIEW public_profiles_safe WITH (security_invoker = true) AS
SELECT
    p.id,
    p.user_id,
    p.full_name,
    p.gender,
    p.dob,
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
    p.photo_url,
    p.created_at,
    p.profile_completed
FROM public.profiles p
WHERE p.is_approved = true;

-- Ensure read policy exists for authenticated users on approved profiles
-- (The view uses security_invoker, so RLS on profiles table applies)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'profiles'
        AND policyname = 'Enable read access for authenticated users to approved profiles'
    ) THEN
        CREATE POLICY "Enable read access for authenticated users to approved profiles"
        ON public.profiles
        FOR SELECT
        USING (auth.role() = 'authenticated' AND is_approved = true);
    END IF;
END $$;

-- ============================================================
-- 5. CREATE / UPDATE RPC FUNCTIONS
-- ============================================================

-- 5a. get_user_conversations_v2
CREATE OR REPLACE FUNCTION get_user_conversations_v2(p_user_id uuid)
RETURNS TABLE(
    id uuid,
    other_participant json,
    last_message json,
    unread_count bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
WITH user_convos AS (
    SELECT cp.conversation_id
    FROM chat_participants cp
    WHERE cp.user_id = p_user_id
),
last_messages AS (
    SELECT
        cm.conversation_id,
        cm.id,
        cm.sender_id,
        cm.content,
        cm.created_at,
        cm.deleted_for_sender,
        cm.deleted_for_receiver,
        ROW_NUMBER() OVER(PARTITION BY cm.conversation_id ORDER BY cm.created_at DESC) as rn
    FROM chat_messages cm
    WHERE cm.conversation_id IN (SELECT conversation_id FROM user_convos)
),
unread_counts AS (
    SELECT
        cm.conversation_id,
        count(*) as unreads
    FROM chat_messages cm
    JOIN chat_participants cp ON cm.conversation_id = cp.conversation_id AND cp.user_id = p_user_id
    WHERE 
      cm.conversation_id IN (SELECT conversation_id FROM user_convos)
      AND cm.sender_id != p_user_id
      AND (cp.last_read_at IS NULL OR cm.created_at > cp.last_read_at)
    GROUP BY cm.conversation_id
)
SELECT
    uc.conversation_id AS id,
    (SELECT row_to_json(p.*) FROM profiles p WHERE p.user_id = op.user_id) AS other_participant,
    (SELECT row_to_json(lm.*) FROM last_messages lm WHERE lm.conversation_id = uc.conversation_id AND lm.rn = 1) AS last_message,
    COALESCE(ucnt.unreads, 0) as unread_count
FROM user_convos uc
JOIN chat_participants op ON uc.conversation_id = op.conversation_id AND op.user_id != p_user_id
LEFT JOIN unread_counts ucnt ON uc.conversation_id = ucnt.conversation_id;
$$;

-- 5b. send_chat_message
-- Uses interests table with sender_id/receiver_id columns (which have FKs to profiles)
-- Also checks profiles.plan_type for premium access
CREATE OR REPLACE FUNCTION send_chat_message(p_receiver_id uuid, p_content text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sender_id uuid := auth.uid();
    v_conversation_id uuid;
    v_is_blocked boolean;
    v_can_chat boolean;
    v_new_message chat_messages;
BEGIN
    -- Block check
    SELECT EXISTS (
        SELECT 1 FROM user_blocks WHERE blocker_id = p_receiver_id AND blocked_id = v_sender_id
    ) INTO v_is_blocked;
    IF v_is_blocked THEN
        RAISE EXCEPTION 'You are blocked by this user.';
    END IF;

    -- Chat eligibility: premium/elite plan OR mutual accepted interest
    SELECT EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.user_id = v_sender_id AND p.plan_type IN ('premium', 'elite')
    ) OR EXISTS (
        SELECT 1 FROM public.interests i
        WHERE 
            ((i.sender_id = v_sender_id AND i.receiver_id = p_receiver_id) 
             OR (i.sender_id = p_receiver_id AND i.receiver_id = v_sender_id))
            AND i.status = 'accepted'
    ) INTO v_can_chat;

    IF NOT v_can_chat THEN
        RAISE EXCEPTION 'You must have a mutual interest or a premium plan to chat.';
    END IF;

    -- Find or create conversation
    SELECT cp1.conversation_id INTO v_conversation_id
    FROM chat_participants cp1
    JOIN chat_participants cp2 ON cp1.conversation_id = cp2.conversation_id
    WHERE cp1.user_id = v_sender_id AND cp2.user_id = p_receiver_id;

    IF v_conversation_id IS NULL THEN
        INSERT INTO chat_conversations DEFAULT VALUES RETURNING id INTO v_conversation_id;
        INSERT INTO chat_participants (conversation_id, user_id) VALUES (v_conversation_id, v_sender_id);
        INSERT INTO chat_participants (conversation_id, user_id) VALUES (v_conversation_id, p_receiver_id);
    END IF;

    -- Insert the message
    INSERT INTO chat_messages (conversation_id, sender_id, content)
    VALUES (v_conversation_id, v_sender_id, p_content)
    RETURNING * INTO v_new_message;
    
    RETURN row_to_json(v_new_message);
END;
$$;

-- 5c. admin_delete_user (Soft Delete)
CREATE OR REPLACE FUNCTION admin_delete_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND (is_admin = true OR role IN ('admin', 'super_admin'))) 
    AND (SELECT auth.jwt()->>'email') != 'bhartiyarishte03@gmail.com' THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can delete users.';
    END IF;

    UPDATE public.users 
    SET deleted_at = now(), is_suspended = true 
    WHERE id = p_user_id;

    INSERT INTO public.audit_logs (admin_id, action, target_id)
    VALUES ((SELECT auth.uid()), 'DELETE_USER', p_user_id);
END;
$$;

-- 5d. admin_hard_delete_user
CREATE OR REPLACE FUNCTION admin_hard_delete_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND (is_admin = true OR role IN ('admin', 'super_admin'))) 
    AND (SELECT auth.jwt()->>'email') != 'bhartiyarishte03@gmail.com' THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can delete users.';
    END IF;

    DELETE FROM public.profiles WHERE user_id = p_user_id;
    DELETE FROM public.users WHERE id = p_user_id;

    INSERT INTO public.audit_logs (admin_id, action, target_id)
    VALUES ((SELECT auth.uid()), 'HARD_DELETE_USER', p_user_id);
END;
$$;

-- 5e. admin_restore_user
CREATE OR REPLACE FUNCTION admin_restore_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND (is_admin = true OR role IN ('admin', 'super_admin'))) 
    AND (SELECT auth.jwt()->>'email') != 'bhartiyarishte03@gmail.com' THEN
        RAISE EXCEPTION 'Unauthorized.';
    END IF;

    UPDATE public.users 
    SET deleted_at = NULL, is_suspended = false 
    WHERE id = p_user_id;

    INSERT INTO public.audit_logs (admin_id, action, target_id)
    VALUES ((SELECT auth.uid()), 'RESTORE_USER', p_user_id);
END;
$$;

-- 5f. admin_update_role
CREATE OR REPLACE FUNCTION admin_update_role(p_user_id uuid, p_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND (is_admin = true OR role IN ('admin', 'super_admin'))) 
    AND (SELECT auth.jwt()->>'email') != 'bhartiyarishte03@gmail.com' THEN
        RAISE EXCEPTION 'Unauthorized.';
    END IF;

    UPDATE public.users 
    SET 
        role = p_role,
        is_admin = (p_role IN ('admin', 'super_admin'))
    WHERE id = p_user_id;

    UPDATE public.profiles
    SET is_admin = (p_role IN ('admin', 'super_admin'))
    WHERE user_id = p_user_id;

    INSERT INTO public.audit_logs (admin_id, action, target_id, details)
    VALUES ((SELECT auth.uid()), 'UPDATE_ROLE', p_user_id, jsonb_build_object('new_role', p_role));
END;
$$;

-- 5g. admin_add_profile (without user_phone — frontend no longer sends it)
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
  photo_url_val text;
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
    photo_url_val := user_photos[1];
  ELSE
    photo_url_val := NULL;
  END IF;

  UPDATE public.profiles
  SET 
    full_name = user_name,
    is_approved = true,
    is_verified = true,
    is_admin = (user_role IN ('admin', 'super_admin')),
    photo_url = photo_url_val
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

-- ============================================================
-- 6. TRIGGERS (idempotent)
-- ============================================================

-- 6a. handle_new_user trigger (create if not exists)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role, is_admin)
  VALUES (
    new.id,
    new.email,
    'user',
    false
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (id, user_id, full_name, is_approved, is_verified)
  VALUES (
    new.id,
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', substring(new.email from '(.*)@')),
    false,
    false
  ) ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6b. sync_profile_photo_urls trigger (photo_url ↔ avatar_url sync)
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

DROP TRIGGER IF EXISTS sync_profile_photos_trigger ON public.profiles;
CREATE TRIGGER sync_profile_photos_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_photo_urls();

-- ============================================================
-- 7. STORAGE BUCKETS (idempotent, requires service_role)
-- ============================================================
-- NOTE: Storage bucket creation via SQL is limited.
-- Run these via the Supabase Dashboard → Storage → New Bucket:
--   1. "avatars" — public bucket for profile photos
--   2. "profile_photos" — public bucket for gallery photos
-- Or use the Supabase Management API.

-- ============================================================
-- DONE — Migration 11 Complete
-- ============================================================
