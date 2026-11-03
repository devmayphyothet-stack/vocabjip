import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://fbopsfqbepwrqoqriqlm.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZib3BzZnFiZXB3cnFvcXJpcWxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1NDYzNDYsImV4cCI6MjEwOTEyMjM0Nn0.HplE0sYhdKZ6yssrjMe9n19PfTaFP2MaykzedmDfK-w';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

const supabaseUrl =
  rawUrl && !rawUrl.includes('fbopsfqbepwrqoqriqlm') ? rawUrl : DEFAULT_SUPABASE_URL;

const supabaseAnonKey =
  supabaseUrl === DEFAULT_SUPABASE_URL ||
  !rawKey ||
  !rawKey.startsWith('eyJ') ||
  rawKey.includes('G7N1W9L2W1f8b4o2UvhH57pQxL10qg')
    ? DEFAULT_SUPABASE_ANON_KEY
    : rawKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


