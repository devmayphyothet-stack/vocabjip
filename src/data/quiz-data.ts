export interface QuizQuestion {
  id: number;
  spokenWord: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  exampleSentence: string;
}

export interface QuizStepItem {
  id: string;
  topicId: string;
  stepNumber: number;
  title: string;
  passingScore: number; // 3 out of 5 required to unlock next step
  questions: QuizQuestion[];
  authorName: string;
  authorRank: string;
}

export interface QuizTopicItem {
  id: string;
  title: string;
  myanmarTitle: string;
  category: string;
  description: string;
  authorName: string;
  authorRank: string;
  steps: QuizStepItem[];
}

export const QUIZ_TOPICS_DATA: QuizTopicItem[] = [
  {
    id: 'qt-connectors-1',
    title: 'Academic Connectors (접속부사)',
    myanmarTitle: 'TOPIK II စာစီစာကုံးသုံး အဆက်စကားလုံးများ',
    category: 'Q54 Essay Connectors',
    description:
      'Replace everyday spoken connectors like 그래서 and 근데 with formal TOPIK II academic transitions.',
    authorName: 'Daw Su Su Kyi',
    authorRank: 'Rank #1 • Top Educator',
    steps: [
      {
        id: 'qs-conn-s1',
        topicId: 'qt-connectors-1',
        stepNumber: 1,
        title: 'Step 1: Cause, Effect & Contrast Basics',
        passingScore: 3,
        authorName: 'Daw Su Su Kyi',
        authorRank: 'Rank #1 • Top Educator',
        questions: [
          {
            id: 1,
            spokenWord: '그래서',
            questionText: 'What is the academic written form of "그래서" (Therefore)?',
            options: ['그러나', '따라서', '비록', '하지만'],
            correctIndex: 1,
            explanation:
              '"따라서" or "그러므로" is the formal written connective for cause and effect in Q53/Q54.',
            exampleSentence: '인터넷 사용자가 급증했다. 따라서 정보 보안이 더욱 중요해졌다.',
          },
          {
            id: 2,
            spokenWord: '근데',
            questionText: 'Which word should replace "근데" (However) in formal writing?',
            options: ['그러나', '그리고', '그리하여', '따라서'],
            correctIndex: 0,
            explanation: '"그러나" introduces contrast between ideas in written Korean essays.',
            exampleSentence: '스마트폰은 편리하다. 그러나 과도한 사용은 건강을 해칠 수 있다.',
          },
          {
            id: 3,
            spokenWord: '진짜 / 너무',
            questionText: 'Choose the academic substitute for "진짜 / 너무" (Very / Extremely):',
            options: ['조금', '매우 / 대단히', '가끔', '별로'],
            correctIndex: 1,
            explanation:
              'Avoid colloquial "너무" or "진짜"; use "매우" or "상당히" to express intensity.',
            exampleSentence: '이 문제는 사회적으로 매우 심각한 영향을 미친다.',
          },
          {
            id: 4,
            spokenWord: '또 / 그리고',
            questionText: 'When adding a second argument in Q54, what replaces "그리고"?',
            options: ['반면에', '또한 / 아울러', '오히려', '즉'],
            correctIndex: 1,
            explanation:
              '"또한" (Furthermore / In addition) links supporting arguments smoothly in formal essays.',
            exampleSentence: '환경 보호는 정부의 노력뿐만 아니라 시민의 참여 또한 필요하다.',
          },
          {
            id: 5,
            spokenWord: '그래도',
            questionText: 'How do you write "그래도" (Nevertheless / Even so) in academic Korean?',
            options: ['그럼에도 불구하고', '왜냐하면', '마침내', '예를 들어'],
            correctIndex: 0,
            explanation:
              '"그럼에도 불구하고" adds strong academic weight when acknowledging a counter-point.',
            exampleSentence: '실패할 확률이 높았다. 그럼에도 불구하고 연구를 계속 진행하였다.',
          },
        ],
      },
      {
        id: 'qs-conn-s2',
        topicId: 'qt-connectors-1',
        stepNumber: 2,
        title: 'Step 2: Advanced Argument Transitions',
        passingScore: 3,
        authorName: 'U Kyaw Min',
        authorRank: 'Rank #2 • Senior Contributor',
        questions: [
          {
            id: 1,
            spokenWord: '다시 말하면',
            questionText: 'Which concise connector rephrases a point ("In other words")?',
            options: ['즉 / 다시 말해', '하물며', '설령', '차라리'],
            correctIndex: 0,
            explanation: '"즉" concisely summarizes or clarifies the preceding statement.',
            exampleSentence: '독서는 지식을 넓혀 준다. 즉, 개인의 성장을 돕는 핵심 도구이다.',
          },
          {
            id: 2,
            spokenWord: '반대로',
            questionText: 'Which expression best contrasts two opposing trends ("On the other hand")?',
            options: ['이에 반해 / 반면에', '이로 인해', '더군다나', '결국'],
            correctIndex: 0,
            explanation: '"반면에" or "이에 반해" is essential for comparing two groups in Q53 & Q54.',
            exampleSentence: '찬성하는 입장이 있는 반면에 반대하는 목소리도 적지 않다.',
          },
          {
            id: 3,
            spokenWord: '때문에',
            questionText: 'What is the formal cause-effect phrase for "Because of this"?',
            options: ['이로 인해 / 이에 따라', '그럴지라도', '어쩌면', '우선'],
            correctIndex: 0,
            explanation:
              '"이로 인해" (Due to this) is widely used in Q53 cause analysis and Q54 body paragraphs.',
            exampleSentence: '출산율이 지속적으로 하락하고 있다. 이로 인해 고령화 사회가 가속화되었다.',
          },
          {
            id: 4,
            spokenWord: '예를 들어서',
            questionText: 'Select the cleanest academic transition to introduce an example:',
            options: ['가령 / 예컨대', '도대체', '아마도', '무조건'],
            correctIndex: 0,
            explanation: '"예컨대" or "예를 들면" introduces concrete evidence in Q54.',
            exampleSentence: '예컨대 재택근무의 확산은 업무 효율성을 높이는 결과를 가져왔다.',
          },
          {
            id: 5,
            spokenWord: '마지막으로 정리하면',
            questionText: 'Which phrase signals the final conclusion in a Q54 essay?',
            options: ['요컨대 / 결론적으로', '우선적으로', '우연히', '일부러'],
            correctIndex: 0,
            explanation: '"결론적으로" or "요컨대" (In conclusion / To sum up) closes the final paragraph.',
            exampleSentence: '결론적으로 진정한 발전을 위해서는 제도와 의식이 함께 변화해야 한다.',
          },
        ],
      },
    ],
  },
  {
    id: 'qt-graph-2',
    title: 'Q53 Graph & Data Trends (도표 분석)',
    myanmarTitle: 'Q53 ဂရပ်ဖ်နှင့် ကိန်းဂဏန်း အတက်အကျပြ စကားလုံးများ',
    category: 'Q53 Graph Trends',
    description:
      'Step-by-step practice on statistical verbs and adverbs required to score full marks in TOPIK II Question 53.',
    authorName: 'Tr. Hnin Wai',
    authorRank: 'Rank #3 • Senior Contributor',
    steps: [
      {
        id: 'qs-graph-s1',
        topicId: 'qt-graph-2',
        stepNumber: 1,
        title: 'Step 1: Rising & Falling Trend Verbs',
        passingScore: 3,
        authorName: 'Tr. Hnin Wai',
        authorRank: 'Rank #3 • Senior Contributor',
        questions: [
          {
            id: 1,
            spokenWord: '늘어나다',
            questionText: 'Which term is used in Q53 graphs to describe an increase?',
            options: ['줄어들다', '감소하다', '증가하다', '하락하다'],
            correctIndex: 2,
            explanation:
              '"증가하다" or "상승하다" is the standard statistical terminology for rising trends.',
            exampleSentence: '1인 가구의 비율이 지난 10년간 크게 증가하였다.',
          },
          {
            id: 2,
            spokenWord: '줄어들다',
            questionText: 'What is the formal statistical verb for "to decrease / decline"?',
            options: ['증가하다', '감소하다 / 하락하다', '유지되다', '확대되다'],
            correctIndex: 1,
            explanation: '"감소하다" (decrease in quantity) and "하락하다" (drop in rate) replace "줄어들다".',
            exampleSentence: '종이 신문 구독자 수는 매년 감소하는 추세를 보이고 있다.',
          },
          {
            id: 3,
            spokenWord: '갑자기 많아지다',
            questionText: 'How do you express "sharply surged / skyrocketed" in 2 syllables?',
            options: ['급감하다', '급증하다', '정체되다', '소폭 오르다'],
            correctIndex: 1,
            explanation: '"급증하다" (급격히 증가하다) describes a steep upward spike in a chart.',
            exampleSentence: '비대면 서비스 이용률이 2020년 이후 급증하였다.',
          },
          {
            id: 4,
            spokenWord: '제일 높다',
            questionText: 'When ranking survey responses, what phrase means "occupied the highest share"?',
            options: ['가장 높은 비율을 차지하다', '가장 낮게 나타나다', '절반에 그치다', '변화가 없다'],
            correctIndex: 0,
            explanation: '"~이/가 가장 높은 비율을 차지했다" is the gold-standard Q53 ranking formula.',
            exampleSentence: '설문 조사 결과, 건강 관리가 45%로 가장 높은 비율을 차지하였다.',
          },
          {
            id: 5,
            spokenWord: '안 바뀌고 그대로다',
            questionText: 'Which verb describes a graph line that stays flat at the same level?',
            options: ['급락하다', '유지하다 / 머무르다', '폭등하다', '역전되다'],
            correctIndex: 1,
            explanation: '"일정한 수준을 유지하다" or "~에 머무르다" describes an unchanged figure.',
            exampleSentence: '2022년부터 2024년까지 수출액은 비슷한 수준을 유지하였다.',
          },
        ],
      },
      {
        id: 'qs-graph-s2',
        topicId: 'qt-graph-2',
        stepNumber: 2,
        title: 'Step 2: Adverbs of Degree & Opinon Verbs',
        passingScore: 3,
        authorName: 'Daw Su Su Kyi',
        authorRank: 'Rank #1 • Top Educator',
        questions: [
          {
            id: 1,
            spokenWord: '생각하다',
            questionText: 'In TOPIK Q54, how should you state an opinion instead of "생각하다"?',
            options: ['주장하다 / 여기다', '말하다', '보다', '듣다'],
            correctIndex: 0,
            explanation: 'Use "주장하다" (to claim) or "~라고 여겨진다" (is considered) for academic weight.',
            exampleSentence: '조기 교육보다 인성 교육이 더 중요하다고 주장한다.',
          },
          {
            id: 2,
            spokenWord: '조금 오르다',
            questionText: 'What is the formal statistical term for "rose slightly"?',
            options: ['대폭 상승하다', '소폭 상승하다', '급격히 하락하다', '절반으로 줄다'],
            correctIndex: 1,
            explanation: '"소폭" (small margin) and "대폭" (large margin) make Q53 descriptions precise.',
            exampleSentence: '전년 대비 실업률이 0.3%p 소폭 상승한 것으로 나타났다.',
          },
          {
            id: 3,
            spokenWord: '계속',
            questionText: 'Which adverb replaces "계속" (continuously / steadily) in trend graphs?',
            options: ['꾸준히 / 지속적으로', '간혹', '우연히', '갑자기'],
            correctIndex: 0,
            explanation: '"지속적으로" or "꾸준히" describes a steady multi-year trend.',
            exampleSentence: '친환경 자동차 판매량은 지난 5년간 지속적으로 증가하고 있다.',
          },
          {
            id: 4,
            spokenWord: '조사해 보니까',
            questionText: 'How should you open a Q53 paragraph summarizing survey results?',
            options: ['조사 결과에 따르면', '내 생각에는', '사람들이 말하길', '어제 보니까'],
            correctIndex: 0,
            explanation: '"~조사 결과에 따르면" (According to the survey results) is the standard Q53 opener.',
            exampleSentence: '소비자 만족도 조사 결과에 따르면 응답자의 70%가 긍정적으로 답했다.',
          },
          {
            id: 5,
            spokenWord: '앞으로 ~할 것 같다',
            questionText: 'How do you formally express a future projection at the end of Q53?',
            options: ['~할 것으로 전망되다', '~하면 좋겠다', '~할지도 모른다', '~하기 싫다'],
            correctIndex: 0,
            explanation: '"~할 것으로 전망되다 / 예상되다" is the formal passive structure for forecasts.',
            exampleSentence: '이러한 추세는 향후에도 계속될 것으로 전망된다.',
          },
        ],
      },
    ],
  },
];

