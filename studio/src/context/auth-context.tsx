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

    // Fallback if profile row is not yet created
    const fallbackRole = (email.toLowerCase() === 'admin@vocabjip.com' || email.toLowerCase() === 'dev.mayphyothet@gmail.com') ? 'admin' : 'contributor';
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
      await fetchProfile(data.user.id, data.user.email || email);
    }
    return {};
  };

  const signUp = async (email: string, pass: string, displayName: string, inviteCode?: string) => {
    const isDirectAdmin = email.trim().toLowerCase() === 'admin@vocabjip.com' || email.trim().toLowerCase() === 'dev.mayphyothet@gmail.com';

    if (!isDirectAdmin && (!inviteCode || !inviteCode.trim())) {
      return {
        error: 'Registration is invite-only. A valid invitation code from an Admin is required.'
      };
    }

    let targetRole: UserRole = isDirectAdmin ? 'admin' : 'contributor';
    let validInviteId: string | null = null;

    if (inviteCode && inviteCode.trim()) {
      try {
        const { data: inv, error: invErr } = await supabase
          .from('invitations')
          .select('*')
          .eq('code', inviteCode.trim().toUpperCase())
          .eq('is_used', false)
          .maybeSingle();

        if (invErr || !inv) {
          return { error: 'Invalid or already used invitation code.' };
        }

        if (inv.expires_at && new Date(inv.expires_at) < new Date()) {
          return { error: 'This invitation code has expired.' };
        }

        targetRole = (inv.role as UserRole) || 'contributor';
        validInviteId = inv.id;
      } catch (err) {
        console.warn('Error validating invite code:', err);
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: pass,
      options: {
        data: {
          display_name: displayName.trim(),
          requested_role: targetRole,
          invite_code: inviteCode?.trim().toUpperCase() || null,
        },
      },
    });
    if (error) {
      // If user already exists or rate-limited on signup, try signing in or sending a login OTP
      if (error.message.toLowerCase().includes('already registered')) {
        const signInAttempt = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: pass,
        });
        if (!signInAttempt.error && signInAttempt.data.user) {
          if (validInviteId) {
            await supabase
              .from('invitations')
              .update({
                is_used: true,
                used_by: signInAttempt.data.user.id,
                used_at: new Date().toISOString(),
              })
              .eq('id', validInviteId);
          }
          await supabase
            .from('profiles')
            .update({ role: targetRole, display_name: displayName.trim() })
            .eq('id', signInAttempt.data.user.id);
          await fetchProfile(signInAttempt.data.user.id, email.trim());
          return {};
        }
        const otpFallback = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: { shouldCreateUser: false },
        });
        if (!otpFallback.error) {
          return { requiresOtp: true, email: email.trim() };
        }
      }
      return { error: error.message };
    }

    if (data.user) {
      // Check if Supabase returned a fake/obfuscated user (identities.length === 0) because the email is already registered!
      const isAlreadyRegistered =
        Array.isArray(data.user.identities) && data.user.identities.length === 0;

      if (isAlreadyRegistered) {
        // 1. Try signing in with the password they entered
        const existingSignIn = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: pass,
        });

        if (!existingSignIn.error && existingSignIn.data.user) {
          if (validInviteId) {
            try {
              await supabase
                .from('invitations')
                .update({
                  is_used: true,
                  used_by: existingSignIn.data.user.id,
                  used_at: new Date().toISOString(),
                })
                .eq('id', validInviteId);
            } catch (_) {}
          }
          try {
            await supabase
              .from('profiles')
              .update({ role: targetRole, display_name: displayName.trim() })
              .eq('id', existingSignIn.data.user.id);
          } catch (_) {}
          await fetchProfile(existingSignIn.data.user.id, email.trim());
          return {};
        }

        // 2. Otherwise, explicitly send a 6-digit OTP via signInWithOtp (since signUp silently skips sending email for existing users)
        const otpRes = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            shouldCreateUser: false,
            data: {
              display_name: displayName.trim(),
              requested_role: targetRole,
              invite_code: inviteCode?.trim().toUpperCase() || null,
            },
          },
        });

        if (otpRes.error) {
          return { error: otpRes.error.message };
        }

        return {
          requiresOtp: true,
          email: email.trim(),
        };
      }

      // Mark invitation used if possible (anyone can redeem unused invitation)
      if (validInviteId) {
        try {
          await supabase
            .from('invitations')
            .update({
              is_used: true,
              used_by: data.user.id,
              used_at: new Date().toISOString(),
            })
            .eq('id', validInviteId);
        } catch (invErr) {
          console.warn('Error marking invite used:', invErr);
        }
      }

      // If Email Confirmation is ON in Supabase, data.session will be null until OTP / Link is verified
      if (!data.session) {
        return {
          requiresOtp: true,
          email: email.trim(),
        };
      }

      // If auto-confirmed, ensure role is updated and load profile immediately
      try {
        await supabase
          .from('profiles')
          .update({ role: targetRole, display_name: displayName.trim() })
          .eq('id', data.user.id);
      } catch (profileErr) {
        console.warn('Error updating profile on signup:', profileErr);
      }

      await fetchProfile(data.user.id, data.user.email || email);
    }
    return {};
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
      const metaRole =
        (data.user.user_metadata?.requested_role as UserRole | undefined) || 'contributor';
      const metaName = data.user.user_metadata?.display_name as string | undefined;
      try {
        await supabase
          .from('profiles')
          .update({
            role: metaRole,
            ...(metaName ? { display_name: metaName } : {}),
          })
          .eq('id', data.user.id);
      } catch (_) {}
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

