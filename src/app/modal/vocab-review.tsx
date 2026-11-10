import { useRef, useState } from 'react';
import { router } from 'expo-router';
import {
  LearningPage,
  LearningCard,
  LearningText,
  LearningButton,
  useLearningCopy,
} from '@/components/LearningUI';
import { useLearningLog } from '@/hooks/use-learning-log';
import { useSaved } from '@/context/saved-context';
import { useCurriculum } from '@/hooks/use-curriculum';
import { useAuth } from '@/context/auth-context';
import { LearningLogService } from '@/services/learning-log-service';
import { StreakService } from '@/services/streak-service';
import type { ReviewWord, RecallRating } from '@/types/learning';
export default function VocabReview() {
  const { user } = useAuth();
  const { log, ready, error, refresh } = useLearningLog();
  const { savedVocabIds } = useSaved();
  const { vocabularies, isLoading } = useCurriculum();
  const copy = useLearningCopy();
  const [revealedId, setRevealedId] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [now, setNow] = useState(Date.now());
  const words = savedVocabIds
    .map((id) => {
      const live = vocabularies.find((item) => item.id === id);
      return live
        ? { ...live, exampleKorean: live.exampleSentence.korean }
        : log.schedules[id]?.word;
    })
    .filter((word): word is ReviewWord => !!word);
  const due = words
    .filter((word) => !log.schedules[word.id] || Date.parse(log.schedules[word.id].dueAt) <= now)
    .sort(
      (a, b) =>
        Date.parse(log.schedules[a.id]?.dueAt || '1970-01-01') -
        Date.parse(log.schedules[b.id]?.dueAt || '1970-01-01'),
    );
  const word = due[0];
  const revealed = !!word && revealedId === word.id;
  async function rate(rating: RecallRating) {
    if (!word || !revealed || lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await LearningLogService.rateWord(word, rating, log.schedules[word.id]?.count || 0, user?.id);
      void StreakService.recordActivity(user?.id, `vocab:${word.id}`);
      setRevealedId('');
      setNotice(copy('Review saved.', 'လေ့ကျင့်မှုကို သိမ်းပြီးပါပြီ။'));
      setNow(Date.now());
    } catch {
      setNotice(copy('Could not save this review. Please retry.', 'သိမ်း၍မရပါ။ ပြန်ကြိုးစားပါ။'));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const next = words
    .map((word) => log.schedules[word.id]?.dueAt)
    .filter(Boolean)
    .sort()[0];
  return (
    <LearningPage
      title={copy('Vocabulary review', 'စကားလုံးများ ပြန်လေ့ကျင့်ရန်')}
      ready={ready && !isLoading}
      error={error}
      retry={refresh}
    >
      {notice ? <LearningText>{notice}</LearningText> : null}
      {word ? (
        <LearningCard>
          <LearningText>
            {due.length}{' '}
            {copy(
              'words due • recall the academic form',
              'လုံး လေ့ကျင့်ရန် • စာရေးအသုံးအနှုန်းကို စဉ်းစားပါ',
            )}
          </LearningText>
          <LearningText heading>{word.spoken}</LearningText>
          <LearningText>{copy(word.englishMeaning, word.myanmarMeaning)}</LearningText>
          {revealed ? (
            <>
              <LearningText heading>{word.written}</LearningText>
              <LearningText>{word.exampleKorean}</LearningText>
              <LearningText>
                {copy('How well did you recall it?', 'မည်မျှ မှတ်မိပါသလဲ။')}
              </LearningText>
              <LearningButton
                disabled={busy}
                label={copy('Again · 10 minutes', 'ထပ်လေ့ကျင့်မည် · ၁၀ မိနစ်')}
                onPress={() => rate('again')}
              />
              <LearningButton
                disabled={busy}
                label={copy('Hard · 1 day', 'ခက်သည် · ၁ ရက်')}
                onPress={() => rate('hard')}
              />
              <LearningButton
                disabled={busy}
                label={copy('Good · next interval', 'မှတ်မိသည် · နောက်အချိန်')}
                onPress={() => rate('good')}
              />
              <LearningButton
                disabled={busy}
                label={copy('Easy · longer interval', 'လွယ်သည် · ပိုကြာသောအချိန်')}
                onPress={() => rate('easy')}
              />
            </>
          ) : (
            <LearningButton
              label={copy('Reveal answer', 'အဖြေကြည့်ရန်')}
              onPress={() => setRevealedId(word.id)}
            />
          )}
        </LearningCard>
      ) : (
        <LearningCard>
          <LearningText heading>
            {copy('No words due right now', 'ယခု လေ့ကျင့်ရန်မရှိပါ')}
          </LearningText>
          <LearningText>
            {next
              ? `${copy('Next review', 'နောက်လေ့ကျင့်ချိန်')}: ${new Date(next).toLocaleString()}`
              : copy(
                  'Save words from the vocabulary library to build your review deck.',
                  'စကားလုံးများကို သိမ်းပြီး ပြန်လေ့ကျင့်နိုင်ပါသည်။',
                )}
          </LearningText>
          <LearningButton
            label={copy('Check again', 'ပြန်စစ်ရန်')}
            onPress={() => setNow(Date.now())}
          />
          <LearningButton
            label={copy('Browse vocabulary', 'စကားလုံးများ ကြည့်ရန်')}
            onPress={() => router.push('/(tabs)/learn')}
          />
        </LearningCard>
      )}
      {words.length < savedVocabIds.length ? (
        <LearningText>
          {copy(
            'Some saved words are unavailable. Refresh the vocabulary library to load them.',
            'သိမ်းထားသော စကားလုံးအချို့ မရရှိပါ။ စကားလုံးစာရင်းကို ပြန်ရယူပါ။',
          )}
        </LearningText>
      ) : null}
      <LearningText>
        {copy(
          'Good intervals: 1, 3, 7, 14, 30, then 60 days. Easy skips a stage; Again restarts the schedule. Only saved words enter this deck.',
          'မှတ်မိပါက ၁၊ ၃၊ ၇၊ ၁၄၊ ၃၀၊ ၆၀ ရက်ကြား ပြန်လေ့ကျင့်ပါမည်။ လွယ်သည်ဆိုပါက အဆင့်တစ်ဆင့်ကျော်ပြီး ထပ်လေ့ကျင့်မည်ဆိုပါက အစမှပြန်စပါမည်။',
        )}
      </LearningText>
    </LearningPage>
  );
}
