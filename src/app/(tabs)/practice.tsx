import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCurriculum } from '@/hooks/use-curriculum';

export default function PracticeScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { essayPrompts } = useCurriculum();
  const q53Prompts = essayPrompts.filter((p) => p.type === 'Q53');
  const q54Prompts = essayPrompts.filter((p) => p.type === 'Q54');
  const activeQ53 = q53Prompts[0];
  const activeQ54 = q54Prompts[0];

  const handleStartPractice = (type: 'Q53' | 'Q54', promptTitle: string, charTarget: string) => {
    router.push({
      pathname: '/modal/wongoji-editor',
      params: { type, promptTitle, charTarget },
    });
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Practice Room</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Small steps. Exam-ready Korean manuscript writing.
          </Text>
        </View>

        {/* Focus Mode Banner */}
        <TouchableOpacity
          onPress={() => handleStartPractice('Q53', '인터넷 사용 통계 (Internet Usage)', '200-300')}
          style={[styles.focusCard, { backgroundColor: colors.primary }]}>
          <View style={styles.focusCardTop}>
            <View style={[styles.focusIconPill, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="timer-outline" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.focusBadgeText}>TIMED FOCUS MODE</Text>
          </View>
          <Text style={styles.focusCardTitle}>Timed TOPIK Simulation</Text>
          <Text style={styles.focusCardDesc}>
            Wongoji အကွက်တွေပေါ်မှာ မိနစ် ၂၀ အတွင်း အရေးအသားလေ့ကျင့်ပါ။
          </Text>
          <View style={styles.focusStartBtn}>
            <Text style={styles.focusStartText}>Start 20-min Session</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* Handwriting Scan Feature Card */}
        <TouchableOpacity
          onPress={() => router.push('/modal/scan-handwriting')}
          style={[
            styles.scanCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          <View style={[styles.scanIconBox, { backgroundColor: colors.accentLight }]}>
            <Ionicons name="camera" size={24} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.scanBadgeRow}>
              <Text style={[styles.scanBadge, { backgroundColor: colors.cardMuted, color: colors.accent }]}>
                HANDWRITING → TEXT
              </Text>
            </View>
            <Text style={[styles.scanCardTitle, { color: colors.text }]}>
              Scan Paper Wongoji
            </Text>
            <Text style={[styles.scanCardDesc, { color: colors.textSecondary }]}>
              မိမိကိုရီးယားလက်ရေးစာမူကို ဓာတ်ပုံရိုက်ပြီး App ထဲမှာ တိုက်ရိုက် edit လုပ်ပါ။
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Practice Topics Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Choose Question Type
        </Text>

        {/* Teacher Essay Review Banner Card */}
        <TouchableOpacity
          onPress={() => router.push('/modal/teacher-review' as any)}
          style={[
            styles.scanCard,
            { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
          ]}>
          <View style={[styles.scanIconBox, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="school" size={24} color="#B45309" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.scanBadgeRow}>
              <Text
                style={[
                  styles.scanBadge,
                  { backgroundColor: '#FEF3C7', color: '#B45309' },
                ]}>
                TEACHER GRADING • Q53 & Q54
              </Text>
            </View>
            <Text style={[styles.scanCardTitle, { color: '#78350F' }]}>
              Teacher Essay Reviews
            </Text>
            <Text style={[styles.scanCardDesc, { color: '#92400E' }]}>
              သင်ရေးထားသော Graph Writing (Q53) နှင့် Long Essay (Q54) စာမူများအတွက် Contributors များ၏ အမှတ်ပေးစစ်ဆေးချက်များကို ကြည့်ပါ။
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#B45309" />
        </TouchableOpacity>

        {/* Q53 Card */}
        <View
          style={[
            styles.topicCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          <View style={styles.topicHeader}>
            <View style={[styles.qTag, { backgroundColor: colors.accentLight }]}>
              <Text style={[styles.qTagText, { color: colors.accent }]}>QUESTION 53</Text>
            </View>
            <Text style={[styles.charTarget, { color: colors.textSecondary }]}>
              200 – 300 CHARACTERS
            </Text>
          </View>

          <Text style={[styles.topicTitle, { color: colors.text }]}>
            {activeQ53 ? `Graph Writing: ${activeQ53.title}` : 'Graph Writing: 인터넷 이용 현황'}
          </Text>
          <Text style={[styles.topicDesc, { color: colors.textSecondary }]}>
            {activeQ53
              ? activeQ53.promptText
              : 'Write a structured 200-300 character summary based on internet usage percentage changes and underlying causes.'}
          </Text>

          <View style={styles.topicButtonsRow}>
            <TouchableOpacity
              onPress={() =>
                handleStartPractice(
                  'Q53',
                  activeQ53 ? activeQ53.title : '인터넷 이용 현황 (Internet Usage)',
                  '200-300'
                )
              }
              style={[styles.openEditorBtn, { backgroundColor: colors.cardMuted }]}>
              <Ionicons name="create-outline" size={16} color={colors.text} />
              <Text style={[styles.openEditorText, { color: colors.text }]}>
                Wongoji Editor
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                handleStartPractice(
                  'Q53',
                  activeQ53 ? activeQ53.title : '인터넷 이용 현황 (Internet Usage)',
                  '200-300'
                )
              }
              style={[styles.startTimedBtn, { backgroundColor: colors.accent }]}>
              <Ionicons name="play" size={14} color="#FFFFFF" />
              <Text style={styles.startTimedText}>Start Timed</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Q54 Card */}
        <View
          style={[
            styles.topicCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          <View style={styles.topicHeader}>
            <View style={[styles.qTag, { backgroundColor: colors.streakLight }]}>
              <Text style={[styles.qTagText, { color: colors.streak }]}>QUESTION 54</Text>
            </View>
            <Text style={[styles.charTarget, { color: colors.textSecondary }]}>
              600 – 700 CHARACTERS
            </Text>
          </View>

          <Text style={[styles.topicTitle, { color: colors.text }]}>
            {activeQ54 ? `Long Essay: ${activeQ54.title}` : 'Long Essay: 평생 교육의 필요성'}
          </Text>
          <Text style={[styles.topicDesc, { color: colors.textSecondary }]}>
            {activeQ54
              ? activeQ54.promptText
              : 'Build your three-part argument: Introduction → Two supporting arguments with examples → Conclusion and social proposals.'}
          </Text>

          <View style={styles.topicButtonsRow}>
            <TouchableOpacity
              onPress={() =>
                handleStartPractice(
                  'Q54',
                  activeQ54 ? activeQ54.title : '평생 교육의 필요성 (Lifelong Learning)',
                  '600-700'
                )
              }
              style={[styles.openEditorBtn, { backgroundColor: colors.cardMuted }]}>
              <Ionicons name="create-outline" size={16} color={colors.text} />
              <Text style={[styles.openEditorText, { color: colors.text }]}>
                Wongoji Editor
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                handleStartPractice(
                  'Q54',
                  activeQ54 ? activeQ54.title : '평생 교육의 필요성 (Lifelong Learning)',
                  '600-700'
                )
              }
              style={[styles.startTimedBtn, { backgroundColor: colors.accent }]}>
              <Ionicons name="play" size={14} color="#FFFFFF" />
              <Text style={styles.startTimedText}>Start Timed</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* University Personal Statements (자기소개서) Card */}
        <TouchableOpacity
          onPress={() => router.push('/modal/admissions')}
          style={[
            styles.topicCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          <View style={styles.topicHeader}>
            <View style={[styles.qTag, { backgroundColor: colors.accentLight }]}>
              <Text style={[styles.qTagText, { color: colors.accent }]}>ADMISSIONS</Text>
            </View>
            <Text style={[styles.charTarget, { color: colors.textSecondary }]}>
              4-STEP WIZARD
            </Text>
          </View>

          <Text style={[styles.topicTitle, { color: colors.text }]}>
            University Personal Statements (자기소개서)
          </Text>
          <Text style={[styles.topicDesc, { color: colors.textSecondary }]}>
            ကိုရီးယား တက္ကသိုလ်နဲ့ ပညာသင်ဆု လျှောက်လွှာတွေအတွက် ကိုယ့်ရဲ့ story ကိုတင်ပြပါ။ AI ရဲ့ လမ်းညွှန်မှုနဲ့အတူ အဆင့်ဆင့် ရေးသားပါ။
          </Text>

          <View style={[styles.statementBuilderBtn, { backgroundColor: colors.primary }]}>
            <Ionicons name="school-outline" size={18} color={colors.primaryContrast} />
            <Text style={[styles.statementBuilderText, { color: colors.primaryContrast }]}>
              Open Statement Builder
            </Text>
          </View>
        </TouchableOpacity>
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
    lineHeight: 20,
  },
  focusCard: {
    borderRadius: 18,
    padding: 20,
    gap: 8,
  },
  focusCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  focusIconPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusBadgeText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  focusCardTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  focusCardDesc: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    lineHeight: 22,
    marginTop: 6,
    paddingTop: 2,
  },
  focusStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  focusStartText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  scanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  scanIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanBadgeRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  scanBadge: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  scanCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  scanCardDesc: {
    fontSize: 12,
    lineHeight: 21,
    marginTop: 4,
    paddingTop: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: Spacing.two,
  },
  topicCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  qTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  charTarget: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  topicTitle: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 25,
    marginTop: 2,
  },
  topicDesc: {
    fontSize: 13,
    lineHeight: 22,
    marginTop: 4,
    paddingTop: 2,
  },
  topicButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  openEditorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 12,
    gap: 6,
  },
  openEditorText: {
    fontSize: 13,
    fontWeight: '600',
  },
  startTimedBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 12,
    gap: 6,
  },
  startTimedText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  statementBuilderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  statementBuilderText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

