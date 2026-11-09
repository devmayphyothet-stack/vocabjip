import React, { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useLearningPreferences } from '@/context/learning-preferences-context';
import { InterfaceLanguage, StudyFocus } from '@/lib/learning-preferences';
import { Colors } from '@/constants/theme';
export default function GetStarted() {
  const { preferences, updatePreferences, t, loadFailed } = useLearningPreferences();
  const [focus, setFocus] = useState<StudyFocus>(preferences.focus);
  const [minutes, setMinutes] = useState(preferences.minutes);
  const [busy, setBusy] = useState(false);
  const chooseLanguage = async (language: InterfaceLanguage) => {
    try {
      await updatePreferences({ language });
    } catch {
      Alert.alert(t('preferencesFailed'));
    }
  };
  const finish = async (skip: boolean) => {
    setBusy(true);
    try {
      await updatePreferences(skip ? { onboarded: true } : { focus, minutes, onboarded: true });
      if (skip) {
        router.back();
        return;
      }
      router.replace(
        focus === 'writing'
          ? '/(tabs)/practice'
          : focus === 'quiz'
            ? '/modal/quiz'
            : '/(tabs)/learn',
      );
    } catch {
      Alert.alert(t('preferencesFailed'));
    } finally {
      setBusy(false);
    }
  };
  const option = (selected: boolean) => ({
    minHeight: 48,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: selected ? Colors.light.accent : Colors.light.border,
    backgroundColor: Colors.light.card,
  });
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.light.background }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => router.back()}
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          <Text style={{ color: Colors.light.accent }}>{t('close')}</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 26, fontWeight: '700' }}>{t('setup')}</Text>
        {loadFailed && <Text accessibilityRole="alert">{t('preferencesLoadFailed')}</Text>}
        <Text>{t('language')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {(['en', 'my'] as const).map((language) => (
            <TouchableOpacity
              key={language}
              accessibilityRole="button"
              accessibilityState={{ selected: preferences.language === language }}
              onPress={() => {
                void chooseLanguage(language);
              }}
              style={option(preferences.language === language)}
            >
              <Text>{language === 'en' ? 'English' : 'မြန်မာ'}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text>{t('focus')}</Text>
        {(['vocab', 'quiz', 'writing'] as const).map((value) => (
          <TouchableOpacity
            key={value}
            accessibilityRole="button"
            accessibilityState={{ selected: focus === value }}
            onPress={() => setFocus(value)}
            style={option(focus === value)}
          >
            <Text>{t(value)}</Text>
          </TouchableOpacity>
        ))}
        <Text>{t('minutes')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {[5, 10, 15].map((value) => (
            <TouchableOpacity
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected: minutes === value }}
              onPress={() => setMinutes(value)}
              style={option(minutes === value)}
            >
              <Text>
                {value} {t('minutesUnit')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={{ color: Colors.light.textSecondary, lineHeight: 24 }}>
          {t('offlineHelp')}
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          disabled={busy}
          onPress={() => {
            void finish(false);
          }}
          style={[option(true), { backgroundColor: Colors.light.accent }]}
        >
          <Text style={{ color: 'white', fontWeight: '700' }}>{t('start')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          disabled={busy}
          onPress={() => {
            void finish(true);
          }}
          style={option(false)}
        >
          <Text>{t('skip')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
