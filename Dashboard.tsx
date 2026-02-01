import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PLANS, UPI_ID, SUB_CASTES } from '../constants';
import { supabase, uploadProfilePhoto, submitPaymentProof } from '../services/api';
import { Check, Upload, Copy, Smartphone, ExternalLink, QrCode } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'profile' | 'membership'>('profile');
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [profileData, setProfileData] = useState({
    age: '', gender: 'Male', education: '', profession: '', location: '', sub_caste: SUB_CASTES[0], bio: '', photo_url: ''
  });

  const [selectedPlan, setSelectedPlan] = useState(PLANS[0].id);
  const [txnId, setTxnId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);

  const currentPlanDetails = PLANS.find(p => p.id === selectedPlan) || PLANS[0];

  useEffect(() => {
    if (location.state && location.state.selectedPlan) {
      setActiveTab('membership');
      setSelectedPlan(location.state.selectedPlan);
    }
    if (user) {
        fetchProfile();
    }
  }, [location, user]);

  const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('user_id', user?.id).single();
      if (data) setProfileData(data);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const upiDeepLink = `upi://pay?pa=${UPI_ID}&pn=Bhartiya%20Brahmin%20Rishtey&am=${currentPlanDetails.price}&cu=INR&tn=Membership%20Plan%20${currentPlanDetails.name}`;

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
        let photoUrl = profileData.photo_url;
        if (screenshot) {
            photoUrl = await uploadProfilePhoto(screenshot, user!.id);
        }

        const { error } = await supabase.from('profiles').upsert({
            user_id: user?.id,
            ...profileData,
            photo_url: photoUrl,
            caste: 'Brahmin'
        });

        if (error) throw error;
        alert('Profile Updated Successfully!');
    } catch (e: any) {
        alert(e.message || 'Failed to update profile');
    } finally {
        setUploading(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!screenshot) return alert('Please upload success screenshot');
    
    setUploading(true);
    try {
        await submitPaymentProof(user!.id, { plan: selectedPlan, upi_txn_id: txnId }, screenshot);
        alert('Payment proof submitted. Admin will verify and activate your plan shortly.');
        setTxnId('');
        setScreenshot(null);
    } catch (e: any) {
        alert(e.message || 'Payment submission failed');
    } finally {
        setUploading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 font-serif uppercase tracking-tight">Namaste, {user?.name}</h1>
            <p className="text-slate-500 mt-1">Brahmin Exclusive Community Portal</p>
          </div>
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-saffron-50 text-saffron-800 font-semibold border border-saffron-200 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-saffron-500 mr-2 animate-pulse"></span>
            Status: <span className="ml-2 uppercase text-saffron-900">{user?.role}</span>
          </div>
        </div>

        <div className="bg-white shadow-xl rounded-2xl overflow-hidden mb-12 border border-slate-100">
            <div className="border-b border-gray-100 bg-slate-50/50">
                <nav className="-mb-px flex">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`${activeTab === 'profile' ? 'border-pink-600 text-pink-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} w-1/2 py-5 px-1 text-center border-b-2 font-bold text-sm transition-all`}
                    >
                        My Brahmin Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('membership')}
                        className={`${activeTab === 'membership' ? 'border-pink-600 text-pink-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} w-1/2 py-5 px-1 text-center border-b-2 font-bold text-sm transition-all`}
                    >
                        Premium Benefits
                    </button>
                </nav>
            </div>

            <div className="p-8">
                {activeTab === 'profile' ? (
                    <form onSubmit={handleProfileSubmit} className="space-y-8 max-w-4xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">Sub-Caste *</label>
                                <select 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                                    value={profileData.sub_caste}
                                    onChange={e => setProfileData({...profileData, sub_caste: e.target.value})}
                                >
                                    {SUB_CASTES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                             </div>
                             <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">Current Location *</label>
                                <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-pink-500 outline-none transition-all" 
                                    placeholder="City, State"
                                    value={profileData.location} onChange={e => setProfileData({...profileData, location: e.target.value})} />
                             </div>
                             <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">Age *</label>
                                <input type="number" required className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-pink-500 outline-none transition-all" 
                                    value={profileData.age} onChange={e => setProfileData({...profileData, age: e.target.value})} />
                             </div>
                             <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">Highest Education *</label>
                                <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-pink-500 outline-none transition-all" 
                                    value={profileData.education} onChange={e => setProfileData({...profileData, education: e.target.value})} />
                             </div>
                             <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">Profession *</label>
                                <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-pink-500 outline-none transition-all" 
                                    value={profileData.profession} onChange={e => setProfileData({...profileData, profession: e.target.value})} />
                             </div>
                             <div className="md:col-span-2 space-y-2">
                                <label className="block text-sm font-bold text-slate-700">About Me & Family Bio</label>
                                <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-pink-500 outline-none transition-all" rows={4}
                                    placeholder="Write about your values, gothra, and expectations..."
                                    value={profileData.bio} onChange={e => setProfileData({...profileData, bio: e.target.value})}></textarea>
                             </div>
                             <div className="md:col-span-2 space-y-2">
                                <label className="block text-sm font-bold text-slate-700">Recent Profile Photo</label>
                                <div className="mt-1 flex justify-center px-6 pt-10 pb-10 border-2 border-slate-200 border-dashed rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group relative overflow-hidden">
                                    {screenshot ? (
                                        <p className="text-pink-600 font-bold">{screenshot.name} selected</p>
                                    ) : (
                                        <div className="space-y-2 text-center">
                                            <Upload className="mx-auto h-12 w-12 text-slate-400 group-hover:text-pink-500 transition-colors" />
                                            <div className="flex text-sm text-slate-600">
                                                <label className="relative cursor-pointer font-bold text-pink-600 hover:text-pink-700">
                                                    <span>Click to choose photo</span>
                                                    <input type="file" className="sr-only" onChange={e => setScreenshot(e.target.files ? e.target.files[0] : null)} />
                                                </label>
                                            </div>
                                            <p className="text-xs text-slate-400">Professional photos increase responses by 3x</p>
                                        </div>
                                    )}
                                </div>
                             </div>
                        </div>
                        <button type="submit" disabled={uploading} className="w-full py-4 px-6 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all transform hover:scale-[1.01] active:scale-[0.99]">
                            {uploading ? 'Updating Records...' : 'Save Brahmin Profile'}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-12">
                        {/* Membership selection UI remains similar but uses supabase for storage */}
                         <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-600/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                                    <Smartphone className="text-pink-500" />
                                    Brahmin Community Support Fund
                                </h3>

                                <div className="grid md:grid-cols-3 gap-10">
                                    <div className="md:col-span-1 flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-2xl">
                                        <img 
                                            src={`https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(upiDeepLink)}&choe=UTF-8`} 
                                            alt="UPI QR Code" 
                                            className="w-full max-w-[180px] h-auto"
                                        />
                                        <p className="mt-4 text-slate-900 text-xs font-bold text-center uppercase tracking-widest">Scan with GPay/Paytm</p>
                                    </div>

                                    <div className="md:col-span-2 space-y-6">
                                        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                                            <div className="flex justify-between items-end mb-6">
                                                <div>
                                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Payable Contribution</p>
                                                    <p className="text-4xl font-black text-white">₹{currentPlanDetails.price}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Service Level</p>
                                                    <p className="text-lg font-bold text-pink-500">{currentPlanDetails.name}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <code className="flex-grow bg-slate-950 px-4 py-3 rounded-lg text-pink-500 font-mono text-sm border border-slate-700 truncate">
                                                    {UPI_ID}
                                                </code>
                                                <button 
                                                    onClick={copyToClipboard}
                                                    className={`p-3 rounded-lg transition-all ${copied ? 'bg-green-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
                                                >
                                                    {copied ? <Check size={18} /> : <Copy size={18} />}
                                                </button>
                                            </div>
                                        </div>

                                        <a href={upiDeepLink} className="w-full flex items-center justify-center gap-3 bg-pink-600 hover:bg-pink-700 text-white py-4 rounded-xl font-black text-lg transition-all shadow-xl shadow-pink-600/20 active:scale-95">
                                            <Smartphone size={22} />
                                            Pay via UPI App
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="max-w-2xl mx-auto">
                            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 font-serif">
                                <Upload className="text-pink-600" />
                                Proof of Payment
                            </h3>
                            <form onSubmit={handlePaymentSubmit} className="space-y-6 bg-white p-8 rounded-3xl border border-slate-100 shadow-xl">
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700">UTR / Ref Number *</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={txnId} 
                                        onChange={e => setTxnId(e.target.value)} 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-pink-500 outline-none transition-all font-mono" 
                                        placeholder="12-digit transaction ID" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700">Payment Screenshot *</label>
                                    <input 
                                        type="file" 
                                        required 
                                        accept="image/*"
                                        onChange={e => setScreenshot(e.target.files ? e.target.files[0] : null)} 
                                        className="w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100 border-2 border-dashed border-slate-200 rounded-xl p-2" 
                                    />
                                </div>
                                <button type="submit" disabled={uploading} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                                    {uploading ? 'Verifying...' : 'Submit Activation Request'}
                                    <ExternalLink size={18} />
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};