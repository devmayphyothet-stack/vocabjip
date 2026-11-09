import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  role: UserRole;
  isAdmin: boolean;
  isContributor: boolean;
  signIn: (email: string, pass: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    pass: string,
    displayName: string,
    inviteCode?: string
  ) => Promise<{ error?: string; requiresOtp?: boolean; email?: string }>;
  verifySignupOtp: (email: string, token: string) => Promise<{ error?: string }>;
  resendSignupOtp: (email: string) => Promise<{ error?: string }>;
  sendLoginOtp: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data && !error) {
        setUser({
          id: data.id,
          email: data.email || email,
          display_name: data.display_name || 'TOPIK Contributor',
          role: (data.role as UserRole) || 'user',
          created_at: data.created_at,
        });
        return;
      }
    } catch (e) {
      console.warn('Error fetching profile:', e);
    }

    // Fail closed when the profile cannot be loaded.
    const fallbackRole = 'user';
    setUser({
      id: userId,
      email,
      display_name: email.split('@')[0],
      role: fallbackRole,
      created_at: new Date().toISOString(),
    });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email || '');
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email || '');
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pass,
    });
    if (error) return { error: error.message };
    if (data.user) {
      try { await redeemInvitation(); } catch (failure: any) { return { error: failure.message || 'Could not redeem invitation.' }; }
      await fetchProfile(data.user.id, data.user.email || email);
    }
    return {};
  };

  const redeemInvitation = async () => {
    const code = sessionStorage.getItem('vocabjip_pending_invite');
    if (!code) return;
    const { error } = await supabase.rpc('redeem_contributor_invitation', { invite_code: code });
    if (error) throw error;
    sessionStorage.removeItem('vocabjip_pending_invite');
  };

  const signUp = async (email: string, pass: string, displayName: string, inviteCode?: string) => {
    const code = inviteCode?.trim().toUpperCase();
    if (!code) return { error: 'A valid invitation code from an administrator is required.' };
    sessionStorage.setItem('vocabjip_pending_invite', code);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(), password: pass,
      options: { data: { display_name: displayName.trim() } },
    });
    if (error) return { error: error.message };
    if (!data.session) return { requiresOtp: true, email: email.trim() };
    try {
      await redeemInvitation();
      await fetchProfile(data.session.user.id, data.session.user.email || email);
      return {};
    } catch (failure: any) {
      return { error: failure.message || 'Could not redeem invitation.' };
    }
  };

  const verifySignupOtp = async (email: string, token: string) => {
    const trimmedEmail = email.trim();
    const cleanToken = token.trim();

    // Try 'signup' first, then 'email' (for signInWithOtp / existing users), then 'magiclink'
    let verifyResult = await supabase.auth.verifyOtp({
      email: trimmedEmail,
      token: cleanToken,
      type: 'signup',
    });

    if (verifyResult.error) {
      const emailOtpResult = await supabase.auth.verifyOtp({
        email: trimmedEmail,
        token: cleanToken,
        type: 'email',
      });
      if (!emailOtpResult.error) {
        verifyResult = emailOtpResult;
      }
    }

    if (verifyResult.error) {
      const recoveryResult = await supabase.auth.verifyOtp({
        email: trimmedEmail,
        token: cleanToken,
        type: 'recovery',
      });
      if (!recoveryResult.error) {
        verifyResult = recoveryResult;
      }
    }

    const { data, error } = verifyResult;
    if (error) return { error: error.message };

    if (data.user) {
      try {
        await redeemInvitation();
      } catch (failure: any) {
        return { error: failure.message || 'Could not redeem invitation.' };
      }
      await fetchProfile(data.user.id, data.user.email || trimmedEmail);
    }

    return {};
  };

  const resendSignupOtp = async (email: string) => {
    const trimmed = email.trim();
    // Try signInWithOtp first (works for both existing users and unconfirmed users in Supabase)
    const otpRes = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { shouldCreateUser: false },
    });
    if (!otpRes.error) {
      return {};
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: trimmed,
    });
    if (error) return { error: error.message };
    return {};
  };

  const sendLoginOtp = async (email: string) => {
    const trimmed = email.trim();
    if (!trimmed) return { error: 'Please enter your email address first.' };
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { shouldCreateUser: false },
    });
    if (error) return { error: error.message };
    return {};
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.email);
    }
  };

  const role = user?.role || 'user';
  const isAdmin = role === 'admin';
  const isContributor = role === 'contributor' || role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        role,
        isAdmin,
        isContributor,
        signIn,
        signUp,
        verifySignupOtp,
        resendSignupOtp,
        sendLoginOtp,
        signOut,
        refreshProfile,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

