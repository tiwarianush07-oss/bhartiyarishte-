import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';
import { mapAuthError } from '../utils/errorMapper';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  // getRedirectPath removed, logic centralized in App.tsx

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let response;
      if (isSignUp) {
        response = await supabase.auth.signUp({ 
           email, 
           password,
           options: { data: { role: 'user' } }
        });
      } else {
        response = await supabase.auth.signInWithPassword({ email, password });
      }

      if (response.error) throw response.error;
      
      if (isSignUp && response.data.user) {
         showToast('Account created! Please complete your profile.', 'success');
      }
      // Note: We do not call navigate() here. 
      // App.tsx acts as the single source of truth and will handle routing 
      // via <Navigate /> once AuthContext sets isAuthenticated = true.
    } catch (err: any) {
      console.error("LoginPage Auth Error:", err);
      const displayError = mapAuthError(err.message);
      
      setError(displayError);
      showToast(isSignUp ? 'Registration failed. ' + displayError : 'Login failed. ' + displayError, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border transition-all">
        <div className="bg-brand p-10 text-white text-center">
          <h2 className="text-3xl font-bold">{isSignUp ? 'Create Profile' : 'Welcome Back'}</h2>
          <p className="mt-2 text-rose-100 font-medium uppercase text-[10px] tracking-widest">Find Your Life Partner Today</p>
        </div>
        
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold leading-relaxed">
              {error}
            </div>
          )}
          
          <form onSubmit={handleAuthAction} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                className="w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-1 focus:ring-brand outline-none font-medium text-gray-700" 
                placeholder="name@example.com"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                className="w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-1 focus:ring-brand outline-none font-medium text-gray-700" 
                placeholder="••••••••"
              />
            </div>
            <div className="pt-4">
               <button 
                 type="submit" 
                 disabled={loading} 
                 className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold uppercase tracking-widest text-[11px] shadow-lg hover:bg-black transition disabled:opacity-50"
               >
                 {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Secure Login')}
               </button>
            </div>

            <div className="relative mt-6 mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                <span className="bg-white px-4 text-gray-400">Or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                try {
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                      redirectTo: window.location.origin
                    }
                  });
                  if (error) throw error;
                } catch (err: any) {
                  showToast('Google login failed: ' + err.message, 'error');
                }
              }}
              className="w-full bg-white border border-gray-200 text-gray-700 py-3.5 rounded-xl font-bold uppercase tracking-widest text-[11px] shadow-sm hover:bg-gray-50 flex items-center justify-center gap-2 transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </form>

          <div className="mt-8 text-center text-[11px]">
             <span className="text-gray-400 font-bold uppercase tracking-widest">
               {isSignUp ? 'Already a member? ' : "Not registered yet? "}
             </span>
             <button onClick={() => setIsSignUp(!isSignUp)} className="font-bold uppercase tracking-widest text-brand ml-2 hover:underline">
               {isSignUp ? 'Login' : 'Signup'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;