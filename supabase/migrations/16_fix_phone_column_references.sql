-- ============================================================
-- PHASE 16: FIX PHONE COLUMN REFERENCES
-- Aligns database functions with normalized column names.
-- ============================================================

-- 1. Secure wire-level defense: revoke select on phone_number for users table
DO $$
BEGIN
    REVOKE SELECT (phone_number) ON public.users FROM authenticated;
EXCEPTION
    WHEN undefined_column THEN
        RAISE NOTICE 'Column phone_number does not exist on users table, skipping revoke.';
    WHEN others THEN
        RAISE NOTICE 'Could not revoke phone_number column: %', SQLERRM;
END $$;

-- 2. Redefine get_contact_if_connected using phone_number
CREATE OR REPLACE FUNCTION public.get_contact_if_connected(target_user_id UUID)
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
        SELECT phone_number INTO phone_val
        FROM public.profiles
        WHERE user_id = target_user_id;
        RETURN phone_val;
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_contact_if_connected(UUID) TO authenticated;
