import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getPartnerPreferences, PartnerPreferences } from '../services/profileService';
import { calculateMatchScore, calculateAgeFromDob } from '../utils/matchmaker';
import { useAuth } from '../context/AuthContext';
import { ProfileCardSkeleton } from '../components/ProfileCardSkeleton';

const MatchesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPremium = user?.profile?.plan_type === 'premium';
  const [preferences, setPreferences] = useState<PartnerPreferences | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIntelligentMatches = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
           navigate('/login');
           return;
        }

        // 1. Fetch Preferences
        const prefs = await getPartnerPreferences(session.user.id);
        setPreferences(prefs);

        // 2. Fetch Active Profiles
        const { data: globalProfiles, error: pError } = await supabase
          .from('profiles')
          .select(`
             id, full_name, date_of_birth, city, state, profession, education, religion, caste, marital_status,
             is_approved, verification_status, user_display_id, photos(url, is_primary)
          `)
          .eq('is_approved', true)
          .eq('is_active', true)
          .neq('user_id', session.user.id)
          .order('id', { ascending: false });

        if (pError) throw pError;

        // 3. Algorithm Processing
        const processedMatches = (globalProfiles || [])
          .map(profile => {
             const score = calculateMatchScore(profile, prefs);
             return {
                ...profile,
                matchScore: score,
                avatar_url: profile.photos?.find((ph: any) => ph.is_primary)?.url || profile.photos?.[0]?.url || `https://i.pravatar.cc/400?u=${profile.id}`
             };
          })
          .filter(p => p.matchScore >= 40) // Only render profiles that hit minimum compatibility!
          .sort((a, b) => b.matchScore - a.matchScore); // Highest compatibility first!

        setMatches(processedMatches);
      } catch (err: any) {
        setError(err.message || 'Failed to trigger Matchmaker API.');
      } finally {
        setLoading(false);
      }
    };

    fetchIntelligentMatches();
  }, [navigate]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row justify-between items-end mb-8 gap-4">
         <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand to-rose-400 font-display flex items-center gap-3">
               <svg className="w-8 h-8 text-brand" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
               AI Top Matches
            </h1>
            <p className="text-gray-500 font-medium mt-2 max-w-xl">Our Matchmaking intelligence mathematically computes your compatibility against the entire platform based exactly on your partner preferences.</p>
         </div>
         <Link to="/partner-preferences" className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest transition">
            Calibrate Preferences
         </Link>
      </div>

      {loading ? (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <ProfileCardSkeleton key={i} />)}
         </div>
      ) : error ? (
         <div className="bg-rose-50 text-rose-600 p-8 rounded-3xl font-bold text-center border border-rose-100">
            {error}
         </div>
      ) : matches.length === 0 ? (
         <div className="bg-white/80 backdrop-blur-xl border border-dashed border-gray-200 rounded-[2rem] p-20 text-center shadow-sm">
            <h2 className="text-3xl font-black text-gray-900 mb-4">No Perfect Matches Found Yet</h2>
            <p className="text-gray-500 font-medium max-w-md mx-auto mb-8">We could not computationally find anyone currently passing a high compatability threshold for your constraints. Try broadening your preferences!</p>
            <Link to="/partner-preferences" className="bg-brand text-white px-8 py-4 rounded-xl font-bold hover:bg-rose-700 shadow-xl shadow-rose-200 transition">
               Broaden Preferences
            </Link>
         </div>
      ) : (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {matches.map(profile => (
               <Link key={profile.id} to={isPremium ? `/profile/${profile.id}` : `/pricing`} className="group relative bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                  <div className="aspect-[3/4] relative">
                     <img src={profile.avatar_url} alt={profile.full_name} style={{ filter: !isPremium ? 'blur(12px)' : 'none' }} className="w-full h-full object-cover transition duration-700 group-hover:scale-105" />
                     <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/20 to-transparent"></div>
                     
                     {!isPremium && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-20">
                           <div className="text-center px-4">
                              <div className="w-10 h-10 rounded-full bg-brand mx-auto text-white flex items-center justify-center mb-3 shadow-[0_4px_15px_rgba(244,63,94,0.5)]">🔒</div>
                              <span className="text-xs font-black uppercase tracking-widest text-white bg-black/80 px-4 py-2 rounded-xl border border-white/20">Upgrade Elite</span>
                           </div>
                        </div>
                     )}
                     
                     {/* Match Score UI Generator */}
                     <div className="absolute top-4 left-4 z-10 flex items-center justify-center">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-sm text-white shadow-xl border-4 backdrop-blur-md bg-black/40 ${profile.matchScore >= 80 ? 'border-emerald-400 shadow-emerald-500/50' : profile.matchScore >= 60 ? 'border-amber-400 shadow-amber-500/50' : 'border-gray-400'}`}>
                           {profile.matchScore}%
                        </div>
                     </div>

                     {profile.verification_status === 'verified' && (
                        <div className="absolute top-4 right-4 bg-blue-500 text-white rounded-full p-2 shadow-lg shadow-blue-500/40">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                     )}

                     <div className="absolute bottom-6 left-6 right-6 text-white">
                        <h3 className="text-xl font-black truncate">{profile.user_display_id || profile.full_name}</h3>
                        <p className="text-white/80 font-bold uppercase tracking-widest text-[10px] mt-1">
                           {calculateAgeFromDob(profile.date_of_birth)} YRS • {profile.city}
                        </p>
                        <p className="text-brand font-bold uppercase tracking-widest text-[9px] mt-1 bg-white/10 w-max px-2 py-0.5 rounded-full inline-block backdrop-blur-sm">
                           {profile.profession || profile.education || 'No Profession'}
                        </p>
                     </div>
                  </div>
               </Link>
            ))}
         </div>
      )}
    </div>
  );
};

export default MatchesPage;

