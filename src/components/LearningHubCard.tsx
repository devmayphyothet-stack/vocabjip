import { router } from 'expo-router';
import {
  LearningCard,
  LearningText,
  LearningButton,
  useLearningCopy,
} from '@/components/LearningUI';
export function LearningHubCard() {
  const copy = useLearningCopy();
  return (
    <LearningCard>
      <LearningText heading>
        {copy('Review & progress', 'ပြန်လေ့ကျင့်မှုနှင့် တိုးတက်မှု')}
      </LearningText>
      <LearningText>
        {copy(
          'Review saved words, practise mistakes, and revise your writing.',
          'သိမ်းထားသော စကားလုံးများ၊ အမှားများနှင့် စာရေးသားမှုကို ပြန်လေ့ကျင့်ပါ။',
        )}
      </LearningText>
      <LearningButton
        label={copy('Open learning hub', 'လေ့ကျင့်မှုများ ဖွင့်ရန်')}
        onPress={() => router.push('/modal/learning-hub')}
      />
    </LearningCard>
  );
}
