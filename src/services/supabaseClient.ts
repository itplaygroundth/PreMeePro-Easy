import { createClient } from '@supabase/supabase-js';

// These should be in your .env file
// VITE_SUPABASE_URL=https://supabase.jkfast.dev
// VITE_SUPABASE_ANON_KEY=your-anon-key-here

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://supabase.jkfast.dev';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
    console.warn('⚠️ Supabase Anon Key is missing! Realtime updates will not work.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false, // We rely on our own auth or backend for writes, mostly reading here?
        // actually standard is true but if we share auth with backend it might be complex
    }
});
