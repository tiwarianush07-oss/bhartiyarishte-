import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { uploadImage } from '../services/uploadService';

const MAX_PHOTOS = 6;
const BUCKET = 'avatars';

export interface GalleryState {
  urls: string[];
  loading: boolean;
  error: string | null;
}

/**
 * useGallery — manages a 6-photo gallery stored in profiles.gallery_urls
 *
 * - The first URL in the array is always the main avatar (avatar_url / avatar_url).
 * - Google profile pictures are treated as slot 0 if present.
 * - Physical files are stored in `avatars/{userId}/photo_{n}.jpg`.
 * - Deletion removes the file from Supabase Storage AND the array.
 */
export function useGallery(userId: string | null) {
  const [state, setState] = useState<GalleryState>({
    urls: [],
    loading: false,
    error: null,
  });

  // ---------------------------------------------------------
  // LOAD: Pull gallery_urls + avatar_url from the profile row
  // ---------------------------------------------------------
  const loadGallery = useCallback(async () => {
    if (!userId) return;
    setState(s => ({ ...s, loading: true, error: null }));

    const { data, error } = await supabase
      .from('profiles')
      .select('gallery_urls, avatar_url')
      .eq('user_id', userId)
      .single();

    if (error) {
      setState(s => ({ ...s, loading: false, error: error.message }));
      return;
    }

    let urls: string[] = data?.gallery_urls ?? [];

    // If avatar_url exists (Google pic) and isn't already in the gallery,
    // prepend it so it always occupies slot 0.
    const googleAvatar = data?.avatar_url;
    if (googleAvatar && !urls.includes(googleAvatar)) {
      urls = [googleAvatar, ...urls].slice(0, MAX_PHOTOS);
    }

    setState({ urls, loading: false, error: null });
  }, [userId]);

  // ---------------------------------------------------------
  // UPLOAD: compress → upload → append URL → persist
  // ---------------------------------------------------------
  const uploadPhoto = useCallback(
    async (file: File): Promise<string | null> => {
      if (!userId) return null;
      if (state.urls.length >= MAX_PHOTOS) {
        setState(s => ({
          ...s,
          error: `Maximum ${MAX_PHOTOS} photos reached. Remove one before adding another.`,
        }));
        return null;
      }

      setState(s => ({ ...s, loading: true, error: null }));

      try {
        const slotIndex = state.urls.length + 1;
        const publicUrl = await uploadImage(file, userId, BUCKET);

        const updatedUrls = [...state.urls, publicUrl];

        // Persist gallery + set first photo as avatar
        const updatePayload: Record<string, any> = {
          gallery_urls: updatedUrls,
        };
        if (updatedUrls.length === 1 || slotIndex === 1) {
          updatePayload.avatar_url = publicUrl;
        }

        const { error } = await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('user_id', userId);

        if (error) throw error;

        setState({ urls: updatedUrls, loading: false, error: null });
        return publicUrl;
      } catch (err: any) {
        setState(s => ({ ...s, loading: false, error: err.message }));
        return null;
      }
    },
    [userId, state.urls],
  );

  // ---------------------------------------------------------
  // DELETE: remove file from storage → remove URL from array
  // ---------------------------------------------------------
  const deletePhoto = useCallback(
    async (url: string) => {
      if (!userId) return;
      setState(s => ({ ...s, loading: true, error: null }));

      try {
        // Extract the storage path from the full public URL
        if (url.includes(BUCKET)) {
          const parts = url.split(`/${BUCKET}/`);
          if (parts.length > 1) {
            await supabase.storage.from(BUCKET).remove([parts[1]]);
          }
        }

        const updatedUrls = state.urls.filter(u => u !== url);

        const updatePayload: Record<string, any> = {
          gallery_urls: updatedUrls,
        };

        // If we just deleted the primary photo, promote the next one
        if (state.urls[0] === url) {
          updatePayload.avatar_url = updatedUrls[0] || null;
        }

        const { error } = await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('user_id', userId);

        if (error) throw error;

        setState({ urls: updatedUrls, loading: false, error: null });
      } catch (err: any) {
        setState(s => ({ ...s, loading: false, error: err.message }));
      }
    },
    [userId, state.urls],
  );

  // ---------------------------------------------------------
  // REPLACE: swap a photo at a specific index
  // ---------------------------------------------------------
  const replacePhoto = useCallback(
    async (index: number, file: File): Promise<string | null> => {
      if (!userId || index < 0 || index >= state.urls.length) return null;
      setState(s => ({ ...s, loading: true, error: null }));

      try {
        const oldUrl = state.urls[index];

        // Delete old file from storage
        if (oldUrl.includes(BUCKET)) {
          const parts = oldUrl.split(`/${BUCKET}/`);
          if (parts.length > 1) {
            await supabase.storage.from(BUCKET).remove([parts[1]]);
          }
        }

        // Upload new
        const publicUrl = await uploadImage(file, userId, BUCKET);

        const updatedUrls = [...state.urls];
        updatedUrls[index] = publicUrl;

        const updatePayload: Record<string, any> = {
          gallery_urls: updatedUrls,
        };
        if (index === 0) {
          updatePayload.avatar_url = publicUrl;
        }

        const { error } = await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('user_id', userId);

        if (error) throw error;

        setState({ urls: updatedUrls, loading: false, error: null });
        return publicUrl;
      } catch (err: any) {
        setState(s => ({ ...s, loading: false, error: err.message }));
        return null;
      }
    },
    [userId, state.urls],
  );

  // ---------------------------------------------------------
  // SET PRIMARY: move a URL to index 0
  // ---------------------------------------------------------
  const setPrimary = useCallback(
    async (url: string) => {
      if (!userId) return;
      const idx = state.urls.indexOf(url);
      if (idx <= 0) return; // already primary or not found

      setState(s => ({ ...s, loading: true, error: null }));

      try {
        const reordered = [url, ...state.urls.filter(u => u !== url)];

        const { error } = await supabase
          .from('profiles')
          .update({
            gallery_urls: reordered,
            avatar_url: url,
          })
          .eq('user_id', userId);

        if (error) throw error;
        setState({ urls: reordered, loading: false, error: null });
      } catch (err: any) {
        setState(s => ({ ...s, loading: false, error: err.message }));
      }
    },
    [userId, state.urls],
  );

  return {
    ...state,
    maxPhotos: MAX_PHOTOS,
    canUpload: state.urls.length < MAX_PHOTOS,
    loadGallery,
    uploadPhoto,
    deletePhoto,
    replacePhoto,
    setPrimary,
  };
}

