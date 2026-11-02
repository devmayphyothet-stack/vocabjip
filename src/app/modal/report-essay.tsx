import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { REPORT_REASONS } from '@/types/community';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ReportEssayModal() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const params = useLocalSearchParams<{ essayTitle?: string; authorName?: string }>();

  const essayTitle = params.essayTitle || 'this essay';
  const authorName = params.authorName || 'the author';

  const [selectedReasonId, setSelectedReasonId] = useState(REPORT_REASONS[0].id);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.sentContainer}>
          <View style={[styles.sentIconCircle, { backgroundColor: colors.successLight }]}>
            <Ionicons name="shield-checkmark" size={44} color={colors.success} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>Report received</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Thank you for letting us know • Help keep the community useful
          </Text>

          <View
            style={[
              styles.sentNoticeCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}>
            <Text style={[styles.sentNoticeTitle, { color: colors.text }]}>
              We will review the essay
            </Text>
            <Text style={[styles.sentNoticeText, { color: colors.textSecondary }]}>
              Your report is completely private. {authorName} will not see your identity. If the essay violates community guidelines, it will be removed.
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.primaryBtn, { backgroundColor: colors.primary, width: '100%' }]}>
            <Text style={[styles.primaryBtnText, { color: colors.primaryContrast }]}>
              Done & Return
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
          Report Essay
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Report an essay</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Help keep the VocabJip learning community safe and useful. What should we review about "{essayTitle}"?
          </Text>
        </View>

        {/* Reasons Radio List */}
        <View style={styles.reasonsList}>
          {REPORT_REASONS.map((r) => {
            const isSelected = selectedReasonId === r.id;
            return (
              <TouchableOpacity
                key={r.id}
                onPress={() => setSelectedReasonId(r.id)}
                style={[
                  styles.reasonCard,
                  {
                    backgroundColor: isSelected ? colors.cardMuted : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}>
                <View
                  style={[
                    styles.radioCircle,
                    {
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected ? colors.primary : 'transparent',
                    },
                  ]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.reasonLabel, { color: colors.text }]}>
                    {r.label}
                  </Text>
                  <Text style={[styles.reasonDesc, { color: colors.textSecondary }]}>
                    {r.description}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Submit Report */}
        <TouchableOpacity
          onPress={handleSubmit}
          style={[styles.primaryBtn, { backgroundColor: colors.error, marginTop: 12 }]}>
          <Ionicons name="flag" size={16} color="#FFFFFF" />
          <Text style={[styles.primaryBtnText, { color: '#FFFFFF' }]}>
            Submit Report
          </Text>
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
  header: {
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  reasonsList: {
    gap: 10,
  },
  reasonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 14,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  reasonLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  reasonDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    gap: 8,
    marginBottom: 24,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  sentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: 12,
  },
  sentIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  sentNoticeCard: {
    width: '100%',
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    marginVertical: 16,
  },
  sentNoticeTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sentNoticeText: {
    fontSize: 13,
    lineHeight: 19,
  },
});

