import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { accountKey, setAccountItem } from '@/lib/account-storage';
import { createDraftId, isUuid } from '@/lib/draft-utils';

const CACHE_KEY = 'contributor_essay_reviews_v2';
export interface ContributorEssaySubmission {
  id: string;
  student_id?: string | null;
  student_name: string;
  question_type: 'Q53' | 'Q54';
  prompt_title: string;
  content: string;
  char_count: number;
  status: 'pending' | 'in_review' | 'reviewed';
  deliveryStatus?: 'queued' | 'sent' | 'local_only';
  score?: number | null;
  max_score: number;
  strengths?: string | null;
  improvements?: string | null;
  corrected_sample?: string | null;
  overall_comment?: string | null;
  reviewed_by?: string | null;
  reviewer_name?: string | null;
  reviewer_rank?: string | null;
  reviewed_at?: string | null;
  created_at: string;
}
const queues = new Map<string, Promise<unknown>>();
function serial<T>(userId: string | undefined, operation: () => Promise<T>): Promise<T> {
  const key = accountKey(CACHE_KEY, userId);
  const result = (queues.get(key) || Promise.resolve()).then(operation);
  queues.set(
    key,
    result.catch(() => {}),
  );
  return result;
}
async function readCache(userId?: string): Promise<ContributorEssaySubmission[]> {
  const raw = await AsyncStorage.getItem(accountKey(CACHE_KEY, userId));
  if (raw) return JSON.parse(raw);
  const legacy = await AsyncStorage.getItem(
    accountKey('vocabjip_teacher_essay_reviews_v1', userId),
  );
  const list: ContributorEssaySubmission[] = legacy ? JSON.parse(legacy) : [];
  // Never surface another account's cached submissions. Old local-only items require a new explicit submission.
  return list
    .filter((item) => (item.student_id || undefined) === userId)
    .map((item) => ({
      ...item,
      deliveryStatus: item.id.startsWith('local-') ? 'local_only' : 'sent',
    }));
}
async function writeCache(items: ContributorEssaySubmission[], userId?: string) {
  await setAccountItem(CACHE_KEY, JSON.stringify(items), userId);
}
async function deliver(
  item: ContributorEssaySubmission,
  userId?: string,
): Promise<ContributorEssaySubmission> {
  if (!userId || !isUuid(item.id)) return item;
  try {
    const { data: existing, error: lookupError } = await supabase
      .from('essay_submissions')
      .select('*')
      .eq('id', item.id)
      .eq('student_id', userId)
      .maybeSingle();
    if (lookupError) return item;
    if (existing) return { ...existing, deliveryStatus: 'sent' };
    const { data, error } = await supabase
      .from('essay_submissions')
      .insert({
        id: item.id,
        student_id: userId,
        student_name: item.student_name,
        question_type: item.question_type,
        prompt_title: item.prompt_title,
        content: item.content,
        char_count: item.char_count,
        status: 'pending',
        max_score: item.max_score,
      })
      .select()
      .single();
    if (!error && data) return { ...data, deliveryStatus: 'sent' };
  } catch {
    /* Keep the local copy queued. */
  }
  return item;
}
export const EssayReviewService = {
  getMySubmissions(userId?: string): Promise<ContributorEssaySubmission[]> {
    return serial(userId, async () => {
      let items = await readCache(userId);
      if (userId) {
        for (let index = 0; index < items.length; index++) {
          if (items[index].deliveryStatus === 'queued')
            items[index] = await deliver(items[index], userId);
        }
        try {
          const { data, error } = await supabase
            .from('essay_submissions')
            .select('*')
            .eq('student_id', userId)
            .order('created_at', { ascending: false })
            .limit(100);
          if (!error && data) {
            const map = new Map(items.map((item) => [item.id, item]));
            data.forEach((item) => map.set(item.id, { ...item, deliveryStatus: 'sent' }));
            items = [...map.values()];
          }
        } catch {
          /* Cached results remain available offline. */
        }
      }
      items.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
      await writeCache(items, userId);
      return items;
    });
  },
  submitEssayForContributorReview(params: {
    userId?: string;
    studentName?: string;
    questionType: 'Q53' | 'Q54';
    promptTopic: string;
    essayText: string;
  }): Promise<ContributorEssaySubmission> {
    return serial(params.userId, async () => {
      const content = params.essayText.trim();
      if (!content) throw new Error('Write your essay before submitting.');
      const item: ContributorEssaySubmission = {
        id: createDraftId(),
        student_id: params.userId || null,
        student_name: params.studentName || 'TOPIK Learner',
        question_type: params.questionType,
        prompt_title: params.promptTopic,
        content,
        char_count: content.length,
        status: 'pending',
        deliveryStatus: 'queued',
        max_score: params.questionType === 'Q53' ? 30 : 50,
        created_at: new Date().toISOString(),
      };
      const items = await readCache(params.userId);
      await writeCache([item, ...items], params.userId);
      const result = await deliver(item, params.userId);
      await writeCache([result, ...items], params.userId);
      return result;
    });
  },
};
