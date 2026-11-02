import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ContributorLeaderboardItem, VocabRecord, PatternRecord } from '../types';
import { 
  BarChart3, 
  Trophy, 
  BookOpen, 
  FileText, 
  Layers, 
  Users, 
  Award, 
  Flame, 
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Clock
} from 'lucide-react';

export function AdminAnalyticsView() {
  const [loading, setLoading] = useState(true);
  const [totalVocabs, setTotalVocabs] = useState(0);
  const [totalPatterns, setTotalPatterns] = useState(0);
  const [pendingReviews, setPendingReviews] = useState(0);
  const [leaderboard, setLeaderboard] = useState<ContributorLeaderboardItem[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<Record<string, number>>({});
  const [questionBreakdown, setQuestionBreakdown] = useState<Record<string, number>>({
    Q51: 0,
    Q52: 0,
    Q53: 0,
    Q54: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch vocabularies
      const { data: vocabs } = await supabase
        .from('vocabularies')
        .select('*');

      // 2. Fetch sentence patterns
      const { data: patterns } = await supabase
        .from('sentence_patterns')
        .select('*');

      // 3. Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*');

      const allVocabs = (vocabs || []) as VocabRecord[];
      const allPatterns = (patterns || []) as PatternRecord[];
      const allProfiles = profiles || [];

      // Counts
      const approvedVocabs = allVocabs.filter(v => v.status === 'approved');
      const approvedPatterns = allPatterns.filter(p => p.status === 'approved');
      const pendingVocabs = allVocabs.filter(v => v.status === 'pending_review');
      const pendingPatterns = allPatterns.filter(p => p.status === 'pending_review');

      setTotalVocabs(approvedVocabs.length);
      setTotalPatterns(approvedPatterns.length);
      setPendingReviews(pendingVocabs.length + pendingPatterns.length);

      // Question breakdown
      const qCounts = { Q51: 0, Q52: 0, Q53: 0, Q54: 0 };
      allPatterns.forEach(p => {
        if (p.question_number && qCounts[p.question_number] !== undefined) {
          qCounts[p.question_number]++;
        }
      });
      setQuestionBreakdown(qCounts);

      // Category breakdown
      const catCounts: Record<string, number> = {};
      allVocabs.forEach(v => {
        const cat = v.category || 'General';
        catCounts[cat] = (catCounts[cat] || 0) + 1;
      });
      setCategoryBreakdown(catCounts);

      // Leaderboard calculation
      const statsMap: Record<string, ContributorLeaderboardItem> = {};

      allProfiles.forEach((prof: any) => {
        statsMap[prof.id] = {
          id: prof.id,
          display_name: prof.display_name || prof.email?.split('@')[0] || 'Contributor',
          email: prof.email || '',
          role: prof.role || 'user',
          approved_vocabs: 0,
          approved_patterns: 0,
          pending_items: 0,
          total_score: 0,
        };
      });

      allVocabs.forEach(v => {
        if (v.created_by && statsMap[v.created_by]) {
          if (v.status === 'approved') statsMap[v.created_by].approved_vocabs++;
          if (v.status === 'pending_review') statsMap[v.created_by].pending_items++;
        }
      });

      allPatterns.forEach(p => {
        if (p.created_by && statsMap[p.created_by]) {
          if (p.status === 'approved') statsMap[p.created_by].approved_patterns++;
          if (p.status === 'pending_review') statsMap[p.created_by].pending_items++;
        }
      });

      // Calculate score: (approved * 10) + (pending * 2)
      const list = Object.values(statsMap).map(item => ({
        ...item,
        total_score: (item.approved_vocabs * 10) + (item.approved_patterns * 15) + (item.pending_items * 2),
      }));

      // Sort by score descending
      list.sort((a, b) => b.total_score - a.total_score);
      setLeaderboard(list);

    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Platform Intelligence</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Analytics & Leaderboard</h1>
          <p className="text-slate-500 text-xs mt-1">
            Live overview of curriculum coverage, content publishing metrics, and top contributing educators.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition self-start md:self-auto">
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Live Vocabularies</span>
            <BookOpen className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{totalVocabs}</div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Synced to mobile app</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Live Patterns</span>
            <FileText className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{totalPatterns}</div>
          <div className="text-[11px] text-purple-600 font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Q51 - Q54 writing formulas</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-600">{pendingReviews}</div>
          <div className="text-[11px] text-slate-500 font-medium">
            Waiting for admin approval
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Contributors</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">
            {leaderboard.filter(l => l.role !== 'user' || l.total_score > 0).length}
          </div>
          <div className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" />
            <span>Active content creators</span>
          </div>
        </div>
      </div>

      {/* Curriculum Coverage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TOPIK Questions Coverage */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900">TOPIK II Writing Formulas</h3>
            <span className="text-xs text-slate-400">By Question Number</span>
          </div>

          <div className="space-y-3">
            {[
              { q: 'Q51', label: 'Q51 Short Sentence Fill-in', count: questionBreakdown.Q51, color: 'bg-blue-500' },
              { q: 'Q52', label: 'Q52 Academic Sentence Fill-in', count: questionBreakdown.Q52, color: 'bg-emerald-500' },
              { q: 'Q53', label: 'Q53 Data / Graph Analysis', count: questionBreakdown.Q53, color: 'bg-amber-500' },
              { q: 'Q54', label: 'Q54 600-700 Word Long Essay', count: questionBreakdown.Q54, color: 'bg-purple-500' },
            ].map(item => (
              <div key={item.q} className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>{item.label}</span>
                  <span className="text-slate-900">{item.count} formulas</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`${item.color} h-full rounded-full transition-all duration-500`} 
                    style={{ width: `${Math.min(100, Math.max(10, item.count * 15))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vocab Categories */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900">Vocabulary Categories</h3>
            <span className="text-xs text-slate-400">Distribution</span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {Object.keys(categoryBreakdown).length === 0 ? (
              <p className="text-xs text-slate-400 italic">No categorized words yet.</p>
            ) : (
              Object.entries(categoryBreakdown).map(([cat, count]) => (
                <div
                  key={cat}
                  className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs flex items-center gap-2">
                  <span className="font-bold text-slate-700">{cat}</span>
                  <span className="bg-slate-200 text-slate-700 font-mono text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                    {count}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Contributor Leaderboard */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wider mb-1">
              <Trophy className="w-4 h-4" />
              <span>Honor Roll</span>
            </div>
            <h2 className="text-lg font-black text-slate-900">Top Contributing Educators & Mentors</h2>
            <p className="text-xs text-slate-500">Ranking based on approved vocabulary pairs and sentence patterns.</p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading rankings...</div>
        ) : leaderboard.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No contributors yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Rank</th>
                  <th className="py-3 px-4">Contributor</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-center">Approved Vocabs</th>
                  <th className="py-3 px-4 text-center">Approved Patterns</th>
                  <th className="py-3 px-4 text-center">In Review</th>
                  <th className="py-3 px-4 text-right">Contribution Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaderboard.slice(0, 10).map((item, index) => {
                  const rank = index + 1;
                  const isTop3 = rank <= 3 && item.total_score > 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 text-center font-bold">
                        {isTop3 ? (
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${
                            rank === 1 
                              ? 'bg-amber-100 text-amber-700 border border-amber-300' 
                              : rank === 2 
                              ? 'bg-slate-200 text-slate-700' 
                              : 'bg-amber-50 text-amber-800'
                          }`}>
                            {rank}
                          </span>
                        ) : (
                          <span className="text-slate-400">#{rank}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900">{item.display_name}</div>
                        <div className="text-[11px] text-slate-400">{item.email}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                          item.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : item.role === 'contributor'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                        {item.approved_vocabs}
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                        {item.approved_patterns}
                      </td>

                      <td className="py-3.5 px-4 text-center text-amber-600 font-bold">
                        {item.pending_items > 0 ? item.pending_items : '-'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-black text-slate-900 text-sm bg-slate-100 px-2 py-1 rounded-lg">
                          {item.total_score} pts
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
