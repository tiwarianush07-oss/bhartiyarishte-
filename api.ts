import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const uploadProfilePhoto = async (file: File, userId: string) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Math.random()}.${fileExt}`;
  const filePath = `profile-photos/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('brahmin-files')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('brahmin-files').getPublicUrl(filePath);
  return data.publicUrl;
};

export const submitPaymentProof = async (userId: string, paymentData: any, file: File) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-txn-${Date.now()}.${fileExt}`;
  const filePath = `payments/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('brahmin-files')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('brahmin-files').getPublicUrl(filePath);

  const { error } = await supabase.from('payments').insert({
    user_id: userId,
    plan: paymentData.plan,
    upi_txn_id: paymentData.upi_txn_id,
    screenshot_url: data.publicUrl,
    status: 'PENDING'
  });

  if (error) throw error;
};