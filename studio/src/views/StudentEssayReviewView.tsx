import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileEdit,
  FileText,
  Loader2,
  Lock,
  RefreshCw,
  Send,
  Sparkles,
  UserCheck
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/auth-context';
import { fetchContributorRankLabel } from '../lib/contributor-rank';
import { supabase } from '../lib/supabase';
import { StudentEssaySubmissionRecord } from '../types';

interface StudentEssayReviewViewProps {
  onReviewCompleted?: () => void;
}

export function StudentEssayReviewView({ onReviewCompleted }: StudentEssayReviewViewProps) {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<StudentEssaySubmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_review' | 'reviewed'>('all');
  const [selectedEssay, setSelectedEssay] = useState<StudentEssaySubmissionRecord | null>(null);
  const [myRankLabel, setMyRankLabel] = useState('Contributor');

  // Grading Form State
  const [score, setScore] = useState<number>(24);
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [correctedSample, setCorrectedSample] = useState('');
  const [overallComment, setOverallComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const reviewerDisplayName =
    user?.display_name || user?.email?.split('@')[0] || 'TOPIK Mentor';

  const fetchEssaysAndRank = async () => {
    setLoading(true);
    try {
      if (user?.id) {
        const rankLabel = await fetchContributorRankLabel(user.id);
        setMyRankLabel(rankLabel);
      }

      const { data, error } = await supabase
        .from('essay_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching essay_submissions:', error.message);
      } else if (data) {
        setSubmissions(data as StudentEssaySubmissionRecord[]);
        if (selectedEssay) {
          const updated = data.find((d: any) => d.id === selectedEssay.id);
          if (updated) {
            setSelectedEssay(updated as StudentEssaySubmissionRecord);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load essay submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEssaysAndRank();
  }, [user?.id]);

  const handleSelectEssay = (item: StudentEssaySubmissionRecord) => {
    setSelectedEssay(item);
    setMessage(null);
    const defaultMax = item.question_type === 'Q53' ? 24 : 38;
    setScore(item.score ?? defaultMax);
    setStrengths(item.strengths || '');
    setImprovements(item.improvements || '');
    setCorrectedSample(item.corrected_sample || '');
    setOverallComment(item.overall_comment || '');
  };

  const handleClaimEssay = async (item: StudentEssaySubmissionRecord) => {
    if (!user) return;
    setClaimingId(item.id);
    setMessage(null);
    try {
      const { data, error } = await supabase
        .from('essay_submissions')
        .update({
          status: 'in_review',
          reviewed_by: user.id,
          reviewer_name: reviewerDisplayName,
          reviewer_rank: myRankLabel,
        })
        .eq('id', item.id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        const updated = data as StudentEssaySubmissionRecord;
        setSubmissions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        handleSelectEssay(updated);
        setMessage({
          type: 'success',
          text: 'ဤစာမူကို သင် စစ်ဆေးရန် Claim လုပ်ပြီးပါပြီ။ အခြား Contributor များက သင်စစ်ဆေးနေကြောင်း မြင်ရပါမည်။',
        });
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Claim လုပ်ရာတွင် အမှားအယွင်းရှိနေပါသည်။',
      });
    } finally {
      setClaimingId(null);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEssay || !user) return;

    const maxScore = selectedEssay.question_type === 'Q53' ? 30 : 50;
    if (score < 0 || score > maxScore) {
      setMessage({
        type: 'error',
        text: `အမှတ်သည် 0 မှ ${maxScore} အတွင်း ဖြစ်ရပါမည်။`,
      });
      return;
    }

    if (!overallComment.trim() && !strengths.trim() && !improvements.trim()) {
      setMessage({
        type: 'error',
        text: 'ကျေးဇူးပြု၍ ကျောင်းသားအတွက် အကြံပြုချက် (Feedback) အနည်းဆုံး တစ်ခု ရေးပေးပါ။',
      });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const { data, error } = await supabase
        .from('essay_submissions')
        .update({
          status: 'reviewed',
          score: Number(score),
          max_score: maxScore,
          strengths: strengths.trim(),
          improvements: improvements.trim(),
          corrected_sample: correctedSample.trim(),
          overall_comment: overallComment.trim(),
          reviewed_by: user.id,
          reviewer_name: reviewerDisplayName,
          reviewer_rank: myRankLabel,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedEssay.id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        const updated = data as StudentEssaySubmissionRecord;
        setSubmissions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        setSelectedEssay(updated);
        setMessage({
          type: 'success',
          text: 'အမှတ်ပေးစစ်ဆေးမှု အောင်မြင်စွာ ပေးပို့ပြီးပါပြီ! ကျောင်းသား၏ App တွင် သင့် Display Name နှင့် Rank ဖြင့် ချက်ချင်းမြင်ရပါပြီ။ (+20 Mentor Points)',
        });
        onReviewCompleted?.();
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Review သိမ်းဆည်းရာတွင် အမှားအယွင်းရှိနေပါသည်။',
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredSubmissions = submissions.filter((item) => {
    if (filterStatus === 'all') return true;
    return item.status === filterStatus;
  });

  const pendingCount = submissions.filter((s) => s.status === 'pending').length;
  const inReviewCount = submissions.filter((s) => s.status === 'in_review').length;
  const reviewedCount = submissions.filter((s) => s.status === 'reviewed').length;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
            <FileEdit className="w-4 h-4" />
            <span>Human Teacher Evaluation • Q53 & Q54</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Student Essay Grading Queue
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            ကျောင်းသားများ ပေးပို့ထားသော Graph Writing (Q53) နှင့် Long Essay (Q54) စာမူများကို စစ်ဆေးအမှတ်ပေးနိုင်ပါသည်။
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {/* <div className="px-3.5 py-2 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-600" />
            <div className="text-left">
              <div className="text-[10px] font-bold uppercase text-amber-700">Your Reviewer Badge</div>
              <div className="text-xs font-extrabold text-slate-900">
                {reviewerDisplayName} • <span className="text-amber-700">{myRankLabel}</span>
              </div>
            </div>
          </div> */}

          <button
            onClick={fetchEssaysAndRank}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'all', label: `All Submissions (${submissions.length})` },
          { id: 'pending', label: `⏳ Waiting for Teacher (${pendingCount})` },
          { id: 'in_review', label: `✍️ Currently In Review (${inReviewCount})` },
          { id: 'reviewed', label: `✅ Graded (${reviewedCount})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${filterStatus === tab.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Submissions Queue */}
        <div className="lg:col-span-5 space-y-3">
          {loading ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span>Loading student essays...</span>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-700">No student essays in this queue</div>
              <p className="text-xs text-slate-400">
                ကျောင်းသားများက Mobile / Web App မှ Q53 သို့မဟုတ် Q54 စာမူများ ပေးပို့လာသည့်အခါ ဤနေရာတွင် ပေါ်လာပါမည်။
              </p>
            </div>
          ) : (
            filteredSubmissions.map((item) => {
              const isSelected = selectedEssay?.id === item.id;
              const isClaimedByOther =
                item.status === 'in_review' &&
                item.reviewed_by &&
                item.reviewed_by !== user?.id;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectEssay(item)}
                  className={`p-4 rounded-2xl border transition cursor-pointer ${isSelected
                      ? 'bg-blue-50/60 border-blue-500 ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200/90 hover:border-slate-300'
                    }`}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${item.question_type === 'Q53'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                          }`}>
                        {item.question_type}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        {item.student_name || 'TOPIK Learner'}
                      </span>
                    </div>

                    {item.status === 'pending' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Needs Review
                      </span>
                    )}
                    {item.status === 'in_review' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> In Review ({item.reviewer_name || 'Teacher'})
                      </span>
                    )}
                    {item.status === 'reviewed' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {item.score}/{item.max_score} pts
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-extrabold text-slate-900 mb-1 line-clamp-1">
                    {item.prompt_title}
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 font-mono bg-slate-50 p-2 rounded-lg border border-slate-100">
                    {item.content}
                  </p>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{item.char_count} chars</span>
                    {item.reviewer_name ? (
                      <span className="text-slate-600 font-semibold">
                        👨‍🏫 {item.reviewer_name}
                        {/* ({item.reviewer_rank || 'Mentor'}) */}
                      </span>
                    ) : (
                      <span>Unclaimed</span>
                    )}
                  </div>

                  {item.status === 'pending' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClaimEssay(item);
                      }}
                      disabled={claimingId === item.id}
                      className="mt-3 w-full py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>
                        {claimingId === item.id
                          ? 'Claiming...'
                          : 'Claim Essay to Grade (내가 채점하기)'}
                      </span>
                    </button>
                  )}

                  {isClaimedByOther && (
                    <div className="mt-2 text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg font-medium">
                      ⚠️ လက်ရှိတွင် {item.reviewer_name} မှ စစ်ဆေးနေပါသည်။
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Essay Reader & Evaluation Form */}
        <div className="lg:col-span-7">
          {!selectedEssay ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <Sparkles className="w-10 h-10 text-blue-500 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-800">
                Select a Student Essay to Inspect & Grade
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                ဘယ်ဘက်စာရင်းမှ ကျောင်းသားပေးပို့ထားသော Q53 (Graph Analysis) သို့မဟုတ် Q54 (Long Essay) တစ်ပုဒ်ကို ရွေးချယ်ပြီး အမှတ်ပေးစစ်ဆေးနိုင်ပါသည်။
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
              {/* Top Essay Metadata */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/60 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase ${selectedEssay.question_type === 'Q53'
                          ? 'bg-blue-600 text-white'
                          : 'bg-purple-600 text-white'
                        }`}>
                      {selectedEssay.question_type}
                    </span>
                    <h2 className="text-base font-black text-slate-900">
                      {selectedEssay.prompt_title}
                    </h2>
                  </div>

                  <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                    {selectedEssay.char_count} characters • Student: {selectedEssay.student_name}
                  </span>
                </div>

                {/* Manuscript Reader Box */}
                <div className="bg-[#FFFEFA] border-2 border-[#E5DFD5] rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Student Korean Manuscript (원고지 작성 내용)</span>
                    <span>
                      Target: {selectedEssay.question_type === 'Q53' ? '200–300' : '600–700'} chars
                    </span>
                  </div>
                  <p className="text-sm text-slate-900 leading-relaxed whitespace-pre-wrap font-medium">
                    {selectedEssay.content}
                  </p>
                </div>
              </div>

              {/* Grading Form */}
              <form onSubmit={handleSubmitReview} className="p-6 space-y-5">
                {message && (
                  <div
                    className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${message.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{message.text}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-800">
                      TOPIK Exam Score (점수 부여)
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {selectedEssay.question_type === 'Q53'
                        ? 'Q53 Maximum Score is 30 points'
                        : 'Q54 Maximum Score is 50 points'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 md:justify-end">
                    <input
                      type="number"
                      min={0}
                      max={selectedEssay.question_type === 'Q53' ? 30 : 50}
                      value={score}
                      onChange={(e) => setScore(Number(e.target.value))}
                      className="w-24 px-3 py-2 text-center text-lg font-black text-blue-700 bg-white border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-black text-slate-500">
                      / {selectedEssay.question_type === 'Q53' ? 30 : 50} pts
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ✅ အားသာချက်များ (Strengths / 잘한 점)
                    </label>
                    <textarea
                      rows={3}
                      value={strengths}
                      onChange={(e) => setStrengths(e.target.value)}
                      placeholder="ဥပမာ - ကိန်းဂဏန်းအချက်အလက်များကို နှိုင်းယှဉ်ပြပုံ ရှင်းလင်းပါသည်။ -(으)ㄴ 반면 သဒ္ဒါသုံးနှုန်းပုံ မှန်ကန်ပါသည်။"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      🛠️ ပြင်ဆင်သင့်သည့် အချက်များ (Areas to Improve / 보완할 점)
                    </label>
                    <textarea
                      rows={3}
                      value={improvements}
                      onChange={(e) => setImprovements(e.target.value)}
                      placeholder="ဥပမာ - 구어체 (အပြောစကား) ဖြစ်သော ~해요 အစား 문어체 (~다/는다) သို့ ပြောင်းရေးရန် လိုအပ်ပါသည်။"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ✨ Contributor ပြင်ဆင်ပေးထားသော အဆင့်မြင့်ဝါကျ (Corrected / Model Rewrite)
                  </label>
                  <textarea
                    rows={3}
                    value={correctedSample}
                    onChange={(e) => setCorrectedSample(e.target.value)}
                    placeholder="ကျောင်းသား၏ ဝါကျကို TOPIK အမှတ်ပြည့်ရနိုင်သည့် Academic Korean ပုံစံဖြင့် ပြန်လည်ရေးသားပေးပါ..."
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    💬 အထွေထွေ သုံးသပ်ချက်နှင့် အားပေးစကား (Overall Teacher Comment in Myanmar)
                  </label>
                  <textarea
                    rows={3}
                    value={overallComment}
                    onChange={(e) => setOverallComment(e.target.value)}
                    placeholder="ကျောင်းသားအတွက် အားပေးစကားနှင့် နောက်တစ်ကြိမ် လေ့ကျင့်ရာတွင် သတိထားရမည့် အချက်များ..."
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
                  <div className="text-[11px] text-slate-500">
                    Signed by:{' '}
                    <span className="font-bold text-slate-800">{reviewerDisplayName}</span>
                    {/* (<span className="text-amber-700 font-bold">{myRankLabel}</span>) */}
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs">
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Publishing Evaluation...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Teacher Evaluation to Student</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
