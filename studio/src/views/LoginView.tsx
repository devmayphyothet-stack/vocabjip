import { AlertCircle, ArrowLeft, CheckCircle2, KeyRound, LogIn, UserPlus } from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../context/auth-context';

export function LoginView() {
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<'signin' | 'invite'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const codeFromUrl = params.get('invite');
      if (codeFromUrl) {
        setInviteCode(codeFromUrl.toUpperCase());
        setMode('invite');
      }
    } catch (_) { }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    if (mode === 'invite' && !inviteCode.trim()) {
      setError('Invitation code is required to create a contributor account.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (mode === 'signin') {
        const res = await signIn(email, password);
        if (res.error) {
          if (res.error.toLowerCase().includes('email not confirmed')) {
            setError('Email not confirmed. Supabase SQL ထဲတွင် confirm လုပ်ပေးပါ သို့မဟုတ် Auth Settings တွင် "Confirm email" ကို ပိတ်ပေးပါ။');
          } else {
            setError(res.error);
          }
        }
      } else {
        const res = await signUp(
          email,
          password,
          displayName || email.split('@')[0],
          inviteCode.trim()
        );
        if (res.error) {
          setError(res.error);
        } else {
          setSuccessMsg('Account created successfully! Signing you in...');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBF9] bg-wongoji-grid flex flex-col justify-center items-center p-4">
      {/* Container */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-xl p-8 space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <img src="/logo.png" alt="VocabJip" className="w-16 h-16 rounded-2xl mx-auto shadow-sm object-contain" />
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">VocabJip Studio</h1>
          <p className="text-xs text-slate-500 font-medium">
            {mode === 'signin'
              ? 'Contributor & Admin Portal for TOPIK II Writing Platform'
              : 'Exclusive Onboarding for TOPIK Educators & Mentors'}
          </p>
        </div>

        {/* Mode Title (Invite vs Sign In) */}
        {mode === 'invite' && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-800 text-xs font-bold">
              <KeyRound className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Redeem Invitation Code</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" />
              <span>Sign In</span>
            </button>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success notification */}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'invite' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Invitation Code *
                </label>
                <input
                  type="text"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="e.g. INV-XXXXXX"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-blue-300 bg-blue-50/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono tracking-widest uppercase font-bold text-blue-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Sayama Su / TOPIK Level 6"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@vocabjip.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50">
            {mode === 'signin' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            <span>
              {submitting
                ? 'Authenticating...'
                : mode === 'signin'
                  ? 'Sign In to Studio'
                  : 'Redeem Code & Create Account'}
            </span>
          </button>
        </form>

        {/* Invite link toggle (for teachers who have a code) */}
        {mode === 'signin' && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setMode('invite');
                setError(null);
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 transition inline-flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Have an Invitation Code? Join as Contributor</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
