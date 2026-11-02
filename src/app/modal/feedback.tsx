import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/auth-context';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type FeedbackCategory = 'feature' | 'bug' | 'content' | 'general';

interface CategoryOption {
  id: FeedbackCategory;
  label: string;
  burmese: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const CATEGORIES: CategoryOption[] = [
  {
    id: 'feature',
    label: 'Feature Request',
    burmese: 'လုပ်ဆောင်ချက် အသစ် အကြံပြုရန်',
    icon: 'bulb-outline',
  },
  {
    id: 'bug',
    label: 'Report Issue',
    burmese: 'အသုံးပြုရ အဆင်မပြေမှု သတင်းပို့ရန်',
    icon: 'alert-circle-outline',
  },
  {
    id: 'content',
    label: 'Vocab / Pattern',
    burmese: 'ဝေါဟာရ / သဒ္ဒါ အသစ် တောင်းဆိုရန်',
    icon: 'book-outline',
  },
  {
    id: 'general',
    label: 'General Feedback',
    burmese: 'အထွေထွေ အကြံပြုချက် သို့မဟုတ် မှတ်ချက်',
    icon: 'chatbubble-ellipses-outline',
  },
];

export default function FeedbackScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [category, setCategory] = useState<FeedbackCategory>('feature');
  const [rating, setRating] = useState<number>(5);
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>(user?.email || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!message.trim()) {
      setErrorMessage('ကျေးဇူးပြု၍ အကြံပြုချက် သို့မဟုတ် မက်ဆေ့ခ်ျ ထည့်သွင်းပေးပါခင်ဗျာ။');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (isSupabaseConfigured) {
        // Try recording in Supabase user_feedback table
        const { error } = await supabase.from('user_feedback').insert({
          user_id: user?.id || null,
          category,
          rating,
          title: title.trim() || `${category.toUpperCase()} feedback`,
          message: message.trim(),
          email: contactEmail.trim() || null,
        });

        if (error) {
          console.warn('Supabase feedback insert note:', error.message);
        }
      }
    } catch (e) {
      console.warn('Feedback submit error:', e);
    } finally {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }
  };

  const handleSendDirectEmail = () => {
    const subject = encodeURIComponent(`[VocabJip Feedback: ${category.toUpperCase()}] ${title || 'User Feedback'}`);
    const body = encodeURIComponent(
      `App: VocabJip v1.0.0\nCategory: ${category}\nRating: ${rating}/5\nUser Email: ${contactEmail || 'Not provided'}\n\nMessage:\n${message}`
    );
    Linking.openURL(`mailto:dev.mayphyothet@gmail.com?subject=${subject}&body=${body}`).catch(() => {});
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Top Header Bar */}
        <View
          style={[
            styles.topBar,
            {
              paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 16 : 24),
              borderBottomColor: colors.border,
              backgroundColor: colors.background,
            },
          ]}>
          <View style={styles.topBarLeft}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Send Feedback</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              အကြံပြုချက်များနှင့် တောင်းဆိုချက်များ ပေးပို့ရန်
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={[styles.closeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {isSubmitted ? (
          /* Submission Success State */
          <ScrollView
            contentContainerStyle={[styles.successContent, { paddingBottom: insets.bottom + 40 }]}
            showsVerticalScrollIndicator={false}>
            <View style={[styles.successHeroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.successIconBox, { backgroundColor: colors.accentLight }]}>
                <Ionicons name="checkmark-circle" size={48} color={colors.accent} />
              </View>

              <Text style={[styles.successTitle, { color: colors.text }]}>
                ကျေးဇူးတင်ရှိပါသည်
              </Text>
              <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
                သင်၏ အကြံပြုချက်ကို လက်ခံရရှိပြီး Developer Team သို့ အောင်မြင်စွာ ပို့ဆောင်ပေးလိုက်ပါပြီ။
              </Text>

              <View style={[styles.summaryBox, { backgroundColor: colors.cardMuted }]}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Category:</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {CATEGORIES.find((c) => c.id === category)?.label}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Rating:</Text>
                  <Text style={[styles.summaryValue, { color: colors.accent }]}>
                    {'★'.repeat(rating)} ({rating}/5)
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.successActions}>
                <TouchableOpacity
                  onPress={handleSendDirectEmail}
                  style={[styles.emailActionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Ionicons name="mail-outline" size={18} color={colors.primary} />
                  <Text style={[styles.emailActionText, { color: colors.text }]}>
                    Send copy via Email (dev.mayphyothet)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.back()}
                  style={[styles.primarySubmitBtn, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.primarySubmitText, { color: colors.primaryContrast }]}>
                    ပြီးပါပြီ (Done)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        ) : (
          /* Form Content */
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {/* Category Selector */}
            <View style={styles.formGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                အကြံပြုချက် အမျိုးအစား (Category)
              </Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((item) => {
                  const isSelected = category === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setCategory(item.id)}
                      activeOpacity={0.7}
                      style={[
                        styles.categoryCard,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.card,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}>
                      <Ionicons
                        name={item.icon}
                        size={18}
                        color={isSelected ? colors.primaryContrast : colors.text}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.categoryLabel,
                            { color: isSelected ? colors.primaryContrast : colors.text },
                          ]}>
                          {item.label}
                        </Text>
                        <Text
                          style={[
                            styles.categoryBurmese,
                            {
                              color: isSelected
                                ? 'rgba(255,255,255,0.85)'
                                : colors.textSecondary,
                            },
                          ]}>
                          {item.burmese}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Satisfaction Rating */}
            <View style={styles.formGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                App အသုံးပြုရ အဆင်ပြေမှု (Overall Rating)
              </Text>
              <View style={[styles.ratingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                      hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
                      <Ionicons
                        name={star <= rating ? 'star' : 'star-outline'}
                        size={32}
                        color={star <= rating ? '#F59E0B' : colors.textMuted}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.ratingCaption, { color: colors.textSecondary }]}>
                  {rating === 5 && 'အလွန်ကောင်းမွန်ပါသည် (Excellent)'}
                  {rating === 4 && 'ကောင်းမွန်ပါသည် (Good)'}
                  {rating === 3 && 'သာမန်ဖြစ်ပါသည် (Average)'}
                  {rating === 2 && 'တိုးတက်ရန် လိုအပ်ပါသည် (Needs improvement)'}
                  {rating === 1 && 'အဆင်မပြေမှု များပြားပါသည် (Poor)'}
                </Text>
              </View>
            </View>

            {/* Subject / Title */}
            <View style={styles.formGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                ခေါင်းစဉ် (Title / Subject)
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="ဥပမာ - TOPIK 54 Sample စာစီစာကုံးများ ထပ်ထည့်ပေးစေချင်ပါသည်"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
              />
            </View>

            {/* Message Body */}
            <View style={styles.formGroup}>
              <View style={styles.labelCountRow}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>
                  အသေးစိတ် အကြံပြုချက် (Detailed Message) *
                </Text>
                <Text style={[styles.charCount, { color: colors.textMuted }]}>
                  {message.length} / 500
                </Text>
              </View>
              <TextInput
                value={message}
                onChangeText={(text) => setMessage(text.slice(0, 500))}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                placeholder="လေ့လာရာတွင် ကြုံတွေ့ရသည့် အခက်အခဲများ သို့မဟုတ် ထည့်သွင်းစေလိုသည့် အင်္ဂါရပ်များကို ရေးသားပေးပါခင်ဗျာ..."
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
              />
            </View>

            {/* Contact Email */}
            <View style={styles.formGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                ဆက်သွယ်ရန် အီးမေးလ် (Contact Email - Optional)
              </Text>
              <TextInput
                value={contactEmail}
                onChangeText={setContactEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="name@example.com"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
              />
              <Text style={[styles.helperText, { color: colors.textMuted }]}>
                အကြောင်းပြန်စာ ပေးပို့နိုင်ရန်အတွက်သာ အသုံးပြုပါမည်။
              </Text>
            </View>

            {/* Error Message */}
            {errorMessage && (
              <View style={[styles.errorBox, { backgroundColor: colors.errorLight, borderColor: colors.error }]}>
                <Ionicons name="alert-circle" size={18} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>{errorMessage}</Text>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={[
                styles.primarySubmitBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: isSubmitting ? 0.7 : 1,
                },
              ]}>
              {isSubmitting ? (
                <ActivityIndicator color={colors.primaryContrast} />
              ) : (
                <>
                  <Ionicons name="paper-plane-outline" size={18} color={colors.primaryContrast} />
                  <Text style={[styles.primarySubmitText, { color: colors.primaryContrast }]}>
                    အကြံပြုချက် ပေးပို့မည် (Submit Feedback)
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  topBarLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  formGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  labelCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    fontSize: 11,
    fontWeight: '500',
  },
  categoryGrid: {
    gap: 8,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  categoryBurmese: {
    fontSize: 11,
    marginTop: 2,
  },
  ratingCard: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
  },
  starRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  ratingCaption: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  textArea: {
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  helperText: {
    fontSize: 11,
    paddingHorizontal: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  primarySubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    gap: 8,
    marginTop: Spacing.two,
  },
  primarySubmitText: {
    fontSize: 15,
    fontWeight: '700',
  },
  successContent: {
    padding: Spacing.four,
    justifyContent: 'center',
  },
  successHeroCard: {
    padding: 24,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  successIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  successSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  summaryBox: {
    width: '100%',
    padding: 14,
    borderRadius: 14,
    gap: 8,
    marginVertical: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  successActions: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  emailActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  emailActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
