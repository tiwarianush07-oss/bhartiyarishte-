
import { supabase } from '../../lib/supabase';

/**
 * Inserts a record into the profile_views table.
 * @param viewerId The user_id of the person viewing the profile.
 * @param targetId The user_id of the profile being viewed.
 */
export const trackProfileView = async (viewerId: string, targetId: string): Promise<{ success: boolean; error?: Error }> => {
    try {
        const { error } = await supabase
            .from('profile_views')
            .insert({ viewer_id: viewerId, target_id: targetId });

        if (error) {
            throw error;
        }
        return { success: true };
    } catch (err: any) {
        console.error("Error in trackProfileView service:", err.message);
        return { success: false, error: err };
    }
};

/**
 * Fetches the profiles of users who have viewed the target user's profile.
 * RLS policy must enforce that this is only accessible to premium users.
 * @param targetId The user_id of the user whose viewers are being requested.
 * @returns An array of viewer profiles with the time of their last view.
 */
export const getProfileViewers = async (targetId: string): Promise<{ profile: any; viewed_at: string }[]> => {
    try {
        // RLS on `profile_views` should ensure only the owner (if premium) can query their own views.
        const { data, error } = await supabase.rpc('get_profile_viewers', {
            target_user_id: targetId
        });

        if (error) {
            throw error;
        }
        return data || [];
    } catch (err: any) {
        console.error("Error fetching profile viewers:", err.message);
        return [];
    }
};

/* 
-- NOTE: The following PostgreSQL function should be created in the Supabase SQL Editor
-- for the `getProfileViewers` service function to work efficiently and securely.

CREATE OR REPLACE FUNCTION get_profile_viewers(target_user_id uuid)
RETURNS TABLE (profile json, viewed_at timestamptz)
LANGUAGE plpgsql
AS $$
BEGIN
  -- RLS is assumed to be active on the `profile_views` table,
  -- so this function will only return rows the calling user is allowed to see.
  RETURN QUERY
  SELECT
    json_build_object(
      'user_id', p.user_id,
      'first_name', p.first_name,
      'last_name', p.last_name,
      'city', p.city,
      'occupation', p.occupation
    ) AS profile,
    pv.viewed_at
  FROM profile_views AS pv
  JOIN profiles AS p ON pv.viewer_id = p.user_id
  WHERE pv.target_id = target_user_id
  ORDER BY pv.viewed_at DESC;
END;
$$;

*/
