
-- ============================================================
-- ADMIN MANAGEMENT EXTENSIONS
-- ============================================================

-- 1. Add columns for soft deletes and roles if not exists
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin'));

-- 1.1 Add missing profile fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS time_of_birth text,
ADD COLUMN IF NOT EXISTS place_of_birth text,
ADD COLUMN IF NOT EXISTS sub_caste text,
ADD COLUMN IF NOT EXISTS income_rs text,
ADD COLUMN IF NOT EXISTS fathers_occupation text,
ADD COLUMN IF NOT EXISTS mothers_occupation text,
ADD COLUMN IF NOT EXISTS brothers text,
ADD COLUMN IF NOT EXISTS sisters text,
ADD COLUMN IF NOT EXISTS current_address text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS avatar_url text;

-- 1.2 and 1.3 Photo URL sync triggers removed during schema normalization.

-- 2. Audit Logs Table (Refined to reference auth.users for stability)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id uuid REFERENCES auth.users(id),
    action text NOT NULL,
    target_id uuid,
    details jsonb,
    created_at timestamptz DEFAULT now()
);

-- 3. Secure Admin RPC: Soft Delete User
CREATE OR REPLACE FUNCTION admin_delete_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if caller is admin OR super admin email
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

-- 4. Secure Admin RPC: Hard Delete User (DANGER)
CREATE OR REPLACE FUNCTION admin_hard_delete_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if caller is admin OR super admin email
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND (is_admin = true OR role IN ('admin', 'super_admin'))) 
    AND (SELECT auth.jwt()->>'email') != 'bhartiyarishte03@gmail.com' THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can delete users.';
    END IF;

    -- Delete from profiles first (linked to auth.users in some setups, or public.users)
    DELETE FROM public.profiles WHERE user_id = p_user_id;
    
    -- Delete from public.users
    DELETE FROM public.users WHERE id = p_user_id;

    INSERT INTO public.audit_logs (admin_id, action, target_id)
    VALUES ((SELECT auth.uid()), 'HARD_DELETE_USER', p_user_id);
END;
$$;

-- 5. Secure Admin RPC: Restore User
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

-- 5. Secure Admin RPC: Update Role
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

-- 6. Secure Admin RPC: Add Full Profile (with Photos support)
-- Accepts user_photos text[] to insert photos and set avatar_url on the profile
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
  -- Authorization Check: Allow if admin role exists OR if email is the Super Admin
  IF NOT EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = (SELECT auth.uid()) 
      AND (is_admin = true OR role IN ('admin', 'super_admin'))
  ) AND (SELECT auth.jwt()->>'email') != 'bhartiyarishte03@gmail.com' THEN
      RAISE EXCEPTION 'Unauthorized.';
  END IF;

  -- Generate ID beforehand to avoid RETURNING issues and null constraint violations
  auth_user_id := extensions.gen_random_uuid();

  -- Create Auth User
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

  -- Update public.users (Trigger handle_new_user already inserted the initial row)
  UPDATE public.users 
  SET 
    is_admin = (user_role IN ('admin', 'super_admin')),
    role = user_role
  WHERE id = auth_user_id;

  -- Get the first photo URL for profile avatar_url
  IF array_length(user_photos, 1) > 0 THEN
    avatar_url_val := user_photos[1];
  ELSE
    avatar_url_val := NULL;
  END IF;

  -- Update public.profiles (Trigger handle_new_user already inserted the initial row)
  UPDATE public.profiles
  SET 
    full_name = user_name,
    is_approved = true,
    is_verified = true,
    is_admin = (user_role IN ('admin', 'super_admin')),
    avatar_url = avatar_url_val
  WHERE user_id = auth_user_id;

  -- Insert photos into photos table
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
-- 7. AUTO-CREATE PROFILE ON SIGNUP (TRIGGER)
-- ============================================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into public.users
  INSERT INTO public.users (id, email, role, is_admin)
  VALUES (
    new.id,
    new.email,
    'user',
    false
  ) ON CONFLICT (id) DO NOTHING;

  -- Insert into public.profiles
  INSERT INTO public.profiles (id, user_id, full_name, is_approved, is_verified)
  VALUES (
    new.id,
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', substring(new.email from '(.*)@')),
    false, -- Require admin approval
    false
  ) ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Trigger to run on every signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

