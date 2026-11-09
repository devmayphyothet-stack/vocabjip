import { ProfileFields, validateProfile } from '@/lib/profile-fields';
import {
  deleteRemoteAccount,
  completeLocalDeletion,
  DELETION_CLEANUP_KEY,
} from '@/services/account-service';
import { StreakService } from '@/services/streak-service';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { migrateLegacyStorage, setAccountItem } from '@/lib/account-storage';
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
    displayName: string,
  ) => Promise<{ success: boolean; autoConfirmed?: boolean; error?: string }>;
  verifyOtp: (token: string) => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  resendOtp: () => Promise<{ success: boolean; error?: string }>;
  clearPendingOtp: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (fields: ProfileFields) => Promise<void>;
  refreshProfile: () => Promise<void>;
  requestEmailChange: (email: string) => Promise<'updated' | 'pending'>;
  deleteAccount: (password: string, confirmation: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const OTP_VALID_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [pendingOtp, setPendingOtp] = useState<PendingOtpSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Helper to fetch profile from Supabase profiles table
  const fetchSupabaseProfile = async (userId: string, email: string): Promise<UserProfile> => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile) {
        return {
          id: profile.id,
          email: profile.email || email,
          avatarKey: profile.avatar_key || 'learner',
          bio: profile.bio || '',
          koreanBackground: profile.korean_background || '',
          role: profile.role || 'user',
          displayName: profile.display_name || 'TOPIK Learner',
          targetLevel: profile.target_level || 'TOPIK II Level 4',
          streakDays: profile.streak_days ?? 1,
          dailyGoal: profile.daily_goal ?? 3,
          dailyCompleted: profile.daily_completed ?? 0,
          createdAt: profile.created_at || new Date().toISOString(),
        };
      }
    } catch (_) {}

    return {
      id: userId,
      email,
      displayName: 'TOPIK Learner',
      targetLevel: 'TOPIK II Level 4',
      streakDays: 1,
      dailyGoal: 3,
      dailyCompleted: 0,
      createdAt: new Date().toISOString(),
    };
  };

  // Restore persistent state on mount
  const restoreSession = useCallback(async () => {
    try {
      const pendingCleanup = await AsyncStorage.getItem(DELETION_CLEANUP_KEY);
      if (pendingCleanup) await completeLocalDeletion(pendingCleanup);
      await migrateLegacyStorage();
      if (isSupabaseConfigured) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await fetchSupabaseProfile(session.user.id, session.user.email || '');
          setUser(profile);
          setIsGuest(false);
          await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
          await AsyncStorage.removeItem(STORAGE_KEYS.IS_GUEST);
        } else {
          const storedGuest = await AsyncStorage.getItem(STORAGE_KEYS.IS_GUEST);
          if (storedGuest === 'true') {
            setIsGuest(true);
          }
        }
      } else {
        const [storedUserJson, storedGuest] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE),
          AsyncStorage.getItem(STORAGE_KEYS.IS_GUEST),
        ]);
        if (storedUserJson) {
          setUser(JSON.parse(storedUserJson));
        } else if (storedGuest === 'true') {
          setIsGuest(true);
        }
      }

      // Check pending OTP session
      const storedOtpJson = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_OTP);
      if (storedOtpJson) {
        const parsedOtp: PendingOtpSession = JSON.parse(storedOtpJson);
        const now = Date.now();
        if (parsedOtp.expiresAt > now) {
          delete parsedOtp.password;
          await AsyncStorage.setItem(STORAGE_KEYS.PENDING_OTP, JSON.stringify(parsedOtp));
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

    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsGuest(false);
      }
      if (event === 'USER_UPDATED' && session?.user) {
        const account = session.user;
        setTimeout(() => {
          void fetchSupabaseProfile(account.id, account.email || '').then((profile) => {
            setUser((current) => (current?.id === account.id ? profile : current));
          });
        }, 0);
      }
      if (event === 'TOKEN_REFRESHED' && !session) {
        setUser(null);
      }
    });

    // Listen to AppState changes (e.g. user returns from Gmail)
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
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
      authSubscription.unsubscribe();
    };
  }, [restoreSession]);

  const savePendingOtp = async (session: PendingOtpSession) => {
    setPendingOtp(session);
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_OTP, JSON.stringify(session));
  };

  const clearPendingOtp = async () => {
    setPendingOtp(null);
    await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_OTP);
  };

  const continueAsGuest = async () => {
    if (user) await signOut();
    setIsGuest(true);
    await AsyncStorage.setItem(STORAGE_KEYS.IS_GUEST, 'true');
  };

  const signUpWithOtp = async (
    email: string,
    password: string,
    displayName: string,
  ): Promise<{ success: boolean; autoConfirmed?: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    const now = Date.now();
    const session: PendingOtpSession = {
      email: trimmedEmail,
      displayName,
      type: 'signup',
      sentAt: now,
      expiresAt: now + OTP_VALID_DURATION_MS,
      resendAvailableAt: now + OTP_RESEND_COOLDOWN_MS,
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: { display_name: displayName },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // If Supabase "Confirm email" is turned OFF, signUp immediately returns an active session
      if (data?.session && data?.user) {
        const profile = await fetchSupabaseProfile(data.user.id, trimmedEmail);
        setUser(profile);
        setIsGuest(false);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
        await AsyncStorage.removeItem(STORAGE_KEYS.IS_GUEST);
        await clearPendingOtp();
        return { success: true, autoConfirmed: true };
      }
    }

    await savePendingOtp(session);
    return { success: true, autoConfirmed: false };
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
        const profile = await fetchSupabaseProfile(data.user.id, pendingOtp.email);
        setUser(profile);
        setIsGuest(false);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
        await AsyncStorage.removeItem(STORAGE_KEYS.IS_GUEST);
      }
    } else {
      // Demo mode
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
    email: string,
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
    newPassword: string,
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
    password: string,
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
        const profile = await fetchSupabaseProfile(data.user.id, trimmedEmail);
        setUser(profile);
        setIsGuest(false);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
        await AsyncStorage.removeItem(STORAGE_KEYS.IS_GUEST);
      }
    } else {
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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
    setUser(null);
    setIsGuest(false);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    await AsyncStorage.removeItem(STORAGE_KEYS.IS_GUEST);
    await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_OTP);
  };

  const updateProfile = async (input: ProfileFields) => {
    if (!user) throw new Error('Sign in to edit your profile.');
    const fields = validateProfile(input);
    const { data, error } = await supabase.rpc('update_own_profile', { profile_fields: fields });
    if (error || !data)
      throw new Error('Could not save your profile. Check your connection and retry.');
    const updated = {
      ...user,
      displayName: data.display_name,
      targetLevel: data.target_level,
      dailyGoal: data.daily_goal,
      avatarKey: data.avatar_key,
      bio: data.bio,
      koreanBackground: data.korean_background,
    };
    await setAccountItem('profile_cache', JSON.stringify(updated), user.id);
    setUser((current) => (current?.id === user.id ? updated : current));
    await StreakService.setDailyGoal(data.daily_goal, user.id).catch(() => {});
  };
  const refreshProfile = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user)
      throw new Error('Could not refresh your profile. Please retry online.');
    const updated = await fetchSupabaseProfile(data.user.id, data.user.email || '');
    setUser((current) => (current?.id === updated.id ? updated : current));
  };
  const requestEmailChange = async (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!user || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed))
      throw new Error('Enter a valid email address.');
    const { data, error } = await supabase.auth.updateUser({ email: trimmed });
    if (error) throw new Error(error.message);
    return data.user?.email?.toLowerCase() === trimmed ? 'updated' : 'pending';
  };
  const deleteAccount = async (password: string, confirmation: string) => {
    if (!user) throw new Error('Sign in before deleting your account.');
    const userId = user.id;
    await deleteRemoteAccount(password, confirmation);
    try {
      await AsyncStorage.setItem(DELETION_CLEANUP_KEY, userId);
      await completeLocalDeletion(userId);
    } catch {
      const failure = new Error(
        'Your account was deleted online, but device cleanup could not finish. Restart the app to retry cleanup.',
      );
      Object.assign(failure, { remoteDeleted: true });
      throw failure;
    }
    setUser((current) => (current?.id === userId ? null : current));
    setIsGuest(false);
    setPendingOtp(null);
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
        updateProfile,
        requestEmailChange,
        refreshProfile,
        deleteAccount,
      }}
    >
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
