import { supabase } from '../../lib/supabase';

type VerificationStatus = 'pending' | 'approved' | 'rejected';

/**
 * ADMIN-ONLY: Updates the approval status of a user's profile.
 * RLS policies should restrict this to admin users.
 * @param userId The UUID of the user whose profile is being updated.
 * @param isApproved The new approval status.
 * @returns An object with success status and optional error.
 */
export const setProfileApprovalStatus = async (userId: string, isApproved: boolean): Promise<{ success: boolean; error?: Error }> => {
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ is_approved: isApproved })
            .eq('user_id', userId);
        
        if (error) {
            throw error;
        }

        return { success: true };
    } catch (err: any) {
        console.error("Error updating profile approval status:", err.message);
        return { success: false, error: err };
    }
};


/**
 * ADMIN-ONLY: Updates the status of a verification request and the associated user's profile atomically.
 * RLS policies should restrict this to admin users.
 * @param requestId The ID of the verification request.
 * @param userId The ID of the user associated with the request.
 * @param newStatus The new status: 'approved' or 'rejected'.
 * @returns An object with success status and optional error.
 */
export const updateVerificationStatus = async (requestId: string, userId: string, newStatus: VerificationStatus): Promise<{ success: boolean; error?: Error }> => {
    try {
        // Use a transaction to ensure both tables are updated or neither are.
        const { error: rpcError } = await supabase.rpc('update_verification_status', {
            request_id: requestId,
            user_id_to_update: userId,
            new_status: newStatus
        });

        if (rpcError) {
            throw rpcError;
        }
        
        return { success: true };

    } catch (err: any) {
        console.error("Error in transaction for updating verification status:", err.message);
        return { success: false, error: err };
    }
};

/*
-- NOTE: The following PostgreSQL function should be created in the Supabase SQL Editor
-- to handle verification status updates atomically. This prevents data inconsistency.

CREATE OR REPLACE FUNCTION update_verification_status(
    request_id uuid,
    user_id_to_update uuid,
    new_status verification_status
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Important: to run with elevated privileges
AS $$
BEGIN
    -- Update the verification_requests table
    UPDATE public.verification_requests
    SET status = new_status, updated_at = now()
    WHERE id = request_id;

    -- Update the corresponding profiles table
    UPDATE public.profiles
    SET 
        is_verified = (new_status = 'approved'),
        verification_status = new_status
    WHERE user_id = user_id_to_update;
END;
$$;
*/
