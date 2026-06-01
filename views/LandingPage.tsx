
import React, { useState, useEffect, memo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface LandingPageProps {
  isAuthenticated: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({ isAuthenticated }) => {
  const navigate = useNavigate();
  const [callbackForm, setCallbackForm] = useState({ name: '', email: '', phone: '' });
  const [profileCount, setProfileCount] = useState<number | null>(null);

  useEffect(() => {
    const getCount = async () => {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', true);
      setProfileCount(count);
    };
    getCount();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Quick validation for Min Age > Max Age
    const minAge = parseInt((e.currentTarget.querySelector('select[name="minAge"]') as HTMLSelectElement)?.value || '20', 10);
    const maxAge = parseInt((e.currentTarget.querySelector('select[name="maxAge"]') as HTMLSelectElement)?.value || '25', 10);
    
    if (minAge > maxAge) {
      alert("Min age cannot be greater than Max age.");
      return;
    }
    
    navigate('/login');
  };

  const handleCallbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thank you for your interest. A relationship manager will contact you shortly.');
    setCallbackForm({ name: '', email: '', phone: '' });
  };

  const ageOptions = Array.from({ length: 53 }, (_, i) => i + 18);

  const plans = {
    selfService: {
      planId: 'self-service',
      title: 'Self Service',
      tagline: 'Connect directly with verified profiles',
      price: '4,500',
      duration: '6 months',
      features: [
        'Added to our Exclusive Paid Group',
        'Direct contact numbers shared within group',
        'Profiles visible to verified members only',
        'Manage your own matching process'
      ],
    },
    vipService: {
      planId: 'vip-service',
      title: 'VIP Service',
      tagline: 'Personalized matching with a dedicated manager',
      price: '6,500',
      duration: '1 year',
      isRecommended: true,
      features: [
        'Everything in Self Service',
        'Dedicated Personal Manager provided',
        'Family-to-family communication support',
        'Verified interest sharing from top families',
        'Meetings arranged on mutual agreement'
      ],
    }
  };

  return (
    <div className="relative overflow-hidden -mt-20">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero.jpg"
            alt="Traditional Indian Matrimony"
            fetchPriority="high"
            width="1920"
            height="1080"
            className="w-full h-full object-cover filter brightness-[0.4]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-gray-50"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-white space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase tracking-widest">Trusted Matrimony Since 2016</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight text-white">
              Find Your Soulmate <span className="text-brand">Today</span>
            </h1>
            <p className="text-lg text-white/80 font-medium max-w-lg">Bhartiya Rishtey helps thousands of Indian families find genuine connections every year.</p>
          </div>

          {profileCount === 0 ? (
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 text-center animate-in fade-in zoom-in duration-500">
              <div className="w-16 h-16 bg-brand text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_4px_20px_rgba(244,63,94,0.5)]">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Be Our First Member!</h2>
              <p className="text-white/80 mb-8 font-medium">We are launching our exclusive matchmaking platform very soon. Join the waitlist and be the first to get access to premium profiles.</p>
              <Link to="/login" className="inline-block bg-white text-brand px-8 py-4 rounded-xl font-bold text-lg uppercase tracking-widest shadow-xl hover:scale-105 transition-transform">
                Join the Waitlist
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Start Your Search</h2>
              <form onSubmit={handleSearchSubmit} className="space-y-4">
                <SearchSelect name="lookingFor" label="I am looking for" options={['Woman', 'Man']} />
                <div className="grid grid-cols-2 gap-4">
                  <SearchSelect name="minAge" label="Min age" options={ageOptions.map(String)} defaultValue="20" />
                  <SearchSelect name="maxAge" label="Max age" options={ageOptions.map(String)} defaultValue="25" />
                </div>
                <SearchSelect name="community" label="Community" options={['Any', 'Brahmin', 'Agrawal', 'Maratha', 'Punjabi', 'Tamil', 'Telugu']} defaultValue="Any" />
                <button type="submit" className="w-full bg-brand hover:bg-rose-700 text-white py-4 rounded-xl text-lg font-bold tracking-widest transition-all shadow-lg active:scale-95">
                  Search profiles
                </button>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Bhartiya Rishtey?</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">We provide a secure, respectful platform for serious, meaningful relationships.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <BenefitCard icon="⚡" title="Verified Profiles" desc="Every profile undergoes mobile and ID verification for your safety." />
            <BenefitCard icon="🛡️" title="Family Focused" desc="Designed to involve families in the matchmaking journey respectfully." />
            <BenefitCard icon="👁️" title="Privacy Control" desc="You decide who can see your photos and detailed contact information." />
          </div>
        </div>
      </section>
      
      {/* Plans Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Membership Plans</h2>
                <p className="text-gray-500 max-w-2xl mx-auto mb-16">Choose a plan that suits your needs. Complete your profile to unlock full details.</p>
                
                {!isAuthenticated ? (
                  <div className="max-w-2xl mx-auto bg-white rounded-3xl border p-12 shadow-sm text-left">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">How to get started:</h4>
                    <div className="space-y-6 mb-10">
                      <div className="flex items-center gap-5">
                        <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm">1</div>
                        <p className="text-lg font-bold text-gray-700">Log in or register your account</p>
                      </div>
                      <div className="flex items-center gap-5">
                        <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm">2</div>
                        <p className="text-lg font-bold text-gray-700">Complete your profile details</p>
                      </div>
                      <div className="flex items-center gap-5">
                        <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm">3</div>
                        <p className="text-lg font-bold text-gray-700">Select a Service Plan</p>
                      </div>
                    </div>
                    <Link to="/login" className="block w-full bg-brand text-white py-4 rounded-xl font-bold text-lg uppercase tracking-widest text-center shadow-lg hover:bg-rose-700 transition">
                      Get Started Now
                    </Link>
                  </div>
                ) : (
                  <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <PricingCard {...plans.selfService} isAuthenticated={isAuthenticated} />
                      <PricingCard {...plans.vipService} isAuthenticated={isAuthenticated} />
                  </div>
                )}
            </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Success Stories</h2>
            <p className="text-gray-500 mb-16">Happy families brought together by Bhartiya Rishtey.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <StoryCard 
                    image="/story1.jpg"
                    names="Priyanka & Abhay"
                    quote="The verification process gave us the trust we needed to start our journey."
                />
                <StoryCard 
                    image="/story2.jpg"
                    names="Akash & Supriya"
                    quote="Bhartiya Rishtey made our meeting possible. It is a highly reliable platform."
                />
                <StoryCard 
                    image="/story3.jpg"
                    names="Rikhita & Akhil"
                    quote="A beautiful connection facilitated by this amazing service. Thank you!"
                />
            </div>
            <Link to="/success-stories" className="inline-block mt-12 text-brand font-bold uppercase tracking-widest text-xs hover:underline">Read more stories →</Link>
        </div>
      </section>

      {/* Callback Form */}
      <section className="py-24 bg-rose-600 text-white">
        <div className="max-w-5xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-grow space-y-4 text-center lg:text-left">
            <h2 className="text-4xl font-black">Need Personal Guidance?</h2>
            <p className="text-rose-100 text-lg">Our relationship managers are happy to help you find the right match.</p>
          </div>
          <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl text-gray-900">
            <h3 className="text-xl font-bold mb-6">Request a Callback</h3>
            <form onSubmit={handleCallbackSubmit} className="space-y-4">
              <input type="text" placeholder="Full Name" aria-label="Full Name" required value={callbackForm.name} onChange={e => setCallbackForm({...callbackForm, name: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-1 focus:ring-brand" />
              <input type="email" placeholder="Email Address" aria-label="Email" required value={callbackForm.email} onChange={e => setCallbackForm({...callbackForm, email: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-1 focus:ring-brand" />
              <input type="tel" placeholder="Phone Number" aria-label="Phone Number" minLength={10} maxLength={15} required value={callbackForm.phone} onChange={e => setCallbackForm({...callbackForm, phone: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-1 focus:ring-brand" />
              <button type="submit" className="w-full bg-brand text-white py-3 rounded-xl font-bold tracking-widest hover:bg-rose-700 transition">Call me back</button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

const PricingCard = ({ planId, title, tagline, price, duration, features, isRecommended, isAuthenticated }: any) => {
    const navigate = useNavigate();
    return (
        <div className={`bg-white p-10 rounded-3xl border-2 flex flex-col text-left ${isRecommended ? 'border-brand shadow-lg' : 'border-gray-100'}`}>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 text-sm font-medium">{tagline}</p>
            <div className="mt-8 mb-10">
                <span className="text-5xl font-black text-gray-900">₹{price}</span>
                <span className="text-gray-400 font-bold text-xs"> / {duration}</span>
            </div>
            <ul className="space-y-4 text-gray-600 mb-12 flex-grow">
                {features.map((feature: string) => (
                    <li key={feature} className="flex items-start gap-3">
                        <span className="text-brand font-bold">✓</span>
                        <span className="text-sm font-medium">{feature}</span>
                    </li>
                ))}
            </ul>
            <button
                onClick={() => navigate(`/checkout?plan=${planId}`)}
                className={`w-full py-4 rounded-xl font-bold text-lg uppercase tracking-widest transition-all ${isRecommended ? 'bg-brand text-white shadow-lg' : 'bg-gray-900 text-white'}`}
            >
                Choose Plan
            </button>
        </div>
    );
};

const SearchSelect = ({ name, label, options, defaultValue }: { name?: string; label: string; options: string[]; defaultValue?: string }) => (
  <div>
    <label className="block text-sm font-bold text-gray-700 mb-1 text-left">{label}</label>
    <select name={name} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 font-bold text-gray-700 outline-none focus:ring-1 focus:ring-brand transition-all appearance-none" defaultValue={defaultValue}>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

const BenefitCard = ({ icon, title, desc }: { icon: string; title: string; desc: string }) => (
  <div className="bg-white p-10 rounded-3xl border shadow-sm hover:shadow-md transition text-center">
    <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-3xl mb-6 mx-auto">{icon}</div>
    <h3 className="text-xl font-bold mb-3 text-gray-900">{title}</h3>
    <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
  </div>
);

const StoryCard = ({ image, names, quote }: { image: string; names: string; quote: string }) => (
  <div className="bg-white rounded-3xl overflow-hidden border shadow-sm flex flex-col text-left">
    <img src={image} className="w-full aspect-square object-cover" alt={names} loading="lazy" width="400" height="400" />
    <div className="p-6">
      <h4 className="font-bold text-lg mb-2">{names}</h4>
      <p className="text-gray-500 text-sm italic">"{quote}"</p>
    </div>
  </div>
);

export default LandingPage;
