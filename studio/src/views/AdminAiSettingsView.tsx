import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/auth-context';
import {
  AlertCircle,
  ArrowLeftRight,
  CheckCircle2,
  Database,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';

interface SystemGeminiConfig {
  primary_key: string;
  backup_key: string;
  enabled: boolean;
  model: string;
  updated_at?: string;
}

interface CachedWordItem {
  word_key: string;
  korean: string;
  root_word: string;
  myanmar_meaning: string;
  english_meaning: string;
  category: string;
  created_at: string;
}

export function AdminAiSettingsView() {
  const { user } = useAuth();
  const [primaryKey, setPrimaryKey] = useState('');
  const [backupKey, setBackupKey] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [model, setModel] = useState('gemini-2.5-flash');
  const [showPrimary, setShowPrimary] = useState(false);
  const [showBackup, setShowBackup] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingKey, setTestingKey] = useState<'primary' | 'backup' | null>(null);
  const [statusMsg, setStatusMsg] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const [cachedWords, setCachedWords] = useState<CachedWordItem[]>([]);
  const [cacheCount, setCacheCount] = useState(0);

  const fetchSettingsAndCache = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', 'system_gemini_config')
        .maybeSingle();

      if (!error && data?.value) {
        const cfg = data.value as SystemGeminiConfig;
        setPrimaryKey(cfg.primary_key || '');
        setBackupKey(cfg.backup_key || '');
        setEnabled(cfg.enabled !== false);
        setModel(cfg.model || 'gemini-2.5-flash');
      }

      const { data: cacheData, count } = await supabase
        .from('vocab_lens_cache')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(15);

      if (cacheData) {
        setCachedWords(cacheData as CachedWordItem[]);
      }
      if (typeof count === 'number') {
        setCacheCount(count);
      }
    } catch (err) {
      console.warn('Error loading AI settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndCache();
  }, []);

  const handleTestGeminiKey = async (which: 'primary' | 'backup') => {
    const keyToTest = (which === 'primary' ? primaryKey : backupKey).trim();
    if (!keyToTest) {
      setStatusMsg({
        type: 'error',
        text: `ကျေးဇူးပြု၍ စမ်းသပ်ရန် ${which === 'primary' ? 'Primary' : 'Backup'} Gemini API Key အရင်ထည့်ပါ။`,
      });
      return;
    }

    setTestingKey(which);
    setStatusMsg(null);

    const tryGenerateWithModel = async (targetModel: string) => {
      const cleanModel = targetModel.replace(/^models\//, '');
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${keyToTest}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Reply OK' }] }],
        }),
      });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, statusText: res.statusText, data, modelUsed: cleanModel };
    };

    try {
      let attempt = await tryGenerateWithModel(model);

      // If the selected model is deprecated/unavailable for new users (400/404) or overloaded (503/500), auto-discover a supported model for this key
      if (
        !attempt.ok &&
        (attempt.status === 400 ||
          attempt.status === 404 ||
          attempt.status === 503 ||
          attempt.status === 500)
      ) {
        const errMessage: string = attempt.data?.error?.message || '';
        const candidateModels: string[] = [];

        // 1. Check if Google's error message explicitly recommends a model (e.g. "use models/gemini-2.5-flash" or "models/gemini-3.0-flash")
        const matchRecommended = errMessage.match(/models\/(gemini-[a-zA-Z0-9.-]+)/);
        if (matchRecommended?.[1]) {
          candidateModels.push(matchRecommended[1]);
        }

        // 2. Standard fallback chain for new & existing Google AI Studio keys
        for (const fallback of [
          'gemini-flash-lite-latest',
          'gemini-flash-latest',
          'gemini-3-flash-preview',
          'gemini-2.5-flash',
          'gemini-2.5-flash-lite',
        ]) {
          if (!candidateModels.includes(fallback) && fallback !== model) {
            candidateModels.push(fallback);
          }
        }

        // 3. Query /v1beta/models for this key to discover any other flash generateContent model
        try {
          const listRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${keyToTest}`
          );
          if (listRes.ok) {
            const listData = await listRes.json();
            const available = (listData.models || [])
              .filter(
                (m: any) =>
                  Array.isArray(m.supportedGenerationMethods) &&
                  m.supportedGenerationMethods.includes('generateContent') &&
                  typeof m.name === 'string' &&
                  m.name.includes('gemini')
              )
              .map((m: any) => (m.name as string).replace(/^models\//, ''));

            // Prefer flash models first
            const flashModels = available.filter((n: string) => n.includes('flash'));
            for (const fm of [...flashModels, ...available]) {
              if (!candidateModels.includes(fm) && fm !== model) {
                candidateModels.push(fm);
              }
            }
          }
        } catch (_) {}

        for (const candidate of candidateModels) {
          const retry = await tryGenerateWithModel(candidate);
          if (retry.ok) {
            attempt = retry;
            setModel(retry.modelUsed);
            break;
          }
          if (retry.status === 429) {
            attempt = retry;
            setModel(retry.modelUsed);
            break;
          }
        }
      }

      if (attempt.ok) {
        setStatusMsg({
          type: 'success',
          text: `✅ ${
            which === 'primary' ? 'Primary' : 'Backup'
          } Gemini API Key အလုပ်လုပ်ပါသည်! (Active Model: ${attempt.modelUsed}) — Save System Keys to Cloud ကိုနှိပ်၍ သိမ်းဆည်းပါ။`,
        });
      } else {
        if (attempt.status === 429) {
          setStatusMsg({
            type: 'error',
            text: `⚠️ ${
              which === 'primary' ? 'Primary' : 'Backup'
            } API Key သည် Google Quota Limit (429) ပြည့်နေပါသည်။ အခြား Key တစ်ခုဖြင့် လဲလှယ်ပါ။`,
          });
        } else {
          setStatusMsg({
            type: 'error',
            text: `❌ API Key မမှန်ကန်ပါ (${
              attempt.data?.error?.message || attempt.statusText
            })`,
          });
        }
      }
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.message || 'Network error while testing Gemini API key.',
      });
    } finally {
      setTestingKey(null);
    }
  };

  const handleSwapKeys = () => {
    const temp = primaryKey;
    setPrimaryKey(backupKey);
    setBackupKey(temp);
    setStatusMsg({
      type: 'info',
      text: 'Primary Key နှင့် Backup Key နေရာချင်း လဲလှယ်ပြီးပါပြီ။ အတည်ပြုရန် Save System Keys ကို နှိပ်ပါ။',
    });
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      const valuePayload: SystemGeminiConfig = {
        primary_key: primaryKey.trim(),
        backup_key: backupKey.trim(),
        enabled,
        model,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('app_settings').upsert(
        {
          key: 'system_gemini_config',
          value: valuePayload,
          updated_by: user?.id || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );

      if (error) throw error;

      setStatusMsg({
        type: 'success',
        text: 'System Gemini API Keys များကို အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ! Mobile/Web App ရှိ Smart Vocab Lens တွင် ချက်ချင်း အသက်ဝင်သွားပါပြီ။',
      });
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text:
          err.message ||
          'သိမ်းဆည်းရာတွင် အမှားအယွင်းရှိနေပါသည်။ Supabase တွင် Section 13 (app_settings) SQL ကို Run ထားကြောင်း စစ်ဆေးပါ။',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
            <KeyRound className="w-4 h-4" />
            <span>Dynamic AI Key Rotation & Smart Vocab Lens</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            System Gemini AI Key Manager
          </h1>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed">
            App ကို ပြန် Build လုပ်စရာမလိုဘဲ Smart Vocab Lens အတွက် သုံးမည့် System Gemini API Key ကို ဤနေရာမှ အချိန်မရွေး ပြောင်းလဲနိုင်ပါသည်။ Primary Key က Limit ပြည့်သွားပါကလည်း Backup Key သို့ အလိုအလျောက် ပြောင်းသုံးပေးပါမည်။
          </p>
        </div>

        <button
          onClick={fetchSettingsAndCache}
          className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition self-start md:self-auto">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Architecture & Quota Saver Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero-Rebuild Key Rotation</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            `.env` ထဲ အသေထည့်စရာမလိုဘဲ Dashboard မှ Key အသစ်ထည့်ပြီး Save နှိပ်ရုံဖြင့် ကျောင်းသားအားလုံး၏ App တွင် ချက်ချင်း ပြောင်းလဲအလုပ်လုပ်ပါသည်။
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
            <Zap className="w-4 h-4" />
            <span>Auto-Failover (Primary → Backup)</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Primary Key သည် Rate Limit (429) ပြည့်သွားပါက App က Backup Key သို့ အလိုအလျောက် ပြောင်းချိတ်ပြီး အဓိပ္ပာယ် ဆက်ထုတ်ပေးပါသည်။
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-purple-600 font-bold text-xs">
            <Database className="w-4 h-4" />
            <span>Shared Cloud Cache ({cacheCount} Words)</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            ကျောင်းသားတစ်ယောက် နှိပ်ဖူးပြီးသား စကားလုံးကို Database တွင် သိမ်းထားပေးသဖြင့် နောက်လူများ နှိပ်လျှင် API Quota လုံးဝမကုန်တော့ပါ။
          </p>
        </div>
      </div>

      {/* Main Key Configuration Form */}
      <form
        onSubmit={handleSaveSettings}
        className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
        {statusMsg && (
          <div
            className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : statusMsg.type === 'info'
                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{statusMsg.text}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <input
              id="enable-ai-lens"
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="enable-ai-lens"
              className="text-sm font-extrabold text-slate-900 cursor-pointer">
              Enable System AI for Smart Vocab Lens (အော်တို အဓိပ္ပာယ်ဖော်စနစ် ဖွင့်ထားမည်)
            </label>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Gemini Model:</span>
            <select
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                setStatusMsg(null);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50">
              <option value="gemini-flash-lite-latest">gemini-flash-lite-latest (Fastest / High Availability)</option>
              <option value="gemini-2.5-flash">gemini-2.5-flash (Recommended)</option>
              <option value="gemini-3.0-flash">gemini-3.0-flash (Latest)</option>
              <option value="gemini-3-flash-preview">gemini-3-flash-preview</option>
              <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite</option>
              <option value="gemini-flash-latest">gemini-flash-latest (Auto Alias)</option>
              {![
                'gemini-flash-lite-latest',
                'gemini-2.5-flash',
                'gemini-3.0-flash',
                'gemini-3-flash-preview',
                'gemini-2.5-flash-lite',
                'gemini-flash-latest',
              ].includes(model) && <option value={model}>{model}</option>}
            </select>
          </div>
        </div>

        {/* Primary API Key */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              1. Primary Gemini API Key (အဓိက သုံးမည့် Key)
            </label>
            <span className="text-[11px] font-semibold text-emerald-600">
              Used first for all Smart Vocab Lens lookups
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type={showPrimary ? 'text' : 'password'}
                value={primaryKey}
                onChange={(e) => setPrimaryKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-4 py-2.5 pr-10 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPrimary(!showPrimary)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPrimary ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleTestGeminiKey('primary')}
              disabled={testingKey === 'primary'}
              className="px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center gap-1.5 transition shrink-0">
              {testingKey === 'primary' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>Test Primary Key</span>
            </button>
          </div>
        </div>

        {/* Backup API Key */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              2. Backup / Failover Gemini API Key (အရန် Key - Optional)
            </label>
            <span className="text-[11px] font-semibold text-amber-600">
              Auto-activates if Primary Key hits 429 Quota Limit
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type={showBackup ? 'text' : 'password'}
                value={backupKey}
                onChange={(e) => setBackupKey(e.target.value)}
                placeholder="AIzaSy... (Second Google AI Studio project key)"
                className="w-full px-4 py-2.5 pr-10 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowBackup(!showBackup)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showBackup ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleTestGeminiKey('backup')}
              disabled={testingKey === 'backup'}
              className="px-4 py-2.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center gap-1.5 transition shrink-0">
              {testingKey === 'backup' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>Test Backup Key</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleSwapKeys}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 transition">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Swap Primary ↔ Backup</span>
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 transition shadow-xs">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Keys...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save System Keys to Cloud</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Recently Cached AI Words Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-purple-600 font-bold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Auto-Generated Dictionary Cache</span>
            </div>
            <h2 className="text-base font-black text-slate-900">
              Recent Smart Vocab Lens AI Lookups ({cacheCount} total cached)
            </h2>
            <p className="text-xs text-slate-500">
              ကျောင်းသားများ နှိပ်ကြည့်ရာမှ AI က အော်တို ဘာသာပြန်ပေးပြီး Database ထဲ အမြဲတမ်း သိမ်းဆည်းထားပြီးသော စကားလုံးများ။
            </p>
          </div>
        </div>

        {cachedWords.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">
            No AI-cached words yet. Once students tap new Korean words in Community Essays, they will automatically appear here!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="py-3 px-4">Tapped Word</th>
                  <th className="py-3 px-4">Root Form</th>
                  <th className="py-3 px-4">Myanmar Meaning</th>
                  <th className="py-3 px-4">English</th>
                  <th className="py-3 px-4">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cachedWords.map((w) => (
                  <tr key={w.word_key} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-extrabold text-slate-900">{w.korean}</td>
                    <td className="py-3 px-4 font-semibold text-blue-600">{w.root_word}</td>
                    <td className="py-3 px-4 text-slate-800">{w.myanmar_meaning}</td>
                    <td className="py-3 px-4 text-slate-500">{w.english_meaning}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px]">
                        {w.category}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

