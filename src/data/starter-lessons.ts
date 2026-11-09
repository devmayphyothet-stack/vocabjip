import type { VocabItem } from '@/data/vocab-data';
import type { PatternItem } from '@/data/patterns-data';
import type { QuizTopicItem } from '@/data/quiz-data';
import type { EssayPromptItem } from '@/services/curriculum-sync-service';

// Built-in introductory examples, not official exam questions or downloaded submissions.
export const STARTER_VOCABS: VocabItem[] = [
  {
    id: 'starter-therefore',
    spoken: '그래서',
    written: '따라서',
    pronunciation: 'tta-ra-seo',
    category: 'Cause & Effect',
    myanmarMeaning: 'ထို့ကြောင့်',
    englishMeaning: 'Therefore; as a result',
    usageTip: 'အကြောင်းနှင့် အကျိုးဆက်ကို ဆက်စပ်ရာတွင် သုံးနိုင်သည်။',
    exampleSentence: {
      korean: '인터넷 사용이 늘었다. 따라서 정보 보호가 중요해졌다.',
      myanmar: 'အင်တာနက် အသုံးပြုမှု တိုးလာသည်။ ထို့ကြောင့် အချက်အလက် ကာကွယ်ရေး အရေးကြီးလာသည်။',
    },
    authorName: 'VocabJip · Starter lesson',
  },
  {
    id: 'starter-however',
    spoken: '근데',
    written: '그러나',
    pronunciation: 'geu-reo-na',
    category: 'Contrast',
    myanmarMeaning: 'သို့သော်',
    englishMeaning: 'However',
    usageTip: 'ဆန့်ကျင်ဘက် အချက်နှစ်ခုကို ဆက်စပ်ရာတွင် သုံးနိုင်သည်။',
    exampleSentence: {
      korean: '기술은 발전했다. 그러나 새로운 문제도 생겼다.',
      myanmar: 'နည်းပညာ တိုးတက်လာသည်။ သို့သော် ပြဿနာအသစ်များလည်း ဖြစ်ပေါ်လာသည်။',
    },
    authorName: 'VocabJip · Starter lesson',
  },
  {
    id: 'starter-increase',
    spoken: '늘다',
    written: '증가하다',
    pronunciation: 'jeung-ga-ha-da',
    category: 'General',
    myanmarMeaning: 'တိုးလာသည်',
    englishMeaning: 'To increase',
    usageTip: 'အရေအတွက် သို့မဟုတ် ရာခိုင်နှုန်း တိုးလာမှုကို ဖော်ပြနိုင်သည်။',
    exampleSentence: {
      korean: '도서관 이용자 수가 증가했다.',
      myanmar: 'စာကြည့်တိုက် အသုံးပြုသူ အရေအတွက် တိုးလာသည်။',
    },
    authorName: 'VocabJip · Starter lesson',
  },
];
export const STARTER_PATTERNS: PatternItem[] = [
  {
    id: 'starter-pattern-trend',
    questionNumber: 'Q53',
    title: 'Describe an increase',
    myanmarTitle: 'တိုးလာမှုကို ဖော်ပြခြင်း',
    description: 'Use a clear starting value and ending value.',
    patternFormula: '[수치]에서 [수치]로 증가했다.',
    exampleKorean: '이용률은 20%에서 30%로 증가했다.',
    exampleMyanmar: 'အသုံးပြုမှုနှုန်းသည် ၂၀ ရာခိုင်နှုန်းမှ ၃၀ ရာခိုင်နှုန်းသို့ တိုးလာသည်။',
    keyPhrases: ['~에서 ~로', '증가했다'],
    authorName: 'VocabJip · Starter lesson',
  },
  {
    id: 'starter-pattern-opinion',
    questionNumber: 'Q54',
    title: 'Give a reason',
    myanmarTitle: 'အကြောင်းပြချက် ဖော်ပြခြင်း',
    description: 'Connect an opinion with a supporting reason.',
    patternFormula: '그 이유는 [이유]기 때문이다.',
    exampleKorean: '독서는 중요하다. 그 이유는 다양한 지식을 얻을 수 있기 때문이다.',
    exampleMyanmar:
      'စာဖတ်ခြင်းသည် အရေးကြီးသည်။ အကြောင်းမှာ အသိပညာအမျိုးမျိုး ရရှိနိုင်သောကြောင့် ဖြစ်သည်။',
    keyPhrases: ['그 이유는', '~기 때문이다'],
    authorName: 'VocabJip · Starter lesson',
  },
];
export const STARTER_QUIZ_TOPICS: QuizTopicItem[] = [
  {
    id: 'starter-connectors',
    title: 'Your first writing words',
    myanmarTitle: 'အခြေခံ အရေးအသားသုံး စကားလုံးများ',
    category: 'General',
    description: 'Five introductory questions. Available without a download.',
    authorName: 'VocabJip',
    authorRank: 'Starter lesson',
    steps: [
      {
        id: 'starter-connectors-1',
        topicId: 'starter-connectors',
        stepNumber: 1,
        title: 'Connect ideas',
        passingScore: 3,
        authorName: 'VocabJip',
        authorRank: 'Starter lesson',
        questions: [
          {
            id: 1,
            spokenWord: '그래서',
            questionText: 'Which word means “therefore”?',
            myanmarQuestionText: '“ထို့ကြောင့်” ဟု အဓိပ္ပာယ်ရသော စကားလုံးကို ရွေးပါ။',
            englishExplanation: '따라서 means therefore and connects a cause to its result.',
            options: ['따라서', '그러나', '감소하다', '학교'],
            correctIndex: 0,
            explanation: '따라서 သည် ထို့ကြောင့် ဟု အဓိပ္ပာယ်ရသည်။',
            exampleSentence: '비가 왔다. 따라서 행사가 취소되었다.',
          },
          {
            id: 2,
            spokenWord: '근데',
            questionText: 'Which word introduces a contrast?',
            myanmarQuestionText: 'ဆန့်ကျင်ဘက် အချက်ကို ဆက်စပ်သော စကားလုံးကို ရွေးပါ။',
            englishExplanation: '그러나 means however and introduces a contrast.',
            options: ['증가하다', '그러나', '학생', '매일'],
            correctIndex: 1,
            explanation: '그러나 သည် သို့သော် ဟု အဓိပ္ပာယ်ရပြီး ဆန့်ကျင်ဘက် အချက်ကို ဆက်စပ်သည်။',
            exampleSentence: '가격은 비싸다. 그러나 품질은 좋다.',
          },
          {
            id: 3,
            spokenWord: '늘다',
            questionText: 'Which word means “to increase”?',
            myanmarQuestionText: '“တိုးလာသည်” ဟု အဓိပ္ပာယ်ရသော စကားလုံးကို ရွေးပါ။',
            englishExplanation: '증가하다 describes an increase in a quantity.',
            options: ['감소하다', '읽다', '증가하다', '먹다'],
            correctIndex: 2,
            explanation: '증가하다 သည် အရေအတွက် တိုးလာသည် ဟု ဆိုလိုသည်။',
            exampleSentence: '이용자 수가 증가했다.',
          },
          {
            id: 4,
            spokenWord: '줄다',
            questionText: 'Which word means “to decrease”?',
            myanmarQuestionText: '“လျော့ကျလာသည်” ဟု အဓိပ္ပာယ်ရသော စကားလုံးကို ရွေးပါ။',
            englishExplanation: '감소하다 describes a decrease in a quantity.',
            options: ['감소하다', '따라서', '그러나', '증가하다'],
            correctIndex: 0,
            explanation: '감소하다 သည် အရေအတွက် လျော့ကျလာသည် ဟု ဆိုလိုသည်။',
            exampleSentence: '자동차 이용이 감소했다.',
          },
          {
            id: 5,
            spokenWord: '이유',
            questionText: 'Which expression gives a reason?',
            myanmarQuestionText: 'အကြောင်းပြချက် ဖော်ပြသော စကားစုကို ရွေးပါ။',
            englishExplanation: '그 이유는 introduces the reason for a statement.',
            options: ['그러나', '그 이유는', '예를 들어', '반면에'],
            correctIndex: 1,
            explanation: '그 이유는 သည် အကြောင်းပြချက် စတင်ဖော်ပြရာတွင် သုံးသည်။',
            exampleSentence: '독서는 중요하다. 그 이유는 지식을 얻을 수 있기 때문이다.',
          },
        ],
      },
    ],
  },
];
export const STARTER_PROMPTS: EssayPromptItem[] = [
  {
    id: 'starter-writing-53',
    type: 'Q53',
    title: 'Library usage · Starter practice',
    promptText:
      'Practice describing these example figures: library usage was 20% in 2020 and 30% in 2024. Describe the change without inventing a cause.',
    subQuestions: ['What changed?', 'What are the starting and ending values?'],
  },
  {
    id: 'starter-writing-54',
    type: 'Q54',
    title: 'Why reading matters · Starter practice',
    promptText:
      'Explain why reading is useful. Give one benefit, one example, and a short conclusion.',
    subQuestions: [
      'What is one benefit?',
      'What example supports your point?',
      'What is your conclusion?',
    ],
  },
];
export function mergeLessons<T extends { id: string }>(starter: T[], downloaded: T[]): T[] {
  const downloadedIds = new Set(downloaded.map((item) => item.id));
  return [
    ...new Map(
      [...downloaded, ...starter.filter((item) => !downloadedIds.has(item.id))].map((item) => [
        item.id,
        item,
      ]),
    ).values(),
  ];
}
