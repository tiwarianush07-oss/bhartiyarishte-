
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getReceivedInterests, getSentInterests, updateInterestStatus, Interest, InterestStatus } from '../services/interestService';
import { Profile } from '../types';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';

type ReceivedInterest = { interest: Interest; from_profile: Partial<Profile> };
type SentInterest = { interest: Interest; to_profile: Partial<Profile> };

const InterestsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'received' | 'sent' | 'accepted'>('received');
  const [received, setReceived] = useState<ReceivedInterest[]>([]);
  const [sent, setSent] = useState<SentInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const loadInterests = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
          setLoading(false);
          return;
      }
      setCurrentUserId(user.id);
      
      const [receivedData, sentData] = await Promise.all([
        getReceivedInterests(user.id),
        getSentInterests(user.id)
      ]);
      setReceived(receivedData);
      setSent(sentData);
      setLoading(false);
    };
    loadInterests();
  }, []);

  const handleUpdateStatus = async (interestId: string, status: InterestStatus) => {
    const result = await updateInterestStatus(interestId, status);
    if (result.success) {
        setReceived(prev => prev.map(item => 
          item.interest.id === interestId ? { ...item, interest: { ...item.interest, status: status } } : item
        ));
        if (status === 'accepted') {
          showToast('💚 Interest Accepted! You are now connected.', 'success');
        } else {
          showToast('Interest Declined', 'info');
        }
    } else {
      showToast('Action failed. Please try again.', 'error');
    }
  };
  
  const receivedPending = received.filter(r => r.interest.status === 'pending');
  const receivedAccepted = received.filter(r => r.interest.status === 'accepted');

  const renderContent = () => {
    if (loading) return (
        <div className="flex justify-center p-20">
            <div className="animate-spin h-10 w-10 border-b-2 border-brand rounded-full"></div>
        </div>
    );

    switch(activeTab) {
      case 'received':
        return <InterestListReceived items={receivedPending} onUpdate={handleUpdateStatus} />;
      case 'sent':
        return <InterestListSent items={sent} />;
      case 'accepted':
        return <InterestListReceived items={receivedAccepted} onUpdate={handleUpdateStatus} acceptedView={true} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">Interests & Connections</h1>
      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        <div className="flex border-b bg-gray-50/50 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <TabButton id="received" label="Received" count={receivedPending.length} active={activeTab === 'received'} onClick={setActiveTab} />
          <TabButton id="sent" label="Sent" count={sent.length} active={activeTab === 'sent'} onClick={setActiveTab} />
          <TabButton id="accepted" label="Accepted" count={receivedAccepted.length} active={activeTab === 'accepted'} onClick={setActiveTab} />
        </div>
        <div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ id, label, active, onClick, count }: any) => (
  <button 
    onClick={() => onClick(id)}
    className={`px-8 py-5 text-sm font-bold uppercase tracking-wider transition relative ${active ? 'bg-white text-brand border-b-4 border-brand' : 'text-gray-400 hover:text-gray-600'}`}
  >
    {label}
    {count > 0 && <span className="ml-2 inline-flex items-center justify-center bg-brand text-white rounded-full h-5 w-5 text-[10px] font-black">{count}</span>}
  </button>
);

const calculateAge = (date_of_birth?: string): string => {
    if (!date_of_birth) return 'N/A';
    const birthDate = new Date(date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age.toString();
};

const InterestListReceived = ({ items, onUpdate, acceptedView = false }: { items: ReceivedInterest[], onUpdate: (id: string, s: InterestStatus) => void, acceptedView?: boolean }) => {
    if (items.length === 0) {
        return <div className="text-center p-20 text-gray-400 font-medium">No incoming interests yet.</div>;
    }
    return (
        <div className="divide-y">
            {items.map(({ interest, from_profile }) => (
                <div key={interest.id} className="p-6 flex flex-col sm:flex-row items-center gap-6 hover:bg-gray-50 transition duration-300">
                    <img src={from_profile.avatar_url || `https://i.pravatar.cc/100?u=${from_profile.user_id}`} alt={from_profile.full_name} className="w-20 h-20 rounded-2xl object-cover shadow-sm" />
                    <div className="flex-grow text-center sm:text-left">
                        <h3 className="font-bold text-lg">{from_profile.full_name}, {calculateAge(from_profile.date_of_birth)}</h3>
                        <p className="text-sm text-gray-500">{from_profile.profession} • {from_profile.city}</p>
                    </div>
                    <div className="flex gap-3 items-center">
                        <Link to={`/profile/${from_profile.id}`} className="px-4 py-2 text-xs font-bold border rounded-xl hover:bg-gray-100 transition">View</Link>
                        {!acceptedView && (
                             <>
                                <button onClick={() => onUpdate(interest.id, 'declined')} className="px-4 py-2 text-xs font-bold bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition">Decline</button>
                                <button onClick={() => onUpdate(interest.id, 'accepted')} className="px-4 py-2 text-xs font-bold bg-brand text-white rounded-xl hover:bg-rose-700 shadow-md transition">Accept</button>
                             </>
                        )}
                        {acceptedView && (
                             <Link to="/chat" className="px-4 py-2 text-xs font-bold bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-md transition">Message</Link>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

const InterestListSent = ({ items }: { items: SentInterest[] }) => {
    if (items.length === 0) {
        return <div className="text-center p-20 text-gray-400 font-medium">You haven't sent any interests yet.</div>;
    }
    return (
        <div className="divide-y">
            {items.map(({ interest, to_profile }) => (
                <div key={interest.id} className="p-6 flex flex-col sm:flex-row items-center gap-6 hover:bg-gray-50 transition duration-300">
                    <img src={to_profile.avatar_url || `https://i.pravatar.cc/100?u=${to_profile.user_id}`} alt={to_profile.full_name} className="w-20 h-20 rounded-2xl object-cover shadow-sm" />
                    <div className="flex-grow text-center sm:text-left">
                        <h3 className="font-bold text-lg">{to_profile.full_name}, {calculateAge(to_profile.date_of_birth)}</h3>
                        <p className="text-sm text-gray-500">{to_profile.profession} • {to_profile.city}</p>
                    </div>
                    <div className="flex gap-4 items-center">
                       <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${interest.status === 'pending' ? 'bg-amber-100 text-amber-700' : interest.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                           {interest.status}
                       </span>
                        <Link to={`/profile/${to_profile.id}`} className="px-4 py-2 text-xs font-bold border rounded-xl hover:bg-gray-100 transition">View Profile</Link>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default InterestsPage;

