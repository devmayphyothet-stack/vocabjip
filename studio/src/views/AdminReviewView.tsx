import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/auth-context';
import { supabase } from '../lib/supabase';
import { VocabRecord, PatternRecord } from '../types';
import { CheckCircle2, XCircle, Clock, Check, AlertCircle, RefreshCw, MessageSquare } from 'lucide-react';

export function AdminReviewView({ onReviewDone }: { onReviewDone?: () => void }) {
  const { user, isAdmin } = useAuth();

  const [pendingVocabs, setPendingVocabs] = useState<VocabRecord[]>([]);
  const [pendingPatterns, setPendingPatterns] = useState<PatternRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Revision modal state
  const [feedbackItem, setFeedbackItem] = useState<{ table: 'vocabularies' | 'sentence_patterns'; id: string; title: string } | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const { data: vData } = await supabase
        .from('vocabularies')
        .select('*, profiles:created_by(display_name, email)')
        .eq('status', 'pending_review')
        .order('created_at', { ascending: true });

      const { data: pData } = await supabase
        .from('sentence_patterns')
        .select('*, profiles:created_by(display_name, email)')
        .eq('status', 'pending_review')
        .order('created_at', { ascending: true });

      if (vData) setPendingVocabs(vData as VocabRecord[]);
      if (pData) setPendingPatterns(pData as PatternRecord[]);
    } catch (e) {
      console.warn('Error fetching pending queue:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (table: 'vocabularies' | 'sentence_patterns', id: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from(table)
        .update({
          status: 'approved',
          reviewed_by: user?.id,
          rejection_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      await fetchPending();
      if (onReviewDone) onReviewDone();
    } catch (e: any) {
      alert(e.message || 'Error approving item');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendRevision = async () => {
    if (!feedbackItem || !feedbackText.trim()) return;
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from(feedbackItem.table)
        .update({
          status: 'rejected',
          reviewed_by: user?.id,
          rejection_reason: feedbackText.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', feedbackItem.id);

      if (error) throw error;
      setFeedbackItem(null);
      setFeedbackText('');
      await fetchPending();
      if (onReviewDone) onReviewDone();
    } catch (e: any) {
      alert(e.message || 'Error sending revision feedback');
    } finally {
      setActionLoading(false);
    }
  };

  const totalPending = pendingVocabs.length + pendingPatterns.length;

  if (!isAdmin) {
    return (
      <div className="p-12 text-center text-slate-500">
        Admin Access Required. You do not have permissions to review submissions.
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Admin Moderation Queue</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
              {totalPending} pending items
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Contributors များ တင်သွင်းထားသော စကားလုံးနှင့် Pattern များကို စစ်ဆေးအတည်ပြု၍ Mobile App သို့ Live Publish ပြုလုပ်ရန်
          </p>
        </div>

        <button
          onClick={fetchPending}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {totalPending === 0 && !loading && (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Check className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">All submissions are reviewed!</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            စစ်ဆေးရန်ကျန်ရှိသော အရာများ မရှိတော့ပါ။ Contributor အသစ်များ တင်သွင်းလာပါက ဤနေရာတွင် ပေါ်လာပါမည်။
          </p>
        </div>
      )}

      {/* Pending Vocabularies Section */}
      {pendingVocabs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wide">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Pending Vocabularies ({pendingVocabs.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingVocabs.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition">
                <div className="space-y-3">
                  {/* Category & Contributor Info */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {item.category}
                    </span>
                    <span className="text-slate-400 font-medium">
                      By: <strong className="text-slate-700">{item.profiles?.display_name || 'Contributor'}</strong>
                    </span>
                  </div>

                  {/* Words */}
                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Spoken: </span>
                      <span className="text-sm font-semibold text-slate-400 line-through">{item.spoken}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-blue-600">Academic: </span>
                      <span className="text-base font-extrabold text-slate-900">{item.written}</span>
                    </div>
                  </div>

                  {/* Meaning & Tip */}
                  <div className="text-xs space-y-1 pt-2 border-t border-slate-100">
                    <p className="font-semibold text-slate-800">{item.myanmar_meaning}</p>
                    <p className="text-slate-500 text-[11px]">{item.english_meaning}</p>
                    {item.usage_tip && (
                      <div className="p-2 bg-amber-50 rounded-lg text-amber-900 text-[11px] font-medium border border-amber-200/50 mt-1">
                        💡 {item.usage_tip}
                      </div>
                    )}
                  </div>

                  {/* Example sentence */}
                  {item.example_korean && (
                    <div className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-0.5 border border-slate-100">
                      <p className="font-medium text-slate-900">{item.example_korean}</p>
                      <p className="text-[11px] text-slate-500">{item.example_myanmar}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    disabled={actionLoading}
                    onClick={() =>
                      setFeedbackItem({
                        table: 'vocabularies',
                        id: item.id,
                        title: `${item.spoken} → ${item.written}`,
                      })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold transition">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Request Revision</span>
                  </button>

                  <button
                    disabled={actionLoading}
                    onClick={() => handleApprove('vocabularies', item.id)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve & Publish to Mobile</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Sentence Patterns Section */}
      {pendingPatterns.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wide">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Pending Sentence Patterns ({pendingPatterns.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingPatterns.map((pat) => (
              <div
                key={pat.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                      {pat.question_number}
                    </span>
                    <span className="text-slate-400 font-medium">
                      By: <strong className="text-slate-700">{pat.profiles?.display_name || 'Contributor'}</strong>
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{pat.title}</h4>
                    <p className="text-xs text-slate-600 mt-0.5">{pat.myanmar_title}</p>
                  </div>

                  <div className="p-2.5 bg-slate-100 rounded-xl font-mono text-[11px] text-slate-800 border border-slate-200">
                    {pat.pattern_formula}
                  </div>

                  {pat.example_korean && (
                    <div className="p-2.5 bg-blue-50/50 rounded-xl text-xs space-y-0.5 border border-blue-200/50">
                      <p className="font-medium text-slate-900">{pat.example_korean}</p>
                      <p className="text-[11px] text-slate-500">{pat.example_myanmar}</p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    disabled={actionLoading}
                    onClick={() =>
                      setFeedbackItem({
                        table: 'sentence_patterns',
                        id: pat.id,
                        title: `${pat.question_number} - ${pat.title}`,
                      })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold transition">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Request Revision</span>
                  </button>

                  <button
                    disabled={actionLoading}
                    onClick={() => handleApprove('sentence_patterns', pat.id)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve & Publish to Mobile</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revision Modal */}
      {feedbackItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <MessageSquare className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900">Request Revision for Contributor</h3>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Item: <strong className="text-slate-800">{feedbackItem.title}</strong>
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Feedback & Correction Reason (ပြန်ပြင်ခိုင်းရခြင်း အကြောင်းရင်း/အကြံပြုချက်) *
              </label>
              <textarea
                rows={4}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="ဥပမာ- သဒ္ဒါအသုံးအနှုန်း မေးခွန်း ၅၄ အတွက် အနည်းငယ် လွဲမှားနေပါသဖြင့် စံပြစာကြောင်းကို ပြန်လည်ပြင်ဆင်ပေးပါရန်..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFeedbackItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition">
                Cancel
              </button>
              <button
                type="button"
                disabled={!feedbackText.trim() || actionLoading}
                onClick={handleSendRevision}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs transition disabled:opacity-50">
                Send Feedback to Contributor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
