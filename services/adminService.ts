
import { supabase } from '../lib/supabase';
import { User } from '../types';

export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      profile:profiles(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[ADMIN_SERVICE] Error fetching users:', error);
    return [];
  }
  return data || [];
}

export async function softDeleteUser(userId: string): Promise<boolean> {
  const { error } = await supabase.rpc('admin_delete_user', { p_user_id: userId });
  if (error) {
    console.error('[ADMIN_SERVICE] Delete Error:', error);
    return false;
  }
  return true;
}

export async function hardDeleteUser(userId: string): Promise<boolean> {
  const { error } = await supabase.rpc('admin_hard_delete_user', { p_user_id: userId });
  if (error) {
    console.error('[ADMIN_SERVICE] Hard Delete Error:', error);
    // Fallback if rpc doesn't exist
    return false;
  }
  return true;
}

/**
 * Nuclear delete: calls the admin-delete-user Edge Function.
 * Wipes: storage files, photos, interests, profile, users row, auth.users
 */
export async function fullDeleteUser(userId: string): Promise<{ success: boolean; message?: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { success: false, message: 'No active session' };

  const res = await supabase.functions.invoke('admin-delete-user', {
    body: { target_user_id: userId },
  });

  if (res.error) {
    console.error('[ADMIN_SERVICE] Full Delete Error:', res.error);
    return { success: false, message: res.error.message };
  }

  return { success: true };
}

export async function restoreUser(userId: string): Promise<boolean> {
  const { error } = await supabase.rpc('admin_restore_user', { p_user_id: userId });
  if (error) {
    console.error('[ADMIN_SERVICE] Restore Error:', error);
    return false;
  }
  return true;
}

export async function updateUserRole(userId: string, role: string): Promise<boolean> {
  const { error } = await supabase.rpc('admin_update_role', { 
    p_user_id: userId, 
    p_role: role 
  });
  if (error) {
    console.error('[ADMIN_SERVICE] Update Role Error:', error);
    return false;
  }
  return true;
}

export async function createAdminProfile(payload: { email: string, password: string, name: string, role: string, photos?: string[], phone?: string }): Promise<{ success: boolean, message?: string }> {
    const { error } = await supabase.rpc('admin_add_profile', {
        user_email: payload.email,
        user_password: payload.password,
        user_name: payload.name,
        user_role: payload.role,
        user_photos: payload.photos || []
    });

    if (error) {
        return { success: false, message: error.message };
    }
    return { success: true };
}

export async function getAdminStats() {
    const { data: users } = await supabase.from('users').select('id, deleted_at, created_at, profile:profiles(is_approved, created_at)');
    if (!users) return { total: 0, active: 0, deleted: 0, today: 0, pending: 0, thisWeek: 0 };

    const now = new Date();
    const todayStart = new Date(now.setHours(0,0,0,0)).toISOString();
    
    // Calculate start of week (Sunday)
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0,0,0,0);
    const weekStartStr = weekStart.toISOString();

    return {
        total: users.length,
        active: users.filter(u => !u.deleted_at).length,
        deleted: users.filter(u => u.deleted_at).length,
        today: users.filter((u: any) => u.created_at >= todayStart).length,
        pending: users.filter((u: any) => {
            const p = Array.isArray(u.profile) ? u.profile[0] : u.profile;
            return !u.deleted_at && p && p.is_approved === false;
        }).length,
        thisWeek: users.filter((u: any) => u.created_at >= weekStartStr).length
    };
}

// -- Approve / Reject Profiles --

export async function approveProfile(userId: string): Promise<{ success: boolean; message?: string }> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_approved: true, verification_status: 'verified' })
    .eq('user_id', userId);

  if (error) {
    console.error('[ADMIN_SERVICE] Approve Profile Error:', error);
    return { success: false, message: error.message };
  }
  return { success: true };
}

export async function rejectProfile(userId: string): Promise<{ success: boolean; message?: string }> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_approved: false, verification_status: 'unverified' })
    .eq('user_id', userId);

  if (error) {
    console.error('[ADMIN_SERVICE] Reject Profile Error:', error);
    return { success: false, message: error.message };
  }
  return { success: true };
}

export async function updateProfile(
  userId: string,
  profileData: Record<string, any>
): Promise<{ success: boolean; message?: string }> {
  // Filter out empty/undefined values so admin can skip fields
  const cleanData: Record<string, any> = {};
  for (const [key, value] of Object.entries(profileData)) {
    if (value !== undefined && value !== null && value !== '') {
      cleanData[key] = value;
    }
  }

  // If gallery_urls is set, always sync avatar_url and avatar_url to slot 0
  if (Array.isArray(cleanData.gallery_urls) && cleanData.gallery_urls.length > 0) {
    cleanData.avatar_url = cleanData.gallery_urls[0];
  }

  const { error } = await supabase
    .from('profiles')
    .update(cleanData)
    .eq('user_id', userId);

  if (error) {
    console.error('[ADMIN_SERVICE] Update Profile Error:', error);
    return { success: false, message: error.message };
  }
  return { success: true };
}

/**
 * Delete a specific file from Supabase Storage given its public URL.
 */
export async function deleteStorageFile(publicUrl: string, bucket: string = 'avatars'): Promise<boolean> {
  if (!publicUrl.includes(bucket)) return false;
  const parts = publicUrl.split(`/${bucket}/`);
  if (parts.length < 2) return false;
  const { error } = await supabase.storage.from(bucket).remove([parts[1]]);
  if (error) {
    console.error('[ADMIN_SERVICE] Storage Delete Error:', error);
    return false;
  }
  return true;
}

export async function getAuditLogs() {
  const { data, error } = await supabase
    .from('audit_logs')
    .select(`
      *,
      admin:users!audit_logs_admin_id_fkey(email, profile:profiles(full_name))
    `)
    .order('created_at', { ascending: false })
    .limit(50);
    
  if (error) return [];
  return data || [];
}

// -- Photo Management for Admin --

export async function getPhotosForUser(userId: string) {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('user_id', userId)
    .order('is_primary', { ascending: false });

  if (error) {
    console.error('[ADMIN_SERVICE] Get Photos Error:', error);
    return [];
  }
  return data || [];
}

export async function addPhotoForUser(userId: string, url: string, isPrimary: boolean): Promise<{ success: boolean; message?: string }> {
  const { error } = await supabase
    .from('photos')
    .insert({ user_id: userId, url, is_primary: isPrimary });

  if (error) {
    console.error('[ADMIN_SERVICE] Add Photo Error:', error);
    return { success: false, message: error.message };
  }
  return { success: true };
}

export async function deletePhotoForUser(photoId: string): Promise<{ success: boolean; message?: string }> {
  const { error } = await supabase
    .from('photos')
    .delete()
    .eq('id', photoId);

  if (error) {
    console.error('[ADMIN_SERVICE] Delete Photo Error:', error);
    return { success: false, message: error.message };
  }
  return { success: true };
}

export async function updateProfilePhotoUrl(userId: string, photoUrl: string | null): Promise<{ success: boolean; message?: string }> {
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: photoUrl })
    .eq('user_id', userId);

  if (error) {
    console.error('[ADMIN_SERVICE] Update Photo URL Error:', error);
    return { success: false, message: error.message };
  }
  return { success: true };
}

// -- Smart User ID Search --

/**
 * Normalizes search input for User ID search.
 * - Numeric input (e.g., "1", "25") → "BR0001", "BR0025"
 * - "BR" prefix input → used directly
 * - Partial input (e.g., "BR00") → used for ILIKE match
 */
export function normalizeUserIdSearch(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  // If input is purely numeric, format as BR + zero-padded
  if (/^\d+$/.test(trimmed)) {
    const padded = trimmed.padStart(4, '0');
    return `BR${padded}`;
  }

  // If it starts with BR (case-insensitive), uppercase it
  if (/^br/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  // Otherwise return as-is (for name/email search)
  return trimmed;
}

