import { BrandLogo } from '@/components/BrandLogo';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AboutScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const insets = useSafeAreaInsets();

  const handleEmailPress = () => {
    Linking.openURL('mailto:dev.mayphyothet@gmail.com').catch(() => { });
  };

  const handlePhonePress = () => {
    Linking.openURL('tel:+821075915740').catch(() => { });
  };

  return (
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>About VocabJip</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            보캡집 • TOPIK II Writing Companion
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={[styles.closeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="close" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}>
        {/* Brand Hero Card */}
        <View
          style={[
            styles.heroCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          <BrandLogo size={76} rounded={true} containerStyle={styles.heroLogo} />
          <Text style={[styles.brandName, { color: colors.text }]}>VocabJip (보캡집)</Text>
          <Text style={[styles.taglineKorean, { color: colors.primary }]}>
            단어를 담는 집, 생각을 짓는 공간
          </Text>
          <View style={[styles.versionPill, { backgroundColor: colors.cardMuted }]}>
            <Text style={[styles.versionText, { color: colors.textMuted }]}>Version 1.0.0</Text>
          </View>
        </View>

        {/* Mission & Purpose Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="flag-outline" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              ဖန်တီးရခြင်း ရည်ရွယ်ချက် (Our Purpose)
            </Text>
          </View>

          <View
            style={[
              styles.infoCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}>
            <Text style={[styles.paragraphText, { color: colors.text }]}>
              <Text style={{ fontWeight: '700' }}>VocabJip (보캡집)</Text> သည် မြန်မာနိုင်ငံမှ ကိုရီးယားဘာသာစကား လေ့လာသူများနှင့် TOPIK II စာမေးပွဲ ဖြေဆိုမည့် ကျောင်းသား/သူများအတွက် အထူးရည်ရွယ်၍ ဖန်တီးထားသော အရေးအသား လေ့ကျင့်ရေး Companion App ဖြစ်ပါသည်။
            </Text>

            <Text style={[styles.paragraphText, { color: colors.textSecondary, marginTop: 10 }]}>
              TOPIK II စာမေးပွဲတွင် အမှတ်အများဆုံး ဆုံးရှုံးရလေ့ရှိသော အပိုင်းမှာ <Text style={{ fontWeight: '600', color: colors.text }}>မေးခွန်း ၅၃ (그래프 분석 - Graph Analysis)</Text> နှင့် <Text style={{ fontWeight: '600', color: colors.text }}>မေးခွန်း ၅၄ (논술형 작문 - Long Essay)</Text> စာစီစာကုံး အရေးအသား ဖြစ်ပါသည်။ စကားပြောအသုံးအနှုန်းများမှ စာရေးသားဟန် (Academic/Formal Style) သို့ ပြောင်းလဲရေးသားနိုင်ရန်၊ ကိုရီးယား ဝေါဟာရနှင့် သဒ္ဒါများကို စနစ်တကျ ပေါင်းစပ်အသုံးပြုနိုင်ရန် ဤ App က အဓိက ကူညီပေးပါသည်။
            </Text>
          </View>
        </View>

        {/* Key Features Pillar */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              အဓိက အထောက်အကူပြု လုပ်ဆောင်ချက်များ
            </Text>
          </View>

          <View style={styles.featureGrid}>
            <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.featureIconBox, { backgroundColor: colors.accentLight }]}>
                <Ionicons name="grid-outline" size={20} color={colors.accent} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>Wongoji Grid System</Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                  တရားဝင် ကိုရီးယား စာစီစာကုံးစာရွက် (원고지) ပုံစံအတိုင်း Spacing, အပိုဒ်ခွဲပုံနှင့် စာလုံးရေကို အတိအကျ ချိန်ညှိလေ့ကျင့်နိုင်ခြင်း။
                </Text>
              </View>
            </View>

            <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.featureIconBox, { backgroundColor: colors.accentLight }]}>
                <Ionicons name="bulb-outline" size={20} color={colors.accent} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>Academic Vocabulary Upgrade</Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                  စကားပြောသုံး (Spoken) စကားလုံးများအစား အမှတ်ပြည့်ရစေမည့် စာရေးသုံး Academic အသုံးအနှုန်းများသို့ မြန်မာဘာသာဖြင့် လဲလှယ်လေ့ကျင့်နိုင်ခြင်း။
                </Text>
              </View>
            </View>

            <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.featureIconBox, { backgroundColor: colors.accentLight }]}>
                <Ionicons name="school-outline" size={20} color={colors.accent} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>Korean University Admissions</Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                  GKS, SNU, Korea, Yonsei တက္ကသိုလ်ဝင်ခွင့် ပညာသင်ဆု ကိုယ်ရေးရာဇဝင် (자기소개서) ရေးသားနည်း ၄ ဆင့် လမ်းညွှန်ချက်။
                </Text>
              </View>
            </View>

            <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.featureIconBox, { backgroundColor: colors.accentLight }]}>
                <Ionicons name="hardware-chip-outline" size={20} color={colors.accent} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>AI Writing Coach & OCR</Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                  Google Gemini AI ဖြင့် စာစီစာကုံး အမှတ်ပေးစစ်ဆေးခြင်းနှင့် လက်ရေးစာရွက်များကို ဖုန်းကင်မရာဖြင့် Scan ဖတ်ပေးနိုင်ခြင်း။
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Contributors Wall of Gratitude Banner */}
        <TouchableOpacity
          onPress={() => router.push('/modal/contributors' as any)}
          activeOpacity={0.7}
          style={[
            styles.feedbackBanner,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          <View style={styles.feedbackBannerContent}>
            <Ionicons name="heart" size={22} color={colors.streak} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.feedbackBannerTitle, { color: colors.text }]}>
                Our Contributors (ကျေးဇူးတင်မှတ်တမ်း)
              </Text>
              <Text style={[styles.feedbackBannerSubtitle, { color: colors.textSecondary }]}>
                VocabJip ဖြစ်တည်လာအောင် ဝိုင်းဝန်းပံ့ပိုးပေးကြသော Contributors များ
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </View>
        </TouchableOpacity>

        {/* Feedback Banner */}
        <TouchableOpacity
          onPress={() => {
            router.push('/modal/feedback');
          }}
          activeOpacity={0.7}
          style={[styles.feedbackBanner, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}>
          <View style={styles.feedbackBannerContent}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.accent} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.feedbackBannerTitle, { color: colors.accent }]}>
                Share your feedback & ideas
              </Text>
              <Text style={[styles.feedbackBannerSubtitle, { color: colors.textSecondary }]}>
                ကြုံတွေ့ရသည့် အခက်အခဲများနှင့် လိုအပ်ချက်များကို အကြံပြုပေးပို့ပါ
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color={colors.accent} />
          </View>
        </TouchableOpacity>

        {/* Quiet Colophon / Developer Info Section */}
        <View style={[styles.colophonContainer, { borderColor: colors.border }]}>
          <Text style={[styles.colophonHeading, { color: colors.textMuted }]}>
            CREDITS & DEVELOPER COLOPHON
          </Text>

          <Text style={[styles.colophonIntro, { color: colors.textMuted }]}>
            ဤ Application အား ကိုရီးယားနိုင်ငံတွင် ပညာသင်ယူနေသော မြန်မာကျောင်းသား/သူများနှင့် TOPIK II အောင်မြင်လိုသူများ စာစီစာကုံး အရေးအသားကို အထောက်အကူပြုစေရန် ရည်ရွယ်၍ ပြုလုပ်ထားခြင်း ဖြစ်ပါသည်။
          </Text>

          <View style={styles.colophonDetails}>
            <View style={styles.colophonRow}>
              <Text style={[styles.colophonLabel, { color: colors.textMuted }]}>Developer</Text>
              <Text style={[styles.colophonValue, { color: colors.textSecondary }]}>
                MAY PHYO THET
              </Text>
            </View>

            <View style={styles.colophonRow}>
              <Text style={[styles.colophonLabel, { color: colors.textMuted }]}>Email</Text>
              <TouchableOpacity onPress={handleEmailPress} activeOpacity={0.6}>
                <Text style={[styles.colophonLink, { color: colors.textSecondary }]}>
                  dev.mayphyothet@gmail.com
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.colophonRow}>
              <Text style={[styles.colophonLabel, { color: colors.textMuted }]}>Contact</Text>
              <TouchableOpacity onPress={handlePhonePress} activeOpacity={0.6}>
                <Text style={[styles.colophonLink, { color: colors.textSecondary }]}>
                  +82 10-7591-5740
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.copyrightText, { color: colors.textMuted }]}>
            © 2026 VocabJip. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
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
  heroCard: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  heroLogo: {
    marginBottom: 14,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  taglineKorean: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  taglineBurmese: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  versionPill: {
    marginTop: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  versionText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  section: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  infoCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  paragraphText: {
    fontSize: 13,
    lineHeight: 21,
  },
  featureGrid: {
    gap: 10,
  },
  featureCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    alignItems: 'flex-start',
  },
  featureIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  featureDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  colophonContainer: {
    marginTop: Spacing.two,
    paddingTop: Spacing.four,
    borderTopWidth: 1,
    gap: 12,
  },
  feedbackBanner: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 4,
  },
  feedbackBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  feedbackBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  feedbackBannerSubtitle: {
    fontSize: 11,
    lineHeight: 16,
  },
  colophonHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  colophonIntro: {
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  colophonDetails: {
    gap: 8,
    marginTop: 4,
  },
  colophonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  colophonLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  colophonValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  colophonLink: {
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  copyrightText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 14,
  },
});

