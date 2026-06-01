
import { supabase } from '../../lib/supabase';

export type SubscriptionPlan = 'free' | 'gold' | 'platinum';

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

/**
 * Checks if a user has an active premium subscription.
 * It queries the `subscriptions` table for an active plan where the end date is in the future.
 * @param userId The ID of the user to check.
 * @returns A promise that resolves to true if the user is premium, otherwise false.
 */
export const checkIsPremium = async (userId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
        const today = new Date().toISOString();
        const { data, error, count } = await supabase
            .from('subscriptions')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_active', true)
            .gte('end_date', today);

        if (error) {
            console.error("Error checking subscription:", error.message);
            return false;
        }

        return count !== null && count > 0;
    } catch (err: any) {
        console.error("Exception in checkIsPremium:", err.message);
        return false;
    }
};

/**
 * Fetches the current active subscription for a user.
 * @param userId The ID of the user.
 * @returns The active subscription object or null if none exists.
 */
export const checkActiveSubscription = async (userId: string): Promise<Subscription | null> => {
    if (!userId) return null;

     try {
        const today = new Date().toISOString();
        const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .gte('end_date', today)
            .order('end_date', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error("Error fetching active subscription:", error.message);
            return null;
        }

        return data;
    } catch (err: any) {
        console.error("Exception in getActiveSubscription:", err.message);
        return null;
    }
};
