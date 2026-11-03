import { supabase } from './supabase';

export async function fetchContributorRankLabel(userId?: string | null): Promise<string> {
  if (!userId) return 'Contributor';
  try {
    const [{ data: vData }, { data: pData }, { data: sData }, { data: eData }, { data: profData }] =
      await Promise.all([
        supabase.from('vocabularies').select('id, created_by, status'),
        supabase.from('sentence_patterns').select('id, created_by, status'),
        supabase.from('quiz_steps').select('id, created_by, status'),
        supabase.from('essay_submissions').select('id, reviewed_by, status'),
        supabase.from('profiles').select('id, role'),
      ]);

    if (!profData) return 'Contributor';

    const scores: Record<string, { id: string; role: string; score: number }> = {};
    profData.forEach((p: any) => {
      scores[p.id] = { id: p.id, role: p.role || 'user', score: 0 };
    });

    (vData || []).forEach((v: any) => {
      if (v.created_by && scores[v.created_by]) {
        if (v.status === 'approved') scores[v.created_by].score += 10;
        if (v.status === 'pending_review') scores[v.created_by].score += 2;
      }
    });

    (pData || []).forEach((p: any) => {
      if (p.created_by && scores[p.created_by]) {
        if (p.status === 'approved') scores[p.created_by].score += 15;
        if (p.status === 'pending_review') scores[p.created_by].score += 2;
      }
    });

    (sData || []).forEach((s: any) => {
      if (s.created_by && scores[s.created_by]) {
        if (s.status === 'approved') scores[s.created_by].score += 25;
        if (s.status === 'pending_review') scores[s.created_by].score += 5;
      }
    });

    (eData || []).forEach((e: any) => {
      if (e.reviewed_by && scores[e.reviewed_by] && e.status === 'reviewed') {
        scores[e.reviewed_by].score += 20;
      }
    });

    const contributors = Object.values(scores)
      .filter((c) => c.role === 'contributor')
      .sort((a, b) => b.score - a.score);

    const myIdx = contributors.findIndex((c) => c.id === userId);
    if (myIdx !== -1) {
      const rankNum = myIdx + 1;
      const myScore = contributors[myIdx].score;
      if (rankNum === 1 && myScore > 0) return 'Rank #1 • Top Educator';
      if (rankNum <= 3 && myScore > 0) return `Rank #${rankNum} • Senior Contributor`;
      return `Rank #${rankNum} • Contributor`;
    }
    return 'Contributor';
  } catch {
    return 'Contributor';
  }
}

