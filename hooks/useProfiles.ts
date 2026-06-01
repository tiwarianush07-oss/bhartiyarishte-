import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

interface UseProfilesFilters {
  minAge?: number;
  maxAge?: number;
  religion?: string;
  caste?: string;
  minIncome?: number;
  city?: string;
  userIdSearch?: string;
}

const PAGE_LIMIT = 12;

export const useProfiles = (filters: UseProfilesFilters) => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchProfiles = useCallback(async (currentPage: number, applyFilters: UseProfilesFilters) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      // SECURITY ENHANCEMENT: Use public_profiles_safe for all non-admin users
      // This physically prevents data leaks like phone numbers from being sent to the client.
      const isAdmin = session?.user?.user_metadata?.role === 'admin' || session?.user?.email === 'bhartiyarishte03@gmail.com';
      const targetSource = isAdmin ? 'profiles' : 'public_profiles_safe';

      let query = supabase
        .from(targetSource)
        .select(`
          id, 
          full_name, 
          date_of_birth, 
          gender, 
          religion, 
          caste,
          city, 
          state,
          height,
          education,
          income_rs,
          profession, 
          marital_status,
          is_approved,
          verification_status,
          user_display_id,
          photos(url, is_primary)
        `)
        .limit(PAGE_LIMIT);

      if (session) {
        query = query.neq('user_id', session.user.id);
        query = query.eq('is_approved', true);
      }

      // Filter Logic (Server-side)
      if (applyFilters.religion) query = query.eq('religion', applyFilters.religion);
      if (applyFilters.city) query = query.ilike('city', `%${applyFilters.city}%`);
      if (applyFilters.userIdSearch) query = query.ilike('user_display_id', `%${applyFilters.userIdSearch}%`);

      const from = currentPage * PAGE_LIMIT;
      const to = from + PAGE_LIMIT - 1;
      query = query.range(from, to)
                   .order('verification_status', { ascending: false })
                   .order('id', { ascending: false });

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      const formattedData = (data || []).map((p: any) => ({
        ...p,
        // Safely resolve avatar_url: prefer is_primary=true, else fall back to first photo
        avatar_url: p.photos?.find((ph: any) => ph.is_primary === true)?.url
          ?? p.photos?.[0]?.url
          ?? null
      })).filter((p: any) => p.avatar_url !== null);

      setProfiles(prev => currentPage === 0 ? formattedData : [...prev, ...formattedData]);
      setHasMore(data.length === PAGE_LIMIT);

    } catch (err: any) {
      setError(err.message || 'Search failed');
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(0);
    fetchProfiles(0, filters);
  }, [filters, fetchProfiles]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProfiles(nextPage, filters);
  };

  return { profiles, loading, error, hasMore, loadMore };
};

