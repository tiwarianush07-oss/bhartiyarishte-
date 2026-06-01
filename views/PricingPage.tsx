import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SubscriptionGate from '../components/SubscriptionGate';

const PricingPage: React.FC<{ onPaymentSuccess: () => void }> = ({ onPaymentSuccess }) => {
  const navigate = useNavigate();

  const plans = [
    {
      planId: 'self-service',
      title: 'Self Service',
      tagline: 'Connect directly with verified profiles',
      price: '4,500',
      duration: '6 months',
      features: [
        'Added to our Exclusive Paid Group',
        'Direct contact numbers on all profiles',
        'Secure sharing within verified circles',
        'Self-managed matching process'
      ],
    },
    {
      planId: 'vip-service',
      title: 'VIP Service',
      tagline: 'Personalized matching with a mediator',
      price: '6,500',
      duration: '1 year',
      isRecommended: true,
      features: [
        'Everything in Self Service',
        'Dedicated Personal Mediator provided',
        'Professional family-to-family communication',
        'Verified interest sharing from top families',
        'Coordinated meetings on mutual agreement'
      ],
    }
  ];

  return (
    <SubscriptionGate>
      <div className="bg-gray-50 py-12 sm:py-24 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-rose-50 text-brand px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] mb-6">
            💎 Elite Memberships
          </div>
          <h1 className="text-4xl sm:text-7xl font-black text-gray-900 mb-6 tracking-tight">Our Service Plans</h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-20 leading-relaxed font-medium">
            Choose a plan that fits your journey to finding the perfect partner. 
            All members undergo strict verification for your security.
          </p>
          
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-y-16 gap-x-12 items-stretch">
            {plans.map((plan) => (
              <PricingCard key={plan.planId} {...plan} />
            ))}
          </div>

          <div className="mt-24 p-12 bg-gray-900 rounded-[4rem] text-white flex flex-col md:flex-row items-center justify-between gap-12 shadow-3xl text-left relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:scale-125 transition-transform duration-1000">👑</div>
             <div className="relative z-10 max-w-xl">
                <h3 className="text-3xl font-black mb-4 tracking-tight">Need Custom High-Touch Assistance?</h3>
                <p className="text-gray-400 text-lg">Our relationship managers are available for bespoke concierge services tailored to specific heritage and lifestyle requirements.</p>
             </div>
             <button 
                onClick={() => navigate('/concierge')}
                className="relative z-10 w-full md:w-auto bg-brand text-white px-12 py-5 rounded-3xl font-black uppercase tracking-widest hover:bg-rose-700 transition shadow-xl shadow-rose-900/50 hover:scale-105 active:scale-95"
             >
                Explore VIP Concierge
             </button>
          </div>
        </div>
      </div>
    </SubscriptionGate>
  );
};

const PricingCard = ({ planId, title, tagline, price, duration, features, isRecommended }: any) => {
    const navigate = useNavigate();
    
    const handleJoinNow = () => {
        navigate(`/checkout?plan=${planId}`);
    };
    
    return (
        <div className={`relative bg-white p-10 sm:p-14 rounded-[4rem] border-2 flex flex-col transition-all duration-500 text-left ${isRecommended ? 'border-brand shadow-[0_30px_60px_-15px_rgba(225,29,72,0.25)] scale-100 lg:scale-105' : 'border-gray-100 shadow-xl hover:border-gray-300'}`}>
            {isRecommended && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand text-white text-xs font-black uppercase tracking-[0.3em] px-8 py-3 rounded-full shadow-2xl">
                Premium Choice
              </div>
            )}
            <div className="mb-12">
                <h3 className="text-4xl font-black text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-lg font-medium">{tagline}</p>
                <div className="mt-10 flex items-baseline gap-2">
                    <span className="text-7xl font-black text-gray-900 tracking-tighter">₹{price}</span>
                    <span className="text-gray-400 font-black uppercase tracking-widest text-sm"> / {duration}</span>
                </div>
            </div>
            <ul className="space-y-6 text-gray-600 mb-14 flex-grow">
                {features.map((feature: string) => (
                    <li key={feature} className="flex items-start gap-5">
                        <div className="w-8 h-8 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0 shadow-sm">
                          <span className="text-brand font-black text-sm">✓</span>
                        </div>
                        <span className="text-base font-bold text-gray-700 leading-relaxed pt-1">{feature}</span>
                    </li>
                ))}
            </ul>
            <button
                onClick={handleJoinNow}
                className={`w-full py-6 rounded-3xl font-black text-xl uppercase tracking-widest transition-all ${isRecommended ? 'bg-brand text-white shadow-2xl shadow-rose-300 hover:bg-rose-700 hover:scale-[1.03]' : 'bg-gray-900 text-white hover:bg-black hover:scale-[1.03]'}`}
            >
                Choose This Plan
            </button>
        </div>
    );
};

export default PricingPage;