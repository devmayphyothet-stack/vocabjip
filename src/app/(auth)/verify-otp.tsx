import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/context/auth-context';
import { OtpInput } from '@/components/auth/otp-input';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BrandLogo } from '@/components/BrandLogo';

export default function VerifyOtpScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { pendingOtp, verifyOtp, resendOtp, clearPendingOtp } = useAuth();
  const params = useLocalSearchParams<{ email?: string; type?: string }>();

  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(60);

  const displayEmail = pendingOtp?.email || params.email || 'your email';
  const otpType = pendingOtp?.type || (params.type as 'signup' | 'recovery') || 'signup';

  // Compute accurate wall-clock timer so switching to Gmail does not freeze the timer
  useEffect(() => {
    const updateCountdown = () => {
      if (pendingOtp?.resendAvailableAt) {
        const remaining = Math.max(
          0,
          Math.ceil((pendingOtp.resendAvailableAt - Date.now()) / 1000)
        );
        setSecondsRemaining(remaining);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [pendingOtp?.resendAvailableAt]);

  // Automatically submit once 6 digits are typed or pasted
  useEffect(() => {
    if (code.length === 6 && !isSubmitting) {
      handleVerify(code);
    }
  }, [code]);

  const handleVerify = async (codeToVerify: string) => {
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const result = await verifyOtp(codeToVerify);
      if (result.success) {
        if (otpType === 'recovery') {
          router.replace('/(auth)/reset-password');
        } else {
          // Success signup -> go to Main App
          router.replace('/(tabs)');
        }
      } else {
        setErrorMessage(result.error || 'Invalid code. Please try again.');
        setCode('');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setErrorMessage('');
    const res = await resendOtp();
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to resend code.');
    } else {
      Alert.alert('Code Sent', 'A fresh 6-digit code has been sent to your email.');
    }
  };

  const handleOpenMailApp = async () => {
    try {
      if (Platform.OS === 'ios') {
        const supported = await Linking.canOpenURL('message://');
        if (supported) {
          await Linking.openURL('message://');
          return;
        }
      }
      // General mailto fallback
      await Linking.openURL(`mailto:${displayEmail}`);
    } catch (_) {
      // If unable to open email client directly, user will just switch manually
    }
  };

  const handleChangeEmail = async () => {
    await clearPendingOtp();
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleChangeEmail}
          style={[styles.backButton, { borderColor: colors.border }]}
          accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textSecondary }]}>
          Verification
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Brand Logo & Title */}
        <BrandLogo size={64} containerStyle={{ marginBottom: 16 }} />

        <Text style={[styles.title, { color: colors.text }]}>Check your inbox</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          We sent a 6-digit verification code to
        </Text>
        <Text style={[styles.emailBadge, { color: colors.text, backgroundColor: colors.cardMuted }]}>
          {displayEmail}
        </Text>

        {/* 6-Digit OTP Box Input */}
        <OtpInput
          code={code}
          onCodeChange={(val) => {
            setCode(val);
            if (errorMessage) setErrorMessage('');
          }}
          error={Boolean(errorMessage)}
          autoFocus={true}
        />

        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={16} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{errorMessage}</Text>
          </View>
        ) : null}

        {isSubmitting && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Verifying code...
            </Text>
          </View>
        )}

        {/* Action: Open Gmail / Mail app button (Removed per user request)
        <TouchableOpacity
          onPress={handleOpenMailApp}
          style={[styles.openMailButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="mail" size={18} color={colors.accent} />
          <Text style={[styles.openMailButtonText, { color: colors.text }]}>
            Open Email App
          </Text>
        </TouchableOpacity>
        */}

        {/* Resend Code Section */}
        <View style={styles.resendSection}>
          <Text style={[styles.resendNotice, { color: colors.textSecondary }]}>
            Didn't receive the email?
          </Text>
          {secondsRemaining > 0 ? (
            <Text style={[styles.timerText, { color: colors.textMuted }]}>
              Resend code in {secondsRemaining}s
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={[styles.resendLink, { color: colors.accent }]}>
                Resend Code
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Footer Info */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleChangeEmail}>
          <Text style={[styles.changeEmailText, { color: colors.textSecondary }]}>
            Entered the wrong email? <Text style={{ color: colors.accent, fontWeight: '600' }}>Change email</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: Spacing.one,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.one,
  },
  emailBadge: {
    fontSize: 15,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: Spacing.three,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  loadingText: {
    fontSize: 13,
  },
  openMailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 24,
  },
  openMailButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resendSection: {
    alignItems: 'center',
    marginTop: 24,
    gap: 6,
  },
  resendNotice: {
    fontSize: 13,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '500',
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    padding: Spacing.four,
    alignItems: 'center',
  },
  changeEmailText: {
    fontSize: 13,
  },
});

