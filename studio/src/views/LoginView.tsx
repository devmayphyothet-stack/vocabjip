import { AlertCircle, ArrowLeft, CheckCircle2, KeyRound, LogIn, MailCheck, RefreshCw, UserPlus } from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../context/auth-context';

export function LoginView() {
  const { signIn, signUp, verifySignupOtp, resendSignupOtp, sendLoginOtp } = useAuth();

  const [mode, setMode] = useState<'signin' | 'invite' | 'verify-otp'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

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

    if (mode === 'verify-otp') {
      if (otpCode.trim().length < 6) {
        setError('ကျေးဇူးပြု၍ အီးမေးလ်သို့ ပို့ထားသော ဂဏန်း ၆ လုံး (6-digit OTP) ကို ထည့်သွင်းပေးပါ။');
        return;
      }
      setSubmitting(true);
      setError(null);
      setSuccessMsg(null);
      try {
        const res = await verifySignupOtp(email, otpCode.trim());
        if (res.error) {
          setError(res.error);
        } else {
          setSuccessMsg('Email verified! Entering VocabJip Studio...');
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }

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
            setMode('verify-otp');
            setError('သင့်အီးမေးလ်ကို အတည်ပြုရန် လိုအပ်ပါသည်။ အီးမေးလ်ထဲမှ ဂဏန်း ၆ လုံး (OTP) ကို ရိုက်ထည့်ပါ သို့မဟုတ် Resend Code နှိပ်ပါ။');
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
        } else if (res.requiresOtp) {
          setMode('verify-otp');
          setSuccessMsg(
            `${email.trim()} သို့ အတည်ပြုကုဒ် ပေးပို့ထားပါသည်။ ကုဒ်ရိုက်ထည့်၍ အတည်ပြုပေးပါ။`
          );
        } else {
          setSuccessMsg('Account created successfully! Signing you in...');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email.trim()) return;
    setResending(true);
    setError(null);
    try {
      const res = await resendSignupOtp(email);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccessMsg('အတည်ပြုကုဒ် အသစ်ကို သင့်အီးမေးလ်သို့ ထပ်မံပေးပို့ပြီးပါပြီ။');
      }
    } finally {
      setResending(false);
    }
  };

  const handleSendLoginOtp = async () => {
    if (!email.trim()) {
      setError('ကျေးဇူးပြု၍ OTP ကုဒ် လက်ခံမည့် Email Address ကို အရင်ရိုက်ထည့်ပေးပါ။');
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await sendLoginOtp(email);
      if (res.error) {
        setError(res.error);
      } else {
        setMode('verify-otp');
        setSuccessMsg(
          `${email.trim()} သို့ ဂဏန်း ၆ လုံး OTP ကုဒ် ပေးပို့ပြီးပါပြီ။ အီးမေးလ်ထဲမှ ကုဒ်ကို ရိုက်ထည့်ပါ။`
        );
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

        {/* Mode Title (Invite vs Verify OTP vs Sign In) */}
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

        {mode === 'verify-otp' && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
              <MailCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Verify Contributor Email</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setSuccessMsg(null);
              }}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" />
              <span>Back to Sign In</span>
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
          {mode === 'verify-otp' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  6-Digit Email Verification Code (OTP) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full px-3.5 py-3 rounded-xl border border-blue-300 bg-blue-50/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg font-mono tracking-[0.4em] font-extrabold text-slate-900"
                />
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Inbox သို့မဟုတ် Spam ထဲသို့ ရောက်ရှိလာသော ဂဏန်း ၆ လုံးကို ရိုက်ထည့်ပါ </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50">
                <MailCheck className="w-4 h-4" />
                <span>{submitting ? 'Verifying Code...' : 'Verify Email & Enter Studio'}</span>
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  disabled={resending}
                  onClick={handleResendOtp}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1.5">
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  <span>{resending ? 'Sending...' : 'Resend Verification Code'}</span>
                </button>
              </div>
            </div>
          ) : (
            <>
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

              {/* Sign In with Email OTP button (Commented out until needed)
              {mode === 'signin' && (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSendLoginOtp}
                  className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-2 disabled:opacity-50">
                  <MailCheck className="w-4 h-4 text-blue-600" />
                  <span>Sign In with Email OTP (OTP ကုဒ်ဖြင့် ဝင်ရန်)</span>
                </button>
              )}
              */}
            </>
          )}
        </form>

        {/* Invite link toggle (for contributors who have a code) */}
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
