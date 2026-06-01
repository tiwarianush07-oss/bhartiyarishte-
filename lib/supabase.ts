import { createClient } from '@supabase/supabase-js';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

// These must be set in your .env file (see .env.example for reference).
// NEVER hardcode real credentials here — they belong in .env (gitignored).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    '[Bhartiya Rishtey] Missing Supabase credentials.\n' +
    'Please create a .env file in the project root with:\n' +
    '  VITE_SUPABASE_URL=your_project_url\n' +
    '  VITE_SUPABASE_ANON_KEY=your_anon_key\n' +
    'See .env.example for reference.'
  );
}

const capacitorStorage = {
  getItem: async (key: string) => {
    const { value } = await Preferences.get({ key });
    return value;
  },
  setItem: async (key: string, value: string) => {
    await Preferences.set({ key, value });
  },
  removeItem: async (key: string) => {
    await Preferences.remove({ key });
  }
};

const getSafeStorage = () => {
  if (Capacitor.isNativePlatform()) {
    return capacitorStorage;
  }
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      // Test access
      window.localStorage.getItem('test');
      return window.localStorage;
    }
  } catch (e) {
    console.warn('localStorage is blocked or unavailable, falling back to memory storage');
  }
  
  // Memory fallback
  const memStore = new Map<string, string>();
  return {
    getItem: (key: string) => memStore.get(key) || null,
    setItem: (key: string, val: string) => {
      memStore.set(key, val);
    },
    removeItem: (key: string) => {
      memStore.delete(key);
    },
  };
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: getSafeStorage(),
    lock: async (name: string, acquireTimeout: number, fn: () => Promise<any>) => {
      // By default, Supabase tries to acquire a lock and waits up to timeout (e.g. 10000ms)
      // This causes a timeout console error in many modern browsers if the lock is held 
      // by a background tab or previous dead session.
      // This override attempts to grab the lock immediately (ifAvailable).
      // If it fails, it just proceeds with executing the auth refresh function anyway instead of waiting.
      try {
        if (typeof navigator !== 'undefined' && navigator.locks) {
          return await navigator.locks.request(name, { mode: 'exclusive', ifAvailable: true }, async (lock) => {
            if (lock) {
              return await fn();
            } else {
              // Lock is held by another tab, just run the function anyway (fallback)
              console.warn(`[Supabase Auth] Lock "${name}" held by another tab, proceeding without lock.`);
              return await fn();
            }
          });
        } else {
          // navigator.locks not supported (older browsers or non-browser environments)
          return await fn();
        }
      } catch (err) {
        // Fallback for unexpected Web Locks API failures
        console.warn(`[Supabase Auth] Web Locks API error for "${name}", proceeding without lock.`, err);
        return await fn();
      }
    }
  }
});
