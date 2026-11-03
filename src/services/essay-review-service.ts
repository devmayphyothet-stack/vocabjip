import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const LOCAL_ESSAY_REVIEWS_KEY = 'vocabjip_teacher_essay_reviews_v1';

export interface TeacherEssaySubmission {
  id: string;
  student_id?: string | null;
  student_name: string;
  question_type: 'Q53' | 'Q54';
  prompt_title: string;
  content: string;
  char_count: number;
  status: 'pending' | 'in_review' | 'reviewed';
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

export const EssayReviewService = {
  async getMySubmissions(userId?: string): Promise<TeacherEssaySubmission[]> {
    let localItems: TeacherEssaySubmission[] = [];
    try {
      const raw = await AsyncStorage.getItem(LOCAL_ESSAY_REVIEWS_KEY);
      if (raw) {
        localItems = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed reading local essay reviews:', e);
    }

    let remoteItems: TeacherEssaySubmission[] = [];
    try {
      let query = supabase
        .from('essay_submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (userId) {
        // Show the student's own submissions plus public mentor-reviewed showcase submissions
        query = query.or(`student_id.eq.${userId},student_id.is.null`);
      }

      const { data, error } = await query;
      if (!error && data) {
        remoteItems = data as TeacherEssaySubmission[];
      }
    } catch (e) {
      // Fallback to local cache if table is not yet created or offline
    }

    // Merge remote and local by ID (prefer remote as it has latest teacher grading)
    const map = new Map<string, TeacherEssaySubmission>();
    for (const item of localItems) {
      map.set(item.id, item);
    }
    for (const item of remoteItems) {
      map.set(item.id, item);
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  async submitEssayForTeacherReview(params: {
    userId?: string;
    studentName?: string;
    questionType: 'Q53' | 'Q54';
    promptTopic: string;
    essayText: string;
  }): Promise<TeacherEssaySubmission> {
    const maxScore = params.questionType === 'Q53' ? 30 : 50;
    const cleanText = params.essayText.trim();
    const newLocalSubmission: TeacherEssaySubmission = {
      id: `local-sub-${Date.now()}`,
      student_id: params.userId || null,
      student_name: params.studentName || 'TOPIK Learner',
      question_type: params.questionType,
      prompt_title: params.promptTopic,
      content: cleanText,
      char_count: cleanText.length,
      status: 'pending',
      max_score: maxScore,
      created_at: new Date().toISOString(),
    };

    // Try inserting into Supabase cloud first
    if (params.userId) {
      try {
        const { data, error } = await supabase
          .from('essay_submissions')
          .insert({
            student_id: params.userId,
            student_name: params.studentName || 'TOPIK Learner',
            question_type: params.questionType,
            prompt_title: params.promptTopic,
            content: cleanText,
            char_count: cleanText.length,
            status: 'pending',
            max_score: maxScore,
          })
          .select()
          .single();

        if (!error && data) {
          await this.saveToLocalCache(data as TeacherEssaySubmission);
          return data as TeacherEssaySubmission;
        }
      } catch (e) {
        console.warn('Cloud essay submission fallback to local:', e);
      }
    }

    await this.saveToLocalCache(newLocalSubmission);
    return newLocalSubmission;
  },

  async saveToLocalCache(submission: TeacherEssaySubmission): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(LOCAL_ESSAY_REVIEWS_KEY);
      const list: TeacherEssaySubmission[] = raw ? JSON.parse(raw) : [];
      const filtered = list.filter((item) => item.id !== submission.id);
      const updated = [submission, ...filtered];
      await AsyncStorage.setItem(LOCAL_ESSAY_REVIEWS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving local essay submission:', e);
    }
  },
};
