
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInterestBetweenUsers, sendInterest, Interest } from '../services/interestService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { ProfileDetailSkeleton } from '../components/Skeleton';

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

const ProfileDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPremium = user?.profile?.plan_type === 'premium';
  const { showToast } = useToast();

  const [profile, setProfile] = useState<any | null>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [interest, setInterest] = useState<Interest | null>(null);
  const [loadingInterest, setLoadingInterest] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchInterestStatus = useCallback(async (uid: string, targetUid: string) => {
    setLoadingInterest(true);
    const interestData = await getInterestBetweenUsers(uid, targetUid);
    setInterest(interestData);
    setLoadingInterest(false);
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (!id) return;
      setLoadingProfile(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      try {
        // Fetch profile using secure RPC (strips phone/email unless interest is accepted)
        const { data: profileData, error: profileError } = await supabase
          .rpc('get_profile_with_contact', { p_profile_id: id });

        if (profileError) throw profileError;
        if (!profileData) throw new Error('Profile not found.');

        // Fetch photos
        const { data: photoData, error: photoError } = await supabase
          .from('photos')
          .select('*')
          .eq('user_id', profileData.user_id)
          .order('is_primary', { ascending: false });

        if (photoError) console.error("Error fetching photos:", photoError);

        setProfile(profileData);
        setPhotos(photoData || []);

        if (user && profileData.user_id) {
          await fetchInterestStatus(user.id, profileData.user_id);
        }
      } catch (err: any) {
        setError(err.message || 'Profile not found.');
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [id, fetchInterestStatus]);

  const handleSendInterest = async () => {
    if (!profile || !currentUserId) return;
    try {
      setError(null);

      if (!isPremium) {
         const today = new Date();
         today.setHours(0, 0, 0, 0);
         const { count, error: countError } = await supabase
           .from('interests')
           .select('*', { count: 'exact', head: true })
           .eq('sender_id', currentUserId)
           .gte('created_at', today.toISOString());
           
         if (!countError && count !== null && count >= 3) {
            throw new Error('Daily limit reached (3/3) for Free Profiles. Upgrade to Elite to unlock unlimited interactions.');
         }
      }

      const result = await sendInterest(currentUserId, profile.user_id);
      if (!result.success) {
        throw new Error(result.error);
      }
      await fetchInterestStatus(currentUserId, profile.user_id);
      showToast('Interest sent! ♥️', 'success');
    } catch (error: any) {
      setError(error.message);
      showToast(error.message.includes('Daily limit') ? '⚠️ Daily limit reached — Upgrade to unlock unlimited!' : 'Failed to send interest', 'error');
    }
  };

  const renderActionButton = () => {
    if (loadingInterest) {
      return (
        <button disabled className="flex-1 bg-gray-200 text-gray-500 py-4 rounded-2xl font-bold text-lg transition">
          Loading...
        </button>
      );
    }

    if (currentUserId === profile?.user_id) {
      return (
        <button onClick={() => navigate('/my-profile')} className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-black transition">
          Edit My Profile
        </button>
      );
    }

    switch (interest?.status) {
      case 'accepted':
        return (
          <button onClick={() => navigate('/chat')} className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-green-700 transition transform hover:-translate-y-1">
            Chat Now
          </button>
        );
      case 'pending':
        return (
          <button disabled className="flex-1 bg-amber-400 text-white py-4 rounded-2xl font-bold text-lg cursor-not-allowed">
            Interest Sent
          </button>
        );
      case 'declined':
        return (
          <button disabled className="flex-1 bg-gray-400 text-white py-4 rounded-2xl font-bold text-lg cursor-not-allowed">
            Interest Declined
          </button>
        );
      default:
        return (
          <button onClick={handleSendInterest} className="flex-1 bg-brand text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-rose-700 transition transform hover:-translate-y-1">
            Send Interest
          </button>
        );
    }
  };

  if (loadingProfile) {
    return <ProfileDetailSkeleton />;
  }

  if (error && !profile) {
    return (
      <div className="text-center p-20">
        <h2 className="text-2xl font-bold text-red-600">Error</h2>
        <p className="text-gray-500">{error}</p>
        <button onClick={() => navigate('/search')} className="mt-6 bg-brand text-white px-6 py-2 rounded-lg font-bold">Back to Search</button>
      </div>
    );
  }

  const profileAge = profile?.date_of_birth ? calculateAge(profile.date_of_birth) : 'N/A';
  const primaryPhoto = photos.find(p => p.is_primary)?.url || photos[0]?.url || `https://i.pravatar.cc/600?u=${profile?.id}`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-gray-500 hover:text-brand font-medium transition"
      >
        <span>←</span> Back to Matches
      </button>

      <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Photo Gallery Section */}
          <div className="bg-gray-100 p-2">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden mb-2">
              <img src={primaryPhoto} alt={profile.full_name} loading="lazy" width="600" height="800" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://i.pravatar.cc/600?u=fallback'; }} />
            </div>
            {photos.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {photos.map((photo: any, idx: number) => (
                  <div key={photo.id} className="aspect-square rounded-lg overflow-hidden border-2 border-white">
                    <img src={photo.url} alt={`Gallery ${idx}`} loading="lazy" width="150" height="150" className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://i.pravatar.cc/150?u=fallback'; }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="p-8 lg:p-12">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-4xl font-extrabold text-gray-900 flex items-center gap-2">
                   {profile.full_name}, {profileAge}
                   {(profile.verification_status === 'verified' || profile.is_verified) && (
                      <span className="text-blue-500" title="Verified Member">
                         <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      </span>
                   )}
                </h1>
                <p className="text-xl text-gray-500 font-medium">{profile.profession || 'Profession Not Set'}</p>
              </div>
              {(profile.verification_status === 'verified' || profile.is_verified) && (
                <div className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 flex items-center gap-1 shadow-sm">
                  100% Confirmed
                </div>
              )}
            </div>

            {error && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-sm">{error}</div>}

            <div className="flex gap-4 mb-10">
              {renderActionButton()}
              <button className="px-6 py-4 border-2 border-gray-200 rounded-2xl font-bold hover:bg-gray-50 transition">
                ♡
              </button>
            </div>

            <div className="space-y-10">
              <section>
                <h3 className="text-sm font-bold text-brand uppercase tracking-widest mb-4">About Me</h3>
                <p className="text-gray-600 leading-relaxed text-lg italic">"{profile.bio || "No bio provided yet."}"</p>
              </section>

              <div className="grid grid-cols-2 gap-y-8 gap-x-4">
                <InfoBlock label="Religion / Caste" value={`${profile.religion || 'N/A'}, ${profile.caste || 'N/A'}`} />
                <InfoBlock label="Marital Status" value={profile.marital_status || 'N/A'} />
                <InfoBlock label="Education" value={profile.education || 'N/A'} />
                <InfoBlock label="Height" value={profile.height || 'N/A'} />
                <InfoBlock label="Annual Income" value={profile.income_rs ? `₹${profile.income_rs}` : 'N/A'} />
              </div>

              <section className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
                 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2"><span className="text-brand">🔒</span> Secured Private Details</h3>
                 {interest?.status === 'accepted' || currentUserId === profile.user_id ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm">
                         <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Phone Number</p>
                         <p className="font-bold text-gray-900 mt-1">{profile.phone_number || 'Not Provided'}</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm">
                         <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Email Address</p>
                         <p className="font-bold text-gray-900 mt-1">{profile.email || 'Not Provided'}</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm md:col-span-1">
                         <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Full Location</p>
                         <p className="font-bold text-gray-900 mt-1">{`${profile.city || 'N/A'}, ${profile.state || 'N/A'}`}</p>
                      </div>
                    </div>
                 ) : (
                    <div className="text-center py-6">
                       <p className="text-gray-500 font-medium text-sm">Full Location and Contact details are locked for privacy & safety.</p>
                       <p className="text-xs text-brand font-bold mt-2 uppercase tracking-widest">Send interest to unlock full details</p>
                    </div>
                 )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoBlock = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">{label}</p>
    <p className="text-gray-900 font-semibold">{value}</p>
  </div>
);

export default ProfileDetail;
