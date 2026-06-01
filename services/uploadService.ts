import { supabase } from '../lib/supabase';
import imageCompression from 'browser-image-compression';

/**
 * Universal utility to compress, upload, and clean up images.
 * @param file The raw File object from the input.
 * @param userId The ID of the user this file belongs to.
 * @param bucketName The storage bucket ('avatars' by default).
 * @param oldPhotoUrl Optional. If provided, deletes the old photo from the bucket.
 * @returns The public URL of the uploaded image.
 */
export async function uploadImage(
  file: File, 
  userId: string, 
  bucketName: string = 'avatars', 
  oldPhotoUrl?: string
): Promise<string> {
  
  // 1. Compression Phase
  const options = {
    maxSizeMB: 0.5, // 500KB Max
    maxWidthOrHeight: 800,
    useWebWorker: true,
  };
  
  let processedFile = file;
  try {
    processedFile = await imageCompression(file, options);
  } catch (error) {
    console.error("Compression failed, using original file", error);
  }

  // 2. Cleanup Phase (if an old photo URL exists in this bucket)
  if (oldPhotoUrl && oldPhotoUrl.includes(bucketName)) {
    try {
      // Extract the path from the URL. e.g. "https://[id].supabase.co/storage/v1/object/public/avatars/123/file.jpg"
      const urlParts = oldPhotoUrl.split(`/${bucketName}/`);
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from(bucketName).remove([filePath]);
      }
    } catch (e) {
      console.warn("Failed to clean up old photo", e);
    }
  }

  // 3. Upload Phase with Exponential Backoff
  const fileExt = processedFile.name.split('.').pop() || 'jpg';
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  
  const maxRetries = 3;
  let uploadError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, processedFile, { upsert: true });

    uploadError = error;

    if (!error) {
      uploadError = null;
      break;
    }

    console.warn(`Upload attempt ${attempt + 1} failed. Retrying...`, error);
    if (attempt < maxRetries - 1) {
      await new Promise(res => setTimeout(res, 1000 * Math.pow(2, attempt)));
    }
  }

  if (uploadError) {
    console.error("All upload attempts failed", uploadError);
    throw uploadError;
  }

  // 4. Retrieve Public URL
  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}

