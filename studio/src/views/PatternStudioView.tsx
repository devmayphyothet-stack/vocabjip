import React, { useState } from 'react';
import { useAuth } from '../context/auth-context';
import { supabase } from '../lib/supabase';
import { MobileCardPreview } from '../components/MobileCardPreview';
import { CheckCircle2, Send, Save, AlertCircle, Plus, X } from 'lucide-react';

const QUESTION_TYPES = ['Q51', 'Q52', 'Q53', 'Q54'] as const;

export function PatternStudioView({ onSubmitted }: { onSubmitted?: () => void }) {
  const { user, isAdmin } = useAuth();

  const [questionNumber, setQuestionNumber] = useState<'Q51' | 'Q52' | 'Q53' | 'Q54'>('Q53');
  const [title, setTitle] = useState('');
  const [myanmarTitle, setMyanmarTitle] = useState('');
  const [description, setDescription] = useState('');
  const [patternFormula, setPatternFormula] = useState('');
  const [exampleKorean, setExampleKorean] = useState('');
  const [exampleMyanmar, setExampleMyanmar] = useState('');
  const [currentPhrase, setCurrentPhrase] = useState('');
  const [keyPhrases, setKeyPhrases] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const addPhrase = () => {
    if (currentPhrase.trim() && !keyPhrases.includes(currentPhrase.trim())) {
      setKeyPhrases([...keyPhrases, currentPhrase.trim()]);
      setCurrentPhrase('');
    }
  };

  const removePhrase = (index: number) => {
    setKeyPhrases(keyPhrases.filter((_, i) => i !== index));
  };

  const handleSave = async (submitStatus: 'draft' | 'pending_review' | 'approved') => {
    if (!title.trim() || !patternFormula.trim() || !exampleKorean.trim()) {
      setErrorMessage('ကျေးဇူးပြု၍ Pattern Title၊ Formula ပုံသေနည်း နှင့် ဥပမာစာကြောင်းကို ထည့်သွင်းပေးပါခင်ဗျာ။');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const id = `p-ext-${Date.now().toString(36)}`;
      const { error } = await supabase.from('sentence_patterns').insert({
        id,
        question_number: questionNumber,
        title: title.trim(),
        myanmar_title: myanmarTitle.trim(),
        description: description.trim(),
        pattern_formula: patternFormula.trim(),
        example_korean: exampleKorean.trim(),
        example_myanmar: exampleMyanmar.trim(),
        key_phrases: keyPhrases,
        status: submitStatus,
        created_by: user?.id || null,
        reviewed_by: submitStatus === 'approved' ? user?.id : null,
      });

      if (error) throw error;

      setSuccessMessage(
        submitStatus === 'approved'
          ? '🎉 Pattern ကို တိုက်ရိုက် Publish လုပ်ပြီး Mobile App သို့ ပို့ဆောင်ပြီးပါပြီ!'
          : submitStatus === 'pending_review'
          ? '✅ စစ်ဆေးအတည်ပြုရန် Admin ထံသို့ အောင်မြင်စွာ တင်သွင်းပြီးပါပြီ။'
          : '💾 Pattern Draft အဖြစ် အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ။'
      );

      // Reset
      setTitle('');
      setMyanmarTitle('');
      setDescription('');
      setPatternFormula('');
      setExampleKorean('');
      setExampleMyanmar('');
      setKeyPhrases([]);

      if (onSubmitted) onSubmitted();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error submitting pattern');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">TOPIK Sentence Pattern Studio</h1>
        <p className="text-sm text-slate-500 mt-1">
          TOPIK II (မေးခွန်း ၅၁ မှ ၅၄) အတွက် အရေးအသား ပုံသေနည်းများနှင့် စံပြစာကြောင်းများ တင်သွင်းရန်
        </p>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          {/* Question Type Pills */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              TOPIK Question Number (မေးခွန်း အမျိုးအစား) *
            </label>
            <div className="grid grid-cols-4 gap-3">
              {QUESTION_TYPES.map((q) => (
                <button
                  type="button"
                  key={q}
                  onClick={() => setQuestionNumber(q)}
                  className={`py-2.5 rounded-xl text-sm font-bold border transition ${
                    questionNumber === q
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}>
                  {q} {q === 'Q53' ? '(Graph)' : q === 'Q54' ? '(Essay)' : '(Short)'}
                </button>
              ))}
            </div>
          </div>

          {/* Titles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Pattern Title (ခေါင်းစဉ်) *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Describe a Trend (증가 및 감소 추세)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Myanmar Title (မြန်မာဘာသာ ခေါင်းစဉ်) *
              </label>
              <input
                type="text"
                value={myanmarTitle}
                onChange={(e) => setMyanmarTitle(e.target.value)}
                placeholder="e.g. တိုးတက်မှုနှင့် ကျဆင်းမှု လားရာကို ဖော်ပြခြင်း"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Description & Writing Context (အသုံးပြုပုံ ရှင်းလင်းချက်)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Q53 Graph ပုစ္ဆာတွင် ကိန်းဂဏန်းများ တိုးပွားလာခြင်း သို့မဟုတ် ကျဆင်းသွားခြင်းကို စနစ်တကျ ရေးသားနည်း"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Pattern Formula */}
          <div>
            <label className="block text-xs font-bold text-blue-700 uppercase mb-1.5">
              Pattern Formula (အရေးအသား ပုံသေနည်း) *
            </label>
            <textarea
              rows={2}
              value={patternFormula}
              onChange={(e) => setPatternFormula(e.target.value)}
              placeholder="e.g. [조사 대상]에 대해 조사한 결과, [연도]에 [수치]에서 [연도]에 [수치]로 (크게 증가하였다 / 감소하였다)."
              className="w-full px-3.5 py-2.5 rounded-xl border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono bg-blue-50/20"
            />
          </div>

          {/* Examples */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase">
              Model Example Sentence (စံပြ စာကြောင်း) *
            </label>

            <input
              type="text"
              value={exampleKorean}
              onChange={(e) => setExampleKorean(e.target.value)}
              placeholder="Korean Example: 인주시의 외국인 유학생 수를 조사한 결과, 2015년 3만 명에서 2023년 12만 명으로 약 4배 급증하였다."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-sans"
            />

            <input
              type="text"
              value={exampleMyanmar}
              onChange={(e) => setExampleMyanmar(e.target.value)}
              placeholder="Myanmar Translation: အင်ဂျူမြို့ရှိ နိုင်ငံခြားသားပညာတော်သင် အရေအတွက်ကို စစ်တမ်းကောက်ယူရာ ၂၀၁၅ ခုနှစ် ၃ သောင်းမှ ၂၀၂၃ တွင် ၁ သိန်း ၂ သောင်းသို့ ၄ ဆခန့် ရုတ်တရက် တိုးပွားလာခဲ့သည်။"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Key Phrases Tag Input */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase">
              Key Phrases / Anchor Terms (မဖြစ်မနေ သုံးရမည့် စကားစုများ)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={currentPhrase}
                onChange={(e) => setCurrentPhrase(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addPhrase();
                  }
                }}
                placeholder="e.g. ~에 대해 조사한 결과"
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                type="button"
                onClick={addPhrase}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition">
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>

            {keyPhrases.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {keyPhrases.map((phrase, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-xs font-medium">
                    {phrase}
                    <button type="button" onClick={() => removePhrase(i)} className="text-blue-500 hover:text-red-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
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
              {isAdmin && (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSave('approved')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-xs transition disabled:opacity-50">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Direct Publish to Mobile</span>
                </button>
              )}

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSave('pending_review')}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-xs transition disabled:opacity-50">
                <Send className="w-4 h-4" />
                <span>Submit for Review</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div>
          <MobileCardPreview
            type="pattern"
            data={{
              questionNumber,
              title,
              myanmarTitle,
              patternFormula,
              exampleKorean,
              exampleMyanmar,
            }}
          />
        </div>
      </div>
    </div>
  );
}

