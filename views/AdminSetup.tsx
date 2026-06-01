import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const ADMIN_SECRET_KEY = import.meta.env.VITE_ADMIN_SECRET_KEY || '';

const AdminSetup: React.FC = () => {
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (secret !== ADMIN_SECRET_KEY) {
      setError('Invalid admin secret key.');
      return;
    }

    if (!user) {
      setError('You must be logged in first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Grant admin flag in profiles
      const { error: profileError } = await supabase.rpc('set_user_as_admin', {
        target_user_id: user.id
      });
      
      // 2. Also try to update the users table role if the rpc exists, fallback silently if not
      await supabase.from('users').update({ is_admin: true, role: 'admin' }).eq('id', user.id);

      if (profileError) {
         console.warn("RPC set_user_as_admin failed or not found. Falling back to direct profile update...");
         const { error: fallbackError } = await supabase.from('profiles').update({ is_admin: true }).eq('user_id', user.id);
         if (fallbackError) throw fallbackError;
      }

      await refreshProfile();
      navigate('/admin');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to promote to admin. Check database permissions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border shadow-sm">
        <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm mx-auto">
          🔐
        </div>
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Admin Setup</h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          Your account is not recognized as an Admin in the database. Enter the master secret key to elevate your privileges.
        </p>

        <form onSubmit={handlePromote} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="Enter Admin Secret Key"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none transition font-mono text-center"
              required
            />
          </div>
          
          {error && <p className="text-rose-500 text-[11px] font-bold text-center uppercase">{error}</p>}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold uppercase tracking-widest text-[11px] hover:bg-black transition shadow-md disabled:opacity-50"
          >
            {loading ? 'Promoting...' : 'Authorize My Account'}
          </button>
        </form>
        
        <button 
          onClick={() => navigate('/')}
          className="w-full mt-4 text-gray-400 hover:text-gray-600 text-[11px] font-bold uppercase tracking-widest transition"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
};

export default AdminSetup;
