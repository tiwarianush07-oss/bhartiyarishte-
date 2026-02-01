import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PLANS, SUB_CASTES } from '../constants';
import { Shield, Lock, Users, Sparkles, CheckCircle2, Calendar, MessageCircle, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Search Widget State
  const [searchParams, setSearchParams] = useState({
    gender: 'Female',
    ageFrom: '24',
    ageTo: '30',
    caste: SUB_CASTES[0],
    motherTongue: 'Hindi'
  });

  const handleSearch = () => {
    // Redirect to register for new users, or profile list for logged in
    if (user) {
      navigate('/profiles');
    } else {
      navigate('/register');
    }
  };

  const handlePlanSelect = (planId: string) => {
    if (user) {
      navigate('/dashboard', { state: { selectedPlan: planId } });
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      
      {/* 1. Hero Section */}
      <div className="relative h-[600px] md:h-[700px] flex items-center justify-center">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://i.pinimg.com/736x/ec/64/00/ec640079943b7179f878b3f2f0931535.jpg" 
            alt="Traditional Indian Wedding Background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30"></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 font-serif tracking-tight drop-shadow-lg">
            Find Your Special Someone
          </h1>
          <p className="text-lg md:text-xl text-slate-100 mb-12 max-w-2xl mx-auto font-light drop-shadow-md">
            Join millions of people finding their perfect match through our trusted platform
          </p>

          {/* Search Widget Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-2xl max-w-5xl mx-auto border border-white/20">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div className="text-left">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Gender *</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-slate-700 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                  value={searchParams.gender}
                  onChange={(e) => setSearchParams({...searchParams, gender: e.target.value})}
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </div>
              <div className="text-left">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Age From</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-slate-700 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                  value={searchParams.ageFrom}
                  onChange={(e) => setSearchParams({...searchParams, ageFrom: e.target.value})}
                >
                  {[...Array(43)].map((_, i) => <option key={i} value={18+i}>{18+i}</option>)}
                </select>
              </div>
              <div className="text-left">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Age To</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-slate-700 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                  value={searchParams.ageTo}
                  onChange={(e) => setSearchParams({...searchParams, ageTo: e.target.value})}
                >
                   {[...Array(43)].map((_, i) => <option key={i} value={18+i}>{18+i}</option>)}
                </select>
              </div>
              <div className="text-left">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Caste</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-slate-700 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                  value={searchParams.caste}
                  onChange={(e) => setSearchParams({...searchParams, caste: e.target.value})}
                >
                  {SUB_CASTES.map((caste) => (
                    <option key={caste} value={caste}>{caste}</option>
                  ))}
                </select>
              </div>
              <div className="text-left">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Mother Tongue</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-slate-700 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                  value={searchParams.motherTongue}
                  onChange={(e) => setSearchParams({...searchParams, motherTongue: e.target.value})}
                >
                  <option value="Hindi">Hindi</option>
                  <option value="English">English</option>
                  <option value="Marathi">Marathi</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Telugu">Telugu</option>
                  <option value="Kannada">Kannada</option>
                  <option value="Gujarati">Gujarati</option>
                  <option value="Bengali">Bengali</option>
                  <option value="Malayalam">Malayalam</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6">
              <button 
                onClick={handleSearch}
                className="w-full md:w-auto px-12 py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-pink-600/30"
              >
                Let's Begin
              </button>
            </div>
            <p className="mt-4 text-slate-500 text-sm font-medium">Over 1 Million+ Matches Found</p>
          </div>
        </div>
      </div>

      {/* 2. Why Join Us (Benefits) */}
      <div id="benefits" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 font-serif">Why Join Us?</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Discover the benefits that make us the most trusted matrimonial platform</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { 
                icon: <Shield size={32} />, 
                title: "Verified Profiles", 
                desc: "All profiles are thoroughly verified to ensure authenticity and safety for our members." 
              },
              { 
                icon: <Lock size={32} />, 
                title: "Privacy Controls", 
                desc: "Complete control over your profile visibility and who can contact you." 
              },
              { 
                icon: <Users size={32} />, 
                title: "Community Features", 
                desc: "Connect with like-minded individuals through our vibrant community features." 
              },
              { 
                icon: <Sparkles size={32} />, 
                title: "Advanced Matching", 
                desc: "Our intelligent algorithm finds the most compatible matches based on your preferences." 
              }
            ].map((feature, idx) => (
              <div key={idx} className="p-8 rounded-2xl bg-white border border-slate-100 shadow-lg hover:shadow-xl transition-shadow text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pink-50 text-pink-600 mb-6 group-hover:bg-pink-600 group-hover:text-white transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Membership Plans */}
      <div id="plans" className="py-20 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 font-serif">Choose Your Plan</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Select the perfect plan that matches your needs and budget</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {PLANS.map((plan) => (
              <div 
                key={plan.id} 
                className={`relative bg-white rounded-3xl p-8 md:p-10 shadow-xl border-2 transition-transform hover:-translate-y-2 duration-300 ${plan.recommended ? 'border-pink-500' : 'border-transparent'}`}
              >
                {plan.recommended && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-pink-600 text-white px-6 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide shadow-lg">
                    Recommended
                  </div>
                )}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                  <p className="text-slate-500 mb-6">{plan.id === 'SELF_SERVICE' ? 'Perfect for getting started' : 'Includes Self Service + Extra Support'}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-extrabold text-slate-900">₹{plan.price.toLocaleString()}</span>
                    <span className="ml-2 text-slate-500 font-medium">/{plan.duration}</span>
                  </div>
                </div>
                
                <ul className="space-y-4 mb-10">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-left">
                      <CheckCircle2 className="flex-shrink-0 w-6 h-6 text-green-500 mr-3" />
                      <span className="text-slate-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={() => handlePlanSelect(plan.id)}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                    plan.recommended 
                      ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-900/20' 
                      : 'bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-100'
                  }`}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
        
        {/* Decorative background element */}
        <div className="absolute top-0 left-0 w-full h-full bg-violet-50/50 -z-0"></div>
      </div>

      {/* 4. Community Highlights */}
      <div id="community" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 font-serif">Community Highlights</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Stay updated with the latest news, events, and stories from our community</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="group bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-100 hover:shadow-2xl transition-all duration-300">
              <div className="h-48 overflow-hidden relative">
                <div className="absolute top-4 left-4 bg-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 z-10">
                  <Calendar size={12} /> Event
                </div>
                <img 
                  src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Community Meetup" 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Community Meetup Success</h3>
                <p className="text-sm text-slate-400 mb-4">March 15, 2024</p>
                <p className="text-slate-600 mb-6 line-clamp-3">
                  Our recent community gathering brought together over 200 members for a memorable evening of connection and celebration.
                </p>
                <button className="text-pink-600 font-semibold text-sm hover:underline">Read More</button>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-100 hover:shadow-2xl transition-all duration-300">
              <div className="h-48 overflow-hidden relative">
                <div className="absolute top-4 left-4 bg-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 z-10">
                  <MessageCircle size={12} /> Update
                </div>
                <img 
                  src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Member Benefits" 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2 text-pink-600">Member Benefits Expanded</h3>
                <p className="text-sm text-slate-400 mb-4">March 10, 2024</p>
                <div className="bg-violet-50 p-4 rounded-lg mb-6 border border-violet-100">
                  <p className="text-slate-700 text-sm italic">
                    "We are excited to announce new features including video calls, enhanced privacy controls, and personalized recommendations."
                  </p>
                </div>
                <button className="text-pink-600 font-semibold text-sm hover:underline">Read More</button>
              </div>
            </div>

            {/* Card 3 */}
            <div className="group bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-100 hover:shadow-2xl transition-all duration-300">
              <div className="h-48 overflow-hidden relative">
                <div className="absolute top-4 left-4 bg-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 z-10">
                  <Heart size={12} /> Story
                </div>
                <img 
                  src="https://images.unsplash.com/photo-1621621667797-e06afc217fb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Success Story" 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Success Story Spotlight</h3>
                <p className="text-sm text-slate-400 mb-4">March 5, 2024</p>
                <p className="text-slate-600 mb-6 line-clamp-3">
                  Read how Anjali and Vikram found their perfect match through our platform and are now planning their dream wedding.
                </p>
                <button className="text-pink-600 font-semibold text-sm hover:underline">Read More</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};