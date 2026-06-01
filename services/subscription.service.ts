import { supabase } from '../lib/supabase';

export type SubscriptionPlan = 'free' | 'gold' | 'platinum';

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export const getActiveSubscription = async (userId: string): Promise<Subscription | null> => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .gte('end_date', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
};

export const hasFeatureAccess = (plan: SubscriptionPlan, feature: 'view_contact' | 'view_viewers' | 'unlimited_interests'): boolean => {
  const matrix: Record<SubscriptionPlan, Record<string, boolean>> = {
    free: {
      view_contact: false,
      view_viewers: false,
      unlimited_interests: false,
    },
    gold: {
      view_contact: true,
      view_viewers: false,
      unlimited_interests: true,
    },
    platinum: {
      view_contact: true,
      view_viewers: true,
      unlimited_interests: true,
    },
  };
  return matrix[plan][feature];
};
