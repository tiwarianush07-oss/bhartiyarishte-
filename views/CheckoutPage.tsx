import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SubscriptionGate from '../components/SubscriptionGate';
import { useAuth } from '../context/AuthContext';

interface CheckoutPageProps {
  onPaymentSuccess: () => void;
}

const planDetails = {
    'self-service': {
      planId: 'self-service',
      name: 'Self Service',
      price: '4,500',
      duration: '6 months',
      features: [
        'You will be added to our Paid Group',
        'All profiles will be posted with contact numbers',
        'Profiles will only be shared within the group',
      ],
      isPopular: false,
    },
    'vip-service': {
      planId: 'vip-service',
      name: 'VIP Service',
      price: '6,500',
      duration: '1 year',
      features: [
        'Everything in Self Service',
        'A mediator will be provided',
        'Mediator will communicate with matched profiles',
        'Share profiles of interested families',
        'Arrange meetings if both parties agree',
      ],
      isPopular: true,
    }
};

const CheckoutPage: React.FC<CheckoutPageProps> = ({ onPaymentSuccess }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const params = new URLSearchParams(location.search);
  const initialPlanId = params.get('plan') as keyof typeof planDetails | null;
  const [selectedPlan, setSelectedPlan] = useState<string>(initialPlanId || '');
  const handleWhatsAppPayment = () => {
    if (!selectedPlan) {
      alert("Please select a plan first.");
      return;
    }
    
    const planName = planDetails[selectedPlan as keyof typeof planDetails]?.name || selectedPlan;
    
    // User info extracted from the Supabase session if available
    const authUser = user as any;
    const fullName = authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0] || 'User';
    const email = authUser?.email || 'N/A';
    const phone = authUser?.user_metadata?.phone || authUser?.phone || 'N/A';

    const messageTemplate = `Hello, I want to purchase a membership plan on Bhartiya Rishtey.

Name: ${fullName}
Email: ${email}
Phone: ${phone}
Selected Plan: ${planName}

Please send me the payment details.`;

    const whatsappUrl = `https://wa.me/911175557?text=${encodeURIComponent(messageTemplate)}`;
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <SubscriptionGate>
      <div className="bg-gray-50 py-12 sm:py-20 min-h-screen">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-8 text-center">Complete Your Subscription</h1>
          
          <div className="max-w-xl mx-auto">
            <div className="bg-white p-10 rounded-3xl shadow-lg border border-gray-100 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-green-50 text-[#25D366] rounded-full mx-auto flex items-center justify-center mb-6">
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.571-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-4">Request Payment Details</h2>
              <p className="text-gray-500 mb-8 max-w-sm">Please securely request the payment details from our administrator via WhatsApp to complete your subscription.</p>
              
              <div className="w-full mb-8 text-left">
                <label className="block text-sm font-bold text-gray-700 mb-2">Confirm Your Plan</label>
                <select 
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none transition font-medium"
                >
                  <option value="" disabled>Select a plan...</option>
                  <option value="self-service">Self Service - ₹4,500</option>
                  <option value="vip-service">VIP Service - ₹6,500</option>
                </select>
              </div>

              <button 
                onClick={handleWhatsAppPayment}
                className="w-full py-5 rounded-2xl text-lg font-bold flex items-center justify-center gap-3 transition shadow-xl shadow-green-200 bg-[#25D366] text-white hover:bg-[#1faa51] active:scale-95"
              >
                Request Payment on WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </SubscriptionGate>
  );
};

export default CheckoutPage;