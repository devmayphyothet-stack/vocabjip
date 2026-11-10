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
export default function LearningHub() {
  const { log, ready, error, refresh } = useLearningLog();
  const { savedVocabIds } = useSaved();
  const copy = useLearningCopy();
  const due = savedVocabIds.filter(
    (id) => !log.schedules[id] || Date.parse(log.schedules[id].dueAt) <= Date.now(),
  ).length;
  const mistakes = Object.values(log.mistakes).filter((item) => item.status === 'open').length;
  return (
    <LearningPage
      title={copy('Review & progress', 'ပြန်လေ့ကျင့်မှုနှင့် တိုးတက်မှု')}
      ready={ready}
      error={error}
      retry={refresh}
    >
      <LearningCard>
        <LearningText heading>
          {copy('Vocabulary review', 'စကားလုံးများ ပြန်လေ့ကျင့်ရန်')}
        </LearningText>
        <LearningText>
          {due} {copy('saved words due', 'လုံး ပြန်လေ့ကျင့်ရန်ရှိသည်')}
        </LearningText>
        <LearningButton
          label={copy('Review words', 'စကားလုံးများ လေ့ကျင့်ရန်')}
          onPress={() => router.push('/modal/vocab-review')}
        />
      </LearningCard>
      <LearningCard>
        <LearningText heading>{copy('Mistake notebook', 'အမှားမှတ်စု')}</LearningText>
        <LearningText>
          {mistakes} {copy('notes to practise', 'ခု ပြန်လေ့ကျင့်ရန်ရှိသည်')}
        </LearningText>
        <LearningButton
          label={copy('Practise mistakes', 'အမှားများ ပြန်လေ့ကျင့်ရန်')}
          onPress={() => router.push('/modal/mistakes')}
        />
      </LearningCard>
      <LearningCard>
        <LearningText heading>{copy('Writing revisions', 'စာရေးသားမှု ပြင်ဆင်ခြင်း')}</LearningText>
        <LearningText>
          {copy(
            'Open saved AI feedback and Contributors reviews to revise the original.',
            'သိမ်းထားသော AI နှင့် Contributors သုံးသပ်ချက်များမှ မူရင်းစာကို ပြန်ပြင်ပါ။',
          )}
        </LearningText>
        <LearningButton
          label={copy('Writing feedback & history', 'စာရေးသုံးသပ်ချက်နှင့် မှတ်တမ်း')}
          onPress={() => router.push('/modal/progress')}
        />
        <LearningButton
          label={copy('Refresh Contributors feedback', 'Contributors သုံးသပ်ချက်များ ပြန်ရယူရန်')}
          onPress={() => router.push('/modal/contributor-review')}
        />
      </LearningCard>
      <LearningText>
        {copy(
          'Learning history and review schedules stay on this device for this account. They are not synced between devices.',
          'လေ့ကျင့်မှုမှတ်တမ်းနှင့် အချိန်ဇယားကို ဤအကောင့်အတွက် ဤစက်တွင်သာ သိမ်းထားသည်။ အခြားစက်များနှင့် မချိတ်ဆက်ပါ။',
        )}
      </LearningText>
    </LearningPage>
  );
}
