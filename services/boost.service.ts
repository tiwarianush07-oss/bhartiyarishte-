import { supabase } from '../lib/supabase';

export interface ProfileBoost {
  id: string;
  user_id: string;
  expires_at: string;
  created_at: string;
}

export const getActiveBoost = async (userId: string): Promise<ProfileBoost | null> => {
  const { data, error } = await supabase
    .from('profile_boosts')
    .select('*')
    .eq('user_id', userId)
    .gte('expires_at', new Date().toISOString())
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
};

export const activateBoost = async (userId: string, hours: number = 24): Promise<void> => {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + hours);

  const { error } = await supabase
    .from('profile_boosts')
    .upsert({
      user_id: userId,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (error) throw error;
};
