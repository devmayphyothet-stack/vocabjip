import React, { useState } from 'react';
import { useAuth } from '../context/auth-context';
import { LogIn, UserPlus, AlertCircle, Sparkles, BookOpen } from 'lucide-react';

export function LoginView() {
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const codeFromUrl = params.get('invite');
      if (codeFromUrl) {
        setInviteCode(codeFromUrl.toUpperCase());
        setMode('signup');
      }
    } catch (_) {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (mode === 'signin') {
        const res = await signIn(email, password);
        if (res.error) setError(res.error);
      } else {
        const res = await signUp(
          email,
          password,
          displayName || email.split('@')[0],
          inviteCode.trim() || undefined
        );
        if (res.error) setError(res.error);
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
            Contributor & Admin Portal for TOPIK II Writing Platform
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              mode === 'signin' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}>
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              mode === 'signup' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}>
            New Contributor
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Display Name (နာမည် / ဆရာ/ဆရာမ အမည်)
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Teacher May / TOPIK Level 6"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                  <span>Invitation Code (ဖိတ်ခေါ်ကုဒ် - ရှိပါက ထည့်ရန်)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="e.g. INV-XXXXXX"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono tracking-wider uppercase"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Email Address (အီးမေးလ်)
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
              Password (စကားဝှက်)
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
            <span>{submitting ? 'Authenticating...' : mode === 'signin' ? 'Sign In to Studio' : 'Create Contributor Account'}</span>
          </button>
        </form>

        {/* Demo credentials hint */}
        <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 text-center space-y-1">
          <p className="font-semibold text-slate-600">Admin Account</p>
          <p>Login with <code className="text-blue-700 font-mono">admin@vocabjip.com</code> for full Admin access</p>
        </div>
      </div>
    </div>
  );
}

