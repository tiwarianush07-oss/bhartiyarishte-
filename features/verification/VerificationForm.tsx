
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { getVerificationStatus, submitVerificationRequest, uploadVerificationFile } from './verification.service';

const VerificationForm: React.FC = () => {
    const [idDocument, setIdDocument] = useState<File | null>(null);
    const [selfie, setSelfie] = useState<File | null>(null);
    const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
    const [loading, setLoading] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const checkStatus = useCallback(async () => {
        setCheckingStatus(true);
        setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated.");
            const currentStatus = await getVerificationStatus(user.id);
            setStatus(currentStatus);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setCheckingStatus(false);
        }
    }, []);

    useEffect(() => {
        checkStatus();
    }, [checkStatus]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!idDocument || !selfie) {
            setError("Please select both an ID document and a selfie.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated.");

            const idDocumentUrl = await uploadVerificationFile(idDocument, user.id, 'id_document');
            const selfieUrl = await uploadVerificationFile(selfie, user.id, 'selfie');

            await submitVerificationRequest(user.id, idDocumentUrl, selfieUrl);
            setStatus('pending');
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred during verification submission.");
        } finally {
            setLoading(false);
        }
    };
    
    if (checkingStatus) {
        return <div className="p-8 text-center">Checking verification status...</div>;
    }

    const renderStatusDisplay = () => {
        switch(status) {
            case 'approved':
                return <div className="p-6 bg-green-50 text-green-700 rounded-2xl text-center"><h3 className="font-bold">✅ Verified</h3><p className="text-sm">Your profile is approved and verified.</p></div>;
            case 'pending':
                return <div className="p-6 bg-amber-50 text-amber-700 rounded-2xl text-center"><h3 className="font-bold">⏳ Pending Review</h3><p className="text-sm">Your documents are under review. This usually takes 24-48 hours.</p></div>;
            case 'rejected':
                 return <div className="p-6 bg-rose-50 text-rose-700 rounded-2xl text-center"><h3 className="font-bold">❌ Verification Rejected</h3><p className="text-sm">Please check your email for details and resubmit with clearer documents.</p></div>;
            default:
                return null;
        }
    };
    
    const showForm = status === 'rejected' || status === null;

    return (
        <div className="bg-white p-8 rounded-2xl shadow-md border">
            <h2 className="text-2xl font-bold mb-6">Profile Verification</h2>
            
            {!showForm ? renderStatusDisplay() : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Government ID</label>
                        <p className="text-xs text-gray-500 mb-2">Upload a clear photo of your Aadhar, Passport, or Driver's License.</p>
                        <input type="file" accept="image/*" onChange={e => setIdDocument(e.target.files ? e.target.files[0] : null)} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-50 file:text-brand hover:file:bg-rose-100" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Selfie Photo</label>
                        <p className="text-xs text-gray-500 mb-2">Upload a clear, recent selfie.</p>
                        <input type="file" accept="image/*" onChange={e => setSelfie(e.target.files ? e.target.files[0] : null)} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-50 file:text-brand hover:file:bg-rose-100" />
                    </div>
                    <button type="submit" disabled={loading || !idDocument || !selfie} className="w-full bg-brand text-white py-3 rounded-lg font-bold hover:bg-rose-700 transition disabled:opacity-50">
                        {loading ? 'Submitting...' : 'Submit for Verification'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default VerificationForm;
