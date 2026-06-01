import { supabase } from '../../lib/supabase';

const BUCKET_NAME = 'verification_documents';

/**
 * Uploads a verification file (ID or selfie) to Supabase Storage.
 * @param file The file to upload.
 * @param userId The ID of the user uploading the file.
 * @param type 'id_document' or 'selfie'.
 * @returns The public URL of the uploaded file.
 */
export const uploadVerificationFile = async (file: File, userId: string, type: 'id_document' | 'selfie'): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${type}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file);

    if (uploadError) {
        throw new Error(`Failed to upload ${type}: ${uploadError.message}`);
    }

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    return data.publicUrl;
};

/**
 * Submits a new verification request to the database.
 * @param userId The user's ID.
 * @param idDocumentUrl Public URL of the uploaded ID document.
 * @param selfieUrl Public URL of the uploaded selfie.
 */
export const submitVerificationRequest = async (userId: string, idDocumentUrl: string, selfieUrl: string): Promise<void> => {
    const { data: existing, error: checkError } = await supabase
        .from('verification_requests')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .single();
    
    if (checkError && checkError.code !== 'PGRST116') throw checkError;
    if (existing) throw new Error("You already have a pending verification request.");

    const { error } = await supabase
        .from('verification_requests')
        .insert({
            user_id: userId,
            id_document_url: idDocumentUrl,
            selfie_url: selfieUrl,
            status: 'pending'
        });

    if (error) {
        throw new Error(`Could not submit verification request: ${error.message}`);
    }
};

/**
 * Fetches the latest verification status for a user.
 * @param userId The user's ID.
 * @returns The status ('pending', 'approved', 'rejected') or null if no request exists.
 */
export const getVerificationStatus = async (userId: string): Promise<'pending' | 'approved' | 'rejected' | null> => {
    const { data, error } = await supabase
        .from('verification_requests')
        .select('status')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') {
        throw new Error(error.message);
    }

    return data ? data.status : null;
};
