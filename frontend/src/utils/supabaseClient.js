import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/**
 * Storage key for local offline tests and user profile
 */
export const LOCAL_STORAGE_KEYS = {
  USER: 'feedguard_user_profile',
  AUTH_TOKEN: 'feedguard_auth_token',
  TESTS: 'feedguard_saved_tests',
  LANGUAGE: 'feedguard_language',
};
