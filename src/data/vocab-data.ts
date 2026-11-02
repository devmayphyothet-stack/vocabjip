export interface VocabItem {
  id: string;
  spoken: string; // Everyday spoken Korean
  written: string; // Academic written Korean for TOPIK
  pronunciation: string;
  category: 'Cause & Effect' | 'Contrast' | 'Society' | 'Education' | 'Economy' | 'General';
  myanmarMeaning: string; // Myanmar explanation
  englishMeaning: string;
  usageTip: string; // TOPIK writing rule/tip
  exampleSentence: {
    korean: string;
    myanmar: string;
  };
  isSaved?: boolean;
}

export const VOCAB_DATA: VocabItem[] = [
  {
    id: 'v-1',
    spoken: '그래서',
    written: '따라서',
    pronunciation: 'tta-ra-seo',
    category: 'Cause & Effect',
    myanmarMeaning: 'ထို့ကြောင့် / ရလဒ်အနေဖြင့်',
    englishMeaning: 'Therefore / As a result',
    usageTip: 'TOPIK စာစီစာကုံး (Q53/54) တွင် "그래서" အစား "따라서" သို့မဟုတ် "그러므로" ကိုသာ အသုံးပြုရပါမည်။',
    exampleSentence: {
      korean: '인터넷 사용자가 급증했다. 따라서 정보 보안이 더욱 중요해졌다.',
      myanmar: 'အင်တာနက်အသုံးပြုသူ ရုတ်တရက်များပြားလာခဲ့သည်။ ထို့ကြောင့် အချက်အလက်လုံခြုံရေးသည် ပို၍အရေးပါလာခဲ့သည်။',
    },
  },
  {
    id: 'v-2',
    spoken: '근데 / 하지만',
    written: '그러나 / 반면에',
    pronunciation: 'geu-reo-na',
    category: 'Contrast',
    myanmarMeaning: 'သို့သော်လည်း / အခြားတစ်ဖက်တွင်မူ',
    englishMeaning: 'However / On the other hand',
    usageTip: 'ဆန့်ကျင်ဘက် အခြေအနေကို ဖော်ပြရာတွင် "근데" ကို စာရေးရာတွင် လုံးဝမသုံးဘဲ "그러나" သို့မဟုတ် "반면에" ကို သုံးပါ။',
    exampleSentence: {
      korean: '스마트폰은 편리하다. 그러나 과도한 사용은 건강을 해칠 수 있다.',
      myanmar: 'စမတ်ဖုန်းသည် အဆင်ပြေသည်။ သို့သော်လည်း အလွန်အကျွံသုံးစွဲခြင်းသည် ကျန်းမာရေးကို ထိခိုက်စေနိုင်သည်။',
    },
  },
  {
    id: 'v-3',
    spoken: '진짜 / 너무',
    written: '매우 / 대단히',
    pronunciation: 'mae-u',
    category: 'General',
    myanmarMeaning: 'အလွန် / အလွန်ပင်',
    englishMeaning: 'Very / Extremely',
    usageTip: 'အလေးအနက်ထား ဖော်ပြရာတွင် "너무" (negative အဓိပ္ပာယ်ပါနိုင်) အစား "매우" သို့မဟုတ် "상당히" ကို အသုံးပြုပါ။',
    exampleSentence: {
      korean: '이 문제는 사회적으로 매우 심각한 영향을 미친다.',
      myanmar: 'ဤပြဿနာသည် လူမှုရေးအရ အလွန်ဆိုးရွားသော သက်ရောက်မှုကို ဖြစ်စေသည်။',
    },
  },
  {
    id: 'v-4',
    spoken: '밥을 먹다',
    written: '식사를 하다',
    pronunciation: 'sik-sa-reul ha-da',
    category: 'General',
    myanmarMeaning: 'အစားအသောက် စားသုံးသည်',
    englishMeaning: 'To dine / have a meal',
    usageTip: 'တရားဝင် စာပေအရေးအသားတွင် "밥을 먹다" အစား ယဉ်ကျေးသည့် "식사를 하다" ကို အသုံးပြုသည်။',
    exampleSentence: {
      korean: '현대인들은 불규칙하게 식사를 하는 경향이 있다.',
      myanmar: 'ခေတ်သစ်လူသားများသည် အစားအသောက်ကို မမှန်မကန် စားသုံးသည့် အလေ့အထရှိသည်။',
    },
  },
  {
    id: 'v-5',
    spoken: '생각하다',
    written: '주장하다 / 여기다',
    pronunciation: 'ju-jang-ha-da',
    category: 'Education',
    myanmarMeaning: 'အကြံပြုသည် / သဘောထားသည်',
    englishMeaning: 'To claim / maintain an opinion',
    usageTip: 'စာစီစာကုံး၏ မိမိအမြင်ကို ဖော်ပြရာတွင် "생각하다" အစား "주장하는 바이다" သို့မဟုတ် "~라고 여겨진다" ကို သုံးပါ။',
    exampleSentence: {
      korean: '조기 교육보다 인성 교육이 더 중요하다고 주장한다.',
      myanmar: 'အစောပိုင်းပညာရေးထက် စာရိတ္တပညာရေးက ပို၍အရေးကြီးသည်ဟု အခိုင်အမာဆိုလိုသည်။',
    },
  },
  {
    id: 'v-6',
    spoken: '늘어나다',
    written: '증가하다 / 급증하다',
    pronunciation: 'jeung-ga-ha-da',
    category: 'Economy',
    myanmarMeaning: 'တိုးပွားလာသည် / ရုတ်တရက်တိုးလာသည်',
    englishMeaning: 'To increase / surge',
    usageTip: 'Q53 Graph ပုစ္ဆာများတွင် ဂဏန်းများ တိုးတက်ပြောင်းလဲမှုကို ဖော်ပြရန် "증가하다 / 급증세를 보이다" ကို မဖြစ်မနေ သုံးရသည်။',
    exampleSentence: {
      korean: '1인 가구의 비율이 지난 10년간 크게 증가하였다.',
      myanmar: 'တစ်ဦးတည်းနေထိုင်သော အိမ်ထောင်စုအချိုးအစားသည် လွန်ခဲ့သော ၁၀ နှစ်အတွင်း သိသိသာသာ တိုးပွားလာခဲ့သည်။',
    },
  },
  {
    id: 'v-7',
    spoken: '줄어들다',
    written: '감소하다 / 하락하다',
    pronunciation: 'gam-so-ha-da',
    category: 'Economy',
    myanmarMeaning: 'လျော့နည်းကျဆင်းသွားသည်',
    englishMeaning: 'To decrease / decline',
    usageTip: 'Q53 တွင် ရာခိုင်နှုန်း လျော့ကျမှုကို "감소세를 나타냈다" ဟု အဆင့်မြင့်စွာ ရေးသားနိုင်သည်။',
    exampleSentence: {
      korean: '출산율은 지속적으로 감소하는 추세를 보이고 있다.',
      myanmar: 'ကလေးမွေးဖွားနှုန်းသည် စဉ်ဆက်မပြတ် လျော့ကျနေသည့် လားရာကို ပြသနေသည်။',
    },
  },
  {
    id: 'v-8',
    spoken: '바꾸다',
    written: '변화시키다 / 전환하다',
    pronunciation: 'byeon-hwa-si-ki-da',
    category: 'Society',
    myanmarMeaning: 'ပြောင်းလဲစေသည် / အသွင်ပြောင်းသည်',
    englishMeaning: 'To change / transform',
    usageTip: 'လူမှုအဖွဲ့အစည်းဆိုင်ရာ ဆောင်းပါးများတွင် "바꾸다" အစား "사회적 인식의 전환이 요구된다" ဟု ရေးသားလေ့ရှိသည်။',
    exampleSentence: {
      korean: '기술 혁신은 우리의 생활 방식을 완전히 변화시켰다.',
      myanmar: 'နည်းပညာ ဆန်းသစ်တီထွင်မှုသည် ကျွန်ုပ်တို့၏ လူနေမှုပုံစံကို လုံးဝ ပြောင်းလဲစေခဲ့သည်။',
    },
  },
];

