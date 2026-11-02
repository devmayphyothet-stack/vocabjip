import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useAi } from '@/context/ai-context';
import { extractKoreanHandwriting } from '@/services/ocr-service';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ScanHandwritingModal() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { apiKey } = useAi();

  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const processSelectedImage = async (base64: string | undefined | null) => {
    setIsProcessing(true);
    try {
      const response = await extractKoreanHandwriting(base64 || '', apiKey);
      if (response.success && response.result) {
        router.push({
          pathname: '/modal/ocr-confirm',
          params: {
            extractedText: response.result.extractedText,
            questionType: response.result.detectedQuestionType,
            uncertainWordsJson: JSON.stringify(response.result.uncertainWords),
          },
        });
      } else {
        Alert.alert('Scan Failed', response.error || 'Could not extract handwriting text.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Something went wrong during extraction.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      setPermissionDenied(true);
      return;
    }
    setPermissionDenied(false);

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets?.[0]) {
      await processSelectedImage(result.assets[0].base64);
    }
  };

  const handlePickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets?.[0]) {
      await processSelectedImage(result.assets[0].base64);
    }
  };

  const handleSimulateSampleScan = async () => {
    // Quick demonstration button to test handwriting extraction without needing a physical camera
    await processSelectedImage(null);
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
          Handwriting OCR
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={[styles.iconCircle, { backgroundColor: colors.accentLight }]}>
            <Ionicons name="camera" size={38} color={colors.accent} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Scan your handwriting</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Paper practice, digital progress • Keep the work. Skip the retyping.
          </Text>
        </View>

        {/* Permission Denied Alert Card */}
        {permissionDenied && (
          <View style={[styles.warningCard, { backgroundColor: colors.streakLight }]}>
            <Ionicons name="warning-outline" size={20} color={colors.streak} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.warningTitle, { color: colors.streak }]}>
                Camera access is off
              </Text>
              <Text style={[styles.warningText, { color: colors.text }]}>
                You can still upload a photo from your gallery, or enable camera access in device settings.
              </Text>
              {Platform.OS === 'ios' && (
                <TouchableOpacity onPress={() => Linking.openSettings()} style={{ marginTop: 6 }}>
                  <Text style={[styles.settingsLink, { color: colors.accent }]}>
                    Open Settings
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Scanning Guidelines Card */}
        <View
          style={[
            styles.guidelinesCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          <Text style={[styles.guidelinesHeading, { color: colors.textSecondary }]}>
            TIPS FOR BEST KOREAN RECOGNITION
          </Text>

          <View style={styles.tipRow}>
            <Ionicons name="scan-outline" size={18} color={colors.accent} />
            <Text style={[styles.tipText, { color: colors.text }]}>
              Align all four corners of the Wongoji (원고지) paper sheet.
            </Text>
          </View>

          <View style={styles.tipRow}>
            <Ionicons name="sunny-outline" size={18} color={colors.streak} />
            <Text style={[styles.tipText, { color: colors.text }]}>
              Avoid heavy shadows and ensure even, bright ambient lighting.
            </Text>
          </View>

          <View style={styles.tipRow}>
            <Ionicons name="checkmark-done-circle-outline" size={18} color={colors.success} />
            <Text style={[styles.tipText, { color: colors.text }]}>
              Keep the camera parallel and steady above the manuscript.
            </Text>
          </View>
        </View>

        {/* Processing Indicator */}
        {isProcessing && (
          <View style={[styles.processingBox, { backgroundColor: colors.cardMuted }]}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={[styles.processingText, { color: colors.text }]}>
              Reading Korean handwriting with Vision AI...
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsGroup}>
          <TouchableOpacity
            onPress={handleTakePhoto}
            disabled={isProcessing}
            style={[
              styles.primaryBtn,
              { backgroundColor: colors.primary },
              isProcessing && { opacity: 0.6 },
            ]}>
            <Ionicons name="camera" size={20} color={colors.primaryContrast} />
            <Text style={[styles.primaryBtnText, { color: colors.primaryContrast }]}>
              Capture Page with Camera
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePickFromGallery}
            disabled={isProcessing}
            style={[
              styles.secondaryBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
              isProcessing && { opacity: 0.6 },
            ]}>
            <Ionicons name="images-outline" size={18} color={colors.text} />
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
              Choose from Photo Gallery
            </Text>
          </TouchableOpacity>

          {/* Quick Demo Scan Button */}
          <TouchableOpacity
            onPress={handleSimulateSampleScan}
            disabled={isProcessing}
            style={[styles.demoBtn, { borderColor: colors.borderLight }]}>
            <Ionicons name="flash-outline" size={14} color={colors.accent} />
            <Text style={[styles.demoBtnText, { color: colors.accent }]}>
              Test with Sample Wongoji Paper
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
  heroSection: {
    alignItems: 'center',
    gap: 8,
    marginVertical: 8,
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
    lineHeight: 18,
  },
  warningCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  warningText: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  settingsLink: {
    fontSize: 12,
    fontWeight: '700',
  },
  guidelinesCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  guidelinesHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tipText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  processingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 10,
  },
  processingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionsGroup: {
    gap: 10,
    marginTop: 8,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  demoBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
