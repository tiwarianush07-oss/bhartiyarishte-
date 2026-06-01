import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '../lib/supabase';
import { getProfilePhotos, uploadProfilePhoto, deleteProfilePhoto, setPrimaryPhoto } from '../services/photoService';
import { Photo, Profile } from '../types';
import { useToast } from '../components/Toast';

const MAX_PHOTOS = 6;
const MAX_FILE_SIZE_MB = 2;

const MyProfile: React.FC = () => {
  const [activeTab, setActiveTab] = useState('basic');
  const [profile, setProfile] = useState<Partial<Profile & { profile_completed: boolean }>>({});
  const [hasPrefs, setHasPrefs] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState('');
  const [showToast, setShowToast] = useState(false);
  const { showToast: notify } = useToast();

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoLoading, setPhotoLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initUser = async () => {
      setLoadingProfile(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);

        // Run all 3 requests in parallel — including photos — before clearing the loader
        const [pData, prefs, userPhotos] = await Promise.all([
          supabase.from('profiles').select('*').eq('user_id', user.id).single(),
          supabase.from('partner_preferences').select('id').eq('user_id', user.id).maybeSingle(),
          getProfilePhotos(user.id).catch(() => [] as typeof photos)
        ]);

        if (pData.data) {
          setProfile(pData.data);
        }
        setHasPrefs(!!prefs.data);
        setPhotos(userPhotos);
      }
      // Only mark loading done AFTER all data (including photos) is ready
      setLoadingProfile(false);
      setPhotoLoading(false);
    };
    initUser();
  }, []);

  const completionStats = useMemo(() => {
    const checklist = [
      { label: 'Full Name', met: !!profile.full_name && profile.full_name !== 'New User' },
      { label: 'Gender', met: profile.gender && profile.gender !== 'other' },
      { label: 'Date of Birth', met: !!profile.date_of_birth },
      { label: 'City', met: !!profile.city },
      { label: 'Bio', met: !!profile.bio && profile.bio.length > 10 },
      { label: 'Photo', met: photos.length > 0 },
      { label: 'Preferences', met: hasPrefs },
    ];
    const metCount = checklist.filter(c => c.met).length;
    const percentage = Math.round((metCount / checklist.length) * 100);
    return { checklist, percentage, isComplete: metCount === checklist.length };
  }, [profile, photos, hasPrefs]);

  const fetchPhotos = async (uid: string) => {
    try {
      setPhotoLoading(true);
      const userPhotos = await getProfilePhotos(uid);
      setPhotos(userPhotos);
    } catch (e: any) {
      setErrors({ photos: "Failed to load photos: " + e.message });
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    setErrors({});
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY });
      const profileInfo = `Name: ${profile.full_name}, Profession: ${profile.profession}, Hobbies: ${profile.bio || 'Not specified'}.`;
      const prompt = `Based on this user profile data, write a warm and inviting 'About Me' summary for an Indian matrimonial website. Keep it under 100 words. Make it sound natural, genuine, and optimistic. Data: ${profileInfo}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });

      if (response.text) {
        setProfile(prev => ({ ...prev, bio: response.text }));
      }
    } catch (err) {
      console.error("Error generating summary:", err);
      setErrors({ ai: 'Failed to generate summary. Please try again.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const validate = () => {
    let newErrors: Record<string, string> = {};

    if (!profile.full_name || profile.full_name === 'New User') newErrors.full_name = "Full Name required";
    if (!profile.email || !profile.email.includes('@')) newErrors.email = "Valid Email required";
    if (!profile.date_of_birth) newErrors.date_of_birth = "Date of Birth required";
    if (!profile.gender) newErrors.gender = "Gender required";
    if (!profile.city) newErrors.city = "City required";
    if (!profile.bio || profile.bio.length < 10) newErrors.bio = "Bio required (min 10 chars)";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!userId) return;

    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    setErrors({});
    setSuccess('');

    try {
      const payload = {
          user_id: userId,
          full_name: profile.full_name,
          email: profile.email,
          date_of_birth: profile.date_of_birth,
          gender: profile.gender,
          religion: profile.religion,
          caste: profile.caste,
          sub_caste: profile.sub_caste,
          education: profile.education,
          profession: profile.profession,
          city: profile.city,
          state: profile.state,
          current_address: profile.current_address,
          height: profile.height,
          marital_status: profile.marital_status,
          bio: profile.bio,
          time_of_birth: profile.time_of_birth || null,
          place_of_birth: profile.place_of_birth || null,
          income_rs: profile.income_rs || null,
          fathers_occupation: profile.fathers_occupation || null,
          mothers_occupation: profile.mothers_occupation || null,
          brothers: profile.brothers || null,
          sisters: profile.sisters || null,
          phone_number: profile.phone_number || null,
          mother_tongue: profile.mother_tongue || null,
          occupation: profile.occupation || profile.profession || null,
          annual_income: profile.annual_income || profile.income_rs || null,
          address: profile.address || profile.current_address || null
      };

      // Strip empty strings and nulls to prevent DB corruption.
      // Keep `false` and `0` since they're valid values.
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, v]) => v !== "" && v !== null && v !== undefined)
      );

      const { error: saveError } = await supabase
        .from('profiles')
        .upsert(cleanPayload, { onConflict: 'user_id' });

      if (saveError) throw saveError;

      // --- Google Sheet Sync ---
      const syncToGoogleSheet = async () => {
        const WEBHOOK = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
        if (!WEBHOOK) {
          console.warn("[GOOGLE_SHEET_SYNC] Webhook URL missing in environment variables.");
          return;
        }

        try {
          const { data: { user } } = await supabase.auth.getUser();

          const payload = {
            type: "profile_update",
            name: profile.full_name || '',
            contact: user?.phone || '',
            email: profile.email || user?.email || '',
            current_address: profile.current_address || `${profile.city || ''}, ${profile.state || ''}`.trim(),
            date_of_birth: profile.date_of_birth || '',
            time_of_birth: profile.time_of_birth || '',
            place_of_birth: profile.place_of_birth || '',
            height: profile.height || '',
            caste: profile.caste || '',
            sub_caste: profile.sub_caste || '',
            religion: profile.religion || '',
            education: profile.education || '',
            occupation: profile.profession || '',
            income_rs: profile.income_rs || '',
            fathers_occupation: profile.fathers_occupation || '',
            mothers_occupation: profile.mothers_occupation || '',
            sisters: profile.sisters || '',
            phone_number: profile.phone_number || '',
            mother_tongue: profile.mother_tongue || ''
          };

          fetch(WEBHOOK, {
            method: "POST",
            mode: "no-cors",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          }).catch(err => console.error("[GOOGLE_SHEET_SYNC] Fetch error:", err));
        } catch (err) {
          console.error("[GOOGLE_SHEET_SYNC] Sync preparation error:", err);
        }
      };
      syncToGoogleSheet();
      // -------------------------

      // Re-fetch to get updated profile_completed status from trigger
      const { data: updated } = await supabase
        .from('profiles')
        .select('profile_completed')
        .eq('user_id', userId)
        .single();

      const wasComplete = profile.profile_completed;
      const isNowComplete = updated?.profile_completed;

      if (updated) {
        setProfile(prev => ({ ...prev, profile_completed: isNowComplete }));
      }

      if (isNowComplete && !wasComplete) {
        notify('Profile completed! Unlocking your plans 🎉', 'success');
        setShowToast(true);
        setTimeout(() => {
          navigate('/concierge');
        }, 2000);
        return;
      }

      notify('Profile updated successfully!', 'success');
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setErrors({ submit: err.message || 'Failed to save profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !userId) return;
    const rawFile = e.target.files[0];
    setPhotoLoading(true);
    setErrors({});
    try {
      const isFirstPhoto = photos.length === 0;
      await uploadProfilePhoto(userId, rawFile, isFirstPhoto);
      await fetchPhotos(userId);
      notify('Photo uploaded & compressed!', 'success');
      handleSave();
    } catch (e: any) {
      setErrors({ photos: "Upload failed: " + e.message });
      notify('Photo upload failed', 'error');
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleDeletePhoto = async (photo: Photo) => {
    if (!userId || !window.confirm("Are you sure you want to delete this photo?")) return;
    setPhotoLoading(true);
    try {
      await deleteProfilePhoto(photo);
      await fetchPhotos(userId);
      handleSave();
    } catch (e: any) {
      setErrors({ photos: "Deletion failed: " + e.message });
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleSetPrimary = async (photoId: string) => {
    if (!userId) return;
    setPhotoLoading(true);
    try {
      await setPrimaryPhoto(userId, photoId);
      await fetchPhotos(userId);
    } catch (e: any) {
      setErrors({ photos: "Failed to set primary photo: " + e.message });
    } finally {
      setPhotoLoading(false);
    }
  };

  if (loadingProfile) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-12 w-12 border-b-2 border-brand rounded-full"></div></div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Floating Success Toast */}
      {showToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md animate-bounce">
          <div className="bg-gray-900 text-white p-6 rounded-[2rem] shadow-2xl border-2 border-brand flex items-center gap-4">
            <div className="w-12 h-12 bg-brand rounded-full flex items-center justify-center text-2xl shadow-lg">🎉</div>
            <div>
              <p className="font-black text-sm uppercase tracking-widest">Profile Completed!</p>
              <p className="text-gray-400 text-xs mt-1">Unlocking your premium plans now...</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-black tracking-tight">My Profile</h1>
            {profile.user_display_id && (
              <span className="inline-flex items-center px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-black tracking-wider border border-indigo-100 shadow-sm">
                🆔 {profile.user_display_id}
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-1">Strengthen your profile to unlock premium benefits.</p>
        </div>

        <div className="flex flex-col items-end">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Strength:</span>
            <span className={`font-black text-sm ${completionStats.percentage === 100 ? 'text-green-500' : 'text-brand'}`}>
              {completionStats.percentage}%
            </span>
          </div>
          <div className="w-48 h-2 bg-gray-100 rounded-full overflow-hidden border">
            <div className="bg-brand h-full transition-all duration-700" style={{ width: `${completionStats.percentage}%` }}></div>
          </div>
        </div>
      </div>

      {!completionStats.isComplete && (
        <div className="mb-8 p-6 bg-rose-50 border border-rose-100 rounded-[2rem] flex flex-col sm:flex-row items-center gap-6 shadow-sm">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-xl shadow-inner shrink-0">⚠️</div>
          <div className="text-center sm:text-left">
            <p className="text-gray-900 font-black text-sm uppercase tracking-wider mb-1">Subscriptions Locked</p>
            <p className="text-gray-500 text-xs">Complete the required fields below to access <span className="text-brand font-bold">VIP Concierge</span> and <span className="text-brand font-bold">Self-Service</span> plans.</p>
          </div>
          <div className="sm:ml-auto">
            <button onClick={() => navigate('/concierge')} className="px-4 py-2 bg-white border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition">Try Unlocking</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] shadow-sm border overflow-hidden">
        <div className="flex border-b bg-gray-50/50 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <TabButton id="basic" label="Basic Details" active={activeTab === 'basic'} onClick={setActiveTab} />
          <TabButton id="photos" label="Manage Photos" active={activeTab === 'photos'} onClick={setActiveTab} />
          <TabButton id="settings" label="Settings" active={activeTab === 'settings'} onClick={setActiveTab} />
          <Link to="/partner-preferences" className={`px-8 py-5 text-sm font-bold uppercase tracking-wider transition ${hasPrefs ? 'text-gray-800' : 'text-brand animate-pulse'} hover:text-gray-900`}>
            Partner Preferences {hasPrefs ? '✓' : '*Required'}
          </Link>
        </div>

        <div className="p-8 sm:p-12">
          {Object.keys(errors).length > 0 && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl text-sm font-bold shadow-sm">
              <p className="mb-2 uppercase text-[10px] tracking-widest opacity-70">Please fix the following errors:</p>
              <ul className="list-disc list-inside space-y-1">
                {Object.entries(errors).map(([key, msg]) => (
                  <li key={key}>{msg}</li>
                ))}
              </ul>
            </div>
          )}
          {success && <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl text-sm font-bold shadow-sm">{success}</div>}

          {activeTab === 'basic' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField label="Full Name*" value={profile.full_name || ''} onChange={(val: string) => setProfile({ ...profile, full_name: val })} placeholder="As per Govt ID" error={errors.full_name} />
                <FormField label="Email Address*" type="email" value={profile.email || ''} onChange={(val: string) => setProfile({ ...profile, email: val })} placeholder="your@email.com" error={errors.email} />
                <FormField label="Phone Number" type="tel" value={profile.phone_number || ''} onChange={(val: string) => setProfile({ ...profile, phone_number: val })} placeholder="+91..." />
                <FormField label="Date of Birth*" type="date" value={profile.date_of_birth || ''} onChange={(val: string) => setProfile({ ...profile, date_of_birth: val })} error={errors.date_of_birth} />
                <FormField label="Gender*" type="select" options={['male', 'female']} value={profile.gender || ''} onChange={(val: string) => setProfile({ ...profile, gender: val as any })} error={errors.gender} />
                <FormField label="Marital Status" type="select" options={['Never Married', 'Awaiting Divorce', 'Divorced', 'Widowed']} value={profile.marital_status || ''} onChange={(val: string) => setProfile({ ...profile, marital_status: val })} />
                <FormField label="Height" value={profile.height || ''} onChange={(val: string) => setProfile({ ...profile, height: val })} placeholder={"e.g. 5'10\""} />
                <FormField label="Religion" type="select" options={['Hindu', 'Muslim', 'Christian', 'Sikh', 'Parsi', 'Jain', 'Buddhist', 'Jewish', 'No Religion', 'Spiritual']} value={profile.religion || ''} onChange={(val: string) => setProfile({ ...profile, religion: val })} />
                <FormField label="Mother Tongue" type="select" options={['Hindi', 'English', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Urdu', 'Gujarati', 'Kannada', 'Odia', 'Malayalam', 'Punjabi']} value={profile.mother_tongue || ''} onChange={(val: string) => setProfile({ ...profile, mother_tongue: val })} />
                <FormField label="Caste" value={profile.caste || ''} onChange={(val: string) => setProfile({ ...profile, caste: val })} />
                <FormField label="Sub-Caste" value={profile.sub_caste || ''} onChange={(val: string) => setProfile({ ...profile, sub_caste: val })} />

                <div className="md:col-span-2 border-t pt-8 mt-4">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Birth Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField label="Time of Birth" type="time" value={profile.time_of_birth || ''} onChange={(val: string) => setProfile({ ...profile, time_of_birth: val })} />
                    <FormField label="Place of Birth" value={profile.place_of_birth || ''} onChange={(val: string) => setProfile({ ...profile, place_of_birth: val })} />
                  </div>
                </div>

                <div className="md:col-span-2 border-t pt-8 mt-4">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Location Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField label="City*" value={profile.city || ''} onChange={(val: string) => setProfile({ ...profile, city: val })} error={errors.city} />
                    <FormField label="State" value={profile.state || ''} onChange={(val: string) => setProfile({ ...profile, state: val })} />
                    <div className="md:col-span-2">
                      <FormField label="Address" value={profile.address || profile.current_address || ''} onChange={(val: string) => setProfile({ ...profile, address: val, current_address: val })} placeholder="Full residential address" />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 border-t pt-8 mt-4">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Professional Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField label="Education" value={profile.education || ''} onChange={(val: string) => setProfile({ ...profile, education: val })} />
                    <FormField label="Occupation/Profession" value={profile.occupation || profile.profession || ''} onChange={(val: string) => setProfile({ ...profile, occupation: val, profession: val })} />
                    <FormField label="Annual Income" type="select" options={['Under 1 Lakh', '1 - 3 Lakhs', '3 - 5 Lakhs', '5 - 10 Lakhs', '10 - 20 Lakhs', '20 - 50 Lakhs', 'Over 50 Lakhs']} value={profile.annual_income || profile.income_rs || ''} onChange={(val: string) => setProfile({ ...profile, annual_income: val, income_rs: val })} />
                  </div>
                </div>

                <div className="md:col-span-2 border-t pt-8 mt-4">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Family Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField label="Father's Occupation" value={profile.fathers_occupation || ''} onChange={(val: string) => setProfile({ ...profile, fathers_occupation: val })} />
                    <FormField label="Mother's Occupation" value={profile.mothers_occupation || ''} onChange={(val: string) => setProfile({ ...profile, mothers_occupation: val })} />
                    <FormField label="Brothers" value={profile.brothers || ''} onChange={(val: string) => setProfile({ ...profile, brothers: val })} />
                    <FormField label="Sisters" value={profile.sisters || ''} onChange={(val: string) => setProfile({ ...profile, sisters: val })} />
                  </div>
                </div>
              </div>
              <div className="pt-4">
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">About Yourself (Bio)*</label>
                  <button onClick={handleGenerateSummary} disabled={isGenerating} className="text-[10px] bg-rose-50 text-brand font-black px-4 py-1.5 rounded-full hover:bg-rose-100 transition disabled:opacity-50 uppercase tracking-widest">
                    {isGenerating ? 'Generating...' : '✨ AI Assist'}
                  </button>
                </div>
                <textarea
                  rows={5}
                  value={profile.bio || ''}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Tell us about yourself. (Minimum 10 characters required)"
                  className={`w-full p-6 border-2 rounded-3xl bg-gray-50 focus:border-brand focus:ring-0 outline-none transition resize-none font-medium text-gray-700 ${errors.bio ? 'border-rose-200' : 'border-gray-100'}`}
                ></textarea>
                {errors.bio && <p className="text-[10px] text-rose-500 font-bold mt-2 uppercase tracking-widest">{errors.bio}</p>}
              </div>
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="space-y-8">
              <div className="p-6 bg-blue-50 text-blue-800 rounded-3xl text-sm flex gap-4">
                <span className="text-2xl">📸</span>
                <p><strong>Upload at least 1 photo</strong> to verify your identity and unlock premium features.</p>
              </div>
              {photoLoading && <div className="text-center py-12"><div className="animate-spin h-8 w-8 border-b-2 border-brand rounded-full mx-auto"></div></div>}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {photos.map(photo => (
                  <div key={photo.id} className="relative aspect-[3/4] bg-gray-100 rounded-3xl overflow-hidden group shadow-md border-4 border-white">
                    <img src={photo.url} className="w-full h-full object-cover" alt="Profile" />
                    {photo.is_primary && <div className="absolute top-3 left-3 bg-brand text-white text-[8px] font-black uppercase px-3 py-1 rounded-full shadow-lg">Primary</div>}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-4">
                      {!photo.is_primary && <button onClick={() => handleSetPrimary(photo.id)} className="w-full text-[10px] bg-white text-black font-black py-2.5 rounded-xl hover:bg-gray-100 uppercase tracking-widest">Set Primary</button>}
                      <button onClick={() => handleDeletePhoto(photo)} className="w-full text-[10px] bg-rose-600 text-white font-black py-2.5 rounded-xl hover:bg-rose-700 uppercase tracking-widest">Delete</button>
                    </div>
                  </div>
                ))}

                {!photoLoading && photos.length < MAX_PHOTOS && (
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        const dummyEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
                        handlePhotoUpload(dummyEvent);
                      }
                    }}
                    className="aspect-[3/4] bg-gray-50 rounded-3xl border-4 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-brand hover:text-brand transition group">
                    <span className="text-5xl text-gray-300 mb-2 group-hover:scale-110 transition">+</span>
                    <span className="text-[10px] text-center text-gray-400 font-black uppercase tracking-[0.2em] group-hover:text-brand">Add Photo</span>
                  </button>
                )}
              </div>
              <input type="file" accept="image/png, image/jpeg, image/webp" ref={fileInputRef} hidden onChange={handlePhotoUpload} />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-8">
              <div className="p-6 bg-gray-50 rounded-3xl border">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-2">Account Information</h3>
                <p className="text-sm text-gray-500">Email: <span className="font-bold text-gray-700">{profile.email}</span></p>
                <p className="text-sm text-gray-500 mt-1">User ID: <span className="font-mono text-xs text-brand">{userId}</span></p>
              </div>
              <div className="p-6 bg-rose-50 rounded-3xl border border-rose-200">
                <h3 className="text-sm font-black text-rose-700 uppercase tracking-widest mb-2">⚠️ Danger Zone</h3>
                <p className="text-sm text-gray-600 mb-4">Permanently delete your account, profile, and all associated photos. This action <strong>cannot be undone</strong>.</p>
                <button
                  onClick={async () => {
                    if (!window.confirm('Are you sure you want to delete your account? All your data and photos will be permanently removed.')) return;
                    if (!window.confirm('FINAL CONFIRMATION: This is irreversible. Proceed with account deletion?')) return;
                    try {
                      // Delete profile row (RLS allows own profile deletion)
                      await supabase.from('photos').delete().eq('user_id', userId!);
                      await supabase.from('profiles').delete().eq('user_id', userId!);
                      await supabase.from('users').delete().eq('id', userId!);
                      // Clear storage folder
                      const { data: files } = await supabase.storage.from('avatars').list(userId!);
                      if (files && files.length > 0) {
                        await supabase.storage.from('avatars').remove(files.map(f => `${userId}/${f.name}`));
                      }
                      await supabase.auth.signOut();
                      navigate('/login');
                    } catch (err: any) {
                      notify('Deletion failed: ' + err.message, 'error');
                    }
                  }}
                  className="px-6 py-3 bg-rose-600 text-white rounded-2xl font-bold text-sm hover:bg-rose-700 transition active:scale-95"
                >
                  Delete My Account Permanently
                </button>
              </div>
            </div>
          )}


          <div className="mt-16 flex flex-col sm:flex-row justify-between items-center gap-6">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">* Required for unlocking plans</p>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto px-12 py-5 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-black transition disabled:opacity-50 active:scale-95"
            >
              {saving ? 'Saving...' : 'Update & Check Eligibility'}
            </button>
          </div>
        </div>
      </div>

      {completionStats.isComplete && (
        <div className="mt-8 p-10 bg-gradient-to-r from-gray-900 to-gray-800 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl">
          <div className="text-center md:text-left">
            <h3 className="text-3xl font-black mb-2 tracking-tight">Profile Ready! 🚀</h3>
            <p className="text-gray-400 text-lg">You have unlocked our premium VIP and Self-Service plans.</p>
          </div>
          <Link to="/concierge" className="w-full md:w-auto bg-brand text-white px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:bg-rose-700 transition shadow-xl shadow-rose-900/40 text-center">
            Unlock Plans
          </Link>
        </div>
      )}
    </div>
  );
};

const TabButton = ({ id, label, active, onClick }: any) => (
  <button
    onClick={() => onClick(id)}
    className={`px-8 py-5 text-sm font-bold uppercase tracking-[0.2em] transition relative ${active ? 'bg-white text-brand border-b-4 border-brand' : 'text-gray-400 hover:text-gray-600'}`}
  >
    {label}
  </button>
);

const FormField = ({ label, type = 'text', value, options, onChange, placeholder, error }: any) => (
  <div>
    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{label}</label>
    {type === 'select' ? (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full p-4 border-2 rounded-2xl bg-gray-50 focus:border-brand focus:ring-0 outline-none transition appearance-none font-bold text-gray-700 ${error ? 'border-rose-200' : 'border-gray-100'}`}
      >
        <option value="">Select Option</option>
        {options.map((o: string) => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
      </select>
    ) : (
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full p-4 border-2 rounded-2xl bg-gray-50 focus:border-brand focus:ring-0 outline-none transition font-bold text-gray-700 ${error ? 'border-rose-200' : 'border-gray-100'}`}
      />
    )}
    {error && <p className="text-[10px] text-rose-500 font-bold mt-2 uppercase tracking-widest">{error}</p>}
  </div>
);

export default MyProfile;