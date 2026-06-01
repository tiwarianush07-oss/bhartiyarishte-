import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, CheckCircle2, Loader2, AlertCircle, Eye, Copy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { scanDocumentWithGemini } from '../services/ocrService';
import { ProfileCardSkeleton } from './ProfileCardSkeleton';
import { uploadImage } from '../services/uploadService';

interface OCRData {
  full_name: string;
  age: string;
  gender: string;
  address: string;
  dob: string;
  email: string;
  phone: string;
  religion?: string;
  caste?: string;
  education?: string;
  profession?: string;
  marital_status?: string;
  city?: string;
  state?: string;
  father_name?: string;
}

export function MagicUploader() {
  const [idFile, setIdFile] = useState<File | null>(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ocrData, setOcrData] = useState<Partial<OCRData> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ email: string, password: string, profileId: string } | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setError(null);

    // Assume first file is ID for scanning
    const targetFile = acceptedFiles[0];
    
    // Set files locally
    if (acceptedFiles.length >= 2) {
      setIdFile(acceptedFiles[0]);
      setProfilePhotoFile(acceptedFiles[1]);
    } else {
      // If only one, assume it's the ID if we don't have one, else profile photo
      if (!idFile) setIdFile(targetFile);
      else setProfilePhotoFile(targetFile);
    }

    if (!idFile || acceptedFiles.length === 1) {
      // Run OCR on the first dropped file
      setIsScanning(true);
      try {
        const data = await scanDocumentWithGemini(targetFile);
        setOcrData((prev) => ({ ...prev, ...data }));
      } catch (err: any) {
        console.error(err);
        setError(`Scanning failed: ${err.message || err}`);
        // Initialize empty form on failure
        if (!ocrData) setOcrData({});
      } finally {
        setIsScanning(false);
      }
    }
  }, [idFile, ocrData]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    }
  });

  const handleCreateAndVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ocrData?.full_name) {
      setError("Full Name is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Generate Auth Credentials
      const tempPassword = Math.random().toString(36).slice(-10) + "A1!";
      const tempEmail = ocrData.email || `user_${Date.now()}@bhartiyarishtey.com`;

      const { error: rpcError } = await supabase.rpc('admin_add_profile', {
        user_email: tempEmail,
        user_password: tempPassword,
        user_name: ocrData.full_name,
        user_role: 'user',
        user_photos: [],
        user_phone: ocrData.phone || null
      });

      if (rpcError) throw rpcError;

      // 2. Fetch the newly created user's ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', tempEmail)
        .single();

      if (userError || !userData?.id) {
        throw new Error("Failed to find created user profile.");
      }
      const userId = userData.id;

      // 3. Upload Photos
      let avatarUrl: string | null = null;
      if (profilePhotoFile) {
        avatarUrl = await uploadImage(profilePhotoFile, userId, 'avatars');
      }

      // Upload ID document for record keeping
      if (idFile && idFile !== profilePhotoFile) {
        const fileExt = idFile.name.split('.').pop();
        const fileName = `id-${userId}-${Date.now()}.${fileExt}`;
        await supabase.storage
          .from('avatars')
          .upload(fileName, idFile);
      }

      // 4. Sanitize & normalize OCR payload
      const parsedAge = parseInt(ocrData.age as string);
      const sanitizedGender = (ocrData.gender || 'other').toLowerCase();

      // Build a clean update payload — only include fields with real values.
      // The trigger already created the row with id, user_id, full_name, etc.
      // We UPDATE it (not INSERT) to avoid PK conflict + RLS INSERT denial.
      const profilePayload: Record<string, any> = {
        full_name: ocrData.full_name,
        email: tempEmail,
        gender: sanitizedGender === 'male' || sanitizedGender === 'female' ? sanitizedGender : 'other',
        date_of_birth: ocrData.dob || '1990-01-01',
        is_approved: true,
        verification_status: 'verified',
        // Defaults for required fields
        height: '5ft 5in',
        religion: 'Hindu',
        caste: 'Not Specified',
        city: 'Not Specified',
        state: 'Not Specified',
        education: 'Not Specified',
        profession: 'Not Specified',
        marital_status: 'Never Married',
        bio: 'Profile created by admin.',
      };

      // Only include optional fields if they have valid values
      if (!isNaN(parsedAge) && parsedAge > 0) profilePayload.age = parsedAge;
      if (ocrData.address) profilePayload.current_address = ocrData.address;
      if (ocrData.phone) profilePayload.phone_number = ocrData.phone;
      if (avatarUrl) {
        profilePayload.avatar_url = avatarUrl;
        profilePayload.photo_url = avatarUrl;
      }

      // 5. UPDATE the trigger-created profile row (not INSERT)
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profilePayload)
        .eq('id', userId);

      if (profileError) throw profileError;

      setSuccessData({
        email: tempEmail,
        password: tempPassword,
        profileId: userId
      });

    } catch (err: any) {
      console.error("MagicUploader Submission Error:", err);
      let displayError = err.message || "An error occurred during account creation.";
      if (displayError.includes('Database error saving new user')) {
        displayError = 'This email or phone number is already registered.';
      }
      setError(displayError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setIdFile(null);
    setProfilePhotoFile(null);
    setOcrData(null);
    setSuccessData(null);
    setError(null);
  };

  if (successData) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-green-100 p-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Profile Live!</h2>
        <p className="text-gray-500 mb-8">The user account has been created and verified successfully.</p>
        
        <div className="bg-gray-50 rounded-xl p-6 text-left max-w-md mx-auto mb-8 border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">User Credentials</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Email (Login)</label>
              <div className="font-mono bg-white px-3 py-2 rounded-lg border border-gray-200 text-gray-800">
                {successData.email}
              </div>
            </div>
            
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Temporary Password</label>
              <div className="flex items-center gap-2">
                <div className="font-mono bg-white px-3 py-2 rounded-lg border border-gray-200 text-gray-800 flex-1">
                  {successData.password}
                </div>
                <button 
                  onClick={() => navigator.clipboard.writeText(successData.password)}
                  className="p-2 text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors"
                  title="Copy Password"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4 italic flex items-start gap-1">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Please share these credentials with the user via WhatsApp or Email. They can change this password after logging in.
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
            className="px-6 py-2.5 min-h-[48px] flex items-center justify-center rounded-xl font-medium bg-brand-600 text-white hover:bg-brand-700 transition-all shadow-lg shadow-brand-200 gap-2"
          >
            <Eye className="w-4 h-4" />
            View Public Profile
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-brand-50 to-white">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <UploadCloud className="w-6 h-6 text-brand-600" />
          Magic Uploader
        </h2>
        <p className="text-sm text-gray-500 mt-1">Drop an ID document to automatically extract details and create a verified account.</p>
      </div>

      <div className="p-6">
        {!ocrData && !isScanning ? (
          <div 
            {...getRootProps()} 
            className={`
              border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200
              ${isDragActive ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'}
            `}
          >
            <input {...getInputProps()} />
            <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Drop ID or Profile Photo here</h3>
            <p className="text-gray-500 text-sm mb-4">Drag and drop, or click to select files</p>
            <div className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm">
              Select Files
            </div>
          </div>
        ) : isScanning ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-gray-50/50 p-6 rounded-2xl border-2 border-gray-100">
            <div className="flex items-center justify-center flex-col text-center">
              <Loader2 className="w-12 h-12 text-brand-600 animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 animate-pulse">Scanning Document...</h3>
              <p className="text-sm text-gray-500 mt-2">Extracting user details using AI vision.</p>
            </div>
            <div>
              <ProfileCardSkeleton count={1} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Files */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Attached Documents</h3>
              
              <div className="flex gap-4">
                <div 
                  {...getRootProps()} 
                  className="flex-1 border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:bg-gray-50 hover:border-brand-300 transition-colors"
                >
                  <input {...getInputProps()} />
                  <UploadCloud className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <span className="text-sm text-gray-600">Add Photos</span>
                </div>
              </div>

              <div className="space-y-3">
                {idFile && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                    <div className="w-10 h-10 bg-blue-200/50 rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-blue-700" />
                    </div>
                    <div className="flex-1 truncate">
                      <p className="text-sm font-medium text-blue-900 truncate">{idFile.name}</p>
                      <p className="text-xs text-blue-700">ID Document</p>
                    </div>
                  </div>
                )}
                {profilePhotoFile && (
                  <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-100 rounded-xl">
                    <div className="w-10 h-10 bg-purple-200/50 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                      <img src={URL.createObjectURL(profilePhotoFile)} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 truncate">
                      <p className="text-sm font-medium text-purple-900 truncate">{profilePhotoFile.name}</p>
                      <p className="text-xs text-purple-700">Display Photo</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Form */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Data</h3>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleCreateAndVerify} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={ocrData?.full_name || ''}
                    onChange={(e) => setOcrData({ ...ocrData, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                    placeholder="Enter full name"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                    <input
                      type="number"
                      value={ocrData?.age || ''}
                      onChange={(e) => setOcrData({ ...ocrData, age: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                      placeholder="e.g. 28"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select
                      value={ocrData?.gender || ''}
                      onChange={(e) => setOcrData({ ...ocrData, gender: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={ocrData?.email || ''}
                    onChange={(e) => setOcrData({ ...ocrData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                    placeholder="If blank, a random one will be generated"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    rows={2}
                    value={ocrData?.address || ''}
                    onChange={(e) => setOcrData({ ...ocrData, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
                    placeholder="Extracted address"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2.5 min-h-[48px] flex items-center justify-center border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 min-h-[48px] bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Create & Verify
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

