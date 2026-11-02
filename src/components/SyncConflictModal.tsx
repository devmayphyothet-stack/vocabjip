import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SavedDraft } from '@/context/saved-context';

interface SyncConflictModalProps {
  visible: boolean;
  localDraft: SavedDraft | null;
  cloudDraft: SavedDraft | null;
  onKeepBoth: () => void;
  onUseLocal: () => void;
  onUseCloud: () => void;
}

export function SyncConflictModal({
  visible,
  localDraft,
  cloudDraft,
  onKeepBoth,
  onUseLocal,
  onUseCloud,
}: SyncConflictModalProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  if (!visible || !localDraft || !cloudDraft) return null;

  const formatDraftTime = (isoString?: string) => {
    if (!isoString) return 'Recently';
    try {
      const d = new Date(isoString);
      return `Updated ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}>
          {/* Top Bar matching figma/syncConflict */}
          <View style={styles.header}>
            <Text style={[styles.screenTitle, { color: colors.text }]}>
              Choose your draft
            </Text>
            <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
              Two versions were found
            </Text>
          </View>

          {/* Notice Card */}
          <View
            style={[
              styles.noticeCard,
              { backgroundColor: colors.streakLight, borderColor: colors.borderLight },
            ]}>
            <Text style={[styles.noticeTitle, { color: colors.streak }]}>
              Keep both if you're unsure
            </Text>
            <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
              We will not overwrite your work automatically.
            </Text>
          </View>

          {/* Local Draft Card */}
          <View
            style={[
              styles.draftCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}>
            <View style={styles.draftTitleRow}>
              <Ionicons name="pencil" size={18} color={colors.accent} />
              <Text style={[styles.draftDeviceText, { color: colors.text }]}>
                On this device
              </Text>
            </View>
            <Text numberOfLines={1} style={[styles.draftTitle, { color: colors.text }]}>
              {localDraft.title} • {localDraft.charCount} characters
            </Text>
            <Text style={[styles.draftDate, { color: colors.textSecondary }]}>
              {formatDraftTime(localDraft.updatedAt)}
            </Text>
          </View>

          {/* Cloud Draft Card */}
          <View
            style={[
              styles.draftCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}>
            <View style={styles.draftTitleRow}>
              <Ionicons name="cloud-outline" size={18} color={colors.accent} />
              <Text style={[styles.draftDeviceText, { color: colors.text }]}>
                In your cloud account
              </Text>
            </View>
            <Text numberOfLines={1} style={[styles.draftTitle, { color: colors.text }]}>
              {cloudDraft.title} • {cloudDraft.charCount} characters
            </Text>
            <Text style={[styles.draftDate, { color: colors.textSecondary }]}>
              {formatDraftTime(cloudDraft.updatedAt)}
            </Text>
          </View>

          {/* 3 Buttons matching figma/syncConflict */}
          <View style={styles.btnStack}>
            <TouchableOpacity
              onPress={onKeepBoth}
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}>
              <Text style={[styles.primaryBtnText, { color: colors.primaryContrast }]}>
                Keep both versions
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onUseLocal}
              style={[
                styles.secondaryBtn,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}>
              <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
                Use this device's draft
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onUseCloud}
              style={[
                styles.secondaryBtn,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}>
              <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
                Use cloud version
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  container: {
    borderRadius: 24,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    marginBottom: 2,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  noticeCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  noticeText: {
    fontSize: 12,
    lineHeight: 17,
  },
  draftCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  draftTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  draftDeviceText: {
    fontSize: 15,
    fontWeight: '700',
  },
  draftTitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  draftDate: {
    fontSize: 12,
  },
  btnStack: {
    gap: 8,
    marginTop: 4,
  },
  primaryBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

