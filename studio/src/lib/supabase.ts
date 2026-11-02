import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://fbopsfqbepwrqoqriqlm.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZib3BzZnFiZXB3cnFvcXJpcWxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1NDYzNDYsImV4cCI6MjEwOTEyMjM0Nn0.HplE0sYhdKZ6yssrjMe9n19PfTaFP2MaykzedmDfK-w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

