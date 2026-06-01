-- ==========================================
-- PHASE 6: SECURITY HARDENING & SOFT-DELETE
-- ==========================================
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. PROFILES: Strict RLS - Owner OR Admin only
-- ============================================
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profile owners can update" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Re-create a single, clean UPDATE policy
CREATE POLICY "profiles_update_owner_or_admin"
ON public.profiles FOR UPDATE
TO authenticated
USING (
    auth.uid() = user_id
    OR EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.is_admin = true
    )
)
WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.is_admin = true
    )
);

-- Ensure SELECT is open to authenticated users for approved profiles
DROP POLICY IF EXISTS "Public profiles are viewable by all" ON public.profiles;
CREATE POLICY "profiles_select_approved"
ON public.profiles FOR SELECT
TO authenticated
USING (is_approved = true OR auth.uid() = user_id);

-- ============================================
-- 2. USER_INTERESTS: Lock sender_id to auth.uid()
-- ============================================
DROP POLICY IF EXISTS "Users can create interests" ON public.interests;
DROP POLICY IF EXISTS "Authenticated users can create interests" ON public.interests;

CREATE POLICY "interests_insert_sender_only"
ON public.interests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- Users can only read their own interests (as sender or receiver)
DROP POLICY IF EXISTS "Users can view interests" ON public.interests;
CREATE POLICY "interests_select_participants_only"
ON public.interests FOR SELECT
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Only receiver can accept/reject
DROP POLICY IF EXISTS "Users can update interests" ON public.interests;
CREATE POLICY "interests_update_receiver_only"
ON public.interests FOR UPDATE
TO authenticated
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

-- ============================================
-- 3. PHONE NUMBER PRIVACY: Hide phone unless connection is 'accepted'
-- A DB function that returns phone only when an accepted connection exists
-- ============================================
CREATE OR REPLACE FUNCTION get_contact_if_connected(target_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    phone_val TEXT;
    connected BOOLEAN;
BEGIN
    -- Check if there is an accepted interest between caller and target
    SELECT EXISTS (
        SELECT 1 FROM public.interests
        WHERE status = 'accepted'
        AND (
            (sender_id = auth.uid() AND receiver_id = target_user_id)
            OR
            (receiver_id = auth.uid() AND sender_id = target_user_id)
        )
    ) INTO connected;

    IF connected THEN
        SELECT phone INTO phone_val
        FROM public.users
        WHERE id = target_user_id;
        RETURN phone_val;
    ELSE
        RETURN NULL;  -- Returns NULL if not connected
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. SOFT DELETE: Add is_active column + RPC
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Soft-delete RPC: Admins or Owner can call this
CREATE OR REPLACE FUNCTION soft_delete_profile(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Security: only owner or admin can soft-delete
    IF auth.uid() != target_user_id THEN
        -- Check admin
        IF NOT EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.is_admin = true
        ) THEN
            RAISE EXCEPTION 'Unauthorized: Only owner or admin can delete this profile';
        END IF;
    END IF;

    UPDATE public.profiles
    SET is_active = false, updated_at = NOW()
    WHERE user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update SELECT policy to exclude soft-deleted profiles for public viewers
-- (Admins bypass is_active filter by checking their own admin policy)
DROP POLICY IF EXISTS "profiles_select_approved" ON public.profiles;
CREATE POLICY "profiles_select_approved_and_active"
ON public.profiles FOR SELECT
TO authenticated
USING (
    (is_approved = true AND is_active = true)
    OR auth.uid() = user_id  -- Owner always sees own profile
    OR EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.is_admin = true
    )
);

-- Create index on is_active for performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_approved_active ON public.profiles(is_approved, is_active);
