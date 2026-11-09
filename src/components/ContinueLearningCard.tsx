import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useSaved } from '@/context/saved-context';
import { useLearningPreferences } from '@/context/learning-preferences-context';
import { useLearningSession } from '@/hooks/use-learning-session';
import { useCurriculum } from '@/hooks/use-curriculum';
import { nextLearningAction } from '@/lib/next-learning-action';
import { Colors } from '@/constants/theme';
export function ContinueLearningCard() {
  const { drafts } = useSaved();
  const session = useLearningSession();
  const { preferences, t } = useLearningPreferences();
  const { vocabularies, essayPrompts } = useCurriculum();
  const writingPrompt = essayPrompts.find((prompt) => prompt.type === 'Q53');
  const next = nextLearningAction(
    drafts,
    session,
    preferences.focus,
    preferences.minutes,
    vocabularies[0]?.id,
  );
  return (
    <View
      style={{
        marginBottom: 16,
        padding: 18,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.light.border,
        backgroundColor: Colors.light.card,
        gap: 8,
      }}
    >
      <Text style={{ color: Colors.light.text, fontSize: 18, fontWeight: '700' }}>
        {t(drafts.length || session ? 'continueLearning' : 'nextStep')}
      </Text>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() =>
          router.push({
            pathname: next.pathname,
            params: {
              ...next.params,
              ...(next.label === 'writing' && writingPrompt
                ? { promptTitle: writingPrompt.title, promptId: writingPrompt.id }
                : {}),
            },
          })
        }
        style={{ minHeight: 48, justifyContent: 'center', gap: 6 }}
      >
        <Text style={{ color: Colors.light.accent, fontWeight: '700' }}>{t(next.label)}</Text>
        <Text style={{ color: Colors.light.text }}>
          {next.title || `${preferences.minutes} ${t('minutesUnit')} · ${t(preferences.focus)}`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
