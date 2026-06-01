import { supabase } from '../lib/supabase';

export type InterestStatus = 'pending' | 'accepted' | 'declined';

export interface Interest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: InterestStatus;
  created_at: string;
}

export const getInterestBetweenUsers = async (uid1: string, uid2: string): Promise<Interest | null> => {
  try {
    const { data, error } = await supabase
      .from('interests')
      .select('*')
      .or(`and(sender_id.eq.${uid1},receiver_id.eq.${uid2}),and(sender_id.eq.${uid2},receiver_id.eq.${uid1})`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching interest:', error.message);
      return null;
    }
    return data as Interest | null;
  } catch (err) {
    return null;
  }
};

export const sendInterest = async (sender_id: string, receiver_id: string): Promise<{success: boolean, error?: string}> => {
  try {
    if (sender_id === receiver_id) {
       return { success: false, error: 'You cannot send an interest request to yourself.' };
    }

    // Check for existing duplicates
    const existing = await getInterestBetweenUsers(sender_id, receiver_id);
    if (existing) {
       if (existing.status === 'pending') return { success: false, error: 'An interest request is already pending between you two.' };
       if (existing.status === 'accepted') return { success: false, error: 'You are already connected with this user.' };
       // If declined, depending on business rules, we might allow a retry or block. We'll block for now.
       return { success: false, error: 'You cannot send another interest to this user at this time.' };
    }

    const { error } = await supabase
      .from('interests')
      .insert([
        { sender_id, receiver_id, status: 'pending' }
      ]);
    
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Error sending interest:', err);
    return { success: false, error: err.message };
  }
};

export const getReceivedInterests = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('interests')
      .select(`
        *,
        from_profile:profiles!sender_id (
          id, user_id, full_name, date_of_birth, profession, city, avatar_url
        )
      ` as any)
      .eq('receiver_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((item: any) => ({
      interest: {
        id: item.id,
        sender_id: item.sender_id,
        receiver_id: item.receiver_id,
        status: item.status,
        created_at: item.created_at
      },
      from_profile: Array.isArray(item.from_profile) ? item.from_profile[0] : item.from_profile
    }));
  } catch (err) {
    console.error('Error fetching received interests:', err);
    return [];
  }
};

export const getSentInterests = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('interests')
      .select(`
        *,
        to_profile:profiles!receiver_id (
          id, user_id, full_name, date_of_birth, profession, city, avatar_url
        )
      ` as any)
      .eq('sender_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((item: any) => ({
      interest: {
        id: item.id,
        sender_id: item.sender_id,
        receiver_id: item.receiver_id,
        status: item.status,
        created_at: item.created_at
      },
      to_profile: Array.isArray(item.to_profile) ? item.to_profile[0] : item.to_profile
    }));
  } catch (err) {
    console.error('Error fetching sent interests:', err);
    return [];
  }
};

export const updateInterestStatus = async (interestId: string, status: InterestStatus): Promise<{success: boolean, error?: string}> => {
  try {
    const { error } = await supabase
      .from('interests')
      .update({ status })
      .eq('id', interestId);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Error updating interest status:', err);
    return { success: false, error: err.message };
  }
};

