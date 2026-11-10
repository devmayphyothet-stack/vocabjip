import { useRef, useState } from 'react';
import { TextInput } from 'react-native';
import {
  LearningPage,
  LearningCard,
  LearningText,
  LearningButton,
  useLearningColors,
  useLearningCopy,
} from '@/components/LearningUI';
import { useLearningLog } from '@/hooks/use-learning-log';
import { useAuth } from '@/context/auth-context';
import { LearningLogService } from '@/services/learning-log-service';
import { StreakService } from '@/services/streak-service';
import type { LearningMistake } from '@/types/learning';
export default function Mistakes() {
  const { user } = useAuth();
  const { log, ready, error, refresh } = useLearningLog();
  const c = useLearningColors();
  const copy = useLearningCopy();
  const [selected, setSelected] = useState<LearningMistake | null>(null);
  const [answer, setAnswer] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [notice, setNotice] = useState('');
  const [limit, setLimit] = useState(30);
  const [all, setAll] = useState(false);
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const notes = Object.values(log.mistakes)
    .filter((item) => all || item.status === 'open')
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  async function save() {
    if (!selected || lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const correct = selected.source === 'quiz' ? answer === selected.correctIndex : true;
      await LearningLogService.practiseMistake(selected.id, correct, user?.id);
      if (correct) void StreakService.recordActivity(user?.id, `mistake:${selected.id}`);
      setSelected(null);
      setNotice(
        correct
          ? copy('Practice recorded.', 'လေ့ကျင့်မှု သိမ်းပြီးပါပြီ။')
          : copy('Kept open for another try.', 'ပြန်လေ့ကျင့်ရန် ထားရှိပါသည်။'),
      );
    } catch {
      setNotice(copy('Could not save. Please retry.', 'သိမ်း၍မရပါ။ ပြန်ကြိုးစားပါ။'));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <LearningPage
      title={copy('Mistake notebook', 'အမှားမှတ်စု')}
      ready={ready}
      error={error}
      retry={refresh}
    >
      {notice ? <LearningText>{notice}</LearningText> : null}
      {selected ? (
        <LearningCard>
          <LearningText>
            {selected.source === 'ai'
              ? copy('AI suggestion · self-check practice', 'AI အကြံပြုချက် · ကိုယ်တိုင်စစ်ဆေးရန်')
              : copy('Quiz practice', 'မေးခွန်း လေ့ကျင့်မှု')}
          </LearningText>
          <LearningText heading>{selected.original}</LearningText>
          {selected.source === 'quiz' ? (
            selected.options?.map((option, index) => (
              <LearningButton
                key={index}
                disabled={revealed}
                label={`${answer === index ? '● ' : '○ '}${option}`}
                onPress={() => setAnswer(index)}
              />
            ))
          ) : (
            <TextInput
              accessibilityLabel={copy('Your rewrite', 'သင်၏ ပြန်ရေးထားသောစာ')}
              placeholder={copy('Rewrite the sentence before comparing', 'အဖြေမကြည့်မီ ပြန်ရေးပါ')}
              placeholderTextColor={c.textMuted}
              multiline
              value={text}
              onChangeText={setText}
              style={{
                color: c.text,
                borderColor: c.border,
                borderWidth: 1,
                borderRadius: 12,
                padding: 16,
                minHeight: 120,
                textAlignVertical: 'top',
                fontSize: 17,
              }}
            />
          )}
          {revealed ? (
            <>
              <LearningText heading>{selected.corrected}</LearningText>
              <LearningText>{selected.explanation}</LearningText>
              <LearningText>
                {selected.source === 'ai'
                  ? copy(
                      'Compare your rewrite yourself. AI suggestions may need checking; this does not give a grade.',
                      'မိမိစာကို ကိုယ်တိုင်နှိုင်းယှဉ်ပါ။ AI အကြံပြုချက်ကို စစ်ဆေးရန်လိုနိုင်ပါသည်။ အမှတ်ပေးခြင်းမဟုတ်ပါ။',
                    )
                  : answer === selected.correctIndex
                    ? copy('Correct', 'မှန်ပါသည်')
                    : copy('Try this note again later.', 'နောက်တစ်ကြိမ် ပြန်လေ့ကျင့်ပါ။')}
              </LearningText>
              <LearningButton
                disabled={busy}
                label={copy('Record practice', 'လေ့ကျင့်မှု သိမ်းရန်')}
                onPress={save}
              />
            </>
          ) : (
            <LearningButton
              label={copy('Check / compare', 'အဖြေစစ်ရန်')}
              disabled={selected.source === 'quiz' ? answer === null : !text.trim()}
              onPress={() => setRevealed(true)}
            />
          )}
          <LearningButton
            disabled={busy}
            label={copy('Return to notebook', 'မှတ်စုသို့ ပြန်ရန်')}
            onPress={() => setSelected(null)}
          />
        </LearningCard>
      ) : (
        <>
          <LearningText>
            {copy(
              'Wrong quiz answers and AI grammar suggestions appear here as you practise. Practised notes can be revisited.',
              'မေးခွန်းအဖြေမှားများနှင့် AI သဒ္ဒါအကြံပြုချက်များကို ဤနေရာတွင် သိမ်းထားသည်။ လေ့ကျင့်ပြီးသော မှတ်စုများကိုလည်း ပြန်ကြည့်နိုင်သည်။',
            )}
          </LearningText>
          <LearningButton
            label={
              all
                ? copy('Show open notes', 'မလေ့ကျင့်ရသေးသော မှတ်စုများ')
                : copy('Include practised notes', 'လေ့ကျင့်ပြီးသော မှတ်စုများပါ ပြရန်')
            }
            onPress={() => setAll(!all)}
          />
          {!notes.length ? (
            <LearningText>
              {copy(
                'No notes in this view yet. Complete a quiz or get writing feedback to begin.',
                'မှတ်စုများ မရှိသေးပါ။ မေးခွန်းဖြေဆိုပါ သို့မဟုတ် စာရေးသုံးသပ်ချက် ရယူပါ။',
              )}
            </LearningText>
          ) : null}
          {notes.slice(0, limit).map((item) => (
            <LearningCard key={item.id}>
              <LearningText>
                {item.source === 'ai' ? 'AI' : copy('Quiz', 'မေးခွန်း')} ·{' '}
                {item.status === 'open'
                  ? copy('To practise', 'လေ့ကျင့်ရန်')
                  : copy('Practised', 'လေ့ကျင့်ပြီး')}
              </LearningText>
              <LearningText heading>{item.original}</LearningText>
              <LearningText>
                {item.title} · {copy('Seen', 'တွေ့ရှိမှု')} {item.occurrences}
              </LearningText>
              <LearningButton
                label={copy('Practise', 'လေ့ကျင့်ရန်')}
                onPress={() => {
                  setSelected(item);
                  setAnswer(null);
                  setText('');
                  setRevealed(false);
                  setNotice('');
                }}
              />
            </LearningCard>
          ))}
          {notes.length > limit ? (
            <LearningButton
              label={copy('Show more notes', 'မှတ်စုများ ထပ်ကြည့်ရန်')}
              onPress={() => setLimit(limit + 30)}
            />
          ) : null}
        </>
      )}
    </LearningPage>
  );
}
