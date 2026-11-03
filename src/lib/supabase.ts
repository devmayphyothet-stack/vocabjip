import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const DEFAULT_SUPABASE_URL = 'https://fbopsfqbepwrqoqriqlm.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZib3BzZnFiZXB3cnFvcXJpcWxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1NDYzNDYsImV4cCI6MjEwOTEyMjM0Nn0.HplE0sYhdKZ6yssrjMe9n19PfTaFP2MaykzedmDfK-w';

const rawUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim();
const rawKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').trim();

const supabaseUrl =
  rawUrl && rawUrl !== 'https://placeholder.supabase.co' && !rawUrl.includes('your-project')
    ? rawUrl
    : DEFAULT_SUPABASE_URL;

const supabaseAnonKey =
  rawKey && rawKey !== 'placeholder-anon-key' && rawKey.startsWith('eyJ')
    ? rawKey
    : DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseUrl !== 'https://placeholder.supabase.co' &&
    supabaseAnonKey &&
    supabaseAnonKey !== 'placeholder-anon-key'
);

// Custom storage adapter for React Native AsyncStorage
const storageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      return null;
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      return;
    }
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      return;
    }
    await AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

