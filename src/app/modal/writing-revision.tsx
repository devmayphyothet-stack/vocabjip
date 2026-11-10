import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  LearningPage,
  LearningCard,
  LearningText,
  LearningButton,
  useLearningColors,
  useLearningCopy,
} from '@/components/LearningUI';
import { useLearningLog } from '@/hooks/use-learning-log';
import { useSaved, SavedDraft } from '@/context/saved-context';
import { useAuth } from '@/context/auth-context';
import { useWritingRecovery } from '@/hooks/use-writing-recovery';
import { createDraftId } from '@/lib/draft-utils';
import { applyWritingCorrection } from '@/lib/review-scheduling';
import { LearningLogService } from '@/services/learning-log-service';
import { StreakService } from '@/services/streak-service';
import type { WritingReview } from '@/types/learning';
export default function WritingRevision() {
  const params = useLocalSearchParams<{ reviewId?: string; draftId?: string }>();
  const { drafts } = useSaved();
  const { log, ready, error, refresh } = useLearningLog();
  const copy = useLearningCopy();
  const draft = drafts.find((item) => item.id === params.draftId);
  const review =
    draft?.metadata?.revision?.review || log.reviews.find((item) => item.id === params.reviewId);
  if (!ready || error || !review)
    return (
      <LearningPage
        title={copy('Writing revision', 'စာရေးသားမှု ပြင်ဆင်ခြင်း')}
        ready={ready}
        error={error}
        retry={refresh}
      >
        <LearningText>
          {copy(
            'This feedback is no longer available. Open another feedback entry from history.',
            'ဤသုံးသပ်ချက် မရရှိတော့ပါ။ မှတ်တမ်းမှ အခြားသုံးသပ်ချက်ကို ဖွင့်ပါ။',
          )}
        </LearningText>
      </LearningPage>
    );
  return <RevisionEditor key={draft?.id || review.id} review={review} existing={draft} />;
}
function RevisionEditor({ review, existing }: { review: WritingReview; existing?: SavedDraft }) {
  const c = useLearningColors();
  const copy = useLearningCopy();
  const { user } = useAuth();
  const { saveDraft } = useSaved();
  const recovery = useWritingRecovery();
  const id = useRef(existing?.id || createDraftId());
  const [started, setStarted] = useState(!!existing);
  const [text, setText] = useState(existing?.content ?? review.originalText);
  const [applied, setApplied] = useState(existing?.metadata?.revision?.appliedCorrections || []);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  function draft(value = text, corrections = applied) {
    return {
      id: id.current,
      type: review.questionType,
      title: existing?.title || `${review.topic} · Revision`,
      content: value,
      charCount: value.length,
      metadata: { ...existing?.metadata, revision: { review, appliedCorrections: corrections } },
    };
  }
  function change(value: string, corrections = applied) {
    setStarted(true);
    setText(value);
    setApplied(corrections);
    recovery.update(draft(value, corrections));
  }
  async function save(action: 'save' | 'finish' | 'ai' | 'contributors') {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setNotice('');
    try {
      await recovery.flush();
      await saveDraft(draft());
      setStarted(true);
      if (action === 'finish') {
        await LearningLogService.completeRevision(review, id.current, text, user?.id);
        void StreakService.recordActivity(user?.id, `revision:${id.current}`);
        setNotice(
          copy(
            'Revision recorded. It has no new score until reviewed again.',
            'ပြင်ဆင်မှုကို မှတ်တမ်းတင်ပြီးပါပြီ။ သုံးသပ်ချက်အသစ်မရမီ အမှတ်အသစ်မရှိပါ။',
          ),
        );
      } else if (action === 'ai' || action === 'contributors')
        router.push({
          pathname: action === 'ai' ? '/modal/ai-feedback' : '/modal/contributor-review',
          params: {
            draftId: id.current,
            questionType: review.questionType,
            promptTopic: review.topic,
          },
        });
      else
        setNotice(
          copy(
            'Revision saved separately. Your original is preserved.',
            'သီးခြားစာမူအဖြစ် သိမ်းပြီးပါပြီ။ မူရင်းစာကို ထိန်းသိမ်းထားပါသည်။',
          ),
        );
    } catch (e) {
      setNotice(
        e instanceof Error
          ? e.message
          : copy('Could not save. Please retry.', 'သိမ်း၍မရပါ။ ပြန်ကြိုးစားပါ။'),
      );
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LearningPage title={copy('Writing revision', 'စာရေးသားမှု ပြင်ဆင်ခြင်း')}>
        <LearningText>
          {review.source === 'ai' ? copy('AI estimate', 'AI ခန့်မှန်းအမှတ်') : 'Contributors'} ·{' '}
          {review.questionType} · {review.score}/{review.maxScore}
        </LearningText>
        <LearningText heading>{review.topic}</LearningText>
        <LearningCard>
          <LearningText heading>{copy('Original writing', 'မူရင်းစာ')}</LearningText>
          <LearningText>{review.originalText}</LearningText>
        </LearningCard>
        <LearningCard>
          <LearningText heading>{copy('Feedback', 'သုံးသပ်ချက်')}</LearningText>
          <LearningText>{review.summary}</LearningText>
          {review.corrections.map((correction, index) => {
            const key = String(index);
            return (
              <LearningCard key={key}>
                <LearningText>
                  {correction.original} → {correction.corrected}
                </LearningText>
                <LearningText>{correction.explanation}</LearningText>
                <LearningButton
                  disabled={busy || applied.includes(key)}
                  label={
                    applied.includes(key)
                      ? copy('Applied', 'ပြင်ဆင်ပြီး')
                      : copy('Apply suggestion', 'အကြံပြုချက်အတိုင်း ပြင်ရန်')
                  }
                  onPress={() => {
                    try {
                      change(
                        applyWritingCorrection(text, correction.original, correction.corrected),
                        [...applied, key],
                      );
                      setNotice('');
                    } catch (e) {
                      setNotice(e instanceof Error ? e.message : 'Please edit manually.');
                    }
                  }}
                />
              </LearningCard>
            );
          })}
          {review.referenceText ? (
            <>
              <LearningText heading>
                {copy('Contributors reference sample', 'Contributors နမူနာစာ')}
              </LearningText>
              <LearningText>{review.referenceText}</LearningText>
              <LearningText>
                {copy(
                  'Use the sample for comparison while writing your own revision.',
                  'နမူနာနှင့် နှိုင်းယှဉ်ပြီး မိမိစာကို ပြန်ရေးပါ။',
                )}
              </LearningText>
            </>
          ) : null}
        </LearningCard>
        <LearningCard>
          <LearningText heading>{copy('Your revision', 'ပြင်ဆင်ထားသောစာ')}</LearningText>
          <TextInput
            accessibilityLabel={copy('Revision writing', 'ပြင်ဆင်ထားသောစာ')}
            editable={!busy}
            multiline
            value={text}
            onChangeText={(value) => change(value)}
            style={{
              minHeight: 280,
              padding: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: c.border,
              color: c.text,
              fontSize: 18,
              lineHeight: 30,
              textAlignVertical: 'top',
            }}
          />
          <LearningText>
            {text.length} {copy('characters', 'လုံး')} ·{' '}
            {!started
              ? copy('Edit to start a separate draft', 'သီးခြားစာမူ စတင်ရန် ပြင်ဆင်ပါ')
              : recovery.status === 'saved'
                ? copy('Saved locally', 'စက်တွင် သိမ်းပြီး')
                : recovery.status === 'saving'
                  ? copy('Saving…', 'သိမ်းနေသည်…')
                  : copy('Save failed. Retry below.', 'သိမ်းမရပါ။ ပြန်ကြိုးစားပါ။')}
          </LearningText>
          {notice ? <LearningText>{notice}</LearningText> : null}
          <LearningButton
            disabled={busy}
            label={copy('Save revision', 'ပြင်ဆင်စာမူ သိမ်းရန်')}
            onPress={() => save('save')}
          />
          <LearningButton
            disabled={busy || !text.trim() || text.trim() === review.originalText.trim()}
            label={copy('Finish revision', 'ပြင်ဆင်မှု ပြီးဆုံးရန်')}
            onPress={() => save('finish')}
          />
          <LearningButton
            disabled={busy || !text.trim()}
            label={copy('Get fresh AI feedback', 'AI သုံးသပ်ချက်အသစ် ရယူရန်')}
            onPress={() => save('ai')}
          />
          <LearningButton
            disabled={busy || !text.trim()}
            label={copy('Request Contributors review', 'Contributors သုံးသပ်ချက် ရယူရန်')}
            onPress={() => save('contributors')}
          />
        </LearningCard>
      </LearningPage>
    </KeyboardAvoidingView>
  );
}
