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

const SAMPLE_GRADED_SUBMISSION: TeacherEssaySubmission = {
  id: 'sample-graded-q53-1',
  student_name: 'TOPIK Learner (Demo)',
  question_type: 'Q53',
  prompt_title: '인터넷 이용 현황 (Q53)',
  content:
    '인터넷 사용 통계에 따르면 2020년 65%에서 2024년 85%로 크게 증가하였다. 이러한 변화의 원인으로는 스마트폰 보급 확대를 들 수 있다. 앞으로도 이용률은 계속 높아질 것으로 전망된다.',
  char_count: 112,
  status: 'reviewed',
  score: 26,
  max_score: 30,
  strengths:
    'ကိန်းဂဏန်း အပြောင်းအလဲ (65% -> 85%) ကို ~에 따르면, ~로 크게 증가하였다 သုံးပြီး တိကျစွာ ဖော်ပြနိုင်ပါသည်။ အကြောင်းရင်းပြ 패턴 (~을/를 들 수 있다) နှင့် ခန့်မှန်းချက် (~(으)ㄹ 것으로 전망된다) သုံးထားပုံ အလွန်ကောင်းမွန်ပါသည်။',
  improvements:
    'စာလုံးရေ 200–300 ပြည့်မီစေရန် အသက်အရွယ်အလိုက် သို့မဟုတ် အသုံးပြုသည့် ရည်ရွယ်ချက်အလိုက် နှိုင်းယှဉ်ချက် (-(으)ㄴ 반면) တစ်ကြောင်းခန့် ထပ်မံဖြည့်စွက်သင့်ပါသည်။',
  corrected_sample:
    '조사 결과에 따르면 인터넷 이용률은 2020년 65%에서 2024년 85%로 지난 4년간 20%p나 급증하였다. 이러한 변화의 주요 원인으로는 스마트폰 보급의 확대와 비대면 서비스의 활성화를 꼽을 수 있다. 이러한 추세가 지속된다면 향후 인터넷 이용률은 더욱 증가할 것으로 전망된다.',
  overall_comment:
    'အခြေခံ Q53 ဖွဲ့စည်းပုံ (Introduction -> Data Trend -> Cause -> Outlook) ကို ကောင်းစွာ နားလည်ထားပါတယ်။ ပြင်ဆင်ပေးထားတဲ့ Model Rewrite ထဲက 급증하였다 (အလျင်အမြန်မြင့်တက်ခဲ့သည်) နဲ့ 꼽을 수 있다 အသုံးအနှုန်းတွေကို မှတ်သားပြီး နောက်တစ်ပုဒ်မှာ စာလုံးရေ 200 ကျော်အောင် ဆက်လေ့ကျင့်ကြည့်ပါနော်!',
  reviewer_name: 'Sayar Min',
  reviewer_rank: 'Rank #1 • Top Educator',
  reviewed_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
  created_at: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
};

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
        query = query.eq('student_id', userId);
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

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Always include the sample graded submission so learners can see how Teacher Review works
    if (!merged.some((m) => m.id === SAMPLE_GRADED_SUBMISSION.id)) {
      merged.push(SAMPLE_GRADED_SUBMISSION);
    }

    return merged;
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
