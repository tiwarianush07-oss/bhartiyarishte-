import React from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { activateBoost } from '../services/boost.service';

const SubscriptionPage: React.FC = () => {
  const { plan, isBoosted, refresh, loading: subLoading } = useSubscription();
  const { user } = useAuth();
  const [loading, setLoading] = React.useState<string | null>(null);

  const handleWhatsAppPayment = (planName: string) => {
    if (!user) return;
    
    // User info extracted from the Supabase session
    const authUser = user as any;
    const fullName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User';
    const email = authUser.email || 'N/A';
    const phone = authUser.user_metadata?.phone || authUser.phone || 'N/A';

    const messageTemplate = `Hello, I want to purchase a membership plan on Bhartiya Rishtey.

Name: ${fullName}
Email: ${email}
Phone: ${phone}
Selected Plan: ${planName}

Please send me the payment details.`;

    const encodedMessage = encodeURIComponent(messageTemplate);
    const whatsappUrl = `https://wa.me/919109330332?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const handleBoost = async () => {
    setLoading('boost');
    try {
      if (!user) return;
      
      // Send them to WhatsApp to pay for the boost
      const authUser = user as any;
      const fullName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User';
      const email = authUser.email || 'N/A';
      const phone = authUser.user_metadata?.phone || authUser.phone || 'N/A';
      
      const messageTemplate = `Hello, I want to purchase a membership plan on Bhartiya Rishtey.

Name: ${fullName}
Email: ${email}
Phone: ${phone}
Selected Plan: Profile Boost (₹99)

Please send me the payment details.`;

      const encodedMessage = encodeURIComponent(messageTemplate);
      const whatsappUrl = `https://wa.me/919109330332?text=${encodedMessage}`;
      
      window.open(whatsappUrl, '_blank');
      
      // Optionally simulate boost activation after request or wait for admin
      // await activateBoost(user.id);
      // await refresh();
    } finally {
      setLoading(null);
    }
  };

  if (subLoading) return <div className="p-20 text-center">Loading plans...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Choose Your Premium Experience</h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">Elevate your matchmaking journey with verified status and advanced networking tools.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        <PlanCard 
          title="Free"
          price="0"
          current={plan === 'free'}
          features={['Create Profile', 'Browse Matches', 'Receive Interests']}
          onSelect={() => {}}
          disabled
        />
        <PlanCard 
          title="Gold"
          price="499"
          highlight
          current={plan === 'gold'}
          loading={loading === 'gold'}
          features={['Unlimited Interests', 'View Contact Details', 'Instant Chat Access', 'Priority Matching']}
          onSelect={() => handleWhatsAppPayment('Gold Plan')}
        />
        <PlanCard 
          title="Platinum"
          price="2999"
          current={plan === 'platinum'}
          loading={loading === 'platinum'}
          features={['All Gold Features', 'See Who Viewed You', 'Advanced AI Filtering', 'Monthly Profile Boost']}
          onSelect={() => handleWhatsAppPayment('Platinum Plan')}
        />
      </div>

      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-[3rem] p-10 text-white flex flex-col md:flex-row items-center gap-10">
        <div className="flex-grow">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">Hot</span>
            <h2 className="text-3xl font-bold">Profile Boost</h2>
          </div>
          <p className="text-gray-300 text-lg">Get 10x more visibility for 24 hours. Your profile will be shown at the top of search results and daily recommendations.</p>
        </div>
        <div className="shrink-0 w-full md:w-auto">
          <button 
            onClick={handleBoost}
            disabled={isBoosted || loading === 'boost'}
            className={`w-full md:w-auto px-8 py-5 rounded-2xl font-bold text-base transition shadow-2xl flex items-center justify-center gap-3 ${isBoosted ? 'bg-green-500 text-white cursor-default' : 'bg-[#25D366] text-white hover:bg-[#1faa51]'}`}
          >
            {isBoosted ? 'Currently Boosted' : loading === 'boost' ? 'Boosting...' : (
              <>
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.571-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Request Boost (₹99) on WhatsApp
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const PlanCard = ({ title, price, features, highlight, onSelect, current, loading, disabled }: any) => (
  <div className={`relative flex flex-col p-8 rounded-[2.5rem] border-2 transition-all duration-300 ${highlight ? 'border-brand bg-white shadow-2xl scale-105 z-10' : 'border-gray-100 bg-gray-50'}`}>
    {highlight && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full w-full max-w-[200px] text-center">Most Recommended</div>}
    <h3 className="text-xl font-black text-gray-900 mb-2">{title}</h3>
    <div className="flex items-baseline gap-1 mb-8">
      <span className="text-4xl font-black text-gray-900">₹{price}</span>
      <span className="text-gray-400 font-medium text-sm">/period</span>
    </div>
    <ul className="space-y-4 mb-10 flex-grow">
      {features.map((f: string) => (
        <li key={f} className="flex items-start gap-3 text-gray-600 text-sm">
          <span className="text-brand font-bold mt-0.5">✓</span>
          {f}
        </li>
      ))}
    </ul>
    <button 
      onClick={onSelect}
      disabled={disabled || current || loading}
      className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition ${current ? 'bg-green-100 text-green-700' : disabled ? 'bg-gray-200 text-gray-400' : 'bg-[#25D366] text-white hover:bg-[#1faa51] shadow-xl shadow-green-200'}`}
    >
      {current ? 'Active Plan' : loading ? 'Processing...' : disabled ? 'Current Plan' : (
        <>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.571-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          Request via WhatsApp
        </>
      )}
    </button>
  </div>
);

export default SubscriptionPage;
