import React, { useState } from 'react';
import SubscriptionGate from '../components/SubscriptionGate';
import { useAuth } from '../context/AuthContext';

const VIPConcierge: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<'premium' | 'vip' | null>(null);
  const { user } = useAuth();

  const plans = {
    premium: {
      id: 'PREMIUM_3M',
      name: 'Premium Service',
      price: '₹4,500',
      duration: '3 Months',
      features: [
        'Unmasked Contacts (Phone/Email)',
        'Support 10:00 AM – 6:00 PM',
        'Certified Relationship Manager',
        'Priority Assistance'
      ]
    },
    vip: {
      id: 'VIP_6M',
      name: 'VIP Concierge',
      price: '₹6,500',
      duration: '6 Months',
      isPopular: true,
      features: [
        'Everything in Premium',
        '24x7 Personal Relationship Manager',
        'Access to Exclusive WhatsApp Group',
        'Extreme Privacy (Circulated only in paid group)'
      ]
    }
  };

  const handleWhatsAppPayment = () => {
    if (!selectedPlan || !user) return;
    
    // User info extracted from the Supabase session
    const authUser = user as any;
    const fullName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User';
    const email = authUser.email || 'N/A';
    const phone = authUser.user_metadata?.phone || authUser.phone || 'N/A';
    const planName = plans[selectedPlan].name;

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

  return (
    <SubscriptionGate>
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <span className="inline-block bg-rose-50 text-brand px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4">High Touch Service</span>
          <h1 className="text-5xl font-black text-gray-900 mb-4">VIP Concierge & Personal Management</h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed">
            Skip the digital noise. Let our certified relationship managers manually handle your profile and find matches within our exclusive verified circles.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-6">
            <PlanOption
              plan={plans.premium}
              selected={selectedPlan === 'premium'}
              onSelect={() => setSelectedPlan('premium')}
            />
            <PlanOption
              plan={plans.vip}
              selected={selectedPlan === 'vip'}
              onSelect={() => setSelectedPlan('vip')}
            />
          </div>

          <div className={`bg-white rounded-[3rem] border-2 p-10 transition-all duration-500 flex flex-col justify-center min-h-[400px] ${selectedPlan ? 'border-brand shadow-2xl scale-100 opacity-100' : 'border-gray-100 opacity-50 pointer-events-none grayscale'}`}>
            {selectedPlan ? (
              <div className="text-center space-y-6">
                 <div className="w-20 h-20 bg-green-50 text-[#25D366] rounded-full mx-auto flex items-center justify-center mb-4">
                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.571-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                 </div>
                 <h3 className="text-2xl font-black mb-2 px-6">Ready to join {plans[selectedPlan].name}?</h3>
                 <p className="text-gray-500 mb-8 max-w-sm mx-auto">Please securely request the payment details from our administrator via WhatsApp.</p>
                <button
                  onClick={handleWhatsAppPayment}
                  className="w-full py-5 rounded-2xl text-lg font-bold flex items-center justify-center gap-3 transition shadow-xl shadow-green-200 bg-[#25D366] text-white hover:bg-[#1faa51] active:scale-95"
                >
                  Request Payment on WhatsApp
                </button>
              </div>
            ) : (
               <div className="text-center">
                 <h3 className="text-2xl font-black mb-2 text-gray-300">Select a Plan</h3>
                 <p className="text-gray-400">Please choose a VIP Concierge plan from the left to continue.</p>
               </div>
            )}
          </div>
        </div>
      </div>
    </SubscriptionGate>
  );
};

const PlanOption = ({ plan, selected, onSelect }: any) => (
  <div
    onClick={onSelect}
    className={`p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer relative overflow-hidden group ${selected ? 'border-brand bg-rose-50' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
  >
    {plan.isPopular && <div className="absolute top-0 right-0 bg-brand text-white text-[8px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-bl-2xl">Recommended</div>}
    <div className="flex justify-between items-start mb-6">
      <div>
        <h3 className="text-2xl font-black text-gray-900 group-hover:text-brand transition">{plan.name}</h3>
        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">{plan.duration}</p>
      </div>
      <div className="text-right">
        <div className="text-3xl font-black text-gray-900">{plan.price}</div>
        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">One-time payment</div>
      </div>
    </div>
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {plan.features.map((f: string) => (
        <li key={f} className="flex items-center gap-2 text-xs text-gray-600 font-medium">
          <span className="w-1.5 h-1.5 bg-brand rounded-full shrink-0"></span>
          {f}
        </li>
      ))}
    </ul>
  </div>
);

export default VIPConcierge;