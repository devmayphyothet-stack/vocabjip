import React, { useState } from 'react';
import { useAuth } from '../context/auth-context';
import { supabase } from '../lib/supabase';
import { CheckCircle2, Send, Save, AlertCircle, FileText } from 'lucide-react';

export function EssayPromptStudioView({ onSubmitted }: { onSubmitted?: () => void }) {
  const { user, isAdmin } = useAuth();

  const [type, setType] = useState<'Q53' | 'Q54' | 'statement'>('Q54');
  const [title, setTitle] = useState('');
  const [promptText, setPromptText] = useState('');
  const [sampleAnswer, setSampleAnswer] = useState('');
  const [scoringCriteria, setScoringCriteria] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async (submitStatus: 'draft' | 'pending_review' | 'approved') => {
    if (!title.trim() || !promptText.trim()) {
      setErrorMessage('ကျေးဇူးပြု၍ မေးခွန်းခေါင်းစဉ်နှင့် ပုစ္ဆာစာသားကို ထည့်သွင်းပေးပါခင်ဗျာ။');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const id = `prompt-${Date.now().toString(36)}`;
      const { error } = await supabase.from('essay_prompts').insert({
        id,
        type,
        title: title.trim(),
        prompt_text: promptText.trim(),
        sample_answer: sampleAnswer.trim(),
        scoring_criteria: scoringCriteria.trim(),
        status: submitStatus,
        created_by: user?.id || null,
        reviewed_by: submitStatus === 'approved' ? user?.id : null,
      });

      if (error) throw error;

      setSuccessMessage(
        submitStatus === 'approved'
          ? '🎉 Prompt အသစ်ကို တိုက်ရိုက် Publish ပြုလုပ်ပြီးပါပြီ!'
          : submitStatus === 'pending_review'
          ? '✅ စစ်ဆေးအတည်ပြုရန် Admin ထံသို့ ပေးပို့ပြီးပါပြီ။'
          : '💾 Draft အဖြစ် သိမ်းဆည်းပြီးပါပြီ။'
      );

      setTitle('');
      setPromptText('');
      setSampleAnswer('');
      setScoringCriteria('');

      if (onSubmitted) onSubmitted();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error submitting prompt');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">TOPIK Essay Prompt Studio</h1>
        <p className="text-sm text-slate-500 mt-1">
          TOPIK II (မေးခွန်း ၅၃ Graph Analysis & မေးခွန်း ၅၄ Long Essay) ပုစ္ဆာများနှင့် စံပြအဖြေများ ထည့်သွင်းရန်
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm font-semibold">{errorMessage}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        {/* Type selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
            Prompt Type (အမျိုးအစား) *
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'Q54', label: 'Q54 Long Essay (논술문)', desc: '600-700 characters' },
              { id: 'Q53', label: 'Q53 Graph Analysis (설명문)', desc: '200-300 characters' },
              { id: 'statement', label: 'Admissions Statement (자기소개서)', desc: 'University SOP' },
            ].map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => setType(t.id as any)}
                className={`p-3 rounded-xl text-left border transition ${
                  type === t.id
                    ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}>
                <div className="text-xs font-bold">{t.label}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Title */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
            Prompt Title (ခေါင်းစဉ်) *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 배움의 가치와 평생 교육 (The Value of Lifelong Learning)"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
          />
        </div>

        {/* Prompt Text / Questions */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
            Official Prompt Text & Sub-questions (ပုစ္ဆာ စာသားနှင့် မေးခွန်း ၃ ချက်) *
          </label>
          <textarea
            rows={4}
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="e.g. 현대 사회에서 평생 교육이 필요한 이유와 이를 위한 방안에 대해 자신의 생각을 쓰시오. (1. 평생 교육이 필요한 이유는 무엇인가? 2. 평생 교육을 통해 얻을 수 있는 것은 무엇인가? 3. 이를 활성화하기 위한 방안은 무엇인가?)"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-sans"
          />
        </div>

        {/* Sample Model Answer */}
        <div>
          <label className="block text-xs font-bold text-blue-700 uppercase mb-1.5">
            Model Sample Answer in Wongoji Style (စံပြ အဖြေလွှာ)
          </label>
          <textarea
            rows={6}
            value={sampleAnswer}
            onChange={(e) => setSampleAnswer(e.target.value)}
            placeholder="TOPIK အမှတ်ပြည့်ရနိုင်မည့် ၆၀၀-၇၀၀ စာလုံးရေ စံပြစာစီစာကုံးကို ရိုက်ထည့်ပါ..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-sans bg-blue-50/20"
          />
        </div>

        {/* Scoring Criteria */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
            TOPIK Scoring Criteria & Checklist (အမှတ်ပေးစံနှုန်း လမ်းညွှန်)
          </label>
          <input
            type="text"
            value={scoringCriteria}
            onChange={(e) => setScoringCriteria(e.target.value)}
            placeholder="e.g. နိဒါန်း၊ စာကိုယ်၊ နိဂုံး ၃ ပိုင်း ခွဲခြားရမည်။ ~다/한다 စာရေးသားဟန် သုံးရမည်။"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
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
    </div>
  );
}
