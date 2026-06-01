
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { User } from "../types";
import { useToast } from "../components/Toast";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchProfile = useCallback(async (userId: string, authUser?: any) => {
    try {
      // Add a race condition to prevent hung DB calls from blocking the app forever
      const profilePromise = supabase
        .from('users')
        .select('*, profile:profiles(*)')
        .eq('id', userId)
        .single();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timed out')), 15000)
      );

      const { data, error: queryError } = await Promise.race([profilePromise, timeoutPromise]) as any;
      
      if (!queryError && data) {
        // Merge is_admin from profile if it exists there
        const planEnum = data.profile?.plan_type || 'free';
        const mergedUser = {
          ...data,
          is_admin: data.is_admin || data.profile?.is_admin || false,
          is_premium: data.is_premium || planEnum !== 'free'
        };
        setUser(mergedUser);
        setError(null);
      } else if (authUser) {
        // Fallback: User is authenticated but profile data might be missing or trigger delayed
        console.warn("Profile fetch failed or timed out, using auth metadata fallback.");
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          phone: authUser.phone || '',
          is_premium: false,
          is_admin: authUser.user_metadata?.is_admin || false,
          is_suspended: false,
          role: authUser.user_metadata?.role || 'user',
          created_at: authUser.created_at,
        } as User);
        setError(null);
      } else {
        setUser(null);
      }
    } catch (err: any) {
      console.error("Profile fetch error:", err);
      // Don't set global error if we have an authUser fallback
      if (authUser) {
         setUser({
          id: authUser.id,
          email: authUser.email || '',
          phone: authUser.phone || '',
          is_premium: false,
          is_admin: authUser.user_metadata?.is_admin || false,
          is_suspended: false,
          role: authUser.user_metadata?.role || 'user',
          created_at: authUser.created_at,
        } as User);
      } else {
        setError(err?.message || 'Failed to load profile data.');
      }
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchProfile(session.user.id, session.user);
      } else {
        setUser(null);
      }
    } catch (err: any) {
      console.error("Refresh profile error:", err);
      setError(err?.message || 'Failed to refresh session.');
    }
  }, [fetchProfile]);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          if (session?.user) {
            await fetchProfile(session.user.id, session.user);
          } else {
            setUser(null);
          }
          setLoading(false);
        }
      } catch (err: any) {
        console.error("Auth init error:", err);
        if (mounted) {
          setError(err?.message || 'Unable to connect to the server. Please check your internet connection.');
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        if (event === 'SIGNED_IN' && session?.user) {
          const provider = session.user.app_metadata?.provider;
          if (provider === 'google') {
            showToast('Google login successful! Metadata saved.', 'success');
          }
        }
        if (session?.user) {
          await fetchProfile(session.user.id, session.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  return (
    <AuthContext.Provider value={{ user, loading, error, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
