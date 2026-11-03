-- =================================================================================
-- VOCABJIP DYNAMIC CURRICULUM SEED SCRIPT
-- Contributor UID : 42746ffa-53eb-4141-bda0-54f5800607cc
-- Contributor Name: May Phyo Thet - TOPIK Level 6
-- Contributor Rank: Rank #1 • Top Educator
-- Run this script in Supabase Dashboard -> SQL Editor
-- =================================================================================

-- 0. Ensure contributor profile exists and is set as contributor
update public.profiles
set
  display_name = coalesce(nullif(display_name, ''), 'May Phyo Thet - TOPIK Level 6'),
  role = 'contributor',
  updated_at = timezone('utc'::text, now())
where id = '42746ffa-53eb-4141-bda0-54f5800607cc';

-- 1. Clear old static/dummy records if any exist
delete from public.quiz_steps;
delete from public.quiz_topics;
delete from public.vocabularies;
delete from public.sentence_patterns;
delete from public.essay_prompts;
delete from public.community_essays;

-- =================================================================================
-- 2. DYNAMIC VOCABULARIES (12 High-Yield TOPIK II Spoken -> Academic Words)
-- =================================================================================
insert into public.vocabularies (
  id, spoken, written, pronunciation, category,
  myanmar_meaning, english_meaning, usage_tip,
  example_korean, example_myanmar,
  status, created_by, author_name, author_rank, reviewed_by
) values
(
  'v-mpt-01',
  '그래서',
  '따라서 / 그러므로',
  'tta-ra-seo',
  'Cause & Effect',
  'ထို့ကြောင့် / ရလဒ်အနေဖြင့်',
  'Therefore / Consequently',
  'TOPIK II စာစီစာကုံး (Q53/Q54) တွင် စကားပြောသုံး "그래서" အစား "따라서" သို့မဟုတ် "그러므로" ကိုသာ အသုံးပြုရပါမည်။',
  '인터넷 사용자가 급증했다. 따라서 정보 보안이 더욱 중요해졌다.',
  'အင်တာနက်အသုံးပြုသူ ရုတ်တရက်များပြားလာခဲ့သည်။ ထို့ကြောင့် အချက်အလက်လုံခြုံရေးသည် ပို၍အရေးပါလာခဲ့သည်။',
  'approved',
  '42746ffa-53eb-4141-bda0-54f5800607cc',
  'May Phyo Thet - TOPIK Level 6',
  'Rank #1 • Top Educator',
  '139a440d-536e-4ccc-81f2-d382aa524f49'
),
(
  'v-mpt-02',
  '근데 / 하지만',
  '그러나 / 반면에',
  'geu-reo-na / ban-myeon-e',
  'Contrast',
  'သို့သော်လည်း / အခြားတစ်ဖက်တွင်မူ',
  'However / On the other hand',
  'ဆန့်ကျင်ဘက် အခြေအနေနှစ်ခုကို နှိုင်းယှဉ်ဖော်ပြရာတွင် "근데" ကို လုံးဝမသုံးဘဲ "그러나" သို့မဟုတ် "반면에" ကို သုံးပါ။',
  '스마트폰은 편리하다. 그러나 과도한 사용은 건강을 해칠 수 있다.',
  'စမတ်ဖုန်းသည် အဆင်ပြေသည်။ သို့သော်လည်း အလွန်အကျွံသုံးစွဲခြင်းသည် ကျန်းမာရေးကို ထိခိုက်စေနိုင်သည်။',
  'approved',
  '42746ffa-53eb-4141-bda0-54f5800607cc',
  'May Phyo Thet - TOPIK Level 6',
  'Rank #1 • Top Educator',
  '139a440d-536e-4ccc-81f2-d382aa524f49'
),
(
  'v-mpt-03',
  '진짜 / 너무',
  '매우 / 상당히',
  'mae-u / sang-dang-hi',
  'General',
  'အလွန် / အတော်အတန်',
  'Very / Considerably',
  'အလေးအနက်ထား ဖော်ပြရာတွင် စကားပြောသုံး "진짜/너무" အစား "매우" သို့မဟုတ် "상당히" ကို အသုံးပြုပါ။',
  '이 문제는 사회적으로 매우 심각한 영향을 미친다.',
  'ဤပြဿနာသည် လူမှုရေးအရ အလွန်ဆိုးရွားသော သက်ရောက်မှုကို ဖြစ်စေသည်။',
  'approved',
  '42746ffa-53eb-4141-bda0-54f5800607cc',
  'May Phyo Thet - TOPIK Level 6',
  'Rank #1 • Top Educator',
  '139a440d-536e-4ccc-81f2-d382aa524f49'
),
(
  'v-mpt-04',
  '늘어나다',
  '증가하다 / 급증하다',
  'jeung-ga-ha-da',
  'Economy',
  'တိုးပွားလာသည် / ရုတ်တရက်မြင့်တက်လာသည်',
  'To increase / To surge',
  'Q53 Graph ပုစ္ဆာများတွင် ကိန်းဂဏန်း တိုးတက်ပြောင်းလဲမှုကို ဖော်ပြရန် "증가하다 / 급증세를 보이다" ကို မဖြစ်မနေ သုံးရသည်။',
  '1인 가구의 비율이 지난 10년간 크게 증가하였다.',
  'တစ်ဦးတည်းနေထိုင်သော အိမ်ထောင်စုအချိုးအစားသည် လွန်ခဲ့သော ၁၀ နှစ်အတွင်း သိသိသာသာ တိုးပွားလာခဲ့သည်။',
  'approved',
  '42746ffa-53eb-4141-bda0-54f5800607cc',
  'May Phyo Thet - TOPIK Level 6',
  'Rank #1 • Top Educator',
  '139a440d-536e-4ccc-81f2-d382aa524f49'
),
(
  'v-mpt-05',
  '줄어들다',
  '감소하다 / 하락하다',
  'gam-so-ha-da',
  'Economy',
  'လျော့နည်းကျဆင်းသွားသည်',
  'To decrease / To decline',
  'Q53 တွင် ပမာဏလျော့ကျမှုကို "감소하다" နှင့် ရာခိုင်နှုန်း/နှုန်းထား ကျဆင်းမှုကို "하락하다" ဟု ခွဲခြားရေးသားပါ။',
  '출산율은 지속적으로 감소하는 추세를 보이고 있다.',
  'ကလေးမွေးဖွားနှုန်းသည် စဉ်ဆက်မပြတ် လျော့ကျနေသည့် လားရာကို ပြသနေသည်။',
  'approved',
  '42746ffa-53eb-4141-bda0-54f5800607cc',
  'May Phyo Thet - TOPIK Level 6',
  'Rank #1 • Top Educator',
  '139a440d-536e-4ccc-81f2-d382aa524f49'
),
(
  'v-mpt-06',
  '생각하다',
  '주장하다 / 간주하다',
  'ju-jang-ha-da / gan-ju-ha-da',
  'Education',
  'အခိုင်အမာဆိုသည် / သတ်မှတ်ယူဆသည်',
  'To claim / To regard as',
  'Q54 စာစီစာကုံးတွင် အမြင်ဖော်ပြရာ၌ "생각하다" အစား "주장하는 바이다" သို့မဟုတ် "~로 간주된다" ကို သုံးပါ။',
  '전문가들은 조기 교육보다 인성 교육이 더 중요하다고 주장한다.',
  'ပညာရှင်များက အစောပိုင်းပညာရေးထက် စာရိတ္တပညာရေးက ပို၍အရေးကြီးသည်ဟု အခိုင်အမာဆိုကြသည်။',
  'approved',
  '42746ffa-53eb-4141-bda0-54f5800607cc',
  'May Phyo Thet - TOPIK Level 6',
  'Rank #1 • Top Educator',
  '139a440d-536e-4ccc-81f2-d382aa524f49'
),
(
  'v-mpt-07',
  '바꾸다',
  '변화시키다 / 전환하다',
  'byeon-hwa-si-ki-da / jeon-hwan-ha-da',
  'Society',
  'ပြောင်းလဲစေသည် / အသွင်ပြောင်းသည်',
  'To transform / To shift',
  'လူမှုအဖွဲ့အစည်း၏ အတွေးအခေါ် ပြောင်းလဲရန် လိုအပ်ကြောင်း ရေးသားရာတွင် "사회적 인식의 전환이 요구된다" ဟု သုံးပါ။',
  '인공지능 기술 혁신은 우리의 생활 방식을 완전히 변화시켰다.',
  'ဉာဏ်ရည်တုနည်းပညာ ဆန်းသစ်တီထွင်မှုသည် ကျွန်ုပ်တို့၏ လူနေမှုပုံစံကို လုံးဝ ပြောင်းလဲစေခဲ့သည်။',
  'approved',
  '42746ffa-53eb-4141-bda0-54f5800607cc',
  'May Phyo Thet - TOPIK Level 6',
  'Rank #1 • Top Educator',
  '139a440d-536e-4ccc-81f2-d382aa524f49'
),
(
  'v-mpt-08',
  '도와주다',
  '기여하다 / 이바지하다',
  'gi-yeo-ha-da',
  'Society',
  'အထောက်အကူပြုသည် / အကျိုးပြုသည်',
  'To contribute to',
  'Q54 နိဂုံးပိုဒ်နှင့် 자기소개서 တို့တွင် "도와주다" အစား "~에 기여하다" (အကျိုးပြုသည်) ကို သုံးပါက အမှတ်ပိုရသည်။',
  '신재생 에너지 개발은 환경 보호와 경제 발전에 크게 기여한다.',
  'ပြန်လည်ပြည့်ဖြိုးမြဲစွမ်းအင် ဖော်ထုတ်ရေးသည် သဘာဝပတ်ဝန်းကျင်ထိန်းသိမ်းရေးနှင့် စီးပွားရေးဖွံ့ဖြိုးမှုကို များစွာ အထောက်အကူပြုသည်။',
  'approved',
  '42746ffa-53eb-4141-bda0-54f5800607cc',
  'May Phyo Thet - TOPIK Level 6',
  'Rank #1 • Top Educator',
  '139a440d-536e-4ccc-81f2-d382aa524f49'
),
(
  'v-mpt-09',
  '문제를 풀다',
  '해결책을 마련하다 / 극복하다',
  'hae-gyeol-chaeg-eul ma-ryeon-ha-da',
  'Environment',
  'ဖြေရှင်းနည်း ရှာဖွေစီမံသည် / ကျော်လွှားသည်',
  'To devise solutions / To overcome',
  'Q54 နိဂုံးပိုင်းတွင် ပြဿနာဖြေရှင်းရန် အကြံပြုရာ၌ "근본적인 해결책을 마련해야 한다" ဟု သုံးနှုန်းပါ။',
  '기후 위기를 극복하기 위해 정부 차원의 실질적인 해결책을 마련해야 한다.',
  'ရာသီဥတုအကျပ်အတည်းကို ကျော်လွှားရန် အစိုးရအဆင့် လက်တွေ့ကျသော ဖြေရှင်းနည်းများကို စီမံဆောင်ရွက်ရမည်။',
  'approved',
  '42746ffa-53eb-4141-bda0-54f5800607cc',
  'May Phyo Thet - TOPIK Level 6',
  'Rank #1 • Top Educator',
  '139a440d-536e-4ccc-81f2-d382aa524f49'
),
(
  'v-mpt-10',
  '만들다 (법/제도)',
  '제정하다 / 구축하다',
  'je-jeong-ha-da / gu-chuk-ha-da',
  'Society',
  'ပြဋ္ဌာန်းသည် (ဥပဒေ) / တည်ဆောက်သည် (စနစ်)',
  'To enact (laws) / To establish (systems)',
  'ဥပဒေပြုလုပ်ခြင်းကို "법률을 제정하다" ဟုသုံးပြီး စနစ်တည်ဆောက်ခြင်းကို "시스템을 구축하다" ဟု တွဲသုံးပါ။',
  '사이버 범죄를 예방하기 위해 관련 법률을 제정하고 보안 체계를 구축해야 한다.',
  'ဆိုက်ဘာမှုခင်းများကို ကာကွယ်ရန် သက်ဆိုင်ရာဥပဒေများကို ပြဋ္ဌာန်းပြီး လုံခြုံရေးစနစ်ကို တည်ဆောက်ရမည်။',
  'approved',
  '42746ffa-53eb-4141-bda0-54f5800607cc',
  'May Phyo Thet - TOPIK Level 6',
  'Rank #1 • Top Educator',
  '139a440d-536e-4ccc-81f2-d382aa524f49'
),
(
  'v-mpt-11',
  '더 커지다 / 넓어지다',
  '확대되다 / 확산되다',
  'hwak-dae-doe-da / hwak-san-doe-da',
  'Technology',
  'ကျယ်ပြန့်လာသည် / ပျံ့နှံ့လာသည်',
  'To expand / To spread widely',
  'Q53 နှင့် Q54 တွင် ဝန်ဆောင်မှု သို့မဟုတ် နည်းပညာ ကျယ်ပြန့်လာခြင်းကို "확대되다/확산되다" ဖြင့် ရေးသားပါ။',
  '재택근무와 비대면 온라인 교육이 사회 전반으로 빠르게 확산되고 있다.',
  'အိမ်မှအလုပ်လုပ်ခြင်းနှင့် အွန်လိုင်းပညာရေးသည် လူ့အဖွဲ့အစည်းတစ်ခုလုံးသို့ လျင်မြန်စွာ ပျံ့နှံ့လာနေသည်။',
  'approved',
  '42746ffa-53eb-4141-bda0-54f5800607cc',
  'May Phyo Thet - TOPIK Level 6',
  'Rank #1 • Top Educator',
  '139a440d-536e-4ccc-81f2-d382aa524f49'
),
(
  'v-mpt-12',
  '나쁜 영향을 주다',
  '부정적인 영향을 미치다 / 저해하다',
  'bu-jeong-jeog-in yeong-hyang-eul mi-chi-da',
  'Education',
  'အပျက်သဘောဆောင်သော သက်ရောက်မှုဖြစ်စေသည် / အဟန့်အတားဖြစ်စေသည်',
  'To have a negative impact / To hinder',
  '"영향을 주다" အစား "영향을 미치다" ကို သုံးခြင်းဖြင့် TOPIK II အရေးအသား အဆင့်အတန်းကို မြှင့်တင်နိုင်သည်။',
  '지나친 경쟁 위주의 교육은 청소년의 창의성 발달을 저해할 우려가 있다.',
  'အလွန်အကျွံ ပြိုင်ဆိုင်မှုကိုသာ ဦးစားပေးသော ပညာရေးသည် လူငယ်များ၏ တီထွင်ဖန်တီးနိုင်စွမ်း ဖွံ့ဖြိုးမှုကို အဟန့်အတားဖြစ်စေနိုင်သည့် စိုးရိမ်ဖွယ်ရှိသည်။',
  'approved',
  '42746ffa-53eb-4141-bda0-54f5800607cc',
  'May Phyo Thet - TOPIK Level 6',
  'Rank #1 • Top Educator',
  '139a440d-536e-4ccc-81f2-d382aa524f49'
);

-- =================================================================================
-- 3. DYNAMIC SENTENCE PATTERNS (6 TOPIK II Q51 - Q54 Formulas)
-- =================================================================================
insert into public.sentence_patterns (
  id, question_number, title, myanmar_title, description,
  pattern_formula, example_korean, example_myanmar, key_phrases,
  status, created_by, author_name, author_rank, reviewed_by
) values
(
  'p-mpt-01',
  'Q53',
  'Describe a Trend (증가 및 감소 추세)',
  'တိုးတက်မှုနှင့် ကျဆင်းမှု လားရာကို ဖော်ပြခြင်း',
  'Q53 Graph ပုစ္ဆာတွင် ကိန်းဂဏန်းများ တိုးပွားလာခြင်း သို့မဟုတ် ကျဆင်းသွားခြင်းကို စနစ်တကျ ရေးသားနည်း',
  '[조사 대상]에 대해 조사한 결과, [연도]에 [수치]에서 [연도]에 [수치]로 (크게 증가하였다 / 감소하였다).',
  '인주시의 외국인 유학생 수를 조사한 결과, 2015년 3만 명에서 2024년 12만 명으로 약 4배 급증하였다.',
  'အင်ဂျူမြို့ရှိ နိုင်ငံခြားသားပညာတော်သင် အရေအတွက်ကို စစ်တမ်းကောက်ယူရာ ၂၀၁၅ ခုနှစ် ၃ သောင်းမှ ၂၀၂၄ တွင် ၁ သိန်း ၂ သောင်းသို့ ၄ ဆခန့် ရုတ်တရက် တိုးပွားလာခဲ့သည်။',
  array['~에 대해 조사한 결과', '~에서 ~로 크게 증가하였다', '~배 급증세를 보였다'],
  'approved',
  '42746ffa-53eb-4141-bda0-54f5800607cc',
  'May Phyo Thet - TOPIK Level 6',
  'Rank #1 • Top Educator',
  '139a440d-536e-4ccc-81f2-d382aa524f49'
),
(
  'p-mpt-02',
  'Q53',
  'Cause of Change & Future Outlook (원인 분석 및 전망)',
  'ပြောင်းလဲရခြင်း အကြောင်းရင်းနှင့် အနာဂတ်ခန့်မှန်းချက်',
  'ဂရပ်တွင် ဖော်ပြထားသော အကြောင်းရင်း (원인) နှင့် အနာဂတ်အလားအလာ (전망) ကို ချိတ်ဆက်ရေးသားသည့် ပုံစံ',
  '이러한 변화의 주요 원인으로는 [원인 1]과/와 [원인 2]을/를 꼽을 수 있으며, 향후에도 이러한 추세가 지속될 것으로 전망된다.',
  '이러한 변화의 주요 원인으로는 한류 열풍으로 인한 관심 증대와 장학 혜택 확대를 꼽을 수 있으며, 향후에도 증가세가 이어질 것으로 전망된다.',
  'ဤပြောင်းလဲမှု၏ အဓိကအကြောင်းရင်းများအဖြစ် ဟန်လျူလှိုင်းကြောင့် စိတ်ဝင်စားမှု တိုးပွားလာခြင်းနှင့် ပညာသင်ဆု တိုးချဲ့ပေးခြင်းတို့ကို ဖော်ပြနိုင်ပြီး နောင်တွင်လည်း တိုးတက်မှုလားရာ ဆက်လက်ရှိနေမည်ဟု ခန့်မှန်းရသည်။',
  array['이러한 원인으로는 ~을 꼽을 수 있다', '~의 영향으로 인해', '~(으)ㄹ 것으로 전망된다'],
  'approved',
  '42746ffa-53eb-4141-bda0-54f5800607cc',
  'May Phyo Thet - TOPIK Level 6',
  'Rank #1 • Top Educator',
  '139a440d-536e-4ccc-81f2-d382aa524f49'
),
(
  'p-mpt-03',
  'Q54',
  'Essay Introduction (서론 문제 제기)',
  'Q54 စာစီစာကုံး၏ နိဒါန်းအစဖွင့် ရေးသားနည်း',
  'အကြောင်းအရာတစ်ခု၏ လူမှုရေးအရေးပါမှုကို ထောက်ပြကာ စာစီစာကုံး၏ နိဒါန်းကို ဆွဲဆောင်မှုရှိစွာ အစပြုခြင်း',
  '현대 사회에서 [주제]은/는 중요한 사회적 과제로 대두되고 있다. 이에 따라 [주제]에 대한 다각적인 논의가 요구되고 있다.',
  '현대 사회에서 평생 교육은 개인의 발전뿐만 아니라 국가 경쟁력을 좌우하는 중요한 요소로 대두되고 있다.',
  'ခေတ်သစ်လူ့ဘောင်တွင် တစ်သက်တာပညာရေးသည် တစ်ဦးချင်းစီ၏ တိုးတက်မှုသာမက နိုင်ငံ၏ယှဉ်ပြိုင်နိုင်စွမ်းကို ဆုံးဖြတ်ပေးသော အရေးပါသည့် အချက်အဖြစ် ပေါ်ထွက်လာနေသည်။',
  array['~로 대두되고 있다', '~에 대한 관심이 높아지고 있다', '중요한 역할을 담당한다'],
  'approved',
  '42746ffa-53eb-4141-bda0-54f5800607cc',
  'May Phyo Thet - TOPIK Level 6',
  'Rank #1 • Top Educator',
  '139a440d-536e-4ccc-81f2-d382aa524f49'
),
(
  'p-mpt-04',
  'Q54',
  'Essay Conclusion & Proposal (결론 및 정책적 제언)',
  'Q54 စာစီစာကုံး၏ နိဂုံးချုပ်နှင့် အကြံပြုချက်',
  'စာစီစာကုံး၏ အဆုံးသတ်တွင် တစ်ဦးချင်းနှင့် လူမှုအဖွဲ့အစည်း/အစိုးရအဆင့် ကြိုးပမ်းရမည့် လမ်းညွှန်ချက်ကို အလေးပေးဖော်ပြခြင်း',
  '따라서 [주제]을/를 해결하기 위해서는 개인의 의식 개선뿐만 아니라 정부 차원의 제도적 뒷받침이 함께 이루어져야 할 것이다.',
  '따라서 환경 문제를 극복하기 위해서는 시민들의 자발적인 실천뿐만 아니라 정부의 엄격한 규제와 정책적 지원이 병행되어야 한다.',
  'ထို့ကြောင့် သဘာဝပတ်ဝန်းကျင်ပြဿနာကို ဖြေရှင်းကျော်လွှားရန် နိုင်ငံသားများ၏ လက်တွေ့လိုက်နာမှုသာမက အစိုးရ၏ တင်းကြပ်သော စည်းမျဉ်းများနှင့် မူဝါဒဆိုင်ရာ ထောက်ပံ့မှုများပါ တစ်ပြိုင်နက်တည်း ရှိရမည်ဖြစ်သည်။',
  array['~이 함께 이루어져야 할 것이다', '~가 병행되어야 한다', '실질적인 노력이 절실히 요구된다'],
  'approved',
  '42746ffa-53eb-4141-bda0-54f5800607cc',
  'May Phyo Thet - TOPIK Level 6',
  'Rank #1 • Top Educator',
  '139a440d-536e-4ccc-81f2-d382aa524f49'
),
(
  'p-mpt-05',
  'Q51',
  'Formal Notice & Request (안내문 및 요청 빈칸)',
  'Q51 တရားဝင်ကြေညာချက်နှင့် မေတ္တာရပ်ခံချက် ကွက်လပ်ဖြည့်ပုံစံ',
  'ကြော်ငြာ၊ ဖိတ်ကြားချက် သို့မဟုတ် အီးမေးလ်များတွင် ယဉ်ကျေးစွာ အကြောင်းကြားသည့် အသုံးအနှုန်း',
  '[내용]에 관심이 있으신 분은 [일시]까지 [행동](해 주시기 바랍니다 / 신청하시기 바랍니다).',
  '한국어 말하기 대회에 참가를 원하시는 분은 이번 주 금요일까지 신청서를 제출해 주시기 바랍니다.',
  'ကိုရီးယားစကားပြောပြိုင်ပွဲတွင် ပါဝင်လိုသူများသည် ယခုတစ်ပတ် သောကြာနေ့အထိ လျှောက်လွှာတင်သွင်းပေးကြပါရန် မေတ္တာရပ်ခံအပ်ပါသည်။',
  array['~해 주시기 바랍니다', '~(으)시기를 바랍니다', '많은 참여를 부탁드립니다'],
  'approved',
  '42746ffa-53eb-4141-bda0-54f5800607cc',
  'May Phyo Thet - TOPIK Level 6',
  'Rank #1 • Top Educator',
  '139a440d-536e-4ccc-81f2-d382aa524f49'
),
(
  'p-mpt-06',
  'Q52',
  'Explanatory Cause & Contrast (설명문 인과 및 대조)',
  'Q52 ရှင်းလင်းချက်စာပိုဒ် အကြောင်းအကျိုး ဆက်စပ်ပုံစံ',
  'Q52 သိပ္ပံနှင့် လူမှုရေး ရှင်းလင်းချက်စာပိုဒ်များတွင် ရှေ့ဝါကျနှင့် နောက်ဝါကျ အကြောင်းအကျိုး ဆက်စပ်ပေးသည့် ပုံစံ',
  '[앞 내용](으)로 인해 [결과]게 된다. 따라서 [해결/대안]기 위해서는 ~(으)ㄹ 필요가 있다.',
  '수면이 부족하면 집중력이 저하되게 된다. 따라서 업무 효율을 높이기 위해서는 충분한 휴식을 취할 필요가 있다.',
  'အိပ်ချိန်မလုံလောက်ပါက အာရုံစူးစိုက်နိုင်စွမ်း ကျဆင်းသွားတတ်သည်။ ထို့ကြောင့် လုပ်ငန်းစွမ်းဆောင်ရည် မြှင့်တင်ရန်အတွက် လုံလောက်သော အနားယူမှု ရယူရန် လိုအပ်သည်။',
  array['~(으)로 인해 ~게 된다', '~기 위해서는 ~(으)ㄹ 필요가 있다', '~에 도움을 준다'],
  'approved',
  '42746ffa-53eb-4141-bda0-54f5800607cc',
  'May Phyo Thet - TOPIK Level 6',
  'Rank #1 • Top Educator',
  '139a440d-536e-4ccc-81f2-d382aa524f49'
);

-- =================================================================================
-- 4. DYNAMIC QUIZ TOPICS & STEPS (3 Topics, 6 Steps, 30 Questions)
-- =================================================================================
insert into public.quiz_topics (
  id, title, myanmar_title, category, description,
  created_by, author_name, author_rank
) values
(
  'qt-mpt-connectors',
  'Academic Connectors (학술적 접속부사)',
  'TOPIK II စာစီစာကုံးသုံး အဆင့်မြင့် အဆက်စကားလုံးများ',
  'Q54 Essay Connectors',
  'Master formal academic transitions to replace everyday spoken connectors in TOPIK II Q53 & Q54.',
  '42746ffa-53eb-4141-bda0-54f5800607cc',
  'May Phyo Thet - TOPIK Level 6',
  'Rank #1 • Top Educator'
),
(
  'qt-mpt-graphs',
  'Q53 Graph & Statistical Verbs (도표 분석 어휘)',
  'Q53 ဂရပ်ဖ်နှင့် ကိန်းဂဏန်း အတက်အကျပြ စကားလုံးများ',
  'Q53 Graph Trends',
  'Step-by-step practice on statistical verbs, adverbs, and ranking expressions for TOPIK II Question 53.',
  '42746ffa-53eb-4141-bda0-54f5800607cc',
  'May Phyo Thet - TOPIK Level 6',
  'Rank #1 • Top Educator'
),
(
  'qt-mpt-verbs',
  'Q54 Argument & Policy Verbs (논술 핵심 동사)',
  'Q54 အကြောင်းပြချက်နှင့် မူဝါဒဆိုင်ရာ အဆင့်မြင့် ကြိယာများ',
  'Academic Verbs',
  'Upgrade simple everyday verbs into high-scoring academic verbs for 600-700 character Q54 essays.',
  '42746ffa-53eb-4141-bda0-54f5800607cc',
  'May Phyo Thet - TOPIK Level 6',
  'Rank #1 • Top Educator'
);

insert into public.quiz_steps (
  id, topic_id, step_number, title, passing_score, questions,
  status, created_by, author_name, author_rank, reviewed_by
) values
(
  'qs-mpt-conn-1',
  'qt-mpt-connectors',
  1,
  'Step 1: Cause, Effect & Contrast Basics',
  3,
  '[
    {
      "id": 1,
      "spokenWord": "그래서",
      "questionText": "What is the academic written form of \"그래서\" (Therefore)?",
      "options": ["그러나", "따라서", "비록", "하지만"],
      "correctIndex": 1,
      "explanation": "\"따라서\" or \"그러므로\" is the formal written connective for cause and effect in Q53/Q54.",
      "exampleSentence": "인터넷 사용자가 급증했다. 따라서 정보 보안이 더욱 중요해졌다."
    },
    {
      "id": 2,
      "spokenWord": "근데",
      "questionText": "Which word should replace \"근데\" (However) in formal writing?",
      "options": ["그러나", "그리고", "그리하여", "따라서"],
      "correctIndex": 0,
      "explanation": "\"그러나\" introduces contrast between ideas in written Korean essays.",
      "exampleSentence": "스마트폰은 편리하다. 그러나 과도한 사용은 건강을 해칠 수 있다."
    },
    {
      "id": 3,
      "spokenWord": "진짜 / 너무",
      "questionText": "Choose the academic substitute for \"진짜 / 너무\" (Very / Extremely):",
      "options": ["조금", "매우 / 상당히", "가끔", "별로"],
      "correctIndex": 1,
      "explanation": "Avoid colloquial \"너무\" or \"진짜\"; use \"매우\" or \"상당히\" to express intensity.",
      "exampleSentence": "이 문제는 사회적으로 매우 심각한 영향을 미친다."
    },
    {
      "id": 4,
      "spokenWord": "또 / 그리고",
      "questionText": "When adding a second supporting argument in Q54, what replaces \"그리고\"?",
      "options": ["반면에", "또한 / 아울러", "오히려", "즉"],
      "correctIndex": 1,
      "explanation": "\"또한\" (Furthermore / In addition) links supporting arguments smoothly in formal essays.",
      "exampleSentence": "환경 보호는 정부의 노력뿐만 아니라 시민의 참여 또한 필요하다."
    },
    {
      "id": 5,
      "spokenWord": "그래도",
      "questionText": "How do you write \"그래도\" (Nevertheless / Even so) in academic Korean?",
      "options": ["그럼에도 불구하고", "왜냐하면", "마침내", "예를 들어"],
      "correctIndex": 0,
      "explanation": "\"그럼에도 불구하고\" adds strong academic weight when acknowledging a counter-point.",
      "exampleSentence": "실패할 확률이 높았다. 그럼에도 불구하고 연구를 계속 진행하였다."
    }
  ]'::jsonb,
  'approved',
  '42746ffa-53eb-4141-bda0-54f5800607cc',
  'May Phyo Thet - TOPIK Level 6',
  'Rank #1 • Top Educator',
  '139a440d-536e-4ccc-81f2-d382aa524f49'
),
(
  'qs-mpt-conn-2',
  'qt-mpt-connectors',
  2,
  'Step 2: Advanced Argument Transitions',
  3,
  '[
    {
      "id": 1,
      "spokenWord": "다시 말하면",
      "questionText": "Which concise connector rephrases a point (\"In other words\")?",
      "options": ["즉 / 다시 말해", "하물며", "설령", "차라리"],
      "correctIndex": 0,
      "explanation": "\"즉\" concisely summarizes or clarifies the preceding statement.",
      "exampleSentence": "독서는 지식을 넓혀 준다. 즉, 개인의 성장을 돕는 핵심 도구이다."
    },
    {
      "id": 2,
      "spokenWord": "반대로",
      "questionText": "Which expression best contrasts two opposing trends (\"On the other hand\")?",
      "options": ["이에 반해 / 반면에", "이로 인해", "더군다나", "결국"],
      "correctIndex": 0,
      "explanation": "\"반면에\" or \"이에 반해\" is essential for comparing two groups in Q53 & Q54.",
      "exampleSentence": "찬성하는 입장이 있는 반면에 반대하는 목소리도 적지 않다."
    },
    {
      "id": 3,
      "spokenWord": "때문에",
      "questionText": "What is the formal cause-effect phrase for \"Because of this\"?",
      "options": ["이로 인해 / 이에 따라", "그럴지라도", "어쩌면", "우선"],
      "correctIndex": 0,
      "explanation": "\"이로 인해\" (Due to this) is widely used in Q53 cause analysis and Q54 body paragraphs.",
      "exampleSentence": "출산율이 지속적으로 하락하고 있다. 이로 인해 고령화 사회가 가속화되었다."
    },
    {
      "id": 4,
      "spokenWord": "예를 들어서",
      "questionText": "Select the cleanest academic transition to introduce an example:",
      "options": ["가령 / 예컨대", "도대체", "아마도", "무조건"],
      "correctIndex": 0,
      "explanation": "\"예컨대\" or \"예를 들면\" introduces concrete evidence in Q54.",
      "exampleSentence": "예컨대 재택근무의 확산은 업무 효율성을 높이는 결과를 가져왔다."
    },
    {
      "id": 5,
      "spokenWord": "마지막으로 정리하면",
      "questionText": "Which phrase signals the final conclusion in a Q54 essay?",
      "options": ["요컨대 / 결론적으로", "우선적으로", "우연히", "일부러"],
      "correctIndex": 0,
      "explanation": "\"결론적으로\" or \"요컨대\" (In conclusion / To sum up) closes the final paragraph.",
      "exampleSentence": "결론적으로 진정한 발전을 위해서는 제도와 의식이 함께 변화해야 한다."
    }
  ]'::jsonb,
  'approved',
  '42746ffa-53eb-4141-bda0-54f5800607cc',
  'May Phyo Thet - TOPIK Level 6',
  'Rank #1 • Top Educator',
  '139a440d-536e-4ccc-81f2-d382aa524f49'
),
(
  'qs-mpt-graph-1',
  'qt-mpt-graphs',
  1,
  'Step 1: Rising & Falling Trend Verbs',
  3,
  '[
    {
      "id": 1,
      "spokenWord": "늘어나다",
      "questionText": "Which term is used in Q53 graphs to describe an increase?",
      "options": ["줄어들다", "감소하다", "증가하다", "하락하다"],
      "correctIndex": 2,
      "explanation": "\"증가하다\" or \"상승하다\" is the standard statistical terminology for rising trends.",
      "exampleSentence": "1인 가구의 비율이 지난 10년간 크게 증가하였다."
    },
    {
      "id": 2,
      "spokenWord": "줄어들다",
      "questionText": "What is the formal statistical verb for \"to decrease / decline\"?",
      "options": ["증가하다", "감소하다 / 하락하다", "유지되다", "확대되다"],
      "correctIndex": 1,
      "explanation": "\"감소하다\" (decrease in quantity) and \"하락하다\" (drop in rate) replace \"줄어들다\".",
      "exampleSentence": "종이 신문 구독자 수는 매년 감소하는 추세를 보이고 있다."
    },
    {
      "id": 3,
      "spokenWord": "갑자기 많아지다",
      "questionText": "How do you express \"sharply surged / skyrocketed\" in 2 syllables?",
      "options": ["급감하다", "급증하다", "정체되다", "소폭 오르다"],
      "correctIndex": 1,
      "explanation": "\"급증하다\" (급격히 증가하다) describes a steep upward spike in a chart.",
      "exampleSentence": "비대면 서비스 이용률이 2020년 이후 급증하였다."
    },
    {
      "id": 4,
      "spokenWord": "제일 높다",
      "questionText": "When ranking survey responses, what phrase means \"occupied the highest share\"?",
      "options": ["가장 높은 비율을 차지하다", "가장 낮게 나타나다", "절반에 그치다", "변화가 없다"],
      "correctIndex": 0,
      "explanation": "\"~이/가 가장 높은 비율을 차지했다\" is the gold-standard Q53 ranking formula.",
      "exampleSentence": "설문 조사 결과, 건강 관리가 45%로 가장 높은 비율을 차지하였다."
    },
    {
      "id": 5,
      "spokenWord": "안 바뀌고 그대로다",
      "questionText": "Which verb describes a graph line that stays flat at the same level?",
      "options": ["급락하다", "유지하다 / 머무르다", "폭등하다", "역전되다"],
      "correctIndex": 1,
      "explanation": "\"일정한 수준을 유지하다\" or \"~에 머무르다\" describes an unchanged figure.",
      "exampleSentence": "2022년부터 2024년까지 수출액은 비슷한 수준을 유지하였다."
    }
  ]'::jsonb,
  'approved',
  '42746ffa-53eb-4141-bda0-54f5800607cc',
  'May Phyo Thet - TOPIK Level 6',
  'Rank #1 • Top Educator',
  '139a440d-536e-4ccc-81f2-d382aa524f49'
),
(
  'qs-mpt-graph-2',
  'qt-mpt-graphs',
  2,
  'Step 2: Adverbs of Degree & Forecast Expressions',
  3,
  '[
    {
      "id": 1,
      "spokenWord": "조금 오르다",
      "questionText": "What is the formal statistical term for \"rose slightly\"?",
      "options": ["대폭 상승하다", "소폭 상승하다", "급격히 하락하다", "절반으로 줄다"],
      "correctIndex": 1,
      "explanation": "\"소폭\" (small margin) and \"대폭\" (large margin) make Q53 descriptions precise.",
      "exampleSentence": "전년 대비 실업률이 0.3%p 소폭 상승한 것으로 나타났다."
    },
    {
      "id": 2,
      "spokenWord": "계속",
      "questionText": "Which adverb replaces \"계속\" (continuously / steadily) in trend graphs?",
      "options": ["꾸준히 / 지속적으로", "간혹", "우연히", "갑자기"],
      "correctIndex": 0,
      "explanation": "\"지속적으로\" or \"꾸준히\" describes a steady multi-year trend.",
      "exampleSentence": "친환경 자동차 판매량은 지난 5년간 지속적으로 증가하고 있다."
    },
    {
      "id": 3,
      "spokenWord": "조사해 보니까",
      "questionText": "How should you open a Q53 paragraph summarizing survey results?",
      "options": ["조사 결과에 따르면", "내 생각에는", "사람들이 말하길", "어제 보니까"],
      "correctIndex": 0,
      "explanation": "\"~조사 결과에 따르면\" (According to the survey results) is the standard Q53 opener.",
      "exampleSentence": "소비자 만족도 조사 결과에 따르면 응답자의 70%가 긍정적으로 답했다."
    },
    {
      "id": 4,
      "spokenWord": "앞으로 ~할 것 같다",
      "questionText": "How do you formally express a future projection at the end of Q53?",
      "options": ["~할 것으로 전망되다", "~하면 좋겠다", "~할지도 모른다", "~하기 싫다"],
      "correctIndex": 0,
      "explanation": "\"~할 것으로 전망되다 / 예상되다\" is the formal passive structure for forecasts.",
      "exampleSentence": "이러한 추세는 향후에도 계속될 것으로 전망된다."
    },
    {
      "id": 5,
      "spokenWord": "1등에서 2등으로 바뀌다",
      "questionText": "Which verb means two categories swapped ranks in a line chart?",
      "options": ["순위가 역전되다", "동일하게 나타나다", "변동이 없다", "최저치를 기록하다"],
      "correctIndex": 0,
      "explanation": "\"역전되다\" (to be reversed) is used when one line overtakes another on a chart.",
      "exampleSentence": "2023년을 기점으로 온라인 쇼핑과 오프라인 쇼핑의 비중이 역전되었다."
    }
  ]'::jsonb,
  'approved',
  '42746ffa-53eb-4141-bda0-54f5800607cc',
  'May Phyo Thet - TOPIK Level 6',
  'Rank #1 • Top Educator',
  '139a440d-536e-4ccc-81f2-d382aa524f49'
),
(
  'qs-mpt-verbs-1',
  'qt-mpt-verbs',
  1,
  'Step 1: Essential Academic Action Verbs',
  3,
  '[
    {
      "id": 1,
      "spokenWord": "생각하다",
      "questionText": "In TOPIK Q54, how should you state an opinion instead of \"생각하다\"?",
      "options": ["주장하다 / 간주하다", "말하다", "보다", "듣다"],
      "correctIndex": 0,
      "explanation": "Use \"주장하다\" (to claim) or \"간주하다\" (to regard as) for academic weight.",
      "exampleSentence": "조기 교육보다 인성 교육이 더 중요하다고 주장한다."
    },
    {
      "id": 2,
      "spokenWord": "도와주다",
      "questionText": "Which formal verb means \"to contribute to\" a positive outcome?",
      "options": ["방해하다", "기여하다 / 이바지하다", "외면하다", "축소하다"],
      "correctIndex": 1,
      "explanation": "\"~에 기여하다\" replaces \"도와주다\" in essays and personal statements.",
      "exampleSentence": "기술 발전은 국가 경제 성장에 크게 기여하였다."
    },
    {
      "id": 3,
      "spokenWord": "바꾸다",
      "questionText": "How do you write \"to shift / transform public awareness\"?",
      "options": ["인식을 전환하다", "생각을 버리다", "마음을 닫다", "규칙을 어기다"],
      "correctIndex": 0,
      "explanation": "\"인식을 전환하다\" or \"인식을 개선하다\" is a top-scoring Q54 conclusion phrase.",
      "exampleSentence": "환경 보호를 위해서는 시민들의 인식 전환이 무엇보다 필요하다."
    },
    {
      "id": 4,
      "spokenWord": "나쁜 영향을 주다",
      "questionText": "What is the academic collocation for \"to have a negative impact on\"?",
      "options": ["부정적인 영향을 미치다", "기분을 나쁘게 하다", "도움을 주다", "관심을 가지다"],
      "correctIndex": 0,
      "explanation": "Always pair \"영향\" with \"미치다\" (or \"끼치다\") rather than \"주다\" in formal writing.",
      "exampleSentence": "가짜 뉴스는 여론 형성에 부정적인 영향을 미친다."
    },
    {
      "id": 5,
      "spokenWord": "법을 만들다",
      "questionText": "Which verb specifically pairs with \"법률 / 제도\" (to enact laws / establish systems)?",
      "options": ["제정하다 / 구축하다", "요리하다", "구매하다", "구경하다"],
      "correctIndex": 0,
      "explanation": "\"법률을 제정하다\" (enact laws) and \"체계를 구축하다\" (build a system) score high in Q54.",
      "exampleSentence": "정부는 관련 법률을 제정하고 지원 체계를 구축해야 한다."
    }
  ]'::jsonb,
  'approved',
  '42746ffa-53eb-4141-bda0-54f5800607cc',
  'May Phyo Thet - TOPIK Level 6',
  'Rank #1 • Top Educator',
  '139a440d-536e-4ccc-81f2-d382aa524f49'
),
(
  'qs-mpt-verbs-2',
  'qt-mpt-verbs',
  2,
  'Step 2: Problem Solving & Social Policy Expressions',
  3,
  '[
    {
      "id": 1,
      "spokenWord": "문제를 풀다",
      "questionText": "Which phrase best replaces \"문제를 풀다\" in a Q54 policy conclusion?",
      "options": ["해결책을 마련하다", "문제를 덮다", "질문을 던지다", "숙제를 끝내다"],
      "correctIndex": 0,
      "explanation": "\"실질적인 해결책을 마련하다\" (devise practical solutions) is ideal for Q54 conclusions.",
      "exampleSentence": "고령화 문제를 해결하기 위해 실질적인 대책을 마련해야 한다."
    },
    {
      "id": 2,
      "spokenWord": "꼭 필요하다",
      "questionText": "How do you express \"is urgently required\" in academic Korean?",
      "options": ["절실히 요구된다", "별로 필요 없다", "가끔 쓰인다", "조금 아쉽다"],
      "correctIndex": 0,
      "explanation": "\"~이/가 절실히 요구된다\" or \"필수적이다\" emphasizes urgency in formal essays.",
      "exampleSentence": "사이버 폭력 예방을 위한 교육이 절실히 요구된다."
    },
    {
      "id": 3,
      "spokenWord": "같이 해야 한다",
      "questionText": "Which verb means two efforts \"must be carried out in parallel\"?",
      "options": ["병행되어야 한다", "중단되어야 한다", "연기되어야 한다", "축소되어야 한다"],
      "correctIndex": 0,
      "explanation": "\"개인의 노력과 정부의 지원이 병행되어야 한다\" is a classic Q54 closing sentence.",
      "exampleSentence": "규제 강화와 인식 개선 캠페인이 반드시 병행되어야 한다."
    },
    {
      "id": 4,
      "spokenWord": "막다 / 못하게 하다",
      "questionText": "Which verb means \"to hinder / impede\" growth or development?",
      "options": ["촉진하다", "저해하다", "장려하다", "보장하다"],
      "correctIndex": 1,
      "explanation": "\"저해하다\" (to inhibit/hinder) is used when discussing drawbacks in Q54.",
      "exampleSentence": "과도한 규제는 기업의 기술 혁신을 저해할 수 있다."
    },
    {
      "id": 5,
      "spokenWord": "더 심해지다",
      "questionText": "How do you write \"social conflict is intensifying / deepening\"?",
      "options": ["갈등이 심화되다", "갈등이 사라지다", "평화가 찾아오다", "이해가 깊어지다"],
      "correctIndex": 0,
      "explanation": "\"심화되다\" (to deepen/intensify) pairs naturally with 갈등, 양극화, and 문제.",
      "exampleSentence": "세대 간의 소통 부족으로 인해 사회적 갈등이 심화되고 있다."
    }
  ]'::jsonb,
  'approved',
  '42746ffa-53eb-4141-bda0-54f5800607cc',
  'May Phyo Thet - TOPIK Level 6',
  'Rank #1 • Top Educator',
  '139a440d-536e-4ccc-81f2-d382aa524f49'
);

-- =================================================================================
-- 5. DYNAMIC ESSAY PROMPTS (Q53, Q54, Statement)
-- =================================================================================
insert into public.essay_prompts (
  id, type, title, prompt_text, sub_questions, sample_answer, scoring_criteria,
  status, created_by, reviewed_by
) values
(
  'ep-mpt-q53-1',
  'Q53',
  '인터넷 이용 현황 및 변화 원인 (Internet Usage Trends)',
  '다음은 국내 인터넷 이용률 변화와 증가 원인에 대한 조사 결과이다. 그래프의 내용을 200~300자로 요약하여 쓰시오.',
  array['연도별 인터넷 이용률 수치 변화(2015년 65% → 2024년 85%)', '증가 원인: 스마트폰 보급 확대, 비대면 서비스 활성화', '향후 전망 요약'],
  '조사 기관의 통계에 따르면 국내 인터넷 이용률은 2015년 65%에서 2024년 85%로 지난 9년간 20%p 크게 증가하였다. 이러한 변화의 주된 원인으로는 스마트폰 보급의 대중화와 비대면 온라인 서비스의 활성화를 꼽을 수 있다. 이러한 추세가 지속된다면 향후 인터넷 이용률은 전 연령층에서 더욱 확대될 것으로 전망된다.',
  '수치 변화 정확성(10점), 원인 연결의 자연스러움(10점), 학술적 문어체 및 격식체 사용(10점)',
  'approved',
  '42746ffa-53eb-4141-bda0-54f5800607cc',
  '139a440d-536e-4ccc-81f2-d382aa524f49'
),
(
  'ep-mpt-q54-1',
  'Q54',
  '평생 교육의 필요성과 사회적 지원 방안 (Lifelong Education)',
  '과학 기술이 급격히 발전하고 평균 수명이 연장되면서 평생 교육의 중요성이 날로 커지고 있다. 평생 교육이 필요한 이유와 이를 활성화하기 위한 방안에 대해 600~700자로 논술하시오.',
  array['현대 사회에서 평생 교육이 필요한 이유는 무엇인가?', '평생 교육이 개인과 사회에 미치는 긍정적 영향은 무엇인가?', '평생 교육을 활성화하기 위해 개인과 정부는 어떤 노력을 해야 하는가?'],
  '현대 사회에서 평생 교육은 개인의 발전뿐만 아니라 국가 경쟁력을 좌우하는 중요한 요소로 대두되고 있다. 기술의 발전 속도가 빨라지면서 과거에 배운 지식만으로는 급변하는 시대를 살아가기에 한계가 있기 때문이다. 첫째, 끊임없는 배움은 개인의 자아실현과 삶의 만족도를 높여 준다. 둘째, 사회적 차원에서도 고령화 사회에 대응하고 생산성을 유지하기 위해 지속적인 재교육이 필수적이다. 따라서 평생 교육을 개인의 몫으로만 남겨둘 것이 아니라, 누구나 쉽게 접근할 수 있도록 정부 차원의 온라인 교육 플랫폼 구축과 제도적 지원이 반드시 병행되어야 한다.',
  '서론-본론-결론 3단 구성(15점), 논리적 근거 및 예시 제시(20점), 고급 학술 어휘 및 원고지 맞춤법(15점)',
  'approved',
  '42746ffa-53eb-4141-bda0-54f5800607cc',
  '139a440d-536e-4ccc-81f2-d382aa524f49'
);

-- =================================================================================
-- 6. DYNAMIC COMMUNITY ESSAYS (Attributed to Contributor May Phyo Thet)
-- =================================================================================
insert into public.community_essays (
  user_id, author_name, type, title, content, score_estimate, likes_count
) values
(
  '42746ffa-53eb-4141-bda0-54f5800607cc',
  'May Phyo Thet - TOPIK Level 6',
  'Q54',
  '배움의 가치와 평생 교육 활성화 방안 (Model Q54 Essay)',
  '현대 사회에서 평생 교육은 개인의 발전뿐만 아니라 국가 경쟁력을 좌우하는 중요한 요소로 대두되고 있다. 과학 기술의 발전 속도가 빨라지고 평균 수명이 연장되면서 과거 학령기에 습득한 지식만으로는 급변하는 시대를 살아가기에 한계가 있기 때문이다.

첫째, 끊임없는 배움은 개인의 자아실현과 삶의 만족도를 높여 준다. 새로운 지식을 습득하고 시야를 넓히는 과정에서 인간은 성취감을 느끼며 더 나은 미래를 주체적으로 설계할 수 있다.
둘째, 사회적 차원에서도 고령화 사회에 대응하고 국가 생산성을 유지하기 위해 지속적인 직업 재교육이 필수적이다. 예컨대 디지털 전환 시대에 맞춘 실무 교육은 중장년층의 재취업을 돕고 사회적 비용을 절감하는 데 크게 기여한다.

따라서 평생 교육을 개인의 몫으로만 남겨둘 것이 아니라, 누구나 쉽게 접근할 수 있도록 정부 차원의 교육 플랫폼 구축과 기업의 제도적 지원이 반드시 병행되어야 할 것이다.',
  '48 / 50',
  42
),
(
  '42746ffa-53eb-4141-bda0-54f5800607cc',
  'May Phyo Thet - TOPIK Level 6',
  'Q53',
  '인주시 외국인 유학생 증가 추이 및 원인 분석 (Model Q53)',
  '인주시의 외국인 유학생 현황에 대해 조사한 결과, 전체 유학생 수는 2015년 3만 명에서 2024년 12만 명으로 지난 9년간 약 4배 급증한 것으로 나타났다. 이러한 증가의 주요 원인으로는 한류 열풍으로 인한 한국 문화와 한국어에 대한 관심 증대(52%)가 가장 높은 비율을 차지하였으며, 대학의 장학 혜택 확대 및 기숙사 지원 강화(35%)가 그 뒤를 이었다. 이러한 추세가 지속된다면 향후 외국인 유학생 유입은 더욱 확대될 것으로 전망된다.',
  '29 / 30',
  35
),
(
  '42746ffa-53eb-4141-bda0-54f5800607cc',
  'May Phyo Thet - TOPIK Level 6',
  'statement',
  '한국 대학원 글로벌장학금(GKS) 학업 계획 및 지원 동기 (Model SOP)',
  '저는 미얀마에서 한국어 교육과 디지털 학습 도구를 연구하며 언어 교육의 격차를 해소하는 데 깊은 관심을 가지게 되었습니다. 특히 체계적인 한국어학 커리큘럼과 첨단 에듀테크 연구 환경을 갖춘 귀교에서 전문적인 지식을 체득하고자 지원하였습니다. 입학 후에는 외국인 학습자의 쓰기 오류 분석과 인공지능 기반 피드백 모델에 관한 연구에 매진할 계획입니다. 졸업 후에는 양국 간의 학술 교류와 한국어 교육 발전에 기여하는 교육 전문가로 성장하겠습니다.',
  '9.8 / 10',
  51
);

