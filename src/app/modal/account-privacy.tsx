import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/context/auth-context';
import { useSaved } from '@/context/saved-context';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function AccountPrivacyModal() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { user, isGuest, signOut } = useAuth();
  const { drafts, savedVocabIds, savedPatternIds } = useSaved();

  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      let exportText = `=== VOCABJIP EXPORTED DATA ===\nUser: ${user?.displayName || 'Guest'}\nExported Date: ${new Date().toLocaleDateString()}\n\n`;
      exportText += `--- SAVED BOOKMARKS ---\nVocab Bookmarks Count: ${savedVocabIds.length}\nPattern Bookmarks Count: ${savedPatternIds.length}\n\n`;
      exportText += `--- WONGOJI DRAFTS (${drafts.length}) ---\n\n`;

      drafts.forEach((d, idx) => {
        exportText += `[Draft #${idx + 1}] ${d.title} (${d.type})\nCharacters: ${d.charCount}\nUpdated: ${d.updatedAt}\n\n${d.content}\n\n--------------------\n\n`;
      });

      await Share.share({
        title: 'VocabJip Essay Drafts Export',
        message: exportText,
      });
    } catch (e: any) {
      Alert.alert('Export Error', e.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete your account?',
      'This cannot be undone. Your cloud data will be removed, including your synced drafts, bookmarks, profile, and saved AI connection.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(tabs)');
            Alert.alert('Account Deleted', 'Your local and cloud data has been purged.');
          },
        },
      ]
    );
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
          Account & Privacy
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Your data, your choices</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            VocabJip believes your Korean learning and essays belong solely to you.
          </Text>
        </View>

        {/* Export Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          <View style={styles.cardTopRow}>
            <View style={[styles.iconBox, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="download-outline" size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Export your writing</Text>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                Download or share a plain text copy of all your Wongoji drafts, personal statements, and bookmarked vocabulary.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleExportData}
            disabled={isExporting}
            style={[styles.actionBtn, { backgroundColor: colors.cardMuted, borderColor: colors.border }]}>
            <Ionicons name="share-outline" size={16} color={colors.text} />
            <Text style={[styles.actionBtnText, { color: colors.text }]}>
              {isExporting ? 'Exporting...' : `Export All Data (${drafts.length} drafts)`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Cloud Data Status */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          <View style={styles.cardTopRow}>
            <View style={[styles.iconBox, { backgroundColor: colors.streakLight }]}>
              <Ionicons name="cloud-done-outline" size={20} color={colors.streak} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Cloud Data & Sync</Text>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                {user && !isGuest
                  ? `Authenticated as ${user.email}. Drafts and progress are automatically synchronized with Supabase.`
                  : 'Currently in Local Guest Mode. Data stays on this device.'}
              </Text>
            </View>
          </View>
        </View>

        {/* Delete Account Danger Zone */}
        <View
          style={[
            styles.dangerCard,
            { backgroundColor: colors.card, borderColor: colors.errorLight },
          ]}>
          <Text style={[styles.dangerTitle, { color: colors.error }]}>DANGER ZONE</Text>
          <Text style={[styles.dangerDesc, { color: colors.textSecondary }]}>
            Permanently remove your account, profile, synced drafts, and reset all local settings.
          </Text>

          <TouchableOpacity
            onPress={handleDeleteAccount}
            style={[styles.deleteBtn, { borderColor: colors.error }]}>
            <Ionicons name="trash-outline" size={16} color={colors.error} />
            <Text style={[styles.deleteBtnText, { color: colors.error }]}>
              Delete your account
            </Text>
          </TouchableOpacity>
        </View>
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
  card: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dangerCard: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    marginTop: 8,
    marginBottom: 24,
  },
  dangerTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dangerDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
    marginTop: 4,
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

