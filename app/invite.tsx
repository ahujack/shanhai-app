import React, { useMemo } from 'react';
import {
  Image,
  ImageStyle,
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
import { SEO_SITE } from '../src/seo/site';
import { trackNamedEvent } from '../src/services/analytics';

const webPointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as const) : {};
const oracleImage = require('../assets/personas/oracle.png');

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
              <Text style={styles.brand}>山海灵境</Text>
              <Text style={styles.badge}>邀请体验</Text>
            </View>

            <View style={styles.visualRow}>
              <View style={styles.imageWrap}>
                <Image source={oracleImage} style={styles.image as ImageStyle} resizeMode="cover" />
              </View>
              <View style={styles.sealStack}>
                <Text style={styles.seal}>字</Text>
                <Text style={styles.seal}>卦</Text>
                <Text style={styles.seal}>命</Text>
              </View>
            </View>

            <Text style={styles.kicker}>中国传统玄学 AI 陪伴</Text>
            <Text style={styles.title}>问一件卡住的事，先拿到一个方向。</Text>
            <Text style={styles.subtitle}>
              测字、易经、八字与陪伴式对话，适合关系、工作、身份规划和说不清的焦虑。
            </Text>

            {referralCode ? (
              <View style={styles.rewardBox}>
                <Text style={styles.rewardLabel}>你的邀请奖励</Text>
                <Text style={styles.rewardText}>用邀请码 {referralCode} 注册，你和邀请人各得 50 积分。</Text>
              </View>
            ) : (
              <View style={styles.rewardBox}>
                <Text style={styles.rewardLabel}>新用户体验</Text>
                <Text style={styles.rewardText}>注册后可保存解读、继续追问，并领取新用户积分。</Text>
              </View>
            )}

            <View style={styles.ctaRow}>
              <TouchableOpacity style={[styles.primaryBtn, webPointer]} onPress={goRegister}>
                <Text style={styles.primaryText}>领取积分并体验</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.secondaryBtn, webPointer]} onPress={goTryZi}>
                <Text style={styles.secondaryText}>先测一个字</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.methodGrid}>
            <Method title="测字" desc="选一个字，看当下状态和下一步。" />
            <Method title="易经" desc="把纠结的问题转成清晰判断。" />
            <Method title="八字" desc="从长期节奏理解自己和选择。" />
          </View>

          <Text style={styles.disclaimer}>
            山海灵境内容仅供娱乐参考与自我观察，不构成医疗、法律、金融、投资或其他专业建议。
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
  visualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    marginBottom: 18,
  },
  imageWrap: {
    width: 112,
    height: 112,
    borderRadius: 56,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(214, 179, 106, 0.45)',
    backgroundColor: '#17120D',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  sealStack: {
    gap: 8,
  },
  seal: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(214, 179, 106, 0.5)',
    color: '#E6C77B',
    textAlign: 'center',
    lineHeight: 32,
    fontSize: 17,
    fontWeight: '900',
    backgroundColor: 'rgba(214, 179, 106, 0.08)',
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
