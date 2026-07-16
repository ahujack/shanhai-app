import React, { useMemo } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SeoHead } from '../components/SeoHead';
import CompanionPresence from '../components/CompanionPresence';
import LanguageToggle from '../components/LanguageToggle';
import { SEO_SITE } from '../src/seo/site';
import { trackNamedEvent } from '../src/services/analytics';
import { useI18nStore } from '../src/store/i18n';

const webPointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as const) : {};
const cloudWandererImage = require('../assets/personas/elder.png');

function normalizeCode(value?: string | string[]) {
  const raw = Array.isArray(value) ? value[0] : value;
  return String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '');
}

export default function InviteLandingPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const language = useI18nStore((state) => state.language);
  const tx = (zh: string, en: string, tw: string) => (language === 'en-US' ? en : language === 'zh-TW' ? tw : zh);
  const params = useLocalSearchParams<{ ref?: string; invite?: string }>();
  const referralCode = normalizeCode(params.ref || params.invite);

  const registerUrl = useMemo(() => {
    return referralCode
      ? `/register?ref=${encodeURIComponent(referralCode)}`
      : '/register';
  }, [referralCode]);

  const goRegister = () => {
    trackNamedEvent('invite_landing_cta', {
      ref: referralCode || null,
      target: 'register',
    });
    router.push(registerUrl as '/register');
  };

  const goTryZi = () => {
    trackNamedEvent('invite_landing_cta', {
      ref: referralCode || null,
      target: 'zi',
    });
    router.push({
      pathname: '/(tabs)/zi',
      params: referralCode
        ? { ref: referralCode, invitePreview: '1' }
        : { invitePreview: '1' },
    });
  };

  return (
    <>
      <SeoHead
        title="山海灵境邀请 | 海外华人的中文玄学 AI 陪伴"
        description="领取邀请奖励，体验测字、易经占卜、八字与中文玄学 AI 陪伴。仅供娱乐参考。"
        canonical={`${SEO_SITE.url}/invite`}
        noindex
      />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.topLine}>
              <Text style={styles.brand}>{tx('山海灵境', 'Shanhai Realm', '山海靈境')}</Text>
              <Text style={styles.badge}>{tx('邀请体验', 'Invite', '邀請體驗')}</Text>
            </View>
            <LanguageToggle compact style={styles.languageToggle} />

            <CompanionPresence
              image={cloudWandererImage}
              name={tx('云游子', 'Yunyouzi', '雲遊子')}
              title={tx('断事老师', 'Reading Companion', '斷事老師')}
              line={tx(
                '先取一个字，云游子替你看形、看势，再给一个当下能用的方向。',
                'Start with one Chinese character. Yunyouzi reads its shape, pattern, and next direction.',
                '先取一個字，雲遊子替你看形、看勢，再給一個當下能用的方向。',
              )}
              mode="hero"
              style={styles.companion}
            />

            <Text style={styles.kicker}>{tx('中国传统玄学 AI 陪伴', 'Chinese Metaphysics AI Companion', '中國傳統玄學 AI 陪伴')}</Text>
            <Text style={styles.title}>{tx('问一件卡住的事，先拿到一个方向。', 'Ask what feels stuck. Get one clear direction first.', '問一件卡住的事，先拿到一個方向。')}</Text>
            <Text style={styles.subtitle}>
              {tx(
                '测字、易经、八字与陪伴式对话，适合关系、工作、身份规划和说不清的焦虑。',
                'Character reading, I Ching, Bazi, and companion chat for relationships, career, identity, and unclear anxiety.',
                '測字、易經、八字與陪伴式對話，適合關係、工作、身份規劃和說不清的焦慮。',
              )}
            </Text>

            {referralCode ? (
              <View style={styles.rewardBox}>
                <Text style={styles.rewardLabel}>{tx('你的邀请奖励', 'Invite reward', '你的邀請獎勵')}</Text>
                <Text style={styles.rewardText}>{tx(`用邀请码 ${referralCode} 注册，你和邀请人各得 50 积分。`, `Register with code ${referralCode}. You and your inviter each get 50 points.`, `用邀請碼 ${referralCode} 註冊，你和邀請人各得 50 積分。`)}</Text>
              </View>
            ) : (
              <View style={styles.rewardBox}>
                <Text style={styles.rewardLabel}>{tx('新用户体验', 'New user trial', '新用戶體驗')}</Text>
                <Text style={styles.rewardText}>{tx('注册后可保存解读、继续追问，并领取新用户积分。', 'Register to save readings, continue follow-ups, and receive starter points.', '註冊後可保存解讀、繼續追問，並領取新用戶積分。')}</Text>
              </View>
            )}

            <View style={styles.ctaRow}>
              <TouchableOpacity style={[styles.primaryBtn, webPointer]} onPress={goRegister}>
                <Text style={styles.primaryText}>{tx('领取积分并体验', 'Claim points and start', '領取積分並體驗')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.secondaryBtn, webPointer]} onPress={goTryZi}>
                <Text style={styles.secondaryText}>{tx('先测一个字', 'Try one character', '先測一個字')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.methodGrid}>
            <Method title={tx('测字', 'Character', '測字')} desc={tx('选一个字，看当下状态和下一步。', 'Pick one character to read your current state.', '選一個字，看當下狀態和下一步。')} />
            <Method title={tx('易经', 'I Ching', '易經')} desc={tx('把纠结的问题转成清晰判断。', 'Turn a dilemma into clearer judgment.', '把糾結的問題轉成清晰判斷。')} />
            <Method title={tx('八字', 'Bazi', '八字')} desc={tx('从长期节奏理解自己和选择。', 'Understand yourself through long-term rhythm.', '從長期節奏理解自己和選擇。')} />
          </View>

          <Text style={styles.disclaimer}>
            {tx(
              '山海灵境内容仅供娱乐参考与自我观察，不构成医疗、法律、金融、投资或其他专业建议。',
              'For entertainment and self-reflection only. Not medical, legal, financial, investment, or professional advice.',
              '山海靈境內容僅供娛樂參考與自我觀察，不構成醫療、法律、金融、投資或其他專業建議。',
            )}
          </Text>
        </ScrollView>
      </View>
    </>
  );
}

function Method({ title, desc }: { title: string; desc: string }) {
  return (
    <View style={styles.methodCard}>
      <Text style={styles.methodTitle}>{title}</Text>
      <Text style={styles.methodDesc}>{desc}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090B10',
  },
  content: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 42,
  },
  hero: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(214, 179, 106, 0.24)',
    backgroundColor: '#111827',
    padding: 18,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  languageToggle: {
    marginBottom: 14,
  },
  brand: {
    color: '#D6B36A',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  badge: {
    color: '#C7D0DF',
    fontSize: 12,
    fontWeight: '800',
    borderWidth: 1,
    borderColor: '#263244',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#0B1220',
  },
  companion: {
    marginBottom: 16,
  },
  kicker: {
    color: '#D6B36A',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.4,
    textAlign: 'center',
    marginBottom: 10,
  },
  title: {
    color: '#F4EBDC',
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: '#AAB3C5',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 12,
  },
  rewardBox: {
    marginTop: 18,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(214, 179, 106, 0.28)',
    backgroundColor: 'rgba(214, 179, 106, 0.08)',
    padding: 13,
  },
  rewardLabel: {
    color: '#D6B36A',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 4,
  },
  rewardText: {
    color: '#E8ECF3',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  ctaRow: {
    marginTop: 18,
    gap: 10,
  },
  primaryBtn: {
    height: 48,
    borderRadius: 8,
    backgroundColor: '#D6B36A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#17120D',
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryBtn: {
    height: 46,
    borderRadius: 8,
    backgroundColor: '#0B1220',
    borderWidth: 1,
    borderColor: '#263244',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: '#E8ECF3',
    fontSize: 15,
    fontWeight: '800',
  },
  methodGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  methodCard: {
    flex: 1,
    minHeight: 96,
    borderRadius: 8,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#263244',
    padding: 12,
  },
  methodTitle: {
    color: '#F4EBDC',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 6,
  },
  methodDesc: {
    color: '#9AA7B8',
    fontSize: 11,
    lineHeight: 16,
  },
  disclaimer: {
    color: '#718096',
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 18,
  },
});
