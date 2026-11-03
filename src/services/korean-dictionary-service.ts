import AsyncStorage from '@react-native-async-storage/async-storage';
import { PATTERNS_DATA } from '@/data/patterns-data';
import { VOCAB_DATA } from '@/data/vocab-data';
import { supabase } from '@/lib/supabase';
import { callGeminiGenerateContent } from '@/services/gemini-service';

export interface WordDefinition {
  korean: string;
  rootWord: string;
  romaja: string;
  myanmarMeaning: string;
  englishMeaning: string;
  vocabId?: string;
  spokenEquivalent?: string;
  writtenEquivalent?: string;
  topikTip?: string;
  category?: string;
  isAiGenerated?: boolean;
  isUnindexed?: boolean;
}

const LOCAL_VOCAB_LENS_CACHE_KEY = '@vocabjip/vocab_lens_ai_cache_v1';
const memoryLensCache: Record<string, WordDefinition> = {};

// Built-in high-yield TOPIK II vocabulary dictionary
const TOPIK_ESSAY_DICTIONARY: Record<string, Omit<WordDefinition, 'korean'>> = {
  평생: {
    rootWord: '평생 (平生)',
    romaja: 'pyeong-saeng',
    myanmarMeaning: 'တစ်သက်တာလုံး / တစ်ဘဝလုံး',
    englishMeaning: 'Lifetime / Entire life',
    topikTip: '평생 교육 (တစ်သက်တာပညာသင်ယူမှု) အသုံးအဖြစ် TOPIK II တွင် အမေးများသည်။',
    category: 'Education',
  },
  교육: {
    rootWord: '교육 (敎育)',
    romaja: 'gyo-yuk',
    myanmarMeaning: 'ပညာရေး / လေ့ကျင့်သင်ကြားမှု',
    englishMeaning: 'Education / Training',
    category: 'Education',
  },
  대두: {
    rootWord: '대두되다 (擡頭)',
    romaja: 'dae-du-doe-da',
    myanmarMeaning: 'ပေါ်ပေါက်လာသည် / အရေးပါအရာရောက်လာသည်',
    englishMeaning: 'To emerge / rise / come to the fore',
    spokenEquivalent: '나타나다 / 생기다',
    writtenEquivalent: '대두되다',
    topikTip: 'လူမှုရေးပြဿနာ သို့မဟုတ် လိုအပ်ချက်များ ပေါ်ပေါက်လာခြင်းကို ရေးသားရာတွင် သုံးသည်။',
    category: 'Society',
  },
  좌우: {
    rootWord: '좌우하다 (左右)',
    romaja: 'jwa-u-ha-da',
    myanmarMeaning: 'လွှမ်းမိုးသည် / အဆုံးအဖြတ်ပေးသည်',
    englishMeaning: 'To determine / dominate / influence',
    spokenEquivalent: '영향을 주다',
    writtenEquivalent: '좌우하다',
    topikTip: 'အဓိက အဆုံးအဖြတ်ပေးသော အချက်ကို ဖော်ပြရာတွင် သုံးသည်။',
    category: 'Society',
  },
  급변: {
    rootWord: '급변하다 (急變)',
    romaja: 'geup-byeon-ha-da',
    myanmarMeaning: 'အလျင်အမြန် ပြောင်းလဲသည်',
    englishMeaning: 'To change rapidly / sudden shift',
    spokenEquivalent: '빨리 바뀌다',
    writtenEquivalent: '급변하다',
    category: 'Society',
  },
  한계: {
    rootWord: '한계 (限界)',
    romaja: 'han-gye',
    myanmarMeaning: 'ကန့်သတ်ချက် / အကန့်အသတ်',
    englishMeaning: 'Limit / Boundary / Limitation',
    topikTip: '한계가 있다 (ကန့်သတ်ချက်ရှိသည်) သို့မဟုတ် 한계에 부딪히다 ဟု တွဲသုံးသည်။',
    category: 'Society',
  },
  발전: {
    rootWord: '발전하다 (發展)',
    romaja: 'bal-jeon-ha-da',
    myanmarMeaning: 'တိုးတက်ဖွံ့ဖြိုးသည်',
    englishMeaning: 'To develop / advance / progress',
    spokenEquivalent: '더 좋아지다',
    writtenEquivalent: '발전하다',
    category: 'Economy',
  },
  경쟁력: {
    rootWord: '경쟁력 (競爭力)',
    romaja: 'gyeong-jaeng-ryeok',
    myanmarMeaning: 'ယှဉ်ပြိုင်နိုင်စွမ်း',
    englishMeaning: 'Competitiveness / Competitive edge',
    category: 'Economy',
  },
  국가: {
    rootWord: '국가 (國家)',
    romaja: 'guk-ga',
    myanmarMeaning: 'နိုင်ငံ / တိုင်းပြည်',
    englishMeaning: 'Nation / State / Country',
    spokenEquivalent: '나라',
    writtenEquivalent: '국가',
    topikTip: 'TOPIK II စာစီစာကုံးများတွင် စကားပြောအသုံး "나라" အစား စာသုံး "국가" ကို အသုံးပြုရပါမည်။',
    category: 'Society',
  },
  현대: {
    rootWord: '현대 (現代)',
    romaja: 'hyeon-dae',
    myanmarMeaning: 'မျက်မှောက်ခေတ် / ယခုခေတ်ကာလ',
    englishMeaning: 'Modern times / Contemporary era',
    spokenEquivalent: '요즘 / 지금 시대',
    writtenEquivalent: '현대 사회',
    category: 'Society',
  },
  사회: {
    rootWord: '사회 (社會)',
    romaja: 'sa-hoe',
    myanmarMeaning: 'လူ့ဘောင် / လူမှုအဖွဲ့အစည်း',
    englishMeaning: 'Society / Community',
    category: 'Society',
  },
  개인: {
    rootWord: '개인 (個人)',
    romaja: 'gae-in',
    myanmarMeaning: 'တစ်ဦးချင်း / ပုဂ္ဂိုလ်',
    englishMeaning: 'Individual / Person',
    category: 'General',
  },
  중요: {
    rootWord: '중요하다 (重要)',
    romaja: 'jung-yo-ha-da',
    myanmarMeaning: 'အရေးကြီးသော / အရေးပါသော',
    englishMeaning: 'Important / Significant',
    category: 'General',
  },
  기술: {
    rootWord: '기술 (技術)',
    romaja: 'gi-sul',
    myanmarMeaning: 'နည်းပညာ / နည်းစနစ်',
    englishMeaning: 'Technology / Technique / Skill',
    category: 'Technology',
  },
  속도: {
    rootWord: '속도 (速度)',
    romaja: 'sok-do',
    myanmarMeaning: 'အရှိန် / အမြန်နှုန်း',
    englishMeaning: 'Speed / Pace / Velocity',
    category: 'General',
  },
  과거: {
    rootWord: '과거 (過去)',
    romaja: 'gwa-geo',
    myanmarMeaning: 'အတိတ်ကာလ / ယခင်အချိန်',
    englishMeaning: 'Past / History',
    spokenEquivalent: '옛날 / 예전',
    writtenEquivalent: '과거',
    category: 'General',
  },
  지식: {
    rootWord: '지식 (知識)',
    romaja: 'ji-sik',
    myanmarMeaning: 'အသိပညာ / ဗဟုသုတ',
    englishMeaning: 'Knowledge / Information',
    topikTip: '지식을 습득하다 (အသိပညာကို ဆည်းပူးသည်) ဟု အသုံးများသည်။',
    category: 'Education',
  },
  배움: {
    rootWord: '배우다',
    romaja: 'bae-um',
    myanmarMeaning: 'သင်ယူခြင်း / လေ့လာဆည်းပူးခြင်း',
    englishMeaning: 'Learning / Studying',
    category: 'Education',
  },
  시대: {
    rootWord: '시대 (時代)',
    romaja: 'si-dae',
    myanmarMeaning: 'ခေတ်ကာလ / ခေတ်',
    englishMeaning: 'Era / Age / Period',
    category: 'Society',
  },
  미래: {
    rootWord: '미래 (未來)',
    romaja: 'mi-rae',
    myanmarMeaning: 'အနာဂတ်ကာလ / နောင်ကာလ',
    englishMeaning: 'Future',
    category: 'General',
  },
  인간: {
    rootWord: '인간 (人間)',
    romaja: 'in-gan',
    myanmarMeaning: 'လူသား / လူ',
    englishMeaning: 'Human / Human being',
    category: 'General',
  },
  시야: {
    rootWord: '시야 (視野)',
    romaja: 'si-ya',
    myanmarMeaning: 'အမြင် / အမြင်မိုးကုတ်စက်ဝိုင်း',
    englishMeaning: 'Perspective / Horizon / Field of vision',
    topikTip: '시야를 넓히다 (အမြင်ကို ကျယ်ပြန့်စေသည်) ဟု တွဲသုံးသည်။',
    category: 'Education',
  },
  설계: {
    rootWord: '설계하다 (設計)',
    romaja: 'seol-gye-ha-da',
    myanmarMeaning: 'အစီအစဉ်ချမှတ်သည် / ပုံစံရေးဆွဲသည်',
    englishMeaning: 'To design / plan / architect',
    category: 'General',
  },
  정부: {
    rootWord: '정부 (政府)',
    romaja: 'jeong-bu',
    myanmarMeaning: 'အစိုးရ',
    englishMeaning: 'Government',
    category: 'Society',
  },
  지원: {
    rootWord: '지원하다 (支援)',
    romaja: 'ji-won-ha-da',
    myanmarMeaning: 'ထောက်ပံ့ကူညီသည် / အကူအညီပေးသည်',
    englishMeaning: 'Support / Backing / Assistance',
    category: 'Society',
  },
  구축: {
    rootWord: '구축하다 (構築)',
    romaja: 'gu-chuk-ha-da',
    myanmarMeaning: 'စနစ်တကျ တည်ဆောက်သည် / စနစ်ထူထောင်သည်',
    englishMeaning: 'To build / establish / set up infrastructure',
    category: 'Society',
  },
  제도: {
    rootWord: '제도 (制度)',
    romaja: 'je-do',
    myanmarMeaning: 'စနစ် / မူဝါဒစနစ်',
    englishMeaning: 'System / Institution',
    category: 'Society',
  },
  조사: {
    rootWord: '조사하다 (調査)',
    romaja: 'jo-sa-ha-da',
    myanmarMeaning: 'စစ်တမ်းကောက်ယူသည် / စုံစမ်းစစ်ဆေးသည်',
    englishMeaning: 'To survey / investigate / examine',
    topikTip: 'Q53 ဇယားပုစ္ဆာ စာပိုဒ်အစတွင် အမြဲမပြတ် ပါဝင်လေ့ရှိသည်။',
    category: 'Statistics',
  },
  기관: {
    rootWord: '기관 (機關)',
    romaja: 'gi-gwan',
    myanmarMeaning: 'အဖွဲ့အစည်း / ဌာန',
    englishMeaning: 'Institution / Organization / Agency',
    category: 'Society',
  },
  통계: {
    rootWord: '통계 (統計)',
    romaja: 'tong-gye',
    myanmarMeaning: 'စာရင်းအင်း / ကိန်းဂဏန်းအချက်အလက်',
    englishMeaning: 'Statistics',
    category: 'Statistics',
  },
  분석: {
    rootWord: '분석하다 (分析)',
    romaja: 'bun-seok-ha-da',
    myanmarMeaning: 'ခွဲခြမ်းစိတ်ဖြာသည် / သုံးသပ်သည်',
    englishMeaning: 'To analyze / examine',
    category: 'Statistics',
  },
  요소: {
    rootWord: '요소 (要素)',
    romaja: 'yo-so',
    myanmarMeaning: 'အရေးပါသော အစိတ်အပိုင်း / အချက်အလက်',
    englishMeaning: 'Element / Factor / Component',
    category: 'General',
  },
  자아실현: {
    rootWord: '자아실현 (自我實現)',
    romaja: 'ja-a-sil-hyeon',
    myanmarMeaning: 'မိမိကိုယ်ကို အကောင်အထည်ဖော်ခြင်း / မိမိရည်မှန်းချက် ပြည့်မြောက်ခြင်း',
    englishMeaning: 'Self-actualization / Self-fulfillment',
    topikTip: 'ပုဂ္ဂိုလ်ရေးဆိုင်ရာ တိုးတက်မှု (Personal Growth) အကြောင်းရေးရာတွင် မရှိမဖြစ် စကားလုံးဖြစ်သည်။',
    category: 'Education',
  },
  성취감: {
    rootWord: '성취감 (成就感)',
    romaja: 'seong-chwi-gam',
    myanmarMeaning: 'အောင်မြင်ပြီးမြောက်မှု ခံစားချက် / ပီတိ',
    englishMeaning: 'Sense of accomplishment / achievement',
    topikTip: '성취감을 느끼다 (အောင်မြင်မှုခံစားချက်ကို ရရှိသည်) ဟု တွဲသုံးလေ့ရှိသည်။',
    category: 'Education',
  },
  고령화: {
    rootWord: '고령화 (高齡化)',
    romaja: 'go-ryeong-hwa',
    myanmarMeaning: 'သက်ကြီးရွယ်အို ဦးရေ များပြားလာခြင်း',
    englishMeaning: 'Aging society / Population aging',
    topikTip: 'Q53/Q54 လူမှုရေးပြဿနာ ပုစ္ဆာများတွင် အမေးအများဆုံး ခေါင်းစဉ်တစ်ခုဖြစ်သည်။',
    category: 'Society',
  },
  생산성: {
    rootWord: '생산성 (生産性)',
    romaja: 'saeng-san-seong',
    myanmarMeaning: 'ကုန်ထုတ်စွမ်းအား / ထုတ်လုပ်မှုစွမ်းရည်',
    englishMeaning: 'Productivity',
    category: 'Economy',
  },
  재교육: {
    rootWord: '재교육 (再敎育)',
    romaja: 'jae-gyo-yuk',
    myanmarMeaning: 'ပြန်လည်လေ့ကျင့်သင်ကြားပေးခြင်း',
    englishMeaning: 'Re-education / Retraining',
    category: 'Education',
  },
  병행: {
    rootWord: '병행되다 (竝行)',
    romaja: 'byeong-haeng-doe-da',
    myanmarMeaning: 'ယှဉ်တွဲဆောင်ရွက်သည် / တစ်ပြိုင်တည်းပြုလုပ်သည်',
    englishMeaning: 'To be conducted concurrently / go hand-in-hand',
    spokenEquivalent: '같이 하다 / 함께 하다',
    writtenEquivalent: '병행하다 / 병행되다',
    category: 'General',
  },
  따라서: {
    rootWord: '따라서',
    romaja: 'tta-ra-seo',
    myanmarMeaning: 'ထို့ကြောင့် / ရလဒ်အနေဖြင့်',
    englishMeaning: 'Therefore / Consequently',
    spokenEquivalent: '그래서',
    writtenEquivalent: '따라서 / 그러므로',
    topikTip: 'TOPIK II စာစီစာကုံးတွင် "그래서" အစား "따라서" သို့မဟုတ် "그러므로" ကိုသာ အသုံးပြုရပါမည်။',
    category: 'Cause & Effect',
  },
  그러나: {
    rootWord: '그러나',
    romaja: 'geu-reo-na',
    myanmarMeaning: 'သို့သော်လည်း / သို့ရာတွင်',
    englishMeaning: 'However / But',
    spokenEquivalent: '근데 / 하지만',
    writtenEquivalent: '그러나 / 반면에',
    category: 'Contrast',
  },
  반면에: {
    rootWord: '반면에',
    romaja: 'ban-myeon-e',
    myanmarMeaning: 'အခြားတစ်ဖက်တွင်မူ',
    englishMeaning: 'On the other hand',
    spokenEquivalent: '근데',
    writtenEquivalent: '반면에',
    category: 'Contrast',
  },
  불구하고: {
    rootWord: '불구하고',
    romaja: 'bul-gu-ha-go',
    myanmarMeaning: 'ဖြစ်လင့်ကစား / ဖြစ်သော်ငြားလည်း',
    englishMeaning: 'Despite / In spite of',
    topikTip: '~에도 불구하고 ပုံစံဖြင့် အဆင့်မြင့် ချိတ်ဆက်စကားစုအဖြစ် သုံးသည်။',
    category: 'Contrast',
  },
  증가: {
    rootWord: '증가하다 (增加)',
    romaja: 'jeung-ga-ha-da',
    myanmarMeaning: 'တိုးပွားလာသည် / မြင့်တက်လာသည်',
    englishMeaning: 'To increase / grow',
    spokenEquivalent: '늘어나다',
    writtenEquivalent: '증가하다 / 급증하다',
    category: 'Economy',
  },
  감소: {
    rootWord: '감소하다 (減少)',
    romaja: 'gam-so-ha-da',
    myanmarMeaning: 'လျော့နည်းကျဆင်းသွားသည်',
    englishMeaning: 'To decrease / diminish',
    spokenEquivalent: '줄어들다',
    writtenEquivalent: '감소하다 / 하락하다',
    category: 'Economy',
  },
  지속적: {
    rootWord: '지속적 (持續的)',
    romaja: 'ji-sok-jeok',
    myanmarMeaning: 'အစဉ်မပြတ် / စဉ်ဆက်မပြတ်',
    englishMeaning: 'Continuous / Sustained',
    spokenEquivalent: '계속',
    writtenEquivalent: '지속적으로',
    category: 'General',
  },
  필수적: {
    rootWord: '필수적 (必需的)',
    romaja: 'pil-su-jeok',
    myanmarMeaning: 'မဖြစ်မနေ လိုအပ်သော',
    englishMeaning: 'Essential / Indispensable',
    spokenEquivalent: '꼭 필요한',
    writtenEquivalent: '필수적이다',
    category: 'General',
  },
  것이다: {
    rootWord: '~(으)ㄹ 것이다',
    romaja: 'geot-i-da',
    myanmarMeaning: '~ဖြစ်ပေလိမ့်မည် / ~ရမည်ဖြစ်သည် (ခိုင်မာသော ကောက်ချက်ချမှုပြ စာသုံးအဆုံးသတ်)',
    englishMeaning: 'Will be / It is that ~ (Formal academic conclusion ending)',
    spokenEquivalent: '~거예요 / ~할 거예요',
    writtenEquivalent: '~(으)ㄹ 것이다 / ~는 것이다',
    topikTip: 'TOPIK II Q54 နိဂုံးချုပ်ဝါကျများတွင် ခိုင်မာသော အဆိုပြုချက် သို့မဟုတ် ခန့်မှန်းချက်ကို ဖော်ပြရာ၌ သုံးသည်။',
    category: 'General',
  },
  것: {
    rootWord: '것 (Dependent Noun)',
    romaja: 'geot',
    myanmarMeaning: 'အရာ / အချက် / ~ခြင်း (နာမ်စားဆက်စကားလုံး)',
    englishMeaning: 'Thing / Fact / ~ing (Nominalizer)',
    spokenEquivalent: '거',
    writtenEquivalent: '것 (~는 것 / ~(으)ㄹ 것)',
    topikTip: 'စာစီစာကုံး ရေးသားရာတွင် စကားပြောသုံး "거" အစား အမြဲတမ်း "것" ကိုသာ ရေးသားရပါမည်။',
    category: 'General',
  },
  수명: {
    rootWord: '수명 (壽命)',
    romaja: 'su-myeong',
    myanmarMeaning: 'သက်တမ်း / လူ့သက်တမ်း',
    englishMeaning: 'Lifespan / Life expectancy',
    topikTip: '평균 수명이 연장되다 (ပျမ်းမျှ လူ့သက်တမ်း ပိုရှည်လာသည်) ဟု တွဲသုံးလေ့ရှိသည်။',
    category: 'Society',
  },
  연장: {
    rootWord: '연장되다 (延長)',
    romaja: 'yeon-jang-doe-da',
    myanmarMeaning: 'သက်တမ်းတိုးလာသည် / ပိုမိုရှည်ကြာလာသည်',
    englishMeaning: 'To be extended / prolonged',
    spokenEquivalent: '길어지다 / 늘어나다',
    writtenEquivalent: '연장되다',
    category: 'Society',
  },
  습득: {
    rootWord: '습득하다 (習得)',
    romaja: 'seup-deuk-ha-da',
    myanmarMeaning: 'သင်ယူတတ်မြောက်သည် / ဆည်းပူးရရှိသည်',
    englishMeaning: 'To acquire / learn (knowledge or skills)',
    spokenEquivalent: '배우다 / 익히다',
    writtenEquivalent: '습득하다',
    topikTip: '지식이나 기술을 습득하다 (အသိပညာ သို့မဟုတ် နည်းပညာကို ဆည်းပူးသည်) ဟု သုံးသည်။',
    category: 'Education',
  },
  만족도: {
    rootWord: '만족도 (滿足度)',
    romaja: 'man-jok-do',
    myanmarMeaning: 'စိတ်ကျေနပ်မှု အတိုင်းအတာ',
    englishMeaning: 'Level of satisfaction',
    topikTip: '삶의 만족도를 높이다 (ဘဝနေထိုင်မှု စိတ်ကျေနပ်မှုကို မြှင့်တင်ပေးသည်) ဟု တွဲသုံးသည်။',
    category: 'Society',
  },
  주체적: {
    rootWord: '주체적 (主體的)',
    romaja: 'ju-che-jeok',
    myanmarMeaning: 'မိမိကိုယ်ပိုင် ဆုံးဖြတ်ချက်ဖြင့် ဦးဆောင်သော / ကိုယ်ပိုင်ရပ်တည်ချက်ရှိသော',
    englishMeaning: 'Proactive / Autonomous / Independent',
    writtenEquivalent: '주체적으로',
    category: 'Education',
  },
  차원: {
    rootWord: '차원 (次元)',
    romaja: 'cha-won',
    myanmarMeaning: 'အဆင့်အတန်း / ရှုထောင့် / ကဏ္ဍအလိုက်',
    englishMeaning: 'Level / Dimension / Perspective',
    topikTip: '개인적 차원 (တစ်ဦးချင်းအဆင့်) နှင့် 사회적·국가적 차원 (လူမှုရေး/နိုင်ငံတော်အဆင့်) ဟု ခွဲခြားသုံးသပ်ရာတွင် သုံးသည်။',
    category: 'Society',
  },
  대응: {
    rootWord: '대응하다 (對應)',
    romaja: 'dae-eung-ha-da',
    myanmarMeaning: 'ရင်ဆိုင်ဖြေရှင်းသည် / တုံ့ပြန်ဆောင်ရွက်သည်',
    englishMeaning: 'To respond to / cope with / address',
    spokenEquivalent: '맞서다 / 대처하다',
    writtenEquivalent: '대응하다',
    category: 'Society',
  },
  유지: {
    rootWord: '유지하다 (維持)',
    romaja: 'yu-ji-ha-da',
    myanmarMeaning: 'ထိန်းသိမ်းထားသည် / ဆက်လက်တည်တံ့စေသည်',
    englishMeaning: 'To maintain / preserve / keep',
    spokenEquivalent: '지키다 / 계속 이어가다',
    writtenEquivalent: '유지하다',
    category: 'General',
  },
};

/**
 * Remove Korean particles/conjugations to find the dictionary stem
 */
function cleanKoreanStem(rawWord: string): string {
  // Strip punctuation
  const clean = rawWord.replace(/[.,!?'"~()·]/g, '').trim();

  // Strip common Korean postpositions & verb endings
  const suffixes = [
    '뿐만 아니라', '뿐만아니라', '뿐만', '아니라',
    '에서도', '에서', '에는', '에게', '으로', '로는', '로',
    '까지', '부터', '마다', '조차', '마저',
    '은', '는', '이', '가', '을', '를', '의', '와', '과', '도',
    '하고 있다', '되고 있다', '되어야 한다', '해야 한다',
    '하고있다', '되고있다', '되어야한다', '해야한다',
    '하였다', '되었다', '하겠다', '되겠다',
    '하면서', '되며', '하며', '하여', '되어', '하면', '되면',
    '하다', '되다', '이다', '있다', '없다',
    '적이다', '적으로', '적인', '적',
  ];

  for (const suf of suffixes) {
    if (clean.endsWith(suf) && clean.length > suf.length) {
      return clean.slice(0, clean.length - suf.length).trim();
    }
  }

  return clean;
}

export class KoreanDictionaryService {
  /**
   * Synchronous instant lookup in static dictionaries & in-memory cache
   */
  static lookupWord(rawWord: string): WordDefinition | null {
    if (!rawWord || !rawWord.trim()) return null;

    const trimmed = rawWord.replace(/[.,!?'"~()·]/g, '').trim();
    const stem = cleanKoreanStem(trimmed);

    // 0. Check in-memory AI/cloud cache first
    if (memoryLensCache[trimmed]) {
      return { ...memoryLensCache[trimmed], korean: trimmed };
    }
    if (stem && memoryLensCache[stem]) {
      return { ...memoryLensCache[stem], korean: trimmed };
    }

    // 1. Direct dictionary match
    if (TOPIK_ESSAY_DICTIONARY[trimmed]) {
      return {
        korean: trimmed,
        ...TOPIK_ESSAY_DICTIONARY[trimmed],
      };
    }

    // 2. Stem match in TOPIK essay dictionary
    if (TOPIK_ESSAY_DICTIONARY[stem]) {
      return {
        korean: trimmed,
        ...TOPIK_ESSAY_DICTIONARY[stem],
      };
    }

    // 3. Search in VOCAB_DATA
    const foundVocab = VOCAB_DATA.find(
      (v) =>
        v.written.includes(stem) ||
        v.spoken.includes(stem) ||
        trimmed.includes(v.written) ||
        v.written.includes(trimmed)
    );

    if (foundVocab) {
      return {
        korean: trimmed,
        vocabId: foundVocab.id,
        rootWord: foundVocab.written,
        romaja: foundVocab.pronunciation,
        myanmarMeaning: foundVocab.myanmarMeaning,
        englishMeaning: foundVocab.englishMeaning,
        spokenEquivalent: foundVocab.spoken,
        writtenEquivalent: foundVocab.written,
        topikTip: foundVocab.usageTip,
        category: foundVocab.category,
      };
    }

    // 4. Search in PATTERNS_DATA
    const foundPattern = PATTERNS_DATA.find(
      (p) =>
        p.title.includes(trimmed) ||
        p.patternFormula.includes(trimmed) ||
        p.keyPhrases.some((phrase) => phrase.includes(trimmed) || trimmed.includes(phrase))
    );

    if (foundPattern) {
      return {
        korean: trimmed,
        rootWord: foundPattern.title,
        romaja: foundPattern.questionNumber,
        myanmarMeaning: foundPattern.myanmarTitle,
        englishMeaning: foundPattern.description,
        topikTip: foundPattern.patternFormula,
        category: foundPattern.questionNumber,
      };
    }

    // 5. General fallback definition (marked isUnindexed = true so Smart AI Lens can auto-translate it!)
    return {
      korean: trimmed,
      rootWord: stem || trimmed,
      romaja: 'Korean Expression',
      myanmarMeaning: 'AI ဖြင့် အဓိပ္ပာယ် ရှာဖွေပေးနေပါသည်...',
      englishMeaning: 'Looking up meaning with Smart Vocab Lens AI...',
      topikTip: 'စကားလုံး၏ အသံထွက်ကို အောက်ပါ Listen ခလုတ်ဖြင့် နားဆင်နိုင်ပါသည်။',
      category: 'General',
      isUnindexed: true,
    };
  }

  /**
   * Smart Async Lookup:
   * 1. Checks Local AsyncStorage Cache
   * 2. Checks Supabase Shared `vocab_lens_cache` & Contributor `vocabularies`
   * 3. Calls System Gemini API (Managed by Admin in `app_settings` with Primary -> Backup auto-failover)
   * 4. Caches result globally so future students use 0 API quota
   */
  static async lookupWordSmart(
    rawWord: string,
    essayContext?: string,
    userGeminiKey?: string | null
  ): Promise<WordDefinition | null> {
    const syncResult = this.lookupWord(rawWord);
    if (!syncResult || !syncResult.isUnindexed) {
      return syncResult;
    }

    const trimmed = syncResult.korean;
    const stem = cleanKoreanStem(trimmed) || trimmed;

    // 1. Check Local AsyncStorage Cache
    try {
      const rawCache = await AsyncStorage.getItem(LOCAL_VOCAB_LENS_CACHE_KEY);
      if (rawCache) {
        const parsedCache: Record<string, WordDefinition> = JSON.parse(rawCache);
        const hit = parsedCache[trimmed] || parsedCache[stem];
        if (hit && !hit.isUnindexed) {
          memoryLensCache[trimmed] = hit;
          memoryLensCache[stem] = hit;
          return { ...hit, korean: trimmed };
        }
      }
    } catch (_) {}

    // 2. Check Supabase Global `vocab_lens_cache` and `vocabularies`
    try {
      const { data: cachedRow } = await supabase
        .from('vocab_lens_cache')
        .select('*')
        .in('word_key', [trimmed, stem])
        .limit(1)
        .maybeSingle();

      if (cachedRow) {
        const resolved: WordDefinition = {
          korean: trimmed,
          rootWord: cachedRow.root_word || stem,
          romaja: cachedRow.romaja || 'Korean Expression',
          myanmarMeaning: cachedRow.myanmar_meaning,
          englishMeaning: cachedRow.english_meaning || '',
          spokenEquivalent: cachedRow.spoken_equivalent || undefined,
          writtenEquivalent: cachedRow.written_equivalent || undefined,
          topikTip: cachedRow.topik_tip || undefined,
          category: cachedRow.category || 'General',
          isAiGenerated: true,
        };
        await this.saveToLocalLensCache(trimmed, stem, resolved);
        return resolved;
      }

      const { data: cloudVocab } = await supabase
        .from('vocabularies')
        .select('*')
        .eq('status', 'approved')
        .or(`written.ilike.%${stem}%,spoken.ilike.%${stem}%`)
        .limit(1)
        .maybeSingle();

      if (cloudVocab) {
        const resolved: WordDefinition = {
          korean: trimmed,
          vocabId: cloudVocab.id,
          rootWord: cloudVocab.written,
          romaja: cloudVocab.pronunciation || '',
          myanmarMeaning: cloudVocab.myanmar_meaning,
          englishMeaning: cloudVocab.english_meaning || '',
          spokenEquivalent: cloudVocab.spoken || undefined,
          writtenEquivalent: cloudVocab.written || undefined,
          topikTip: cloudVocab.usage_tip || undefined,
          category: cloudVocab.category || 'General',
        };
        await this.saveToLocalLensCache(trimmed, stem, resolved);
        return resolved;
      }
    } catch (_) {}

    // 3. Fetch System Gemini API Keys from Admin `app_settings` (plus .env / user fallback)
    const candidateKeys: string[] = [];
    let modelName = 'gemini-2.5-flash';

    try {
      const { data: settingRow } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'system_gemini_config')
        .maybeSingle();

      if (settingRow?.value) {
        const cfg = settingRow.value as any;
        if (cfg.enabled !== false) {
          if (cfg.primary_key?.trim()) candidateKeys.push(cfg.primary_key.trim());
          if (cfg.backup_key?.trim()) candidateKeys.push(cfg.backup_key.trim());
        }
        if (cfg.model) modelName = cfg.model;
      }
    } catch (_) {}

    const envKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim();
    if (envKey && !candidateKeys.includes(envKey)) {
      candidateKeys.push(envKey);
    }
    if (userGeminiKey?.trim() && !candidateKeys.includes(userGeminiKey.trim())) {
      candidateKeys.push(userGeminiKey.trim());
    }

    if (candidateKeys.length === 0) {
      return {
        ...syncResult,
        myanmarMeaning: 'အဓိပ္ပာယ် အော်တိုဖော်ပြရန် System Gemini AI Key လိုအပ်ပါသည်',
        englishMeaning: 'Admin can configure System Gemini Key in Studio -> System Gemini AI Keys',
        isUnindexed: false,
      };
    }

    // 4. Try candidate keys in order (Auto-failover from Primary -> Backup if 429 Quota reached)
    for (const activeKey of candidateKeys) {
      const aiDef = await this.generateWordDefinitionWithGemini(
        activeKey,
        modelName,
        trimmed,
        stem,
        essayContext
      );
      if (aiDef) {
        await this.saveToLocalLensCache(trimmed, stem, aiDef);
        // Save to global Supabase cache in background so next learners get it for free
        supabase
          .from('vocab_lens_cache')
          .upsert(
            {
              word_key: stem,
              korean: trimmed,
              root_word: aiDef.rootWord,
              romaja: aiDef.romaja,
              myanmar_meaning: aiDef.myanmarMeaning,
              english_meaning: aiDef.englishMeaning,
              spoken_equivalent: aiDef.spokenEquivalent || null,
              written_equivalent: aiDef.writtenEquivalent || null,
              topik_tip: aiDef.topikTip || null,
              category: aiDef.category || 'General',
            },
            { onConflict: 'word_key' }
          )
          .then(() => {});
        return aiDef;
      }
    }

    return {
      ...syncResult,
      myanmarMeaning: 'လက်ရှိတွင် AI အဓိပ္ပာယ် ရှာဖွေ၍ မရနိုင်သေးပါ (Quota စစ်ဆေးပါ)',
      englishMeaning: 'Could not reach Gemini AI at the moment.',
      isUnindexed: false,
    };
  }

  private static async generateWordDefinitionWithGemini(
    apiKey: string,
    model: string,
    word: string,
    stem: string,
    contextText?: string
  ): Promise<WordDefinition | null> {
    try {
      const prompt = `You are a Korean-Myanmar TOPIK II dictionary expert.
Explain the Korean word "${word}" (stem: "${stem}")${
        contextText ? ` as used in this context: "${contextText.slice(0, 220)}"` : ''
      }.
Return ONLY a valid JSON object matching this exact schema:
{
  "rootWord": "<Korean dictionary base form, e.g. 증가하다>",
  "romaja": "<revised romanization pronunciation, e.g. jeung-ga-ha-da>",
  "myanmarMeaning": "<clear, natural Myanmar meaning>",
  "englishMeaning": "<concise English meaning>",
  "spokenEquivalent": "<everyday spoken Korean equivalent if applicable, or empty string>",
  "writtenEquivalent": "<academic written Korean equivalent if applicable, or empty string>",
  "topikTip": "<1 short helpful tip in Myanmar for TOPIK II essay writing>",
  "category": "<one of: Society, Economy, Education, Technology, Contrast, Cause & Effect, General>"
}`;

      const attempt = await callGeminiGenerateContent(
        apiKey,
        {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        },
        model
      );

      if (!attempt.ok) {
        // If 429 or 400/403, return null so loop automatically tries Backup Key!
        return null;
      }

      const data = attempt.data;
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) return null;

      let parsed: any;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        const m = rawText.match(/```(?:json)?([\s\S]*?)```/);
        if (m) parsed = JSON.parse(m[1].trim());
        else return null;
      }

      if (!parsed.myanmarMeaning) return null;

      return {
        korean: word,
        rootWord: parsed.rootWord || stem,
        romaja: parsed.romaja || '',
        myanmarMeaning: parsed.myanmarMeaning,
        englishMeaning: parsed.englishMeaning || '',
        spokenEquivalent: parsed.spokenEquivalent || undefined,
        writtenEquivalent: parsed.writtenEquivalent || undefined,
        topikTip: parsed.topikTip || undefined,
        category: parsed.category || 'General',
        isAiGenerated: true,
        isUnindexed: false,
      };
    } catch {
      return null;
    }
  }

  private static async saveToLocalLensCache(
    word: string,
    stem: string,
    def: WordDefinition
  ): Promise<void> {
    memoryLensCache[word] = def;
    memoryLensCache[stem] = def;
    try {
      const raw = await AsyncStorage.getItem(LOCAL_VOCAB_LENS_CACHE_KEY);
      const map: Record<string, WordDefinition> = raw ? JSON.parse(raw) : {};
      map[word] = def;
      map[stem] = def;
      await AsyncStorage.setItem(LOCAL_VOCAB_LENS_CACHE_KEY, JSON.stringify(map));
    } catch (_) {}
  }
}
