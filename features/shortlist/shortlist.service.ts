
import { supabase } from '../../lib/supabase';

/**
 * Checks if a target profile is already shortlisted by the current user.
 * @param targetProfileId The UUID of the profile to check.
 * @returns A boolean indicating if the profile is shortlisted.
 */
export const isShortlisted = async (targetProfileId: string): Promise<boolean> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User must be logged in.");

        const { data, error } = await supabase
            .from('shortlists')
            .select('id')
            .eq('from_user_id', user.id)
            .eq('to_user_id', targetProfileId)
            .single();

        if (error && error.code !== 'PGRST116') { // Ignore 'no rows' error
            throw error;
        }

        return !!data;
    } catch (err: any) {
        console.error("Error checking shortlist status:", err.message);
        return false;
    }
};

/**
 * Toggles the shortlist status of a target profile for the current user.
 * If the profile is shortlisted, it will be removed. If not, it will be added.
 * @param targetUserId The user_id of the profile to toggle.
 * @returns The new shortlist status (true if added, false if removed).
 */
export const toggleShortlist = async (targetUserId: string): Promise<boolean | undefined> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User must be logged in.");

        const isCurrentlyShortlisted = await isShortlisted(targetUserId);

        if (isCurrentlyShortlisted) {
            // Delete from shortlist
            const { error } = await supabase
                .from('shortlists')
                .delete()
                .eq('from_user_id', user.id)
                .eq('to_user_id', targetUserId);
            
            if (error) throw error;
            return false; // Now it is not shortlisted
        } else {
            // Add to shortlist
            const { error } = await supabase
                .from('shortlists')
                .insert({
                    from_user_id: user.id,
                    to_user_id: targetUserId,
                });
            
            if (error) throw error;
            return true; // Now it is shortlisted
        }
    } catch (err: any) {
        console.error("Error toggling shortlist:", err.message);
        // Return undefined on error to indicate the operation failed
        return undefined;
    }
};
