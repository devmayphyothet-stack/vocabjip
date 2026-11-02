import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/context/auth-context';
import { useAi } from '@/context/ai-context';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ProfileScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { user, isGuest, signOut } = useAuth();
  const { isConnected, maskedKey } = useAi();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(tabs)');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>My Learning Space</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Progress, one sentence at a time.
          </Text>
        </View>

        {/* User Card */}
        <View
          style={[
            styles.userCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          <View style={styles.userCardTop}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="person" size={24} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.userName, { color: colors.text }]}>
                {user ? user.displayName : 'Guest Learner'}
              </Text>
              <Text style={[styles.userGoal, { color: colors.accent }]}>
                {user ? user.targetLevel : 'Target: TOPIK II Level 4'}
              </Text>
              {user && (
                <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                  {user.email}
                </Text>
              )}
            </View>
          </View>

          {/* If guest, display call to action to Sign Up */}
          {(!user || isGuest) && (
            <View style={[styles.guestSyncBox, { backgroundColor: colors.cardMuted }]}>
              <Text style={[styles.guestSyncTitle, { color: colors.text }]}>
                Sync across devices
              </Text>
              <Text style={[styles.guestSyncDesc, { color: colors.textSecondary }]}>
                Create an account using a 6-digit OTP to backup your streak and drafts.
              </Text>
              <View style={styles.authBtnRow}>
                <Link href="/(auth)/sign-up" asChild>
                  <TouchableOpacity
                    style={[styles.authBtn, { backgroundColor: colors.primary }]}>
                    <Text
                      style={[styles.authBtnText, { color: colors.primaryContrast }]}>
                      Sign Up with OTP
                    </Text>
                  </TouchableOpacity>
                </Link>
                <Link href="/(auth)/sign-in" asChild>
                  <TouchableOpacity
                    style={[styles.authBtnSecondary, { borderColor: colors.border }]}>
                    <Text style={[styles.authBtnSecondaryText, { color: colors.text }]}>
                      Sign In
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          )}
        </View>

        {/* Settings & Privacy Section */}
        <Text style={[styles.sectionHeading, { color: colors.text }]}>
          Settings & Preferences
        </Text>

        <View
          style={[
            styles.menuGroup,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          {/* AI Connection */}
          <TouchableOpacity
            onPress={() => router.push('/modal/ai-connect')}
            style={styles.menuRow}>
            <View
              style={[
                styles.menuIconBox,
                { backgroundColor: isConnected ? colors.successLight : colors.accentLight },
              ]}>
              <Ionicons
                name="hardware-chip-outline"
                size={18}
                color={isConnected ? colors.success : colors.accent}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>AI Connection</Text>
              <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
                {isConnected ? maskedKey : 'Connect Google Gemini BYOK (Free tier)'}
              </Text>
            </View>
            <View style={styles.badgeRow}>
              <Text
                style={[
                  styles.badgeValue,
                  { color: isConnected ? colors.success : colors.accent, fontWeight: '700' },
                ]}>
                {isConnected ? 'Active' : 'Setup'}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          {/* Language Selection */}
          <View style={styles.menuRow}>
            <View style={[styles.menuIconBox, { backgroundColor: colors.streakLight }]}>
              <Ionicons name="language-outline" size={18} color={colors.streak} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>
                Explanation Language
              </Text>
              <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
                Myanmar (မြန်မာစာ)
              </Text>
            </View>
            <Text style={[styles.badgeValue, { color: colors.textSecondary }]}>
              Default
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          {/* Account, Privacy & Export */}
          <TouchableOpacity
            onPress={() => router.push('/modal/account-privacy')}
            style={styles.menuRow}>
            <View style={[styles.menuIconBox, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>Account & Privacy</Text>
              <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
                Data export, anonymous sharing & account settings
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Sign Out (if logged in) */}
        {user && !isGuest && (
          <TouchableOpacity
            onPress={handleSignOut}
            style={[
              styles.signOutBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}>
            <Ionicons name="log-out-outline" size={18} color={colors.error} />
            <Text style={[styles.signOutText, { color: colors.error }]}>Sign Out</Text>
          </TouchableOpacity>
        )}

        {/* Version info */}
        <Text style={[styles.versionText, { color: colors.textMuted }]}>
          VocabJip v1.0.0 • Offline-First TOPIK Companion
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    marginBottom: Spacing.one,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  userCard: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
  },
  userCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  userGoal: {
    fontSize: 13,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  guestSyncBox: {
    padding: 14,
    borderRadius: 12,
    gap: 6,
  },
  guestSyncTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  guestSyncDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  authBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  authBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  authBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  authBtnSecondary: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  authBtnSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: Spacing.two,
  },
  menuGroup: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
  },
  badgeValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  divider: {
    height: 1,
    marginLeft: 64,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginTop: Spacing.two,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '700',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
  },
});

