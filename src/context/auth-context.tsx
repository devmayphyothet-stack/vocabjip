import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { AuthState, PendingOtpSession, UserProfile } from '@/types/auth';

const STORAGE_KEYS = {
  USER_PROFILE: '@vocabjip/user_profile',
  PENDING_OTP: '@vocabjip/pending_otp_session',
  IS_GUEST: '@vocabjip/is_guest',
};

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithOtp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (token: string) => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  resendOtp: () => Promise<{ success: boolean; error?: string }>;
  clearPendingOtp: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const OTP_VALID_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [pendingOtp, setPendingOtp] = useState<PendingOtpSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore persistent state on mount
  const restoreSession = useCallback(async () => {
    try {
      const [storedUserJson, storedGuest, storedOtpJson] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE),
        AsyncStorage.getItem(STORAGE_KEYS.IS_GUEST),
        AsyncStorage.getItem(STORAGE_KEYS.PENDING_OTP),
      ]);

      if (storedUserJson) {
        setUser(JSON.parse(storedUserJson));
      } else if (storedGuest === 'true') {
        setIsGuest(true);
      }

      if (storedOtpJson) {
        const parsedOtp: PendingOtpSession = JSON.parse(storedOtpJson);
        const now = Date.now();
        // If not expired, restore pending OTP
        if (parsedOtp.expiresAt > now) {
          setPendingOtp(parsedOtp);
        } else {
          await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_OTP);
        }
      }
    } catch (e) {
      console.warn('Failed to restore auth session:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();

    // Listen to AppState changes (e.g. user returns from Gmail)
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Refresh and ensure pending OTP is still verified
        AsyncStorage.getItem(STORAGE_KEYS.PENDING_OTP).then((val) => {
          if (val) {
            try {
              const otp: PendingOtpSession = JSON.parse(val);
              if (otp.expiresAt > Date.now()) {
                setPendingOtp(otp);
              }
            } catch (_) {}
          }
        });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [restoreSession]);

  // Persist Pending OTP to AsyncStorage
  const savePendingOtp = async (session: PendingOtpSession) => {
    setPendingOtp(session);
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_OTP, JSON.stringify(session));
  };

  const clearPendingOtp = async () => {
    setPendingOtp(null);
    await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_OTP);
  };

  const continueAsGuest = async () => {
    setIsGuest(true);
    await AsyncStorage.setItem(STORAGE_KEYS.IS_GUEST, 'true');
  };

  const signUpWithOtp = async (
    email: string,
    password: string,
    displayName: string
  ): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    const now = Date.now();
    const session: PendingOtpSession = {
      email: trimmedEmail,
      displayName,
      password,
      type: 'signup',
      sentAt: now,
      expiresAt: now + OTP_VALID_DURATION_MS,
      resendAvailableAt: now + OTP_RESEND_COOLDOWN_MS,
    };

    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: { display_name: displayName },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }
    }

    await savePendingOtp(session);
    return { success: true };
  };

  const verifyOtp = async (token: string): Promise<{ success: boolean; error?: string }> => {
    if (!pendingOtp) {
      return { success: false, error: 'No active OTP request. Please request a new code.' };
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.verifyOtp({
        email: pendingOtp.email,
        token: token.trim(),
        type: pendingOtp.type === 'signup' ? 'signup' : 'recovery',
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const newUser: UserProfile = {
          id: data.user.id,
          email: pendingOtp.email,
          displayName: pendingOtp.displayName || data.user.user_metadata?.display_name || 'TOPIK Learner',
          targetLevel: 'TOPIK II Level 4',
          streakDays: 1,
          dailyGoal: 3,
          dailyCompleted: 0,
          createdAt: new Date().toISOString(),
        };
        setUser(newUser);
        setIsGuest(false);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(newUser));
        await AsyncStorage.removeItem(STORAGE_KEYS.IS_GUEST);
      }
    } else {
      // Demo / Mock mode for local preview before Supabase is configured
      // Accepts 6-digit code (e.g. 123456 or any 6 digits)
      if (token.length !== 6) {
        return { success: false, error: 'Please enter a valid 6-digit code.' };
      }

      if (pendingOtp.type === 'signup') {
        const demoUser: UserProfile = {
          id: 'demo-user-1',
          email: pendingOtp.email,
          displayName: pendingOtp.displayName || 'TOPIK Learner',
          targetLevel: 'TOPIK II Level 4',
          streakDays: 1,
          dailyGoal: 3,
          dailyCompleted: 0,
          createdAt: new Date().toISOString(),
        };
        setUser(demoUser);
        setIsGuest(false);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(demoUser));
        await AsyncStorage.removeItem(STORAGE_KEYS.IS_GUEST);
      }
    }

    await clearPendingOtp();
    return { success: true };
  };

  const requestPasswordReset = async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    const now = Date.now();
    const session: PendingOtpSession = {
      email: trimmedEmail,
      type: 'recovery',
      sentAt: now,
      expiresAt: now + OTP_VALID_DURATION_MS,
      resendAvailableAt: now + OTP_RESEND_COOLDOWN_MS,
    };

    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail);
      if (error) {
        return { success: false, error: error.message };
      }
    }

    await savePendingOtp(session);
    return { success: true };
  };

  const updatePassword = async (
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        return { success: false, error: error.message };
      }
    }
    return { success: true };
  };

  const resendOtp = async (): Promise<{ success: boolean; error?: string }> => {
    if (!pendingOtp) {
      return { success: false, error: 'No active session found.' };
    }
    const now = Date.now();
    if (now < pendingOtp.resendAvailableAt) {
      const waitSeconds = Math.ceil((pendingOtp.resendAvailableAt - now) / 1000);
      return { success: false, error: `Please wait ${waitSeconds}s before requesting a new code.` };
    }

    const updatedSession: PendingOtpSession = {
      ...pendingOtp,
      sentAt: now,
      expiresAt: now + OTP_VALID_DURATION_MS,
      resendAvailableAt: now + OTP_RESEND_COOLDOWN_MS,
    };

    if (isSupabaseConfigured) {
      if (pendingOtp.type === 'signup') {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: pendingOtp.email,
        });
        if (error) return { success: false, error: error.message };
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(pendingOtp.email);
        if (error) return { success: false, error: error.message };
      }
    }

    await savePendingOtp(updatedSession);
    return { success: true };
  };

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const loggedInUser: UserProfile = {
          id: data.user.id,
          email: trimmedEmail,
          displayName: data.user.user_metadata?.display_name || 'TOPIK Learner',
          targetLevel: 'TOPIK II Level 4',
          streakDays: 7,
          dailyGoal: 3,
          dailyCompleted: 2,
          createdAt: new Date().toISOString(),
        };
        setUser(loggedInUser);
        setIsGuest(false);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(loggedInUser));
        await AsyncStorage.removeItem(STORAGE_KEYS.IS_GUEST);
      }
    } else {
      // Demo login
      const demoUser: UserProfile = {
        id: 'demo-user-1',
        email: trimmedEmail,
        displayName: 'TOPIK Learner',
        targetLevel: 'TOPIK II Level 4',
        streakDays: 7,
        dailyGoal: 3,
        dailyCompleted: 2,
        createdAt: new Date().toISOString(),
      };
      setUser(demoUser);
      setIsGuest(false);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(demoUser));
      await AsyncStorage.removeItem(STORAGE_KEYS.IS_GUEST);
    }

    return { success: true };
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setIsGuest(false);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    await AsyncStorage.removeItem(STORAGE_KEYS.IS_GUEST);
    await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_OTP);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isGuest,
        pendingOtp,
        signIn,
        signUpWithOtp,
        verifyOtp,
        requestPasswordReset,
        updatePassword,
        resendOtp,
        clearPendingOtp,
        continueAsGuest,
        signOut,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

