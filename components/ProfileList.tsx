import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ProfileCardSkeleton } from '../components/ProfileCardSkeleton';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  user_display_id?: string;
  date_of_birth: string;
  city: string;
  state: string;
  profession: string;
  religion?: string;
  caste?: string;
  height?: string;
  education?: string;
  income_rs?: string;
  avatar_url?: string;
}

interface ProfileListProps {
  religion?: string;
  caste?: string;
  minIncome?: number;
  city?: string;
}

const PAGE_LIMIT = 12;

const calculateAge = (date_of_birth: string): number => {
    const birthDate = new Date(date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

const ProfileList: React.FC<ProfileListProps> = ({ religion, caste, minIncome, city }) => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProfiles = useCallback(async (currentPage: number) => {
        if (currentPage === 0) {
            setProfiles([]);
        }
        setLoading(true);
        setError(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error("User not authenticated. Please log in to view profiles.");
            }
            const currentUserId = session.user.id;

            let query = supabase
                .from('profiles')
                .select('id, user_id, full_name, user_display_id, date_of_birth, city, state, profession, religion, caste, height, education, income_rs, avatar_url')
                .eq('is_verified', true)
                .neq('user_id', currentUserId)
                .not('avatar_url', 'is', null);

            if (religion) query = query.eq('religion', religion);
            if (caste) query = query.eq('caste', caste);
            if (minIncome && minIncome > 0) query = query.gte('income_rs', minIncome);
            if (city) query = query.ilike('city', `%${city}%`);

            const from = currentPage * PAGE_LIMIT;
            const to = from + PAGE_LIMIT - 1;
            query = query.range(from, to).order('created_at', { ascending: false });

            const { data, error: queryError } = await query;

            if (queryError) {
                throw queryError;
            }

            setProfiles(prev => currentPage === 0 ? data : [...prev, ...data]);
            setHasMore(data.length === PAGE_LIMIT);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred while fetching profiles.');
        } finally {
            setLoading(false);
        }
    }, [religion, caste, minIncome, city]);

    useEffect(() => {
        setPage(0);
        setHasMore(true);
        fetchProfiles(0);
    }, [fetchProfiles]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchProfiles(nextPage);
    };

    return (
        <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Show skeletons on initial load */}
                {loading && profiles.length === 0 && (
                    <ProfileCardSkeleton count={8} />
                )}
                {profiles.map(profile => {
                    const age = calculateAge(profile.date_of_birth);
                    const details = [
                        age ? `${age} Years` : null,
                        profile.height || null,
                        profile.religion || null,
                        profile.city || null,
                        profile.caste || null,
                        profile.education || null,
                        profile.income_rs ? `Rs. ${profile.income_rs}` : null,
                        profile.profession || null,
                    ].filter(Boolean).join(' | ');

                    return (
                        <Link
                            key={profile.id}
                            to={`/profile/${profile.id}`}
                            className="bg-white rounded-xl overflow-hidden shadow-sm border hover:shadow-xl transition-all group block"
                        >
                            <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                                <img
                                    src={profile.avatar_url || `https://i.pravatar.cc/300?u=${profile.id}`}
                                    alt={profile.full_name}
                                    loading="lazy"
                                    width="300"
                                    height="400"
                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://i.pravatar.cc/300?u=fallback'; }}
                                />
                            </div>
                            <div className="p-4">
                                <h3 className="text-base font-bold text-gray-900 truncate mb-1">
                                    {profile.user_display_id || profile.full_name}
                                </h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {details}
                                </p>
                            </div>
                        </Link>
                    );
                })}
                {/* Show 3 skeleton cards for load-more pagination */}
                {loading && profiles.length > 0 && (
                    <ProfileCardSkeleton count={3} />
                )}
            </div>

            {error && (
                <div className="text-center py-8 px-4">
                    <p className="text-red-600 bg-red-50 p-4 rounded-lg">{error}</p>
                </div>
            )}
            
            {!loading && profiles.length === 0 && !error && (
                 <div className="text-center py-12 px-4">
                    <p className="text-gray-600 bg-gray-100 p-6 rounded-lg">No profiles found matching your criteria.</p>
                 </div>
            )}

            {hasMore && !loading && profiles.length > 0 && (
                <div className="text-center py-10">
                    <button
                        onClick={handleLoadMore}
                        className="bg-brand text-white px-8 py-3 rounded-lg font-semibold hover:bg-rose-700 transition shadow-md hover:shadow-lg"
                    >
                        Load More Profiles
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProfileList;
