import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Removed incorrect request import from services/api
import { TURNSTILE_SITE_KEY } from '../constants';

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);

    try {
      // Use the register function from AuthContext which handles supabase auth and user creation
      await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });

      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-slate-200">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 font-serif">Create Account</h2>
          <div className="mt-4 bg-orange-50 border border-orange-200 p-3 rounded-md">
            <p className="text-saffron-800 font-semibold text-sm">
              Note: This platform is exclusively for the Brahmin community. Verification will be required.
            </p>
          </div>
        </div>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm text-center">{error}</div>}
        
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <input
            name="name"
            type="text"
            required
            className="appearance-none relative block w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-saffron-500 focus:border-saffron-500 sm:text-sm"
            placeholder="Full Name"
            onChange={handleChange}
          />
          <input
            name="email"
            type="email"
            required
            className="appearance-none relative block w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-saffron-500 focus:border-saffron-500 sm:text-sm"
            placeholder="Email Address"
            onChange={handleChange}
          />
          <input
            name="phone"
            type="tel"
            required
            className="appearance-none relative block w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-saffron-500 focus:border-saffron-500 sm:text-sm"
            placeholder="Phone Number"
            onChange={handleChange}
          />
          <input
            name="password"
            type="password"
            required
            className="appearance-none relative block w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-saffron-500 focus:border-saffron-500 sm:text-sm"
            placeholder="Password"
            onChange={handleChange}
          />
          <input
            name="confirmPassword"
            type="password"
            required
            className="appearance-none relative block w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-saffron-500 focus:border-saffron-500 sm:text-sm"
            placeholder="Confirm Password"
            onChange={handleChange}
          />

          <div className="flex justify-center py-2">
            <div className="cf-turnstile" data-sitekey={TURNSTILE_SITE_KEY}></div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-saffron-600 hover:bg-saffron-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-saffron-500"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
};