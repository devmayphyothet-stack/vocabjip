import { LearningPreferencesProvider } from '@/context/learning-preferences-context';
import { DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/context/auth-context';
import { SavedProvider } from '@/context/saved-context';
import { AiProvider } from '@/context/ai-context';

SplashScreen.preventAutoHideAsync();

function AccountProviders({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading)
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator accessibilityLabel="Restoring your account" />
      </View>
    );
  return (
    <SavedProvider key={user?.id || 'guest'}>
      <LearningPreferencesProvider key={user?.id || 'guest'}>
        <AiProvider key={user?.id || 'guest'}>{children}</AiProvider>
      </LearningPreferencesProvider>
    </SavedProvider>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider value={DefaultTheme}>
        <AuthProvider>
          <AccountProviders>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="modal/get-started" options={{ presentation: 'modal' }} />
              <Stack.Screen name="modal/edit-profile" options={{ presentation: 'modal' }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)/sign-in" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)/sign-up" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)/verify-otp" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)/forgot-password" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)/reset-password" options={{ headerShown: false }} />
              <Stack.Screen
                name="modal/vocab-detail"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="modal/pattern-detail"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="modal/quiz"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="modal/wongoji-editor"
                options={{ presentation: 'fullScreenModal', headerShown: false }}
              />
              <Stack.Screen
                name="modal/ai-connect"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="modal/ai-feedback"
                options={{ presentation: 'fullScreenModal', headerShown: false }}
              />
              <Stack.Screen
                name="modal/contributor-review"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="modal/scan-handwriting"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="modal/ocr-confirm"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="modal/admissions"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="modal/statement-editor"
                options={{ presentation: 'fullScreenModal', headerShown: false }}
              />
              <Stack.Screen
                name="modal/statement-feedback"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="modal/community"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="modal/essay-detail"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="modal/publish-essay"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="modal/report-essay"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="modal/account-privacy"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="modal/about"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="modal/contributors"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="modal/feedback"
                options={{ presentation: 'modal', headerShown: false }}
              />
            </Stack>
          </AccountProviders>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
