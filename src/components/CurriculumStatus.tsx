import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useCurriculum } from '@/hooks/use-curriculum';
import { useLearningPreferences } from '@/context/learning-preferences-context';
import { Colors } from '@/constants/theme';
export function CurriculumStatus() {
  const { isLoading, isSyncing, updateFailed, hasDownloadedContent, syncNow } = useCurriculum();
  const { t } = useLearningPreferences();
  return (
    <View
      style={{
        marginHorizontal: 24,
        marginBottom: 12,
        padding: 12,
        borderRadius: 12,
        backgroundColor: Colors.light.cardMuted,
        gap: 6,
      }}
    >
      <Text accessibilityLiveRegion="polite" style={{ color: Colors.light.textSecondary }}>
        {t(
          isLoading
            ? 'loadingLessons'
            : isSyncing
              ? 'updating'
              : updateFailed
                ? 'updateFailed'
                : hasDownloadedContent
                  ? 'availableLessons'
                  : 'starterLessons',
        )}
      </Text>
      {!isLoading && (
        <TouchableOpacity
          accessibilityRole="button"
          disabled={isSyncing}
          onPress={() => {
            void syncNow();
          }}
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          <Text style={{ color: Colors.light.accent }}>
            {t(updateFailed ? 'retry' : 'download')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
