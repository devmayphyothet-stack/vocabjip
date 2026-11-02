import { VOCAB_DATA } from '@/data/vocab-data';
import { PATTERNS_DATA } from '@/data/patterns-data';

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
}

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
   * Look up definition for any tapped word in an essay
   */
  static lookupWord(rawWord: string): WordDefinition | null {
    if (!rawWord || !rawWord.trim()) return null;

    const trimmed = rawWord.replace(/[.,!?'"~()·]/g, '').trim();
    const stem = cleanKoreanStem(trimmed);

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

    // 5. General fallback definition
    return {
      korean: trimmed,
      rootWord: stem || trimmed,
      romaja: 'Korean Expression',
      myanmarMeaning: `"${trimmed}" အား အသံထွက် နားဆင်နိုင်ပါသည်။`,
      englishMeaning: `Korean term in TOPIK context: "${trimmed}"`,
      topikTip: 'စာပိုဒ်အတွင်းရှိ အရေးပါသော ဝေါဟာရများကို အသံထွက်နှင့် တွဲဖက်လေ့လာပါ။',
    };
  }
}
