import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  FolderPlus,
  Layers,
  Lock,
  Plus,
  RefreshCw,
  Save,
  Send,
  UserCheck,
  X
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/auth-context';
import { supabase } from '../lib/supabase';
import { QuizQuestionItem, QuizStepRecord, QuizTopicRecord } from '../types';

const QUIZ_CATEGORIES = [
  'Cause & Effect',
  'Contrast',
  'Q53 Graph Trends',
  'Q54 Essay Connectors',
  'Academic Verbs',
  'Society & Culture',
  'Education & Economy',
  'General TOPIK II',
];

function createEmptyFiveQuestions(): QuizQuestionItem[] {
  return [1, 2, 3, 4, 5].map((num) => ({
    id: num,
    spokenWord: '',
    questionText: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    explanation: '',
    exampleSentence: '',
  }));
}

export function QuizStudioView({ onSubmitted }: { onSubmitted?: () => void }) {
  const { user } = useAuth();

  const [topics, setTopics] = useState<QuizTopicRecord[]>([]);
  const [steps, setSteps] = useState<QuizStepRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRankLabel, setMyRankLabel] = useState<string>('Contributor');

  // Create New Topic Modal state
  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicMyanmar, setNewTopicMyanmar] = useState('');
  const [newTopicCategory, setNewTopicCategory] = useState(QUIZ_CATEGORIES[0]);
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [creatingTopic, setCreatingTopic] = useState(false);

  // Active Step Editor state
  const [selectedTopic, setSelectedTopic] = useState<QuizTopicRecord | null>(null);
  const [editingStep, setEditingStep] = useState<QuizStepRecord | null>(null);
  const [stepNumber, setStepNumber] = useState<number>(1);
  const [stepTitle, setStepTitle] = useState<string>('');
  const [questions, setQuestions] = useState<QuizQuestionItem[]>(createEmptyFiveQuestions());
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchBoardData = async () => {
    setLoading(true);
    try {
      const [{ data: tData }, { data: sData }, { data: vData }, { data: pData }, { data: profData }] =
        await Promise.all([
          supabase.from('quiz_topics').select('*').order('created_at', { ascending: false }),
          supabase.from('quiz_steps').select('*').order('step_number', { ascending: true }),
          supabase.from('vocabularies').select('id, created_by, status'),
          supabase.from('sentence_patterns').select('id, created_by, status'),
          supabase.from('profiles').select('id, display_name, email, role'),
        ]);

      if (tData) setTopics(tData as QuizTopicRecord[]);
      if (sData) setSteps(sData as QuizStepRecord[]);

      // Compute current contributor's dynamic rank on the leaderboard
      if (user && profData) {
        const scores: Record<string, { id: string; role: string; score: number }> = {};
        profData.forEach((p: any) => {
          scores[p.id] = { id: p.id, role: p.role || 'user', score: 0 };
        });

        (vData || []).forEach((v: any) => {
          if (v.created_by && scores[v.created_by]) {
            if (v.status === 'approved') scores[v.created_by].score += 10;
            if (v.status === 'pending_review') scores[v.created_by].score += 2;
          }
        });

        (pData || []).forEach((p: any) => {
          if (p.created_by && scores[p.created_by]) {
            if (p.status === 'approved') scores[p.created_by].score += 15;
            if (p.status === 'pending_review') scores[p.created_by].score += 2;
          }
        });

        (sData || []).forEach((s: any) => {
          if (s.created_by && scores[s.created_by]) {
            if (s.status === 'approved') scores[s.created_by].score += 25;
            if (s.status === 'pending_review') scores[s.created_by].score += 5;
          }
        });

        const contributors = Object.values(scores)
          .filter((c) => c.role === 'contributor')
          .sort((a, b) => b.score - a.score);

        const myIdx = contributors.findIndex((c) => c.id === user.id);
        if (myIdx !== -1) {
          const rankNum = myIdx + 1;
          const myScore = contributors[myIdx].score;
          if (rankNum === 1 && myScore > 0) setMyRankLabel('Rank #1 • Top Educator');
          else if (rankNum <= 3 && myScore > 0) setMyRankLabel(`Rank #${rankNum} • Senior Contributor`);
          else setMyRankLabel(`Rank #${rankNum} • Contributor`);
        } else {
          setMyRankLabel('Contributor');
        }
      }
    } catch (e) {
      console.warn('Error loading quiz studio board:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoardData();
  }, [user]);

  // Create a new Topic and automatically claim Step 1 in draft mode so others see it's claimed
  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim() || !newTopicMyanmar.trim()) {
      setErrorMessage('ကျေးဇူးပြု၍ Topic Title နှင့် မြန်မာခေါင်းစဉ်ကို ထည့်သွင်းပေးပါ။');
      return;
    }

    setCreatingTopic(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const topicId = `qt-${Date.now().toString(36)}`;
      const authorName = user?.display_name || user?.email?.split('@')[0] || 'Contributor';

      const newTopicObj: QuizTopicRecord = {
        id: topicId,
        title: newTopicTitle.trim(),
        myanmar_title: newTopicMyanmar.trim(),
        category: newTopicCategory,
        description: newTopicDesc.trim(),
        created_by: user?.id || null,
        author_name: authorName,
        author_rank: myRankLabel,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: tErr } = await supabase.from('quiz_topics').insert({
        id: newTopicObj.id,
        title: newTopicObj.title,
        myanmar_title: newTopicObj.myanmar_title,
        category: newTopicObj.category,
        description: newTopicObj.description,
        created_by: newTopicObj.created_by,
        author_name: newTopicObj.author_name,
        author_rank: newTopicObj.author_rank,
      });

      if (tErr) throw tErr;

      // Immediately reserve Step 1 as 'draft' so other contributors see this topic/step is being written
      const stepId = `qs-${Date.now().toString(36)}-s1`;
      const initialQuestions = createEmptyFiveQuestions();
      const defaultStepTitle = 'Step 1: Foundation & Core Expressions';

      const { error: sErr } = await supabase.from('quiz_steps').insert({
        id: stepId,
        topic_id: topicId,
        step_number: 1,
        title: defaultStepTitle,
        passing_score: 3,
        questions: initialQuestions,
        status: 'draft',
        created_by: user?.id || null,
        author_name: authorName,
        author_rank: myRankLabel,
      });

      if (sErr) throw sErr;

      setShowNewTopicModal(false);
      setNewTopicTitle('');
      setNewTopicMyanmar('');
      setNewTopicDesc('');

      await fetchBoardData();

      // Open editor for Step 1 of this new topic
      setSelectedTopic(newTopicObj);
      setEditingStep({
        id: stepId,
        topic_id: topicId,
        step_number: 1,
        title: defaultStepTitle,
        passing_score: 3,
        questions: initialQuestions,
        status: 'draft',
        created_by: user?.id || null,
        author_name: authorName,
        author_rank: myRankLabel,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setStepNumber(1);
      setStepTitle(defaultStepTitle);
      setQuestions(initialQuestions);
      setActiveQuestionIdx(0);
      setSuccessMessage('✨ Topic အသစ်ဖန်တီးပြီး Step 1 ကို သင့်နာမည်ဖြင့် Reserve (Claim) လုပ်ပြီးပါပြီ။ မေးခွန်း ၅ ပုဒ် စတင်ရေးသားနိုင်ပါပြီ။');
    } catch (err: any) {
      setErrorMessage(err.message || 'Topic ဖန်တီးရာတွင် အမှားအယွင်းရှိနေပါသည်။');
    } finally {
      setCreatingTopic(false);
    }
  };

  // Claim next step on an existing topic
  const handleClaimNextStep = async (topic: QuizTopicRecord) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const topicSteps = steps.filter((s) => s.topic_id === topic.id);
    const maxStep = topicSteps.reduce((max, s) => (s.step_number > max ? s.step_number : max), 0);
    const nextStepNum = maxStep + 1;
    const stepId = `qs-${Date.now().toString(36)}-s${nextStepNum}`;
    const authorName = user?.display_name || user?.email?.split('@')[0] || 'Contributor';
    const defaultTitle = `Step ${nextStepNum}: Level ${nextStepNum} Practice`;
    const initialQuestions = createEmptyFiveQuestions();

    try {
      const { error } = await supabase.from('quiz_steps').insert({
        id: stepId,
        topic_id: topic.id,
        step_number: nextStepNum,
        title: defaultTitle,
        passing_score: 3,
        questions: initialQuestions,
        status: 'draft',
        created_by: user?.id || null,
        author_name: authorName,
        author_rank: myRankLabel,
      });

      if (error) throw error;

      await fetchBoardData();

      setSelectedTopic(topic);
      setEditingStep({
        id: stepId,
        topic_id: topic.id,
        step_number: nextStepNum,
        title: defaultTitle,
        passing_score: 3,
        questions: initialQuestions,
        status: 'draft',
        created_by: user?.id || null,
        author_name: authorName,
        author_rank: myRankLabel,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setStepNumber(nextStepNum);
      setStepTitle(defaultTitle);
      setQuestions(initialQuestions);
      setActiveQuestionIdx(0);
      setSuccessMessage(`📌 "${topic.title}" ၏ Step ${nextStepNum} ကို သင့်နာမည်ဖြင့် Claim လုပ်ပြီးပါပြီ။`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Step အသစ်ယူရာတွင် အမှားအယွင်းရှိနေပါသည်။');
    }
  };

  // Open an existing step that belongs to the current contributor
  const handleOpenMyStep = (topic: QuizTopicRecord, step: QuizStepRecord) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setSelectedTopic(topic);
    setEditingStep(step);
    setStepNumber(step.step_number);
    setStepTitle(step.title);

    const loadedQuestions =
      Array.isArray(step.questions) && step.questions.length === 5
        ? step.questions
        : createEmptyFiveQuestions();
    setQuestions(loadedQuestions);
    setActiveQuestionIdx(0);
  };

  const updateCurrentQuestion = (patch: Partial<QuizQuestionItem>) => {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === activeQuestionIdx ? { ...q, ...patch } : q))
    );
  };

  const updateCurrentOption = (optIdx: number, val: string) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== activeQuestionIdx) return q;
        const nextOpts = [...q.options];
        nextOpts[optIdx] = val;
        return { ...q, options: nextOpts };
      })
    );
  };

  const isQuestionComplete = (q: QuizQuestionItem) => {
    return (
      q.spokenWord.trim().length > 0 &&
      q.questionText.trim().length > 0 &&
      q.options.length === 4 &&
      q.options.every((o) => o.trim().length > 0) &&
      q.explanation.trim().length > 0 &&
      q.exampleSentence.trim().length > 0
    );
  };

  const handleSaveStep = async (targetStatus: 'draft' | 'pending_review') => {
    if (!selectedTopic || !editingStep) return;

    if (!stepTitle.trim()) {
      setErrorMessage('ကျေးဇူးပြု၍ Step Title ကို ထည့်သွင်းပေးပါ။');
      return;
    }

    if (targetStatus === 'pending_review') {
      const incompleteIdx = questions.findIndex((q) => !isQuestionComplete(q));
      if (incompleteIdx !== -1) {
        setActiveQuestionIdx(incompleteIdx);
        setErrorMessage(
          `မေးခွန်း (Question ${incompleteIdx + 1}) တွင် အချက်အလက်များ မပြည့်စုံသေးပါ။ မေးခွန်း ၅ ပုဒ်လုံး ပြည့်စုံမှ Admin ထံ ပေးပို့နိုင်ပါမည်။`
        );
        return;
      }
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const authorName = user?.display_name || user?.email?.split('@')[0] || 'Contributor';
      const { error } = await supabase
        .from('quiz_steps')
        .update({
          title: stepTitle.trim(),
          passing_score: 3, // Fixed requirement: at least 3 out of 5 correct to unlock next step
          questions,
          status: targetStatus,
          author_name: authorName,
          author_rank: myRankLabel,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingStep.id);

      if (error) throw error;

      await fetchBoardData();
      if (onSubmitted) onSubmitted();

      if (targetStatus === 'pending_review') {
        setSuccessMessage(
          '✅ မေးခွန်း ၅ ပုဒ်ပါဝင်သော Quiz Step ကို Admin စစ်ဆေးအတည်ပြုရန် အောင်မြင်စွာ ပေးပို့ပြီးပါပြီ! Admin Approve လုပ်ပြီးပါက Mobile App ပေါ်သို့ သင့် Display Name & Rank နှင့်တကွ ရောက်ရှိသွားပါမည်။'
        );
        setSelectedTopic(null);
        setEditingStep(null);
      } else {
        setSuccessMessage('💾 Draft အဖြစ် သိမ်းဆည်းပြီးပါပြီ။ အခြား Contributor များက သင်ရေးသားနေဆဲဖြစ်ကြောင်း မြင်တွေ့ရပါမည်။');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Quiz သိမ်းဆည်းရာတွင် အမှားအယွင်းရှိနေပါသည်။');
    } finally {
      setSubmitting(false);
    }
  };

  const currentQ = questions[activeQuestionIdx] || createEmptyFiveQuestions()[0];
  const completedCount = questions.filter(isQuestionComplete).length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Dynamic Quiz & Topic Studio
            </h1>
            {/* <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              {myRankLabel}
            </span> */}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Contributor များ စိတ်ကြိုက် Topic အသစ်ဖန်တီးနိုင်ပြီး တစ်ဦးရေးသားနေသော Topic/Step ကို အခြားသူများ တိုက်ရိုက်မြင်တွေ့နိုင်ပါသည်။
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchBoardData}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Board</span>
          </button>

          <button
            onClick={() => setShowNewTopicModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition">
            <FolderPlus className="w-4 h-4" />
            <span>+ Create New Quiz Topic</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-sm font-semibold">{successMessage}</p>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-sm font-semibold">{errorMessage}</p>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-600 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* If editing a step, show the 5-Question Step Builder */}
      {selectedTopic && editingStep ? (
        <div className="space-y-6">
          {/* Active Step Header Banner */}
          <div className="bg-white rounded-2xl border border-blue-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
                <span>Topic: {selectedTopic.title}</span>
                <span>•</span>
                <span>{selectedTopic.category}</span>
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  Step {stepNumber} (5 Questions • Pass: 3/5)
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-slate-900">
                {selectedTopic.myanmar_title} — Step {stepNumber} ရေးသားနေသည်
              </h2>
              <p className="text-xs text-slate-500">
                Author Attribution on App:{' '}
                <strong className="text-slate-800">
                  {user?.display_name || 'Contributor'}
                  {/* ({myRankLabel}) */}
                </strong>
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedTopic(null);
                setEditingStep(null);
              }}
              className="self-start md:self-auto px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 transition">
              ← Back to Topic Coordination Board
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left 2 Columns: Step Title + 5 Question Tabs + Question Form */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              {/* Step Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Step {stepNumber} Title (အဆင့်ခေါင်းစဉ်) *
                </label>
                <input
                  type="text"
                  value={stepTitle}
                  onChange={(e) => setStepTitle(e.target.value)}
                  placeholder="e.g. Step 1: Essential Cause & Effect Connectors"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-900"
                />
              </div>

              {/* 5 Question Selector Pills */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 uppercase">
                    5 Required Questions ({completedCount}/5 Completed)
                  </span>
                  <span className="text-emerald-700 font-semibold">
                    Passing Requirement: 3 / 5 Correct
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, idx) => {
                    const done = isQuestionComplete(q);
                    const isCurrent = idx === activeQuestionIdx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveQuestionIdx(idx)}
                        className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition ${isCurrent
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : done
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}>
                        <span>Q{idx + 1}</span>
                        {done && (
                          <CheckCircle2
                            className={`w-3.5 h-3.5 ${isCurrent ? 'text-white' : 'text-emerald-600'}`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question Form Fields */}
              <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <span className="text-xs font-extrabold uppercase text-blue-700 tracking-wider">
                    Editing Question {activeQuestionIdx + 1} of 5
                  </span>
                  <span className="text-[11px] text-slate-400">
                    All 4 options & explanation required
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Prompt / Target Word *
                    </label>
                    <input
                      type="text"
                      value={currentQ.spokenWord}
                      onChange={(e) => updateCurrentQuestion({ spokenWord: e.target.value })}
                      placeholder="e.g. 그래서 / 늘어나다"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Question Text (မေးခွန်းစာသား) *
                    </label>
                    <input
                      type="text"
                      value={currentQ.questionText}
                      onChange={(e) => updateCurrentQuestion({ questionText: e.target.value })}
                      placeholder='e.g. "그래서" ၏ TOPIK စာစီစာကုံးသုံး အဆင့်မြင့်စကားလုံးမှာ အဘယ်နည်း?'
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                    />
                  </div>
                </div>

                {/* 4 Options with radio button for Correct Answer */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    4 Answer Choices (အဖြေမှန်ဘေးရှိ အဝိုင်းကို နှိပ်၍ ရွေးပေးပါ) *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[0, 1, 2, 3].map((optIdx) => {
                      const isCorrect = currentQ.correctIndex === optIdx;
                      return (
                        <div
                          key={optIdx}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition ${isCorrect
                              ? 'bg-emerald-50/70 border-emerald-400'
                              : 'bg-white border-slate-200'
                            }`}>
                          <button
                            type="button"
                            onClick={() => updateCurrentQuestion({ correctIndex: optIdx })}
                            className={`w-7 h-7 rounded-full text-xs font-extrabold flex items-center justify-center shrink-0 transition ${isCorrect
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            title="Mark as correct answer">
                            {String.fromCharCode(65 + optIdx)}
                          </button>
                          <input
                            type="text"
                            value={currentQ.options[optIdx] || ''}
                            onChange={(e) => updateCurrentOption(optIdx, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                            className="w-full text-sm font-medium bg-transparent focus:outline-none text-slate-900"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Explanation & Example Sentence */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Explanation (ရှင်းလင်းချက် - ဖြေပြီးချိန်ပြရန်) *
                    </label>
                    <textarea
                      rows={2}
                      value={currentQ.explanation}
                      onChange={(e) => updateCurrentQuestion({ explanation: e.target.value })}
                      placeholder='e.g. "따라서" သို့မဟုတ် "그러므로" သည် အကြောင်းအကျိုးဆက်စပ်ရာတွင် သုံးသော အရေးအသားသုံး စကားလုံးဖြစ်သည်။'
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Example Usage Sentence (ဥပမာ ဝါကျ) *
                    </label>
                    <textarea
                      rows={2}
                      value={currentQ.exampleSentence}
                      onChange={(e) => updateCurrentQuestion({ exampleSentence: e.target.value })}
                      placeholder="e.g. 인터넷 사용자가 급증했다. 따라서 정보 보안이 더욱 중요해졌다."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>
                </div>

                {/* Prev / Next Question Navigation */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    disabled={activeQuestionIdx === 0}
                    onClick={() => setActiveQuestionIdx((i) => Math.max(0, i - 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 disabled:opacity-40">
                    ← Previous Question
                  </button>
                  <button
                    type="button"
                    disabled={activeQuestionIdx === 4}
                    onClick={() => setActiveQuestionIdx((i) => Math.min(4, i + 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-blue-600 disabled:opacity-40">
                    Next Question →
                  </button>
                </div>
              </div>

              {/* Action Buttons (No direct publish for contributors — only Save Draft or Submit for Admin Approval) */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSaveStep('draft')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 transition">
                  <Save className="w-4 h-4" />
                  <span>Save Draft (Keep Claimed)</span>
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSaveStep('pending_review')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition">
                  <Send className="w-4 h-4" />
                  <span>Submit 5-Question Step for Admin Review</span>
                </button>
              </div>
            </div>

            {/* Right Column: Mobile App Preview with Contributor Name & Rank */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 sticky top-24">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                  Mobile Quiz Preview
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Pass: 3/5 Correct
                </span>
              </div>

              {/* Mobile Mockup Card */}
              <div className="rounded-2xl bg-[#FAF8F5] border border-slate-200 p-4 space-y-3.5">
                {/* Contributor Attribution Pill */}
                <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-extrabold text-xs">
                      {(user?.display_name || 'C')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-[11px] font-extrabold text-slate-900 leading-tight">
                        {user?.display_name || 'Contributor'}
                      </div>
                      {/* <div className="text-[10px] font-bold text-amber-700 flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        <span>{myRankLabel}</span>
                      </div> */}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    Step {stepNumber}
                  </span>
                </div>

                {/* Question Preview */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="text-xs font-extrabold text-blue-600">
                    "{currentQ.spokenWord || '그래서'}"
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {currentQ.questionText || 'Question text will appear here...'}
                  </div>
                </div>

                {/* Options Preview */}
                <div className="space-y-2">
                  {currentQ.options.map((opt, idx) => {
                    const isAns = currentQ.correctIndex === idx;
                    return (
                      <div
                        key={idx}
                        className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2.5 ${isAns
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                            : 'bg-white border-slate-200 text-slate-700'
                          }`}>
                        <span
                          className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${isAns ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{opt || `Option ${String.fromCharCode(65 + idx)}`}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Shared Topic & Step Coordination Board */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Shared Topic Coordination Board ({topics.length} Topics)
              </h2>
              <p className="text-xs text-slate-500">
                အခြား Contributor များ ရွေးချယ်ရေးသားနေသော Topic နှင့် Step များကို ကြည့်ရှုပြီး မထပ်စေဘဲ Topic အသစ် သို့မဟုတ် နောက်ထပ် Step အသစ်ကို ရွေးချယ်ရေးသားနိုင်ပါသည်။
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
              Loading shared quiz topics...
            </div>
          ) : topics.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">No Quiz Topics Created Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                ပထမဆုံး Quiz Topic ကို စတင်ဖန်တီးပြီး Step 1 (မေးခွန်း ၅ ပုဒ်) ကို ရေးသားနိုင်ပါပြီ။
              </p>
              <button
                onClick={() => setShowNewTopicModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xs hover:bg-blue-700 transition">
                <Plus className="w-4 h-4" />
                <span>Create First Topic</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {topics.map((topic) => {
                const topicSteps = steps
                  .filter((s) => s.topic_id === topic.id)
                  .sort((a, b) => a.step_number - b.step_number);

                return (
                  <div
                    key={topic.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 mb-1.5">
                            {topic.category}
                          </span>
                          <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                            {topic.title}
                          </h3>
                          <p className="text-xs font-semibold text-slate-600 mt-0.5">
                            {topic.myanmar_title}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-[10px] text-slate-400 uppercase font-bold">
                            Topic Started By
                          </div>
                          <div className="text-xs font-bold text-slate-800">
                            {topic.author_name}
                          </div>
                          {/* <div className="text-[10px] font-semibold text-amber-700">
                            {topic.author_rank}
                          </div> */}
                        </div>
                      </div>

                      {topic.description && (
                        <p className="text-xs text-slate-500">{topic.description}</p>
                      )}

                      {/* Steps List inside this Topic */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Steps under this topic ({topicSteps.length})
                        </div>

                        {topicSteps.length === 0 ? (
                          <div className="text-xs text-slate-400 italic py-2">
                            No steps claimed yet.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {topicSteps.map((st) => {
                              const isMine = st.created_by === user?.id;
                              const qDone = Array.isArray(st.questions)
                                ? st.questions.filter(isQuestionComplete).length
                                : 0;

                              return (
                                <div
                                  key={st.id}
                                  className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${isMine
                                      ? 'bg-blue-50/40 border-blue-200'
                                      : 'bg-slate-50 border-slate-200/80'
                                    }`}>
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <span className="font-extrabold text-slate-900">
                                        Step {st.step_number}: {st.title}
                                      </span>
                                      {st.status === 'approved' && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                          ✅ Live on App
                                        </span>
                                      )}
                                      {st.status === 'pending_review' && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                          ⏳ Pending Admin Review
                                        </span>
                                      )}
                                      {st.status === 'draft' && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                          ✍️ In Progress ({qDone}/5 Qs)
                                        </span>
                                      )}
                                      {st.status === 'rejected' && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                                          ⚠️ Needs Revision
                                        </span>
                                      )}
                                    </div>

                                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                                      <UserCheck className="w-3 h-3 text-slate-400" />
                                      <span>
                                        Claimed by:{' '}
                                        <strong className="text-slate-700">{st.author_name}</strong>
                                        {/* ({st.author_rank}) */}
                                      </span>
                                    </div>

                                    {st.status === 'rejected' && st.rejection_reason && isMine && (
                                      <p className="text-[11px] text-red-600 font-semibold mt-1">
                                        Admin Note: {st.rejection_reason}
                                      </p>
                                    )}
                                  </div>

                                  {isMine && st.status !== 'approved' ? (
                                    <button
                                      onClick={() => handleOpenMyStep(topic, st)}
                                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 shrink-0 transition">
                                      <Edit3 className="w-3 h-3" />
                                      <span>{st.status === 'draft' ? 'Continue' : 'Edit'}</span>
                                    </button>
                                  ) : (
                                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 shrink-0">
                                      <Lock className="w-3 h-3" />
                                      <span>{isMine ? 'Published' : 'Reserved'}</span>
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Add Next Step Button */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        Each step requires 5 questions (3/5 to unlock next)
                      </span>
                      <button
                        onClick={() => handleClaimNextStep(topic)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition">
                        <Plus className="w-3.5 h-3.5" />
                        <span>Claim Step {topicSteps.length + 1}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Create New Topic */}
      {showNewTopicModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Create New Quiz Topic</h3>
                <p className="text-xs text-slate-500">
                  Topic အသစ်ဖန်တီးလိုက်သည်နှင့် အခြား Contributor များက သင်ယူထားကြောင်း ချက်ချင်းမြင်ရပါမည်။
                </p>
              </div>
              <button
                onClick={() => setShowNewTopicModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTopic} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Topic Title (Korean / English) *
                </label>
                <input
                  type="text"
                  required
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  placeholder="e.g. Q53 Graph Verbs & Trends (그래프 동사)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Myanmar Title (မြန်မာခေါင်းစဉ်) *
                </label>
                <input
                  type="text"
                  required
                  value={newTopicMyanmar}
                  onChange={(e) => setNewTopicMyanmar(e.target.value)}
                  placeholder="e.g. Q53 ဂရပ်ဖ်အတက်အကျပြ ကြိယာများ လေ့ကျင့်ခန်း"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Category *
                </label>
                <select
                  value={newTopicCategory}
                  onChange={(e) => setNewTopicCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {QUIZ_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Short Description (အကြောင်းအရာ အကျဉ်းချုပ်)
                </label>
                <textarea
                  rows={2}
                  value={newTopicDesc}
                  onChange={(e) => setNewTopicDesc(e.target.value)}
                  placeholder="e.g. Master essential verbs like 증가하다, 감소하다, 급증하다 for TOPIK II Q53."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowNewTopicModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTopic}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs">
                  {creatingTopic ? 'Creating...' : 'Create Topic & Claim Step 1'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

