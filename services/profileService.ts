import { supabase } from '../lib/supabase';

// NOTE: Types are defined locally to avoid modifying existing files.
export interface PartnerPreferences {
  user_id: string;
  min_age: number;
  max_age: number;
  min_height: string;
  max_height: string;
  marital_statuses: string[];
  religions: string[];
  castes: string[];
  educations: string[];
}

const defaultPreferences: Omit<PartnerPreferences, 'user_id'> = {
  min_age: 21,
  max_age: 35,
  min_height: "5'0\"",
  max_height: "6'2\"",
  marital_statuses: ['Never Married'],
  religions: [],
  castes: [],
  educations: [],
};

// --- Service Functions ---

/**
 * Fetches partner preferences for a user from the database.
 * Falls back to sensible defaults if no record exists yet.
 * @param userId The ID of the logged-in user.
 */
export async function getPartnerPreferences(userId: string): Promise<PartnerPreferences> {
  const { data, error } = await supabase
    .from('partner_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[PROFILE_SERVICE] Error fetching preferences:', error);
    return { ...defaultPreferences, user_id: userId };
  }

  if (data) {
    return data as PartnerPreferences;
  }

  return { ...defaultPreferences, user_id: userId };
}

/**
 * Saves partner preferences for a user to the database.
 * Uses upsert so it works for both first-time saves and updates.
 * @param userId The ID of the logged-in user.
 * @param preferences The preferences object to save.
 */
export async function savePartnerPreferences(
  userId: string,
  preferences: PartnerPreferences
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('partner_preferences')
    .upsert(
      { ...preferences, user_id: userId },
      { onConflict: 'user_id' }
    );

  if (error) {
    console.error('[PROFILE_SERVICE] Error saving preferences:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
