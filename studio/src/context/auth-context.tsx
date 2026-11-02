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
  signUp: (email: string, pass: string, displayName: string, inviteCode?: string) => Promise<{ error?: string }>;
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
        data: { display_name: displayName.trim() },
      },
    });
    if (error) return { error: error.message };

    if (data.user) {
      // If signed up with valid invite or for studio, update role to targetRole
      try {
        await supabase
          .from('profiles')
          .update({ role: targetRole, display_name: displayName.trim() })
          .eq('id', data.user.id);

        if (validInviteId) {
          await supabase
            .from('invitations')
            .update({
              is_used: true,
              used_by: data.user.id,
              used_at: new Date().toISOString(),
            })
            .eq('id', validInviteId);
        }
      } catch (profileErr) {
        console.warn('Error updating profile on signup:', profileErr);
      }

      await fetchProfile(data.user.id, data.user.email || email);
    }
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

