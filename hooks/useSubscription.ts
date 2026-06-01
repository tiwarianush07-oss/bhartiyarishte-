import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getActiveSubscription, SubscriptionPlan, Subscription, hasFeatureAccess } from '../services/subscription.service';
import { getActiveBoost, ProfileBoost } from '../services/boost.service';

export const useSubscription = () => {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [boost, setBoost] = useState<ProfileBoost | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan>('free');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPlan('free');
        setSubscription(null);
        return;
      }

      const [subData, boostData] = await Promise.all([
        getActiveSubscription(user.id),
        getActiveBoost(user.id)
      ]);

      setSubscription(subData);
      setBoost(boostData);
      setPlan(subData?.plan || 'free');
    } catch (error) {
      console.error('Subscription sync error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(() => refresh());
    return () => authListener.unsubscribe();
  }, [refresh]);

  const canUse = (feature: 'view_contact' | 'view_viewers' | 'unlimited_interests') => {
    return hasFeatureAccess(plan, feature);
  };

  return {
    plan,
    subscription,
    boost,
    isPremium: plan !== 'free',
    isBoosted: !!boost,
    loading,
    canUse,
    refresh
  };
};
