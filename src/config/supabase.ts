import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isConfigured = supabaseUrl !== '' && supabaseAnonKey !== '' && !supabaseUrl.includes('your-project-id');

if (!isConfigured) {
  console.warn(
    'Supabase environment variables are missing! PWA will fall back to local/offline storage mode.'
  );
}

// Fallback to dummy values to prevent createClient from crashing during initialization
const urlToUse = isConfigured ? supabaseUrl : 'https://placeholder-project-id.supabase.co';
const keyToUse = isConfigured ? supabaseAnonKey : 'placeholder-anon-key';

export const supabase = createClient(urlToUse, keyToUse);
