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
    console.log("Supabase initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err);
  }
} else {
  console.warn("DEBUG INFO: URL present:", !!supabaseUrl, "| Key present:", !!supabaseAnonKey);
}

export const supabase = client;
export const configDebug = { url: !!supabaseUrl, key: !!supabaseAnonKey };
