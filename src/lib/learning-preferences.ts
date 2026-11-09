export type InterfaceLanguage = 'en' | 'my';
export type StudyFocus = 'vocab' | 'quiz' | 'writing';
export interface LearningPreferences {
  language: InterfaceLanguage;
  focus: StudyFocus;
  minutes: number;
  onboarded: boolean;
}
export const DEFAULT_PREFERENCES: LearningPreferences = {
  language: 'en',
  focus: 'vocab',
  minutes: 5,
  onboarded: false,
};
export function parsePreferences(value: unknown): LearningPreferences {
  if (!value || typeof value !== 'object') return { ...DEFAULT_PREFERENCES };
  const input = value as Partial<LearningPreferences>;
  return {
    language: input.language === 'my' ? 'my' : 'en',
    focus: ['vocab', 'quiz', 'writing'].includes(input.focus || '') ? input.focus! : 'vocab',
    minutes: [5, 10, 15].includes(input.minutes || 0) ? input.minutes! : 5,
    onboarded: input.onboarded === true,
  };
}
const COPY = {
  goalDone: ['Daily goal reached', 'ရည်မှန်းချက် ပြည့်မီပါပြီ'],
  guestSyncHelp: [
    'Sign up to save drafts and bookmarks to your account.',
    'စာမူနှင့် စာညှပ်များကို အကောင့်တွင် သိမ်းရန် အကောင့် ဖွင့်ပါ။',
  ],
  tip: ["Today's writing word", 'ယနေ့ အရေးအသားသုံး ဝေါဟာရ'],
  viewLesson: ['View lesson', 'သင်ခန်းစာ ကြည့်ရန်'],
  shuffleTip: ['Show another word', 'အခြား စကားလုံး ပြရန်'],
  quizShort: ['Short steps · Resume any time', 'အဆင့်တိုများ · အချိန်မရွေး ဆက်ဖြေနိုင်သည်'],
  savedLocal: ['Saved on this device', 'ဤစက်တွင် သိမ်းထားပါသည်'],
  savedSynced: ['Synced with your account', 'အကောင့်နှင့် ချိတ်ဆက် သိမ်းပြီးပါပြီ'],
  savedSyncing: ['Syncing…', 'ချိတ်ဆက် သိမ်းနေသည်…'],
  savedPending: [
    'Saved on device · Waiting to sync',
    'စက်တွင် သိမ်းပြီး · ချိတ်ဆက်ရန် စောင့်နေသည်',
  ],
  savedSyncFailed: [
    'Cloud sync could not finish. Your saved items are on this device.',
    'အကောင့်နှင့် ချိတ်ဆက် မသိမ်းနိုင်ပါ။ စက်တွင် သိမ်းထားသော အရာများကို သုံးနိုင်သည်။',
  ],
  retrySync: ['Retry cloud sync', 'အကောင့်နှင့် ပြန်ချိတ်ဆက်ရန်'],
  step: ['Step', 'အဆင့်'],
  question: ['Question', 'မေးခွန်း'],
  passTarget: ['Passing target', 'အောင်မှတ်'],

  meaning: ['Meaning', 'အဓိပ္ပာယ်'],
  spoken: ['Everyday', 'အပြောစကား'],
  academic: ['Academic', 'အရေးအသားသုံး'],
  correct: ['Nice work!', 'ကောင်းပါသည်။'],
  keepLearning: ['Keep learning!', 'ဆက်လက် လေ့လာပါ။'],
  example: ['Example usage', 'အသုံးပြုပုံ ဥပမာ'],
  chooseTopic: ['Choose a lesson topic', 'သင်ခန်းစာ ခေါင်းစဉ် ရွေးပါ'],
  quizHelp: [
    'Start at the first step. Meet the passing score shown for each step to unlock the next.',
    'ပထမအဆင့်မှ စပါ။ အဆင့်တစ်ခုချင်း၏ သတ်မှတ်အောင်မှတ် ရရှိပါက နောက်အဆင့် ပွင့်မည်။',
  ],
  stepResult: ['Step result', 'အဆင့် ရလဒ်'],
  stepPassed: ['Step passed!', 'ဤအဆင့် အောင်မြင်ပါသည်။'],
  almostThere: ['Try again', 'ပြန်ကြိုးစားပါ'],
  stepsMap: ['Back to steps', 'အဆင့်များသို့ ပြန်ရန်'],
  replaceQuiz: ['Start a different quiz?', 'အခြား ဉာဏ်စမ်း စတင်မလား။'],
  replaceQuizHelp: [
    'This replaces your unfinished quiz session. Your completed step scores stay saved.',
    'လက်ရှိ မပြီးသေးသော ဉာဏ်စမ်းကို အစားထိုးမည်။ ပြီးဆုံးပြီး အဆင့်ရလဒ်များ မပျက်ပါ။',
  ],
  cancel: ['Cancel', 'မလုပ်တော့ပါ'],
  preferencesFailed: [
    'Could not save preferences. Please retry.',
    'စိတ်ကြိုက်ရွေးချယ်မှုများ မသိမ်းနိုင်ပါ။ ပြန်ကြိုးစားပါ။',
  ],
  preferencesLoadFailed: [
    'Previous preferences could not be loaded. Saving here replaces them.',
    'ယခင်ရွေးချယ်မှုများ မဖွင့်နိုင်ပါ။ ဤနေရာတွင် သိမ်းပါက အစားထိုးမည်။',
  ],
  bookmarkHint: [
    'Tap the bookmark on a word or pattern to find it here.',
    'စကားလုံး သို့မဟုတ် ပုံစံတစ်ခု၏ စာညှပ်ကို နှိပ်ပြီး ဤနေရာတွင် သိမ်းနိုင်သည်။',
  ],
  noDrafts: ['No drafts saved yet', 'စာမူ မသိမ်းရသေးပါ'],
  profileTab: ['Profile', 'ကိုယ်ရေး'],
  clearSearch: ['Clear search', 'ရှာဖွေမှု ရှင်းရန်'],
  home: ['Home', 'ပင်မ'],
  learn: ['Learn', 'သင်ယူရန်'],
  practice: ['Practice', 'လေ့ကျင့်ရန်'],
  saved: ['Saved', 'သိမ်းထားသည်'],
  profile: ['Profile', 'ကိုယ်ရေးအချက်အလက်'],
  welcome: ['Make your next step easier', 'နောက်တစ်ဆင့်ကို လွယ်ကူစွာ စတင်ပါ'],
  setup: ['Set up your learning', 'သင်ယူမှု စီစဉ်ရန်'],
  preferences: ['Learning preferences', 'သင်ယူမှု စိတ်ကြိုက်ရွေးချယ်ရန်'],
  language: ['Interface language', 'မျက်နှာပြင် ဘာသာစကား'],
  focus: ['What would you like to practice?', 'မည်သည့်အရာကို လေ့ကျင့်လိုပါသလဲ။'],
  minutes: ['Time for a short session', 'လေ့ကျင့်ချိန် ရွေးချယ်ရန်'],
  minutesUnit: ['minutes', 'မိနစ်'],
  start: ['Start learning', 'စတင်သင်ယူရန်'],
  skip: ['Maybe later', 'နောက်မှ စီစဉ်မည်'],
  close: ['Close', 'ပိတ်ရန်'],
  back: ['Back', 'နောက်သို့'],
  continueLearning: ['Continue learning', 'ဆက်လက် သင်ယူရန်'],
  continueWriting: ['Continue writing', 'ဆက်လက် ရေးသားရန်'],
  resumeQuiz: ['Resume your quiz', 'ဉာဏ်စမ်းကို ဆက်ဖြေရန်'],
  nextStep: ['Your next step', 'နောက်တစ်ဆင့်'],
  vocab: ['Vocabulary', 'ဝေါဟာရ'],
  patterns: ['Writing patterns', 'အရေးအသား ပုံစံများ'],
  writing: ['Writing', 'စာရေးခြင်း'],
  quiz: ['Quiz', 'ဉာဏ်စမ်း'],
  quickPractice: ['Quick practice', 'အမြန် လေ့ကျင့်ရန်'],
  loadingLessons: ['Opening lessons…', 'သင်ခန်းစာများ ဖွင့်နေသည်…'],
  updating: ['Updating lessons…', 'သင်ခန်းစာများ မွမ်းမံနေသည်…'],
  updateFailed: [
    'Could not update. Lessons on this device are still available.',
    'မွမ်းမံ၍ မရပါ။ စက်ထဲရှိ သင်ခန်းစာများကို ဆက်သုံးနိုင်ပါသည်။',
  ],
  starterLessons: [
    'Starter lessons · Available without a download',
    'အခြေခံ သင်ခန်းစာများ · ဒေါင်းလုဒ် မလိုပါ',
  ],
  availableLessons: ['Lessons saved on this device', 'ဤစက်ထဲတွင် သိမ်းထားသော သင်ခန်းစာများ'],
  retry: ['Retry update', 'ပြန်လည် မွမ်းမံရန်'],
  download: ['Download more lessons', 'သင်ခန်းစာများ ထပ်မံ ရယူရန်'],
  offlineHelp: [
    'Starter lessons work right away. Download more when connected; saved lessons and writing stay available without a connection. AI and Contributors submissions need a connection.',
    'အခြေခံ သင်ခန်းစာများကို ချက်ချင်း သုံးနိုင်သည်။ အင်တာနက် ရရှိချိန်တွင် ထပ်မံ ရယူနိုင်သည်။ သိမ်းထားသော သင်ခန်းစာနှင့် စာမူများကို အင်တာနက်မရှိဘဲ သုံးနိုင်သည်။ AI နှင့် Contributors ထံ ပေးပို့ရန် အင်တာနက် လိုအပ်သည်။',
  ],
  searchVocab: [
    'Search Korean, Myanmar or English',
    'ကိုရီးယား၊ မြန်မာ သို့မဟုတ် အင်္ဂလိပ်ဖြင့် ရှာရန်',
  ],
  searchPatterns: ['Search writing patterns', 'အရေးအသား ပုံစံများ ရှာရန်'],
  noMatches: ['No matching lessons', 'ကိုက်ညီသော သင်ခန်းစာ မတွေ့ပါ'],
  clearFilters: ['Clear search and filters', 'ရှာဖွေမှုနှင့် စစ်ထုတ်မှုများ ရှင်းရန်'],
  all: ['All', 'အားလုံး'],
  addBookmark: ['Save bookmark', 'စာညှပ် သိမ်းရန်'],
  removeBookmark: ['Remove bookmark', 'စာညှပ် ဖယ်ရှားရန်'],
  listen: ['Listen to pronunciation', 'အသံထွက် နားထောင်ရန်'],
  unavailableLesson: [
    'This lesson is unavailable. Choose another from Learn.',
    'ဤသင်ခန်းစာကို မရနိုင်ပါ။ သင်ယူရန် စာမျက်နှာမှ အခြားတစ်ခု ရွေးပါ။',
  ],
  dailyGoal: ['Daily goal', 'နေ့စဉ် ရည်မှန်းချက်'],
  streak: ['Day streak', 'ဆက်တိုက် သင်ယူရက်'],
  today: ['Today', 'ယနေ့'],
  guest: ['Guest mode', 'ဧည့်သည်အဖြစ် သုံးနေသည်'],
  signUp: ['Sign up', 'အကောင့် ဖွင့်ရန်'],
  collection: ['Your collection', 'သိမ်းထားသော အရာများ'],
  drafts: ['Drafts', 'စာမူများ'],
  learningSpace: ['My learning space', 'ကျွန်ုပ်၏ သင်ယူမှု'],
  editProfile: ['Edit profile', 'ကိုယ်ရေးအချက်အလက် ပြင်ရန်'],
  checkAnswer: ['Check answer', 'အဖြေ စစ်ရန်'],
  nextQuestion: ['Next question', 'နောက်မေးခွန်း'],
  seeResults: ['See results', 'ရလဒ် ကြည့်ရန်'],
  retryStep: ['Try this step again', 'ဤအဆင့်ကို ပြန်ဖြေရန်'],
  topics: ['Quiz topics', 'ဉာဏ်စမ်း ခေါင်းစဉ်များ'],
  quizChanged: [
    'This lesson changed. Start the step again to use the updated questions.',
    'သင်ခန်းစာ ပြောင်းလဲထားပါသည်။ မေးခွန်းအသစ်များဖြင့် အဆင့်ကို ပြန်စပါ။',
  ],
  progressFailed: [
    'Could not save quiz progress on this device. Please retry before leaving.',
    'ဤစက်တွင် ဉာဏ်စမ်း တိုးတက်မှုကို မသိမ်းနိုင်ပါ။ မထွက်မီ ပြန်ကြိုးစားပါ။',
  ],
} as const;
export type CopyKey = keyof typeof COPY;
export function translate(language: InterfaceLanguage, key: CopyKey) {
  return COPY[key][language === 'my' ? 1 : 0];
}
