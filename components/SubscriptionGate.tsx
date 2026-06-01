import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface SubscriptionGateProps {
  children: React.ReactNode;
}

const SubscriptionGate: React.FC<SubscriptionGateProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 text-lg mb-16 max-w-3xl mx-auto leading-relaxed">
          Choose a plan that fits your journey to finding the perfect partner. Experience elite matchmaking after you sign in.
        </p>

        <div className="max-w-2xl mx-auto bg-white rounded-[3.5rem] border border-gray-100 p-12 sm:p-16 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] text-left">
          <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-10">To join our community and choose a plan:</h4>
          
          <div className="space-y-8 mb-14">
            <div className="flex items-center gap-6">
              <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center font-black text-sm shadow-lg shadow-rose-200 shrink-0">1</div>
              <p className="text-xl font-bold text-gray-700 tracking-tight">Log in to your account</p>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center font-black text-sm shadow-lg shadow-rose-200 shrink-0">2</div>
              <p className="text-xl font-bold text-gray-700 tracking-tight">Access the Self Service or VIP Service plans</p>
            </div>
          </div>

          <button 
            onClick={() => navigate('/login')}
            className="w-full bg-brand text-white py-6 rounded-[1.5rem] font-black text-xl uppercase tracking-widest shadow-[0_15px_30px_-5px_rgba(225,29,72,0.4)] hover:bg-rose-700 transition active:scale-[0.98]"
          >
            Log In Now
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default SubscriptionGate;