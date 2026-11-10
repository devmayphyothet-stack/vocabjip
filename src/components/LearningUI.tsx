import { ReactNode } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLearningPreferences } from '@/context/learning-preferences-context';
export function useLearningCopy() {
  const { preferences } = useLearningPreferences();
  return (en: string, my: string) => (preferences.language === 'my' ? my : en);
}
export function useLearningColors() {
  return Colors[useColorScheme() ?? 'light'];
}
export function LearningPage({
  title,
  children,
  ready = true,
  error = '',
  retry,
}: {
  title: string;
  children: ReactNode;
  ready?: boolean;
  error?: string;
  retry?: () => void;
}) {
  const c = useLearningColors();
  const copy = useLearningCopy();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <LearningButton label={copy('Back', 'နောက်သို့')} onPress={() => router.back()} />
        <Text
          accessibilityRole="header"
          style={{ flex: 1, fontSize: 22, fontWeight: '700', color: c.text }}
        >
          {title}
        </Text>
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 20,
          gap: 16,
          paddingBottom: 60,
          width: '100%',
          maxWidth: 720,
          alignSelf: 'center',
        }}
      >
        {!ready ? (
          <ActivityIndicator accessibilityLabel={copy('Loading', 'ရယူနေသည်')} />
        ) : error ? (
          <LearningCard>
            <Text accessibilityRole="alert" style={{ color: c.error }}>
              {error}
            </Text>
            {retry ? (
              <LearningButton label={copy('Retry', 'ပြန်ကြိုးစားရန်')} onPress={retry} />
            ) : null}
          </LearningCard>
        ) : (
          children
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
export function LearningCard({ children }: { children: ReactNode }) {
  const c = useLearningColors();
  return (
    <View
      style={{
        padding: 20,
        borderRadius: 18,
        backgroundColor: c.card,
        borderWidth: 1,
        borderColor: c.border,
        gap: 12,
      }}
    >
      {children}
    </View>
  );
}
export function LearningText({
  children,
  heading = false,
}: {
  children: ReactNode;
  heading?: boolean;
}) {
  const c = useLearningColors();
  return (
    <Text
      accessibilityRole={heading ? 'header' : undefined}
      style={{
        color: c.text,
        fontSize: heading ? 20 : 16,
        lineHeight: heading ? 30 : 26,
        fontWeight: heading ? '700' : '400',
      }}
    >
      {children}
    </Text>
  );
}
export function LearningButton({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const c = useLearningColors();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{
        minHeight: 48,
        padding: 12,
        borderRadius: 12,
        backgroundColor: c.accentLight,
        justifyContent: 'center',
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <Text style={{ color: c.accent, fontWeight: '600', fontSize: 16 }}>{label}</Text>
    </TouchableOpacity>
  );
}
