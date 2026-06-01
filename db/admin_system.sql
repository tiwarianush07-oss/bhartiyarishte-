-- ============================================================
-- ADMIN USER SYSTEM & RLS OPTIMIZATION
-- ============================================================

-- 1. DATABASE UPDATES
-- Add is_admin to profiles if it doesn't exist (as requested)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Ensure photos table exists with correct structure
CREATE TABLE IF NOT EXISTS public.photos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    url text NOT NULL, -- Changed from image_url to match frontend
    is_primary boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- 2. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON public.photos(user_id);

-- 3. HELPER FUNCTION (OPTIMIZED)
-- Using (SELECT auth.uid()) as requested for better RLS performance
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS boolean AS $$
BEGIN
    -- Super Admin Email Bypass
    IF (SELECT auth.jwt()->>'email') = 'bhartiyarishte03@gmail.com' THEN
        RETURN true;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = (SELECT auth.uid()) 
        AND (is_admin = true OR role = 'admin' OR role = 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 4. ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- 5. PROFILES POLICIES
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT TO authenticated
USING (
    (user_id = (SELECT auth.uid())) OR 
    (public.check_is_admin()) OR
    (is_approved = true) -- Allow viewing other approved profiles
);

DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE TO authenticated
USING (
    (user_id = (SELECT auth.uid())) OR 
    (public.check_is_admin())
)
WITH CHECK (
    (user_id = (SELECT auth.uid())) OR 
    (public.check_is_admin())
);

DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
CREATE POLICY "profiles_delete_policy" ON public.profiles
FOR DELETE TO authenticated
USING (
    (user_id = (SELECT auth.uid())) OR 
    (public.check_is_admin())
);

-- 6. PHOTOS POLICIES
DROP POLICY IF EXISTS "photos_select_policy" ON public.photos;
CREATE POLICY "photos_select_policy" ON public.photos
FOR SELECT TO authenticated
USING (
    (user_id = (SELECT auth.uid())) OR 
    (public.check_is_admin()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = photos.user_id AND is_approved = true)
);

DROP POLICY IF EXISTS "photos_insert_policy" ON public.photos;
CREATE POLICY "photos_insert_policy" ON public.photos
FOR INSERT TO authenticated
WITH CHECK (
    (user_id = (SELECT auth.uid())) OR 
    (public.check_is_admin())
);

DROP POLICY IF EXISTS "photos_update_policy" ON public.photos;
CREATE POLICY "photos_update_policy" ON public.photos
FOR UPDATE TO authenticated
USING (
    (user_id = (SELECT auth.uid())) OR 
    (public.check_is_admin())
);

DROP POLICY IF EXISTS "photos_delete_policy" ON public.photos;
CREATE POLICY "photos_delete_policy" ON public.photos
FOR DELETE TO authenticated
USING (
    (user_id = (SELECT auth.uid())) OR 
    (public.check_is_admin())
);

-- 7. UTILITY: SET ADMIN ROLE
-- Usage: SELECT set_user_as_admin('user-uuid-here');
CREATE OR REPLACE FUNCTION public.set_user_as_admin(target_user_id uuid)
RETURNS void AS $$
BEGIN
    -- Update profiles table
    UPDATE public.profiles 
    SET is_admin = true 
    WHERE user_id = target_user_id;

    -- Update users table (Source of Truth for RLS)
    UPDATE public.users
    SET is_admin = true, role = 'admin'
    WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
