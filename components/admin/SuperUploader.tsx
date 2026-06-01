import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, CheckCircle2, Loader2, AlertCircle, Eye, Copy, Image, Trash2, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { scanDocumentWithGemini } from '../../services/ocrService';
import { ProfileCardSkeleton } from '../ProfileCardSkeleton';
import { uploadImage } from '../../services/uploadService';

const MAX_GALLERY_PHOTOS = 6;

interface OCRData {
  full_name: string;
  age: string;
  gender: string;
  address: string;
  dob: string;
  email: string;
  phone: string;
  caste: string;
  city: string;
  state: string;
  height: string;
  religion: string;
  education: string;
  profession: string;
  marital_status: string;
}

type Step = 'drop' | 'scan' | 'review' | 'gallery' | 'submitting' | 'success';

/**
 * SuperUploader — Admin "Magic" Zero-Entry Onboarding with Multi-Photo Gallery.
 *
 * Flow:
 *   1. DROP an ID document → OCR auto-fills a form
 *   2. REVIEW extracted data (admin can edit)
 *   3. GALLERY — attach up to 6 profile photos
 *   4. CONFIRM & LAUNCH — creates auth user, profile, uploads all photos
 */
export function SuperUploader() {
  const [step, setStep] = useState<Step>('drop');
  const [ocrData, setOcrData] = useState<Partial<OCRData>>({});
  const [idFile, setIdFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<(File | null)[]>(Array(MAX_GALLERY_PHOTOS).fill(null));
  const [galleryPreviews, setGalleryPreviews] = useState<(string | null)[]>(Array(MAX_GALLERY_PHOTOS).fill(null));
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const [successData, setSuccessData] = useState<{ email: string; password: string; profileId: string } | null>(null);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ---- Step 1: ID Document Drop ----
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setError(null);
    const targetFile = acceptedFiles[0];
    setIdFile(targetFile);
    setStep('scan');

    try {
      const data = await scanDocumentWithGemini(targetFile);
      setOcrData(prev => ({ ...prev, ...data }));
      setStep('review');
    } catch (err: any) {
      setError('OCR scan failed. You can still enter details manually.');
      setOcrData({});
      setStep('review');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
  });

  // ---- Step 3: Gallery Slot Management ----
  const handleGallerySlot = (index: number, file: File | null) => {
    const newFiles = [...galleryFiles];
    const newPreviews = [...galleryPreviews];

    if (file) {
      newFiles[index] = file;
      newPreviews[index] = URL.createObjectURL(file);
    } else {
      // Clear slot
      if (newPreviews[index]) URL.revokeObjectURL(newPreviews[index]!);
      newFiles[index] = null;
      newPreviews[index] = null;
    }
    setGalleryFiles(newFiles);
    setGalleryPreviews(newPreviews);
  };

  const filledSlots = galleryFiles.filter(Boolean).length;

  // ---- Step 4: Create & Verify ----
  const handleCreateAndVerify = async () => {
    if (!ocrData?.full_name) {
      setError('Full Name is required.');
      return;
    }

    setStep('submitting');
    setError(null);

    try {
      // 1. Generate Auth
      const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';
      const tempEmail = ocrData.email || `user_${Date.now()}@bhartiyarishtey.com`;
      setProgress('Creating account...');

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: tempEmail,
        password: tempPassword,
      });
      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error('Failed to create user account.');

      // 2. Wait for DB Trigger (handle_new_user) to create the profile row
      setProgress('Synchronizing database profile...');
      let profileSyncSuccess = false;
      for (let attempt = 0; attempt < 5; attempt++) {
        const { data: profileCheck } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle();
        
        if (profileCheck) {
          profileSyncSuccess = true;
          break;
        }
        await new Promise(res => setTimeout(res, 1000 * Math.pow(2, attempt))); // exponential backoff
      }

      if (!profileSyncSuccess) {
        throw new Error('Database synchronization timeout. Profile row was not created by the backend trigger.');
      }

      // 3. Update Profile (NOT Insert)
      setProgress('Saving profile data...');
      const { error: profileError } = await supabase.from('profiles').update({
        full_name: ocrData.full_name || 'Admin Created User',
        gender: ocrData.gender?.toLowerCase() || 'other',
        date_of_birth: ocrData.dob || '1990-01-01',
        age: parseInt(ocrData.age as string) || 25,
        current_address: ocrData.address || '',
        address: ocrData.address || '',
        city: ocrData.city || 'Not Specified',
        state: ocrData.state || 'Not Specified',
        caste: ocrData.caste || 'Not Specified',
        is_approved: true,
        verification_status: 'verified',
        height: ocrData.height || null,
        religion: ocrData.religion || null,
        education: ocrData.education || null,
        profession: ocrData.profession || null,
        occupation: ocrData.profession || null,
        marital_status: ocrData.marital_status || null,
        phone_number: ocrData.phone || null,
        bio: 'Profile created by admin.',
      }).eq('id', userId);

      if (profileError) throw profileError;

      // 4. Upload Gallery Photos
      setProgress('Uploading photos safely...');
      const galleryUrls: string[] = [];
      for (let i = 0; i < MAX_GALLERY_PHOTOS; i++) {
        const file = galleryFiles[i];
        if (file) {
          setProgress(`Uploading photo ${i + 1} of ${filledSlots}...`);
          try {
            const url = await uploadImage(file, userId, 'avatars');
            galleryUrls.push(url);
          } catch (uploadErr) {
            console.error(`Failed to upload photo ${i + 1}`, uploadErr);
            // We swallow individual photo upload errors to prevent orphan failure
          }
        }
      }

      // Upload ID doc for record-keeping
      if (idFile) {
        try {
          const ext = idFile.name.split('.').pop();
          const idPath = `${userId}/id_document.${ext}`;
          await supabase.storage.from('avatars').upload(idPath, idFile, { upsert: true });
        } catch (idErr) {
          console.error('Failed to upload ID document', idErr);
        }
      }

      // 5. Finalize Profile Images
      const primaryPhoto = galleryUrls[0] || undefined;
      if (galleryUrls.length > 0) {
        await supabase.from('profiles').update({
          avatar_url: primaryPhoto,
          gallery_urls: galleryUrls,
        }).eq('id', userId);
      }

      setSuccessData({ email: tempEmail, password: tempPassword, profileId: userId });
      setStep('success');
    } catch (err: any) {
      console.error("SuperUploader FinalSubmit Error:", err);
      // Map obscure errors (Agent 5 requirement)
      let displayError = err.message || 'An error occurred during account creation.';
      if (displayError.includes('Database error saving new user')) {
        displayError = 'This email or phone number is already registered.';
      }
      setError(displayError);
      setStep('review');
    }
  };

  // ---- RESET ----
  const resetForm = () => {
    // Revoke all blob URLs
    galleryPreviews.forEach(p => p && URL.revokeObjectURL(p));
    setStep('drop');
    setOcrData({});
    setIdFile(null);
    setGalleryFiles(Array(MAX_GALLERY_PHOTOS).fill(null));
    setGalleryPreviews(Array(MAX_GALLERY_PHOTOS).fill(null));
    setError(null);
    setSuccessData(null);
    setProgress('');
  };

  // Clean up blob URLs on unmount
  useEffect(() => {
    return () => {
      galleryPreviews.forEach(p => p && URL.revokeObjectURL(p));
    };
  }, []);

  // ========================================================
  // RENDER
  // ========================================================

  // ---- SUCCESS SCREEN ----
  if (step === 'success' && successData) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-green-100 p-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Profile Live!</h2>
        <p className="text-gray-500 mb-8">
          The user account has been created, verified, and {filledSlots > 0 ? `${filledSlots} photo${filledSlots > 1 ? 's' : ''} uploaded` : 'no photos attached'}.
        </p>

        <div className="bg-gray-50 rounded-xl p-6 text-left max-w-md mx-auto mb-8 border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">User Credentials</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Email (Login)</label>
              <div className="font-mono bg-white px-3 py-2 rounded-lg border border-gray-200 text-gray-800 text-sm break-all">
                {successData.email}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Temporary Password</label>
              <div className="flex items-center gap-2">
                <div className="font-mono bg-white px-3 py-2 rounded-lg border border-gray-200 text-gray-800 flex-1 text-sm">
                  {successData.password}
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(successData.password)}
                  className="p-2 text-brand hover:bg-rose-50 rounded-lg transition-colors"
                  title="Copy Password"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4 italic flex items-start gap-1">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Share these credentials with the user via WhatsApp or Email.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={resetForm}
            className="px-6 py-2.5 min-h-[48px] flex items-center justify-center rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Upload Another
          </button>
          <a
            href={`/profile/${successData.profileId}`}
            target="_blank"
            rel="noreferrer"
            className="px-6 py-2.5 min-h-[48px] flex items-center justify-center rounded-xl font-medium bg-brand text-white hover:bg-rose-700 transition-all shadow-lg gap-2"
          >
            <Eye className="w-4 h-4" />
            View Public Profile
          </a>
        </div>
      </div>
    );
  }

  // ---- SUBMITTING SCREEN ----
  if (step === 'submitting') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <Loader2 className="w-12 h-12 text-brand animate-spin mx-auto mb-6" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Creating Profile...</h3>
        <p className="text-gray-500 text-sm">{progress}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-rose-50 to-white">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <UploadCloud className="w-6 h-6 text-brand" />
          Super Uploader
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Drop an ID → auto-extract details → attach up to 6 photos → launch a verified profile in one go.
        </p>
      </div>

      {/* Step Progress Bar */}
      <div className="px-6 pt-4 flex items-center gap-2">
        {['ID Scan', 'Review', 'Gallery', 'Launch'].map((label, i) => {
          const stepOrder: Step[] = ['drop', 'review', 'gallery', 'success'];
          const currentIdx = stepOrder.indexOf(step === 'scan' ? 'drop' : step);
          const isActive = i <= currentIdx;
          return (
            <React.Fragment key={label}>
              <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-brand' : 'text-gray-300'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${isActive ? 'bg-brand text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {i + 1}
                </div>
                <span className="hidden sm:inline">{label}</span>
              </div>
              {i < 3 && <div className={`flex-1 h-0.5 rounded ${isActive ? 'bg-brand' : 'bg-gray-100'}`} />}
            </React.Fragment>
          );
        })}
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* ---- STEP 1: DROP ZONE ---- */}
        {step === 'drop' && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200
              ${isDragActive ? 'border-brand bg-rose-50' : 'border-gray-200 hover:border-brand/50 hover:bg-gray-50'}`}
          >
            <input {...getInputProps()} />
            <div className="w-16 h-16 bg-rose-100 text-brand rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Drop ID or Biodata here</h3>
            <p className="text-gray-500 text-sm mb-4">Drag and drop, or click to select a document</p>
            <div className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm">
              Select File
            </div>
          </div>
        )}

        {/* ---- STEP 2: SCANNING ---- */}
        {step === 'scan' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-gray-50/50 p-6 rounded-2xl border-2 border-gray-100">
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <Loader2 className="w-8 h-8 text-brand animate-spin" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Scanning Document...</h3>
                  <p className="text-sm text-gray-500">Extracting user details using AI vision.</p>
                </div>
              </div>
              {/* Skeleton form preview — shows what will auto-fill */}
              <div className="space-y-4">
                {['Full Name', 'Age', 'Gender', 'Caste', 'City', 'State'].map((label, i) => (
                  <div key={label}>
                    <div className="h-3 w-20 bg-gray-200 rounded-full mb-2 relative overflow-hidden">
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                    </div>
                    <div className="h-10 bg-gray-200 rounded-xl relative overflow-hidden">
                      <div
                        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent"
                        style={{ animation: `shimmer 1.5s infinite ${i * 0.12}s` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <ProfileCardSkeleton count={1} />
            </div>
          </div>
        )}

        {/* ---- STEP 3: REVIEW FORM ---- */}
        {step === 'review' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Review Extracted Data</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Full Name *" value={ocrData.full_name || ''} onChange={v => setOcrData({ ...ocrData, full_name: v })} />
              <InputField label="Age" type="number" value={ocrData.age || ''} onChange={v => setOcrData({ ...ocrData, age: v })} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  value={ocrData.gender || ''}
                  onChange={e => setOcrData({ ...ocrData, gender: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <InputField label="Caste" value={ocrData.caste || ''} onChange={v => setOcrData({ ...ocrData, caste: v })} />
              <InputField label="City" value={ocrData.city || ''} onChange={v => setOcrData({ ...ocrData, city: v })} />
              <InputField label="State" value={ocrData.state || ''} onChange={v => setOcrData({ ...ocrData, state: v })} />
              <InputField label="Email (Optional)" type="email" value={ocrData.email || ''} onChange={v => setOcrData({ ...ocrData, email: v })} />
              <InputField label="Phone" type="tel" value={ocrData.phone || ''} onChange={v => setOcrData({ ...ocrData, phone: v })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                rows={2}
                value={ocrData.address || ''}
                onChange={e => setOcrData({ ...ocrData, address: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none resize-none"
                placeholder="Full address"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={resetForm}
                className="flex-1 px-4 py-2.5 min-h-[48px] flex items-center justify-center border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!ocrData.full_name) {
                    setError('Full Name is required.');
                    return;
                  }
                  setError(null);
                  setStep('gallery');
                }}
                className="flex-1 px-4 py-2.5 min-h-[48px] bg-gray-900 text-white rounded-xl font-medium hover:bg-black transition-colors flex items-center justify-center gap-2"
              >
                <Image className="w-4 h-4" />
                Next: Add Photos
              </button>
            </div>
          </div>
        )}

        {/* ---- STEP 4: GALLERY (6 Slots) ---- */}
        {step === 'gallery' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Photo Gallery</h3>
                <p className="text-sm text-gray-500">Upload up to 6 photos. The first photo becomes the avatar.</p>
              </div>
              <span className="text-sm font-bold text-brand bg-rose-50 px-3 py-1 rounded-full">
                {filledSlots}/{MAX_GALLERY_PHOTOS}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array.from({ length: MAX_GALLERY_PHOTOS }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] rounded-2xl overflow-hidden relative group border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center cursor-pointer hover:border-brand/50 transition-all"
                  onClick={() => !galleryFiles[i] && fileRefs.current[i]?.click()}
                >
                  {galleryPreviews[i] ? (
                    <>
                      <img src={galleryPreviews[i]!} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                      {/* Primary badge */}
                      {i === 0 && (
                        <div className="absolute top-2 left-2 bg-brand text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                          <Star className="w-3 h-3" /> Avatar
                        </div>
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleGallerySlot(i, null);
                          }}
                          className="p-3 bg-white rounded-full shadow-lg hover:bg-rose-50 transition"
                          title="Remove"
                        >
                          <Trash2 className="w-5 h-5 text-rose-600" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-2xl font-light">+</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        {i === 0 ? 'Main Avatar' : `Photo ${i + 1}`}
                      </span>
                    </div>
                  )}
                  <input
                    ref={el => { fileRefs.current[i] = el; }}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleGallerySlot(i, file);
                      e.target.value = '';
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep('review')}
                className="flex-1 px-4 py-2.5 min-h-[48px] flex items-center justify-center border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleCreateAndVerify}
                className="flex-1 px-4 py-2.5 min-h-[48px] bg-brand text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                Confirm & Launch
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Reusable Input ----
const InputField = ({
  label,
  type = 'text',
  value,
  onChange,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
    />
  </div>
);
