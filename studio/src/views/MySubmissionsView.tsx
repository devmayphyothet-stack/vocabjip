import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/auth-context';
import { supabase } from '../lib/supabase';
import { VocabRecord, PatternRecord, ReviewStatus } from '../types';
import { Clock, CheckCircle2, XCircle, FileEdit, Trash2, RefreshCw } from 'lucide-react';

export function MySubmissionsView() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'vocab' | 'patterns'>('vocab');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [vocabs, setVocabs] = useState<VocabRecord[]>([]);
  const [patterns, setPatterns] = useState<PatternRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMySubmissions = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: vData } = await supabase
        .from('vocabularies')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      const { data: pData } = await supabase
        .from('sentence_patterns')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (vData) setVocabs(vData as VocabRecord[]);
      if (pData) setPatterns(pData as PatternRecord[]);
    } catch (e) {
      console.warn('Error fetching submissions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMySubmissions();
  }, [user]);

  const handleDelete = async (table: 'vocabularies' | 'sentence_patterns', id: string) => {
    if (!window.confirm('ဖျက်ပစ်ရန် သေချာပါသလား?')) return;
    await supabase.from(table).delete().eq('id', id);
    fetchMySubmissions();
  };

  const filteredVocabs = vocabs.filter((v) => filterStatus === 'all' || v.status === filterStatus);
  const filteredPatterns = patterns.filter((p) => filterStatus === 'all' || p.status === filterStatus);

  const renderStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Approved (Live in App)
          </span>
        );
      case 'pending_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Pending Review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3 h-3" /> Needs Revision
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
              {st === 'all' ? 'All' : st.replace('_', ' ')}
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
                      <td className="py-3 px-4">
                        {item.rejection_reason ? (
                          <div className="p-2 rounded-lg bg-red-50 text-red-800 text-[11px] font-medium border border-red-200">
                            {item.rejection_reason}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
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
        ) : (
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
                      <td className="py-3 px-4">
                        {pat.rejection_reason ? (
                          <div className="p-2 rounded-lg bg-red-50 text-red-800 text-[11px] font-medium border border-red-200">
                            {pat.rejection_reason}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
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
        )}
      </div>
    </div>
  );
}

