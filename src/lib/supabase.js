import { createClient } from '@supabase/supabase-js';

// Robust loading of environment variables
const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Clean quotes if they were accidentally pasted into Vercel
const supabaseUrl = rawUrl?.replace(/^["'](.+)["']$/, '$1')?.trim();
const supabaseAnonKey = rawKey?.replace(/^["'](.+)["']$/, '$1')?.trim();

let client = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err);
  }
} else {
  console.error("Supabase environment variables are missing or incomplete.");
}

export const supabase = client;
