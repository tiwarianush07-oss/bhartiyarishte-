-- ============================================================
-- PHASE 7: FINAL PRODUCTION HARDENING
-- Run this in Supabase SQL Editor AFTER all prior migrations.
-- ============================================================

-- ============================================================
-- 1. PHONE PRIVACY: Column-Level Access Control
-- The users table SELECT is already admin-only from 02_lockdown_rls.sql.
-- This adds an extra wire-level defense by revoking SELECT on the
-- `phone` column from the `authenticated` role entirely.
-- Phone is only accessible via get_contact_if_connected() RPC.
-- ============================================================
DO $$
BEGIN
    -- Revoke column-level access to phone for authenticated role
    -- (Only service_role / admins via RPC can read it)
    REVOKE SELECT (phone) ON public.users FROM authenticated;
EXCEPTION
    WHEN undefined_column THEN
        RAISE NOTICE 'Column phone does not exist on users table, skipping revoke.';
    WHEN others THEN
        RAISE NOTICE 'Could not revoke phone column: %', SQLERRM;
END $$;

-- Ensure the get_contact_if_connected function has SECURITY DEFINER
-- so it can bypass RLS and read phone on behalf of the caller
-- (already set in 06_security_audit.sql — this is a no-op safety re-create)
CREATE OR REPLACE FUNCTION get_contact_if_connected(target_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    phone_val TEXT;
    connected BOOLEAN;
BEGIN
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
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to all authenticated users
GRANT EXECUTE ON FUNCTION get_contact_if_connected(UUID) TO authenticated;


-- ============================================================
-- 2. PROFILES SELECT POLICY: Ensure is_active filter is tight
-- Re-apply the final approved+active policy (idempotent)
-- ============================================================
DROP POLICY IF EXISTS "profiles_select_approved_and_active" ON public.profiles;

CREATE POLICY "profiles_select_approved_and_active"
ON public.profiles FOR SELECT
TO authenticated
USING (
    -- Public viewers: must be both approved AND active
    (is_approved = true AND is_active = true)
    -- Owner always sees their own profile regardless
    OR auth.uid() = user_id
    -- Admins see everything including soft-deleted
    OR EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.is_admin = true
    )
);

-- Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_approved_active ON public.profiles(is_approved, is_active);


-- ============================================================
-- 3. ADMIN HELPER: Get Soft-Deleted Profiles
-- Admins can call this RPC to audit all deactivated profiles
-- ============================================================
CREATE OR REPLACE FUNCTION get_soft_deleted_profiles()
RETURNS TABLE (
    profile_id UUID,
    user_id UUID,
    full_name TEXT,
    email TEXT,
    city TEXT,
    is_approved BOOLEAN,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    -- Security: Only admins may call this
    IF NOT EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    RETURN QUERY
        SELECT
            p.id AS profile_id,
            p.user_id,
            p.full_name,
            p.email,
            p.city,
            p.is_approved,
            p.updated_at
        FROM public.profiles p
        WHERE p.is_active = false
        ORDER BY p.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_soft_deleted_profiles() TO authenticated;


-- ============================================================
-- 4. SOFT DELETE: Ensure the RPC also updates is_active
-- Re-apply soft_delete_profile to guarantee atomicity
-- ============================================================
CREATE OR REPLACE FUNCTION soft_delete_profile(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Security: only owner or admin can soft-delete
    IF auth.uid() != target_user_id THEN
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

GRANT EXECUTE ON FUNCTION soft_delete_profile(UUID) TO authenticated;


-- ============================================================
-- 5. RESTORE: Create a restore_profile RPC for admin use
-- ============================================================
CREATE OR REPLACE FUNCTION restore_profile(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    UPDATE public.profiles
    SET is_active = true, updated_at = NOW()
    WHERE user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION restore_profile(UUID) TO authenticated;
