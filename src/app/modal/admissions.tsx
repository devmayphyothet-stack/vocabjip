import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { STATEMENT_SECTIONS } from '@/data/statement-sections';

export default function AdmissionsModal() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const [university, setUniversity] = useState('Seoul National University');
  const [major, setMajor] = useState('Computer Science & Engineering');

  const handleStartBuilding = () => {
    router.push({
      pathname: '/modal/statement-editor',
      params: {
        university,
        major,
      },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.closeBtn, { borderColor: colors.border }]}>
          <Ionicons name="close" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textSecondary }]}>
          Admissions Hub
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={[styles.iconCircle, { backgroundColor: colors.accentLight }]}>
            <Ionicons name="school-outline" size={38} color={colors.accent} />
          </View>
          <Text style={[styles.koreanTag, { color: colors.accent, backgroundColor: colors.cardMuted }]}>
            자기소개서 • PERSONAL STATEMENT
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>Your next chapter</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Tell your story. In your own voice. Prepare your university and scholarship admissions essays with AI coaching.
          </Text>
        </View>

        {/* Target University & Major Inputs */}
        <View
          style={[
            styles.targetCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          <Text style={[styles.targetCardHeading, { color: colors.textSecondary }]}>
            APPLICATION DETAILS
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Target University</Text>
            <TextInput
              style={[
                styles.textInput,
                { backgroundColor: colors.cardMuted, borderColor: colors.border, color: colors.text },
              ]}
              placeholder="e.g. Seoul National University, Korea University"
              placeholderTextColor={colors.textMuted}
              value={university}
              onChangeText={setUniversity}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Target Major</Text>
            <TextInput
              style={[
                styles.textInput,
                { backgroundColor: colors.cardMuted, borderColor: colors.border, color: colors.text },
              ]}
              placeholder="e.g. Business Administration, Computer Science"
              placeholderTextColor={colors.textMuted}
              value={major}
              onChangeText={setMajor}
            />
          </View>
        </View>

        {/* 4 Core Pillars */}
        <Text style={[styles.sectionsTitle, { color: colors.text }]}>
          4 Essential Statement Sections
        </Text>

        <View style={styles.pillarsList}>
          {STATEMENT_SECTIONS.map((section, idx) => (
            <View
              key={section.id}
              style={[
                styles.pillarCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}>
              <View style={[styles.stepNumPill, { backgroundColor: colors.accentLight }]}>
                <Text style={[styles.stepNumText, { color: colors.accent }]}>
                  0{idx + 1}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.pillarKorean, { color: colors.textSecondary }]}>
                  {section.koreanTitle}
                </Text>
                <Text style={[styles.pillarTitle, { color: colors.text }]}>
                  {section.title}
                </Text>
                <Text style={[styles.pillarMyanmar, { color: colors.textSecondary }]}>
                  {section.myanmarTitle}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Start Button */}
        <TouchableOpacity
          onPress={handleStartBuilding}
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}>
          <Text style={[styles.primaryBtnText, { color: colors.primaryContrast }]}>
            Open Statement Builder
          </Text>
          <Ionicons name="arrow-forward" size={18} color={colors.primaryContrast} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  heroSection: {
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  koreanTag: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  targetCard: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  targetCardHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  textInput: {
    height: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  sectionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  pillarsList: {
    gap: 10,
  },
  pillarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  stepNumPill: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontSize: 14,
    fontWeight: '800',
  },
  pillarKorean: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  pillarTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  pillarMyanmar: {
    fontSize: 12,
    marginTop: 2,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    gap: 8,
    marginTop: 8,
    marginBottom: 24,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
