import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAi } from '@/context/ai-context';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function AiConnectModal() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { apiKey, isConnected, maskedKey, isConnecting, connectKey, removeKey } = useAi();

  const [inputKey, setInputKey] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleConnect = async () => {
    if (!inputKey.trim()) {
      setErrorMessage('Please paste or type your Gemini API key.');
      return;
    }

    setErrorMessage('');
    const res = await connectKey(inputKey);
    if (res.success) {
      Alert.alert('AI Connected', 'Your Gemini API key is verified and ready for TOPIK writing review!');
      setInputKey('');
    } else {
      setErrorMessage(res.error || 'Failed to verify key.');
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Gemini?',
      'Your learning stays with you. Removing your key will disable AI reviews until reconnected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await removeKey();
          },
        },
      ]
    );
  };

  const handleOpenStudio = () => {
    Linking.openURL('https://aistudio.google.com/app/apikey');
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
          AI Connection
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Connected State */}
        {isConnected ? (
          <View style={styles.connectedContainer}>
            <View style={[styles.iconCircle, { backgroundColor: colors.successLight }]}>
              <Ionicons name="checkmark-circle" size={44} color={colors.success} />
            </View>

            <Text style={[styles.title, { color: colors.text }]}>Gemini Connected</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Ready when you are for TOPIK essay evaluation.
            </Text>

            <View
              style={[
                styles.keyStatusCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}>
              <View style={styles.statusRow}>
                <Ionicons name="shield-checkmark" size={20} color={colors.success} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.statusKeyText, { color: colors.text }]}>
                    {maskedKey}
                  </Text>
                  <Text style={[styles.statusSubtext, { color: colors.textSecondary }]}>
                    Billing & quota belong to your Google project (Free tier)
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleDisconnect}
              style={[styles.disconnectBtn, { borderColor: colors.error }]}>
              <Ionicons name="trash-outline" size={16} color={colors.error} />
              <Text style={[styles.disconnectBtnText, { color: colors.error }]}>
                Disconnect Gemini Key
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Not Connected / Connect Flow */
          <View style={styles.notConnectedContainer}>
            <View style={[styles.iconCircle, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="hardware-chip-outline" size={40} color={colors.accent} />
            </View>

            <Text style={[styles.title, { color: colors.text }]}>Connect your AI</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Optional • Bring your own key (BYOK) • Free tier available
            </Text>

            {/* Value Proposition Box */}
            <View
              style={[
                styles.infoCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}>
              <Text style={[styles.infoCardTitle, { color: colors.text }]}>
                Your key. Your learning pace.
              </Text>
              <Text style={[styles.infoCardText, { color: colors.textSecondary }]}>
                VocabJip does not sell AI credits or charge subscription fees. By providing your free Google Gemini API key, you get unlimited essay scoring directly from Google's free tier.
              </Text>
            </View>

            {/* 3 Step Tutorial */}
            <View
              style={[
                styles.stepsCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}>
              <Text style={[styles.stepsHeading, { color: colors.textSecondary }]}>
                GET YOUR FREE GEMINI KEY IN 3 STEPS
              </Text>

              <View style={styles.stepRow}>
                <View style={[styles.stepNumber, { backgroundColor: colors.accentLight }]}>
                  <Text style={[styles.stepNumberText, { color: colors.accent }]}>1</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>
                    Visit Google AI Studio
                  </Text>
                  <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
                    Sign in with any standard Google account.
                  </Text>
                </View>
              </View>

              <View style={styles.stepRow}>
                <View style={[styles.stepNumber, { backgroundColor: colors.accentLight }]}>
                  <Text style={[styles.stepNumberText, { color: colors.accent }]}>2</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>
                    Click "Get API Key"
                  </Text>
                  <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
                    Create a new free API key in seconds.
                  </Text>
                </View>
              </View>

              <View style={styles.stepRow}>
                <View style={[styles.stepNumber, { backgroundColor: colors.accentLight }]}>
                  <Text style={[styles.stepNumberText, { color: colors.accent }]}>3</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>
                    Paste it below
                  </Text>
                  <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
                    Stored only on this device. Never uploaded to our servers.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleOpenStudio}
                style={[styles.openStudioBtn, { backgroundColor: colors.cardMuted }]}>
                <Ionicons name="open-outline" size={16} color={colors.accent} />
                <Text style={[styles.openStudioText, { color: colors.accent }]}>
                  Open Google AI Studio
                </Text>
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {errorMessage ? (
              <View style={[styles.errorBox, { backgroundColor: colors.errorLight }]}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Key Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Paste Gemini API Key
              </Text>
              <TextInput
                style={[
                  styles.keyInput,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="AIzaSy..."
                placeholderTextColor={colors.textMuted}
                value={inputKey}
                onChangeText={setInputKey}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
            </View>

            {/* Connect Button */}
            <TouchableOpacity
              onPress={handleConnect}
              disabled={isConnecting}
              style={[
                styles.connectBtn,
                { backgroundColor: colors.primary },
                isConnecting && { opacity: 0.7 },
              ]}>
              {isConnecting ? (
                <ActivityIndicator color={colors.primaryContrast} />
              ) : (
                <Text style={[styles.connectBtnText, { color: colors.primaryContrast }]}>
                  Verify & Connect Key
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
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
    gap: Spacing.three,
  },
  notConnectedContainer: {
    alignItems: 'center',
    gap: 12,
  },
  connectedContainer: {
    alignItems: 'center',
    gap: 14,
    paddingVertical: 24,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  infoCard: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  infoCardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  infoCardText: {
    fontSize: 13,
    lineHeight: 19,
  },
  stepsCard: {
    width: '100%',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  stepsHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: '700',
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  stepDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  openStudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 10,
    gap: 6,
    marginTop: 4,
  },
  openStudioText: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    width: '100%',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  inputContainer: {
    width: '100%',
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  keyInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  connectBtn: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  connectBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  keyStatusCard: {
    width: '100%',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusKeyText: {
    fontSize: 15,
    fontWeight: '700',
  },
  statusSubtext: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  disconnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  disconnectBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

