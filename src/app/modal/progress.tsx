import { useState } from 'react';
import { router } from 'expo-router';
import {
  LearningPage,
  LearningCard,
  LearningText,
  LearningButton,
  useLearningCopy,
} from '@/components/LearningUI';
import { useLearningLog } from '@/hooks/use-learning-log';
import { localDay } from '@/lib/review-scheduling';
import { useSaved } from '@/context/saved-context';
export default function Progress() {
  const [limit, setLimit] = useState(30);
  const { log, ready, error, refresh } = useLearningLog();
  const { drafts } = useSaved();
  const copy = useLearningCopy();
  const today = log.activities.filter((item) => localDay(new Date(item.at)) === localDay());
  const unique = new Set(today.map((item) => item.creditKey)).size;
  const revisions = drafts.filter((item) => item.metadata?.revision);
  return (
    <LearningPage
      title={copy('Learning history', 'လေ့ကျင့်မှုမှတ်တမ်း')}
      ready={ready}
      error={error}
      retry={refresh}
    >
      <LearningCard>
        <LearningText heading>
          {unique} {copy('distinct activities today', 'မျိုး ယနေ့လေ့ကျင့်ပြီး')}
        </LearningText>
        <LearningText>
          {copy(
            'Each word, quiz step, mistake note, or revision draft counts once per day here. History starts when you use these features on this device.',
            'စကားလုံး၊ မေးခွန်းအဆင့်၊ အမှားမှတ်စု၊ ပြင်ဆင်ထားသောစာ တစ်ခုစီကို တစ်နေ့လျှင် တစ်ကြိမ်သာ ရေတွက်သည်။ ဤလုပ်ဆောင်ချက်များကို စသုံးချိန်မှ မှတ်တမ်းစတင်သည်။',
          )}
        </LearningText>
      </LearningCard>
      <LearningText heading>{copy('Continue a revision', 'ပြင်ဆင်မှု ဆက်လုပ်ရန်')}</LearningText>
      {!revisions.length ? (
        <LearningText>
          {copy(
            'Open a feedback entry below to start a separate revision draft.',
            'အောက်ပါ သုံးသပ်ချက်တစ်ခုကို ဖွင့်၍ သီးခြားပြင်ဆင်စာမူ စတင်ပါ။',
          )}
        </LearningText>
      ) : null}
      {revisions.map((draft) => (
        <LearningButton
          key={draft.id}
          label={`${draft.title} · ${new Date(draft.updatedAt).toLocaleDateString()}`}
          onPress={() =>
            router.push({ pathname: '/modal/writing-revision', params: { draftId: draft.id } })
          }
        />
      ))}
      <LearningText heading>{copy('Writing feedback', 'စာရေးသုံးသပ်ချက်များ')}</LearningText>
      <LearningText>
        {copy(
          'AI scores are estimates. Contributors scores are recorded reviews. Q53 and Q54 have different scales; revisions have no new score until reviewed again.',
          'AI အမှတ်သည် ခန့်မှန်းချက်ဖြစ်သည်။ Contributors အမှတ်သည် သုံးသပ်ပေးထားသောအမှတ်ဖြစ်သည်။ Q53 နှင့် Q54 အမှတ်စနစ် မတူပါ။ ပြန်ပြင်ထားသောစာကို သုံးသပ်ချက်အသစ် မရမီ အမှတ်အသစ်မပေးပါ။',
        )}
      </LearningText>
      {!log.reviews.length ? (
        <LearningText>
          {copy(
            'No feedback recorded yet. Open existing AI feedback or refresh Contributors submissions to import it.',
            'သုံးသပ်ချက် မသိမ်းရသေးပါ။ ရှိပြီးသား AI သုံးသပ်ချက်ကိုဖွင့်ပါ သို့မဟုတ် Contributors သုံးသပ်ချက်များ ပြန်ရယူပါ။',
          )}
        </LearningText>
      ) : null}
      {[...log.reviews]
        .sort((a, b) => Date.parse(b.reviewedAt) - Date.parse(a.reviewedAt))
        .map((review) => (
          <LearningCard key={review.id}>
            <LearningText>
              {review.source === 'ai' ? copy('AI estimate', 'AI ခန့်မှန်းအမှတ်') : 'Contributors'} ·{' '}
              {review.questionType} · {review.score}/{review.maxScore}
            </LearningText>
            <LearningText heading>{review.topic}</LearningText>
            <LearningText>{new Date(review.reviewedAt).toLocaleString()}</LearningText>
            <LearningText>{review.summary}</LearningText>
            <LearningButton
              label={copy('Compare & revise', 'နှိုင်းယှဉ်၍ ပြင်ဆင်ရန်')}
              onPress={() =>
                router.push({
                  pathname: '/modal/writing-revision',
                  params: { reviewId: review.id },
                })
              }
            />
          </LearningCard>
        ))}
      <LearningText heading>{copy('Recent practice', 'မကြာသေးမီ လေ့ကျင့်မှုများ')}</LearningText>
      {!log.activities.length ? (
        <LearningText>
          {copy(
            'Completed practice will appear here.',
            'လေ့ကျင့်ပြီးသော မှတ်တမ်းများကို ဤနေရာတွင် ပြပါမည်။',
          )}
        </LearningText>
      ) : null}
      {log.activities.slice(0, limit).map((item) => (
        <LearningCard key={item.id}>
          <LearningText>
            {
              {
                vocab: copy('Vocabulary', 'စကားလုံး'),
                quiz: copy('Quiz', 'မေးခွန်း'),
                mistake: copy('Mistake practice', 'အမှားလေ့ကျင့်မှု'),
                revision: copy('Writing revision', 'စာပြင်ဆင်မှု'),
              }[item.kind]
            }{' '}
            · {new Date(item.at).toLocaleString()}
          </LearningText>
          <LearningText>
            {item.title}
            {item.score !== undefined ? ` · ${item.score}/${item.maxScore}` : ''}
          </LearningText>
        </LearningCard>
      ))}
      {log.activities.length > limit ? (
        <LearningButton
          label={copy('Show more practice', 'လေ့ကျင့်မှုများ ထပ်ကြည့်ရန်')}
          onPress={() => setLimit(limit + 30)}
        />
      ) : null}
      <LearningText>
        {copy(
          'History is stored on this device: up to 400 practice entries, 200 mistake notes, and 30 feedback entries. Revision drafts remain in Saved until you delete them.',
          'ဤစက်တွင် လေ့ကျင့်မှု ၄၀၀၊ အမှားမှတ်စု ၂၀၀ နှင့် သုံးသပ်ချက် ၃၀ အထိ သိမ်းထားသည်။ ပြင်ဆင်စာမူများကို မဖျက်မချင်း Saved တွင် သိမ်းထားသည်။',
        )}
      </LearningText>
    </LearningPage>
  );
}
