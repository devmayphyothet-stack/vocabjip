import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/auth-context';
import { supabase } from '../lib/supabase';
import { fetchContributorRankLabel } from '../lib/contributor-rank';
import { MobileCardPreview } from '../components/MobileCardPreview';
import { CheckCircle2, Send, Save, AlertCircle, HelpCircle, Trophy } from 'lucide-react';

const CATEGORIES = [
  'Cause & Effect',
  'Contrast',
  'Society',
  'Education',
  'Economy',
  'Environment',
  'Technology',
  'General',
];

export function VocabStudioView({ onSubmitted }: { onSubmitted?: () => void }) {
  const { user, isAdmin } = useAuth();

  const [spoken, setSpoken] = useState('');
  const [written, setWritten] = useState('');
  const [pronunciation, setPronunciation] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [myanmarMeaning, setMyanmarMeaning] = useState('');
  const [englishMeaning, setEnglishMeaning] = useState('');
  const [usageTip, setUsageTip] = useState('');
  const [exampleKorean, setExampleKorean] = useState('');
  const [exampleMyanmar, setExampleMyanmar] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [myRankLabel, setMyRankLabel] = useState<string>('Contributor');

  useEffect(() => {
    fetchContributorRankLabel(user?.id).then(setMyRankLabel);
  }, [user?.id]);

  const handleSave = async (submitStatus: 'draft' | 'pending_review') => {
    if (!written.trim() || !spoken.trim() || !myanmarMeaning.trim()) {
      setErrorMessage('ကျေးဇူးပြု၍ Academic Word၊ Spoken Equivalent နှင့် မြန်မာပြန် အဓိပ္ပာယ်ကို မဖြစ်မနေ ထည့်သွင်းပေးပါခင်ဗျာ။');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const id = `v-ext-${Date.now().toString(36)}`;
      const authorName = user?.display_name || user?.email?.split('@')[0] || 'Contributor';
      const { error } = await supabase.from('vocabularies').insert({
        id,
        spoken: spoken.trim(),
        written: written.trim(),
        pronunciation: pronunciation.trim(),
        category,
        myanmar_meaning: myanmarMeaning.trim(),
        english_meaning: englishMeaning.trim(),
        usage_tip: usageTip.trim(),
        example_korean: exampleKorean.trim(),
        example_myanmar: exampleMyanmar.trim(),
        status: submitStatus,
        created_by: user?.id || null,
        author_name: authorName,
        author_rank: myRankLabel,
        reviewed_by: null,
      });

      if (error) throw error;

      setSuccessMessage(
        submitStatus === 'pending_review'
          ? '✅ စစ်ဆေးအတည်ပြုရန် Admin ထံသို့ အောင်မြင်စွာ တင်သွင်းပြီးပါပြီ။'
          : '💾 Draft အဖြစ် အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ။'
      );

      // Reset form
      setSpoken('');
      setWritten('');
      setPronunciation('');
      setMyanmarMeaning('');
      setEnglishMeaning('');
      setUsageTip('');
      setExampleKorean('');
      setExampleMyanmar('');

      if (onSubmitted) onSubmitted();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error submitting vocabulary');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Title */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Academic Vocabulary Studio</h1>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            {myRankLabel}
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          TOPIK II စာစီစာကုံးသုံး အဆင့်မြင့် ဝေါဟာရများ (Spoken → Academic Upgrade) ရေးသားတင်သွင်းရန် • Admin Approve လုပ်ပြီးပါက သင့် Display Name & Rank နှင့်တကွ Mobile App တွင် ပေါ်လာပါမည်။
        </p>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm font-semibold">{errorMessage}</p>
        </div>
      )}

      {/* Main Grid: Form + Mobile Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Form Container (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          {/* Pair Input: Spoken vs Written */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Everyday Spoken Word (စကားပြောသုံး) *
              </label>
              <input
                type="text"
                value={spoken}
                onChange={(e) => setSpoken(e.target.value)}
                placeholder="e.g. 그래서, 근데, 진짜"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-blue-700 uppercase mb-1.5">
                TOPIK Academic Word (စာစီစာကုံးသုံး) *
              </label>
              <input
                type="text"
                value={written}
                onChange={(e) => setWritten(e.target.value)}
                placeholder="e.g. 따라서, 그러나, 매우"
                className="w-full px-3.5 py-2.5 rounded-xl border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold font-sans text-slate-900"
              />
            </div>
          </div>

          {/* Pronunciation & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Pronunciation / Romaja (အသံထွက်)
              </label>
              <input
                type="text"
                value={pronunciation}
                onChange={(e) => setPronunciation(e.target.value)}
                placeholder="e.g. tta-ra-seo"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Category (အမျိုးအစား) *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white font-medium">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Myanmar & English Meanings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Myanmar Meaning (မြန်မာပြန် အဓိပ္ပာယ်) *
              </label>
              <input
                type="text"
                value={myanmarMeaning}
                onChange={(e) => setMyanmarMeaning(e.target.value)}
                placeholder="e.g. ထို့ကြောင့် / ရလဒ်အနေဖြင့်"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                English Meaning (အင်္ဂလိပ်ပြန်)
              </label>
              <input
                type="text"
                value={englishMeaning}
                onChange={(e) => setEnglishMeaning(e.target.value)}
                placeholder="e.g. Therefore / As a result"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* TOPIK Writing Tip */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              TOPIK Writing Tip & Rule (အရေးအသား စည်းမျဉ်း/အကြံပြုချက်)
            </label>
            <textarea
              rows={2}
              value={usageTip}
              onChange={(e) => setUsageTip(e.target.value)}
              placeholder="e.g. TOPIK II စာစီစာကုံး (Q53/54) တွင် '그래서' အစား '따라서' သို့မဟုတ် '그러므로' ကိုသာ အသုံးပြုရပါမည်။"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Example Sentence Pair */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase">
              <span>Example Sentence (ဥပမာ စာကြောင်း)</span>
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <input
              type="text"
              value={exampleKorean}
              onChange={(e) => setExampleKorean(e.target.value)}
              placeholder="Korean Example: 인터넷 사용자가 급증했다. 따라서 정보 보안이 더욱 중요해졌다."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-sans"
            />

            <input
              type="text"
              value={exampleMyanmar}
              onChange={(e) => setExampleMyanmar(e.target.value)}
              placeholder="Myanmar Translation: အင်တာနက်အသုံးပြုသူ ရုတ်တရက်များပြားလာခဲ့သည်။ ထို့ကြောင့် အချက်အလက်လုံခြုံရေးသည် ပို၍အရေးပါလာခဲ့သည်။"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSave('draft')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition disabled:opacity-50">
              <Save className="w-4 h-4 text-slate-500" />
              <span>Save Draft</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSave('pending_review')}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-xs transition disabled:opacity-50">
                <Send className="w-4 h-4" />
                <span>Submit for Admin Review</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Preview Column (1 col) */}
        <div>
          <MobileCardPreview
            type="vocab"
            data={{
              spoken,
              written,
              pronunciation,
              category,
              myanmarMeaning,
              englishMeaning,
              usageTip,
              exampleKorean,
              exampleMyanmar,
            }}
          />
        </div>
      </div>
    </div>
  );
}

