import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { getPartnerPreferences, PartnerPreferences } from '../services/profileService';
import { calculateMatchScore } from '../utils/matchmaker';
import { useToast } from '../components/Toast';
import { ProfileCardSkeleton } from '../components/ProfileCardSkeleton';

interface Match {
  id: string;
  full_name: string;
  date_of_birth: string;
  city: string;
  profession: string;
  avatar_url?: string;
}

interface Interest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  sender?: any;
  receiver?: any;
}

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

const Dashboard: React.FC<{ isPremium: boolean }> = ({ isPremium }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'received' | 'sent' | 'matches'>('matches');
  
  const [matches, setMatches] = useState<any[]>([]);
  const [hasPrefs, setHasPrefs] = useState(false);
  const [topPicks, setTopPicks] = useState<any[]>([]);
  const [interestsReceived, setInterestsReceived] = useState<Interest[]>([]);
  const [interestsSent, setInterestsSent] = useState<Interest[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!user) return;
        
        // 0. Fetch Matchmaker Preferences
        const prefs = await getPartnerPreferences(user.id);
        setHasPrefs(!!prefs && (prefs.min_age !== 21 || prefs.castes?.length > 0)); // simple proxy to check if filled

        // 1. Load Universal Pool for Matches & Top Picks computation
        const { data: profileData } = await supabase
          .from('profiles')
          .select(`id, full_name, date_of_birth, city, profession, religion, caste, education, marital_status, verification_status, photos (url, is_primary)`)
          .eq('is_approved', true)
          .neq('user_id', user.id);

        if (profileData) {
           const processed = profileData.map((p: any) => ({
             ...p,
             matchScore: calculateMatchScore(p, prefs),
             avatar_url: p.photos?.find((ph: any) => ph.is_primary)?.url || p.photos?.[0]?.url || `https://i.pravatar.cc/400?u=${p.id}`
           }));

           // Raw Matches (Any Score)
           setMatches(processed.slice(0, 6));

           // Top Picks Logic (Verified & High Score)
           const picks = processed
              .filter(p => p.verification_status === 'verified' && p.matchScore >= 40)
              .sort((a, b) => b.matchScore - a.matchScore)
              .slice(0, 3);
           setTopPicks(picks);
        }

        // 2. Load Interests Received
        const { data: rData } = await supabase
          .from('interests')
          .select(`id, status, created_at, sender_id, receiver_id, sender:profiles!sender_id (id, full_name, city, photos(url))` as any)
          .eq('receiver_id', user?.id)
          .order('created_at', { ascending: false });
        if (rData) setInterestsReceived(rData as any);

        // 3. Load Interests Sent
        const { data: sData } = await supabase
          .from('interests')
          .select(`id, status, created_at, sender_id, receiver_id, receiver:profiles!receiver_id (id, full_name, city, photos(url))` as any)
          .eq('sender_id', user?.id)
          .order('created_at', { ascending: false });
        if (sData) setInterestsSent(sData as any);

      } catch (err: any) {
        console.error("Data Sync Error:", err);
        setError(err?.message || 'Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    if (user) loadData();
  }, [user]);

  // Real-time listener for "Sent Interest" Status Updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('interests-status')
       .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'interests', filter: `sender_id=eq.${user.id}` }, (payload) => {
          setInterestsSent(prev => prev.map(i => i.id === payload.new.id ? { ...i, status: payload.new.status } : i));
          if(payload.new.status === 'accepted') {
             // Visual notification 
             const audio = new Audio('/notification.mp3'); // Fallback trigger
             audio.play().catch(e => {}); 
          }
       })
       .subscribe();

    return () => { supabase.removeChannel(channel); }
  }, [user]);

  const handleInterestStatus = async (id: string, newStatus: 'accepted' | 'declined') => {
     await supabase.from('interests').update({ status: newStatus }).eq('id', id);
     setInterestsReceived(interestsReceived.map(i => i.id === id ? { ...i, status: newStatus } : i));
     if (newStatus === 'accepted') {
       showToast('💚 Accepted! You are now connected.', 'success');
     } else {
       showToast('Interest Declined', 'info');
     }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 sm:gap-10 items-start">
        
        {/* User Sidebar */}
        <aside className="xl:col-span-1 space-y-6">
          <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-rose-100 to-brand/10 opacity-50 pointer-events-none"></div>
            
            <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl mx-auto mb-4 flex items-center justify-center text-4xl relative z-10 border border-gray-50">
              {user?.profile?.verification_status === 'verified' && (
                 <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1 shadow-lg border-2 border-white z-20">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                 </div>
              )}
              👤
            </div>
            <h3 className="font-bold text-2xl text-gray-900 relative z-10 flex items-center justify-center gap-1">
               {user?.profile?.full_name || 'Member'}
            </h3>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1 relative z-10">Status: {isPremium ? 'Premium' : 'Standard'}</p>

            {/* Dynamic Profile Strength Engine */}
            {(() => {
               let strength = 0;
               if (user?.profile?.avatar_url) strength += 20;
               if (user?.profile?.bio && user.profile.bio.length > 10) strength += 20;
               if (user?.profile?.education || user?.profile?.profession) strength += 30;
               if (user?.profile?.verification_status === 'verified' || user?.profile?.is_verified) strength += 30;
               
               let color = 'bg-brand';
               if (strength >= 80) color = 'bg-emerald-500';
               else if (strength >= 50) color = 'bg-amber-400';

               return (
                 <div className="mt-8 space-y-2 text-left relative z-10">
                   <div className="flex justify-between items-end border-b border-gray-100 pb-2 mb-2">
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Strength</span>
                     <span className={`text-[11px] font-black uppercase tracking-widest ${strength >= 80 ? 'text-emerald-500' : 'text-brand'}`}>{strength}%</span>
                   </div>
                   <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden shadow-inner flex">
                     <div className={`h-full transition-all duration-1000 ${color}`} style={{ width: `${strength}%` }}></div>
                   </div>
                 </div>
               );
            })()}

            <Link to="/my-profile" className="mt-8 block w-full py-4 bg-gray-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-black transition transform hover:-translate-y-0.5 active:scale-95 z-10 relative">
              Edit Profile
            </Link>
          </div>

          {/* Verification Call To Action */}
          {(!user?.profile?.verification_status || user.profile.verification_status === 'unverified') && (
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-[2rem] p-6 shadow-sm border border-blue-100 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
               <div className="w-12 h-12 bg-blue-100 text-blue-500 rounded-full mx-auto flex items-center justify-center mb-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
               </div>
               <h4 className="font-bold text-gray-900 text-sm">Get Verified</h4>
               <p className="text-xs text-gray-500 mt-1 mb-4">Upload ID to get the Blue Tick and 3x more matches.</p>
               <button onClick={() => alert("Forwarding to OCR Upload Gateway - Add your native upload logic here.")} className="w-full bg-blue-500 text-white py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 shadow-md shadow-blue-500/20 transition">
                  Upload ID
               </button>
            </div>
          )}

          {/* Preferences Reminder Nudge */}
          {!hasPrefs && (
             <div className="bg-gradient-to-br from-rose-50 to-white rounded-[2rem] p-6 shadow-sm border border-rose-100 text-center animate-in fade-in zoom-in-95 duration-500">
                <span className="text-2xl mb-2 block">🎯</span>
                <h4 className="font-bold text-gray-900 text-sm">Find Better Matches</h4>
                <p className="text-xs text-gray-500 mt-1 mb-4">Fill out your partner preferences to unlock the AI Matchmaker.</p>
                <Link to="/partner-preferences" className="block w-full bg-brand text-white py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-rose-700 shadow-md shadow-rose-200 transition">
                   Calibrate Now
                </Link>
             </div>
          )}

          {/* Activity Feed Sidebar */}
          <div className="bg-white/70 backdrop-blur-md rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
             <h4 className="font-black text-gray-900 text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
                Live Activity
             </h4>
             <div className="space-y-4">
                <div className="flex gap-3 items-start">
                   <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-500">👁️</div>
                   <div>
                      <p className="text-sm font-bold text-gray-900">3 people viewed your profile today</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-0.5">2 hours ago</p>
                   </div>
                </div>
                <div className="flex gap-3 items-start">
                   <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 text-emerald-500">✨</div>
                   <div>
                      <p className="text-sm font-bold text-gray-900">New verified match in your city!</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-0.5">5 hours ago</p>
                   </div>
                </div>
             </div>
          </div>

           {/* Go Elite CTA */}
           {!isPremium && (
              <div className="bg-gradient-to-tr from-gray-900 to-black rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12 group-hover:scale-125 transition-transform duration-1000 select-none">👑</div>
                 <div className="relative z-10">
                    <h4 className="font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 text-sm uppercase tracking-widest mb-1 flex items-center gap-2">
                       Unlock Elite
                    </h4>
                    <p className="text-[11px] text-gray-400 mb-4 font-medium leading-relaxed">View clear photos, send unlimited interests, and unlock exact salary ranges.</p>
                    <Link to="/pricing" className="block w-full bg-gradient-to-r from-amber-400 to-amber-600 text-gray-900 text-center py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:from-amber-300 hover:to-amber-500 shadow-lg shadow-amber-500/20 transition transform hover:-translate-y-0.5">
                       Upgrade Now
                    </Link>
                 </div>
              </div>
           )}

        </aside>

        {/* Dynamic Glassmorphism Hub */}
        <div className="xl:col-span-3 space-y-8">
           
           {/* Tab Navigation */}
           <div className="flex gap-4 p-2 bg-white/50 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm max-w-fit overflow-x-auto hide-scrollbar">
              <TabButton active={activeTab === 'matches'} onClick={() => setActiveTab('matches')} icon="✨" label="Matches For You" count={matches.length} />
              <TabButton active={activeTab === 'received'} onClick={() => setActiveTab('received')} icon="📥" label="Received" count={interestsReceived.filter(i => i.status === 'pending').length} />
              <TabButton active={activeTab === 'sent'} onClick={() => setActiveTab('sent')} icon="📤" label="Sent" count={interestsSent.length} />
           </div>

           {error && <div className="p-4 bg-brand/10 text-brand rounded-xl font-bold border border-brand/20">{error}</div>}

           {/* AI TOP PICKS FOR YOU */}
           {topPicks.length > 0 && (
              <div className="bg-gradient-to-r from-gray-900 to-black rounded-[2rem] p-8 shadow-2xl relative overflow-hidden animate-in fade-in duration-500 text-white">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-brand rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none"></div>
                 <div className="flex justify-between items-end mb-6 relative z-10">
                    <div>
                       <h2 className="text-2xl font-black font-display flex items-center gap-2">
                          <svg className="w-6 h-6 text-brand" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                          Top Picks For You
                       </h2>
                       <p className="text-white/60 font-bold uppercase tracking-widest text-[10px] mt-1">Based on highest compatibility</p>
                    </div>
                    <Link to="/matches" className="text-brand font-bold text-xs hover:text-rose-400 uppercase tracking-widest hidden sm:block delay-75 transition">View All Matches →</Link>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
                    {topPicks.map(match => (
                        <Link key={match.id} to={isPremium ? `/profile/${match.id}` : `/pricing`} className="group relative bg-white/10 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/20 hover:border-brand/50 transition duration-500">
                           <div className="aspect-square relative">
                              <img src={match.avatar_url} style={{ filter: !isPremium ? 'blur(12px)' : 'none' }} className="w-full h-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://i.pravatar.cc/400?u=fallback'; }} />
                              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
                              
                              {!isPremium && (
                                 <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-20">
                                    <div className="text-center px-4">
                                       <div className="w-8 h-8 rounded-full bg-brand mx-auto text-white flex items-center justify-center mb-2 shadow-xl shadow-rose-500/50">🔒</div>
                                       <span className="text-[10px] font-black uppercase tracking-widest text-white block bg-black/60 px-3 py-1 rounded-full border border-white/20">Upgrade Elite</span>
                                    </div>
                                 </div>
                              )}
                             
                             <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-white font-black text-xs border border-white/10 flex items-center gap-1 shadow-xl">
                                <span className={match.matchScore >= 80 ? "text-emerald-400" : "text-amber-400"}>★</span> {match.matchScore}%
                             </div>

                             <div className="absolute top-3 right-3 bg-blue-500 text-white rounded-full p-1.5 shadow-lg shadow-blue-500/40">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                             </div>

                             <div className="absolute bottom-4 left-4 right-4">
                                <h3 className="text-lg font-black truncate">{match.full_name}</h3>
                                <p className="text-white/80 font-bold uppercase tracking-widest text-[9px] mt-0.5">{calculateAge(match.date_of_birth)} YRS • {match.city}</p>
                             </div>
                          </div>
                       </Link>
                    ))}
                 </div>
                 <Link to="/matches" className="block w-full text-center mt-6 text-brand font-bold text-xs uppercase tracking-widest sm:hidden">View All Matches →</Link>
              </div>
           )}

           {/* MATCHES VIEW */}
           {activeTab === 'matches' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-black text-gray-900 mb-6 font-display">Recommended Profiles</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="bg-white/50 backdrop-blur animate-pulse h-96 rounded-[2rem] border border-white"></div>)
                  ) : matches.length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-white/50 backdrop-blur rounded-[2rem] border border-dashed border-gray-200">
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No profiles found</p>
                    </div>
                  ) : matches.map((match, i) => (
                    <div key={match.id} className="group relative bg-white rounded-[2rem] overflow-hidden shadow-sm border hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1">
                      <div className="aspect-[4/5] relative">
                         <img src={match.avatar_url} style={{ filter: !isPremium ? 'blur(12px)' : 'none' }} className="w-full h-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://i.pravatar.cc/400?u=fallback'; }} />
                         <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/20 to-transparent"></div>

                         {!isPremium && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-md z-20">
                               <div className="text-center">
                                  <div className="w-10 h-10 rounded-full bg-brand mx-auto text-white flex items-center justify-center mb-3 shadow-[0_4px_15px_rgba(244,63,94,0.5)]">🔒</div>
                                  <Link to="/pricing" className="text-xs font-black uppercase tracking-widest text-white bg-black/80 px-4 py-2 rounded-xl hover:bg-brand transition">View Photos</Link>
                               </div>
                            </div>
                         )}
                         <div className="absolute bottom-6 left-6 right-6">
                            <h3 className="text-2xl font-black text-white">{match.full_name}</h3>
                            <p className="text-white/80 font-bold uppercase tracking-widest text-[10px] mt-1">{calculateAge(match.date_of_birth)} YRS • {match.city}</p>
                         </div>
                      </div>
                      <Link to={`/profile/${match.id}`} className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-3 rounded-xl border border-white/30 text-white hover:bg-brand transition">
                         View
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
           )}

           {/* RECEIVED INTERESTS VIEW */}
           {activeTab === 'received' && (
              <div className="bg-white/70 backdrop-blur-2xl rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white animate-in fade-in zoom-in-95 duration-300">
                 <h2 className="text-2xl font-black text-gray-900 mb-6 font-display">Interests Received</h2>
                 <div className="space-y-4">
                    {loading ? <p className="text-gray-400 animate-pulse">Scanning network...</p> : interestsReceived.length === 0 ? <p className="text-gray-400 font-bold text-sm">Your inbox is empty.</p> : null}
                    {interestsReceived.map(interest => (
                       <div key={interest.id} className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-brand/30 transition">
                          <img src={interest.sender.photos?.[0]?.url || `https://i.pravatar.cc/100?u=${interest.sender.id}`} className="w-16 h-16 rounded-full object-cover shadow-inner" loading="lazy" />
                          <div className="flex-1 text-center sm:text-left">
                            <h4 className="font-bold text-lg text-gray-900">{interest.sender.full_name}</h4>
                            <p className="text-brand font-bold uppercase tracking-widest text-[10px]">{interest.sender.city}</p>
                          </div>
                          {interest.status === 'pending' ? (
                             <div className="flex gap-2 w-full sm:w-auto">
                               <button onClick={() => handleInterestStatus(interest.id, 'accepted')} className="flex-1 sm:flex-none px-6 py-3 bg-brand text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-[0_4px_15px_rgba(244,63,94,0.3)] hover:bg-rose-700 transition">Accept</button>
                               <button onClick={() => handleInterestStatus(interest.id, 'declined')} className="flex-1 sm:flex-none px-6 py-3 bg-gray-100 text-gray-500 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-gray-200 transition">Decline</button>
                             </div>
                          ) : (
                             <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${interest.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                                {interest.status}
                             </span>
                          )}
                       </div>
                    ))}
                 </div>
              </div>
           )}

           {/* SENT INTERESTS VIEW */}
           {activeTab === 'sent' && (
              <div className="bg-white/70 backdrop-blur-2xl rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white animate-in fade-in zoom-in-95 duration-300">
                 <h2 className="text-2xl font-black text-gray-900 mb-6 font-display">Interests Sent</h2>
                 <div className="space-y-4">
                    {loading ? <p className="text-gray-400 animate-pulse">Loading sent requests...</p> : interestsSent.length === 0 ? <p className="text-gray-400 font-bold text-sm">You haven't sent any interests yet. Explore matches to get started!</p> : null}
                    {interestsSent.map(interest => (
                       <div key={interest.id} className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                          <img src={interest.receiver?.photos?.[0]?.url || `https://i.pravatar.cc/100?u=${interest.receiver?.id}`} className="w-16 h-16 rounded-2xl object-cover shadow-inner" loading="lazy" />
                          <div className="flex-1 text-center sm:text-left">
                            <h4 className="font-bold text-lg text-gray-900">{interest.receiver?.full_name || 'Profile'}</h4>
                            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">{new Date(interest.created_at).toLocaleDateString()}</p>
                          </div>
                          
                          {/* Live Badging */}
                          {interest.status === 'accepted' && (
                             <div className="flex items-center gap-2">
                                <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span>
                                <span className="font-black text-[11px] text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">Connected</span>
                             </div>
                          )}
                          {interest.status === 'pending' && <span className="font-bold text-[10px] text-amber-500 uppercase tracking-widest bg-amber-50 px-3 py-1.5 rounded-lg">Awaiting Reply</span>}
                          {interest.status === 'declined' && <span className="font-bold text-[10px] text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg">Declined</span>}
                       </div>
                    ))}
                 </div>
              </div>
           )}

        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label, count }: any) => (
  <button 
     onClick={onClick}
     className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${active ? 'bg-gradient-to-r from-gray-900 to-black text-white shadow-lg shadow-black/20 transform scale-100' : 'bg-transparent text-gray-500 hover:bg-white/80 hover:scale-95'}`}
  >
     <span className="text-sm">{icon}</span>
     {label}
     {count > 0 && (
       <span className={`ml-2 px-2 py-0.5 rounded-full text-[9px] ${active ? 'bg-brand text-white' : 'bg-brand/10 text-brand'}`}>{count}</span>
     )}
  </button>
);

export default Dashboard;

