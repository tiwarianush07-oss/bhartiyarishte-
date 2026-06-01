import { supabase } from '../lib/supabase';
import { Photo } from '../types';

/**
 * SECURE PHOTO SERVICE
 * Requirement: 'profile_photos' bucket must have RLS enabled.
 * Public access should be DISABLED for the bucket.
 */

const BUCKET_NAME = 'profile_photos';

export async function getProfilePhotos(userId: string): Promise<Photo[]> {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('user_id', userId)
    .order('is_primary', { ascending: false });

  if (error) throw error;
  return data || [];
}

import { uploadImage } from './uploadService';

export async function uploadProfilePhoto(userId: string, file: File, isPrimary: boolean): Promise<Photo> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Upload to bucket using the universal uploadImage utility
  const publicUrl = await uploadImage(file, user.id, BUCKET_NAME);
  
  const { data: newPhoto, error: insertError } = await supabase
    .from('photos')
    .insert({ 
      user_id: user.id, 
      url: publicUrl, 
      is_primary: isPrimary 
    })
    .select()
    .single();
    
  if (insertError) throw insertError;

  return newPhoto;
}

export async function deleteProfilePhoto(photo: Photo): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== photo.user_id) throw new Error("Unauthorized");

  const filePath = photo.url.split(`${BUCKET_NAME}/`)[1];
  
  await supabase.storage.from(BUCKET_NAME).remove([filePath]);

  const { error: dbError } = await supabase
    .from('photos')
    .delete()
    .eq('id', photo.id);

  if (dbError) throw dbError;
}

// Added setPrimaryPhoto function to fix the import error in views/MyProfile.tsx
/**
 * Sets a specific photo as the primary photo for a user.
 * This function first resets all photos for the user to not be primary,
 * and then sets the chosen photo ID to be the primary one.
 */
export async function setPrimaryPhoto(userId: string, photoId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) throw new Error("Unauthorized");

  // Reset all existing photos for this user to not primary
  const { error: resetError } = await supabase
    .from('photos')
    .update({ is_primary: false })
    .eq('user_id', userId);

  if (resetError) throw resetError;

  // Set the target photo to be primary
  const { error: updateError } = await supabase
    .from('photos')
    .update({ is_primary: true })
    .eq('id', photoId)
    .eq('user_id', userId);

  if (updateError) throw updateError;
}
