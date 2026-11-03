import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/auth-context';
import { supabase } from '../lib/supabase';
import { VocabRecord, PatternRecord, QuizStepRecord, ReviewStatus } from '../types';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  FileEdit, 
  Trash2, 
  RefreshCw,
  Send,
  AlertTriangle,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export function MySubmissionsView() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'vocab' | 'patterns' | 'quizzes'>('vocab');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [vocabs, setVocabs] = useState<VocabRecord[]>([]);
  const [patterns, setPatterns] = useState<PatternRecord[]>([]);
  const [quizSteps, setQuizSteps] = useState<QuizStepRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit/Resubmit modal state
  const [editingVocab, setEditingVocab] = useState<VocabRecord | null>(null);
  const [editingPattern, setEditingPattern] = useState<PatternRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchMySubmissions = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [{ data: vData }, { data: pData }, { data: qData }] = await Promise.all([
        supabase
          .from('vocabularies')
          .select('*')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('sentence_patterns')
          .select('*')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('quiz_steps')
          .select('*, quiz_topics(*)')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false }),
      ]);

      if (vData) setVocabs(vData as VocabRecord[]);
      if (pData) setPatterns(pData as PatternRecord[]);
      if (qData) setQuizSteps(qData as QuizStepRecord[]);
    } catch (e) {
      console.warn('Error fetching submissions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMySubmissions();
  }, [user]);

  const handleDelete = async (table: 'vocabularies' | 'sentence_patterns' | 'quiz_steps', id: string) => {
    if (!window.confirm('ဖျက်ပစ်ရန် သေချာပါသလား?')) return;
    await supabase.from(table).delete().eq('id', id);
    fetchMySubmissions();
  };

  const handleSaveAndResubmitVocab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVocab) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('vocabularies')
        .update({
          spoken: editingVocab.spoken,
          written: editingVocab.written,
          pronunciation: editingVocab.pronunciation,
          category: editingVocab.category,
          myanmar_meaning: editingVocab.myanmar_meaning,
          english_meaning: editingVocab.english_meaning,
          usage_tip: editingVocab.usage_tip,
          example_korean: editingVocab.example_korean,
          example_myanmar: editingVocab.example_myanmar,
          status: 'pending_review',
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingVocab.id);

      if (!error) {
        setEditingVocab(null);
        await fetchMySubmissions();
      } else {
        alert('Failed to update: ' + error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndResubmitPattern = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPattern) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('sentence_patterns')
        .update({
          title: editingPattern.title,
          myanmar_title: editingPattern.myanmar_title,
          pattern_formula: editingPattern.pattern_formula,
          description: editingPattern.description,
          example_korean: editingPattern.example_korean,
          example_myanmar: editingPattern.example_myanmar,
          status: 'pending_review',
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingPattern.id);

      if (!error) {
        setEditingPattern(null);
        await fetchMySubmissions();
      } else {
        alert('Failed to update: ' + error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const filteredVocabs = vocabs.filter((v) => filterStatus === 'all' || v.status === filterStatus);
  const filteredPatterns = patterns.filter((p) => filterStatus === 'all' || p.status === filterStatus);
  const filteredQuizzes = quizSteps.filter((q) => filterStatus === 'all' || q.status === filterStatus);

  const renderStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Approved
          </span>
        );
      case 'pending_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> In Review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            <AlertTriangle className="w-3 h-3" /> Needs Revision
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Submissions</h1>
          <p className="text-sm text-slate-500 mt-1">
            မိမိတင်သွင်းထားသော စကားလုံးများနှင့် Pattern များ၏ အတည်ပြုမှု အခြေအနေများကို စစ်ဆေးရန်
          </p>
        </div>

        <button
          onClick={fetchMySubmissions}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs & Status Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        {/* Type tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('vocab')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'vocab'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}>
            Vocabularies ({vocabs.length})
          </button>

          <button
            onClick={() => setActiveTab('patterns')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'patterns'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}>
            Sentence Patterns ({patterns.length})
          </button>

          <button
            onClick={() => setActiveTab('quizzes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'quizzes'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}>
            Quiz Steps ({quizSteps.length})
          </button>
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-semibold mr-1">Status:</span>
          {['all', 'pending_review', 'approved', 'rejected', 'draft'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition ${
                filterStatus === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}>
              {st === 'all' ? 'All' : st === 'rejected' ? 'Needs Revision' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table list */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {activeTab === 'vocab' ? (
          filteredVocabs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">တင်သွင်းထားသော စကားလုံး မရှိသေးပါခင်ဗျာ။</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Spoken</th>
                    <th className="py-3 px-4 text-blue-700">Academic Word</th>
                    <th className="py-3 px-4">Myanmar Meaning</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Admin Review Notes</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredVocabs.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">{renderStatusBadge(item.status)}</td>
                      <td className="py-3 px-4 text-slate-400 line-through">{item.spoken}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{item.written}</td>
                      <td className="py-3 px-4 font-medium">{item.myanmar_meaning}</td>
                      <td className="py-3 px-4 text-slate-600">{item.category}</td>
                      <td className="py-3 px-4 max-w-xs">
                        {item.rejection_reason ? (
                          <div className="p-2 rounded-lg bg-red-50 text-red-800 text-[11px] font-medium border border-red-200">
                            {item.rejection_reason}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        {item.status === 'rejected' && (
                          <button
                            onClick={() => setEditingVocab(item)}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-[11px] shadow-2xs transition inline-flex items-center gap-1">
                            <FileEdit className="w-3 h-3" />
                            <span>Edit & Resubmit</span>
                          </button>
                        )}

                        {item.status !== 'approved' && (
                          <button
                            onClick={() => handleDelete('vocabularies', item.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete draft">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : activeTab === 'patterns' ? (
          filteredPatterns.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">တင်သွင်းထားသော Pattern မရှိသေးပါခင်ဗျာ။</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Question</th>
                    <th className="py-3 px-4">Pattern Title</th>
                    <th className="py-3 px-4">Myanmar Title</th>
                    <th className="py-3 px-4">Formula</th>
                    <th className="py-3 px-4">Admin Review Notes</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredPatterns.map((pat) => (
                    <tr key={pat.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">{renderStatusBadge(pat.status)}</td>
                      <td className="py-3 px-4 font-bold text-amber-700">{pat.question_number}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{pat.title}</td>
                      <td className="py-3 px-4 font-medium">{pat.myanmar_title}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 max-w-xs truncate">{pat.pattern_formula}</td>
                      <td className="py-3 px-4 max-w-xs">
                        {pat.rejection_reason ? (
                          <div className="p-2 rounded-lg bg-red-50 text-red-800 text-[11px] font-medium border border-red-200">
                            {pat.rejection_reason}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        {pat.status === 'rejected' && (
                          <button
                            onClick={() => setEditingPattern(pat)}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-[11px] shadow-2xs transition inline-flex items-center gap-1">
                            <FileEdit className="w-3 h-3" />
                            <span>Edit & Resubmit</span>
                          </button>
                        )}

                        {pat.status !== 'approved' && (
                          <button
                            onClick={() => handleDelete('sentence_patterns', pat.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete draft">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          filteredQuizzes.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">တင်သွင်းထားသော Quiz Step မရှိသေးပါခင်ဗျာ။</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Topic</th>
                    <th className="py-3 px-4">Step</th>
                    <th className="py-3 px-4">Step Title</th>
                    <th className="py-3 px-4">Questions</th>
                    <th className="py-3 px-4">Admin Review Notes</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredQuizzes.map((qz) => (
                    <tr key={qz.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">{renderStatusBadge(qz.status)}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {qz.quiz_topics?.title || 'Quiz Topic'}
                      </td>
                      <td className="py-3 px-4 font-bold text-purple-700">Step {qz.step_number}</td>
                      <td className="py-3 px-4 font-medium">{qz.title}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {(qz.questions || []).length} Qs (Pass: {qz.passing_score}/5)
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        {qz.rejection_reason ? (
                          <div className="p-2 rounded-lg bg-red-50 text-red-800 text-[11px] font-medium border border-red-200">
                            {qz.rejection_reason}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        {qz.status !== 'approved' && (
                          <button
                            onClick={() => handleDelete('quiz_steps', qz.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete step">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Edit Vocab Modal */}
      {editingVocab && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Edit & Resubmit Vocabulary</h3>
                <p className="text-xs text-slate-500">Address feedback and re-submit for admin review</p>
              </div>
              <button
                onClick={() => setEditingVocab(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1">
                ✕
              </button>
            </div>

            {editingVocab.rejection_reason && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Admin Feedback Note:</span>
                </div>
                <p>{editingVocab.rejection_reason}</p>
              </div>
            )}

            <form onSubmit={handleSaveAndResubmitVocab} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Spoken (စကားပြော)</label>
                  <input
                    type="text"
                    required
                    value={editingVocab.spoken}
                    onChange={(e) => setEditingVocab({ ...editingVocab, spoken: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Academic (စာရေး/TOPIK)</label>
                  <input
                    type="text"
                    required
                    value={editingVocab.written}
                    onChange={(e) => setEditingVocab({ ...editingVocab, written: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-blue-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Myanmar Meaning (မြန်မာအဓိပ္ပာယ်)</label>
                <input
                  type="text"
                  required
                  value={editingVocab.myanmar_meaning}
                  onChange={(e) => setEditingVocab({ ...editingVocab, myanmar_meaning: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Korean Example (နမူနာဝါကျ)</label>
                <textarea
                  rows={2}
                  required
                  value={editingVocab.example_korean}
                  onChange={(e) => setEditingVocab({ ...editingVocab, example_korean: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Myanmar Translation of Example</label>
                <textarea
                  rows={2}
                  required
                  value={editingVocab.example_myanmar}
                  onChange={(e) => setEditingVocab({ ...editingVocab, example_myanmar: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">TOPIK Writing Tip</label>
                <input
                  type="text"
                  value={editingVocab.usage_tip}
                  onChange={(e) => setEditingVocab({ ...editingVocab, usage_tip: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingVocab(null)}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50">
                  <Send className="w-3.5 h-3.5" />
                  <span>{saving ? 'Submitting...' : 'Save & Resubmit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Pattern Modal */}
      {editingPattern && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Edit & Resubmit Pattern</h3>
                <p className="text-xs text-slate-500">Address feedback and re-submit for admin review</p>
              </div>
              <button
                onClick={() => setEditingPattern(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1">
                ✕
              </button>
            </div>

            {editingPattern.rejection_reason && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Admin Feedback Note:</span>
                </div>
                <p>{editingPattern.rejection_reason}</p>
              </div>
            )}

            <form onSubmit={handleSaveAndResubmitPattern} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pattern Title (Korean)</label>
                <input
                  type="text"
                  required
                  value={editingPattern.title}
                  onChange={(e) => setEditingPattern({ ...editingPattern, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Myanmar Title</label>
                <input
                  type="text"
                  required
                  value={editingPattern.myanmar_title}
                  onChange={(e) => setEditingPattern({ ...editingPattern, myanmar_title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Grammar Formula</label>
                <input
                  type="text"
                  required
                  value={editingPattern.pattern_formula}
                  onChange={(e) => setEditingPattern({ ...editingPattern, pattern_formula: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Example Korean</label>
                <textarea
                  rows={2}
                  required
                  value={editingPattern.example_korean}
                  onChange={(e) => setEditingPattern({ ...editingPattern, example_korean: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Example Myanmar</label>
                <textarea
                  rows={2}
                  required
                  value={editingPattern.example_myanmar}
                  onChange={(e) => setEditingPattern({ ...editingPattern, example_myanmar: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPattern(null)}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50">
                  <Send className="w-3.5 h-3.5" />
                  <span>{saving ? 'Submitting...' : 'Save & Resubmit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
