import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/context/auth-context';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BrandLogo } from '@/components/BrandLogo';

export default function ForgotPasswordScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { requestPasswordReset } = useAuth();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRequestReset = async () => {
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);
    try {
      const res = await requestPasswordReset(email);
      if (res.success) {
        // Direct to 6-digit OTP verification screen in recovery mode!
        router.push({
          pathname: '/(auth)/verify-otp',
          params: { email: email.trim(), type: 'recovery' },
        });
      } else {
        setErrorMessage(res.error || 'Failed to request reset code.');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backBtn, { borderColor: colors.border }]}>
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.header}>
            <BrandLogo size={64} containerStyle={{ marginBottom: 16, alignSelf: 'flex-start' }} />
            <Text style={[styles.title, { color: colors.text }]}>Reset your password</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter your email and we'll send you a 6-digit verification code to set a new password.
            </Text>
          </View>

          {errorMessage ? (
            <View style={[styles.errorBox, { backgroundColor: colors.errorLight }]}>
              <Ionicons name="alert-circle" size={16} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="you@example.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              onPress={handleRequestReset}
              disabled={isLoading}
              style={[
                styles.primaryBtn,
                { backgroundColor: colors.primary },
                isLoading && { opacity: 0.7 },
              ]}>
              {isLoading ? (
                <ActivityIndicator color={colors.primaryContrast} />
              ) : (
                <Text style={[styles.primaryBtnText, { color: colors.primaryContrast }]}>
                  Send 6-Digit Code
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    flexGrow: 1,
    justifyContent: 'center',
  },
  topBar: {
    marginBottom: Spacing.four,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginBottom: Spacing.four,
    alignItems: 'center',
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginBottom: Spacing.three,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  form: {
    gap: Spacing.three,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  primaryBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

