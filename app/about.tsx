import React from 'react';
import { ScrollView, Text, View, TouchableOpacity, StyleSheet, Platform, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import theme from '../constants/Colors';
import { serifTitle } from '../constants/typography';
import { SeoHead } from '../components/SeoHead';
import { SiteComplianceFooter } from '../components/SiteComplianceFooter';
import TrustStrip from '../components/TrustStrip';
import { useI18nStore } from '../src/store/i18n';
import { STATIC_PAGE_SEO } from '../src/seo/site';

const ink = theme.dark;
const colors = {
  background: ink.background,
  card: ink.card,
  text: ink.text,
  textSecondary: ink.textSecondary,
  accent: ink.accent,
  border: ink.palette.plum,
};

const webPointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as const) : {};

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const language = useI18nStore((state) => state.language);
  const t = useI18nStore((state) => state.t);

  const copy =
    language === 'en-US'
      ? {
          title: 'About Shanhai Realm',
          slogan: 'Not a verdict. A compass for your next step.',
          lead: 'An Eastern oracle-style AI companion for reflection — not absolute prophecy.',
          whoTitle: 'Who we are',
          whoBody:
            'Shanhai Realm combines traditional Chinese symbol systems (BaZi, character reading, I Ching-style guidance) with modern AI, so you can clarify feelings, timing, and next steps in plain language.',
          howTitle: 'How we work',
          howItems: [
            'We turn your question into a structured reading: observation → verdict → actionable next step.',
            'Free tiers help you experience the rhythm; VIP unlocks deeper commentary and lower point costs.',
            'All readings are for entertainment and self-reflection only — not medical, legal, or financial advice.',
          ],
          trustTitle: 'Trust & safety',
          trustItems: [
            'We do not sell your personal data.',
            'Payments go through Creem; support email is always visible in the app.',
            'You can request account deletion and data export via support@shanhai.app.',
          ],
          ctaPrimary: 'Try a free reading',
          ctaSecondary: 'View pricing',
          ctaReport: 'Get a deep destiny report ($9.9)',
          ctaViewReport: 'Open my saved report',
        }
      : language === 'zh-TW'
        ? {
            title: '關於山海靈境',
            slogan: '不是判決，是下一步的座標。',
            lead: '東方玄學風格的 AI 陪伴：幫你反思，而不是給絕對預言。',
            whoTitle: '我們是誰',
            whoBody:
              '山海靈境把八字、測字、易經式指引與現代 AI 結合，用白話幫你梳理感情、時機與下一步。',
            howTitle: '我們怎麼做',
            howItems: [
              '把問題變成結構化解讀：現象觀察 → 扎心結論 → 可執行下一步。',
              '免費檔幫你先體驗節奏；VIP 解鎖更深批註與更低積分消耗。',
              '所有解讀僅供娛樂與自我反思，不構成醫療、法律或財務建議。',
            ],
            trustTitle: '信任與安全',
            trustItems: [
              '我們不出售你的個人資料。',
              '支付走 Creem；應用內始終可見客服郵箱。',
              '可透過 support@shanhai.app 申請刪除帳號與匯出資料。',
            ],
            ctaPrimary: '先免費體驗一次',
            ctaSecondary: '查看定價',
            ctaReport: '獲取深度命運報告（$9.9）',
            ctaViewReport: '打開我已保存的報告',
          }
        : {
            title: '关于山海灵境',
            slogan: '不是判决，是下一步的坐标。',
            lead: '东方玄学风格的 AI 陪伴：帮你反思，而不是给绝对预言。',
            whoTitle: '我们是谁',
            whoBody:
              '山海灵境把八字、测字、易经式指引与现代 AI 结合，用白话帮你梳理感情、时机与下一步。',
            howTitle: '我们怎么做',
            howItems: [
              '把问题变成结构化解读：现象观察 → 扎心结论 → 可执行下一步。',
              '免费档帮你先体验节奏；VIP 解锁更深批注与更低积分消耗。',
              '所有解读仅供娱乐与自我反思，不构成医疗、法律或财务建议。',
            ],
            trustTitle: '信任与安全',
            trustItems: [
              '我们不出售你的个人数据。',
              '支付走 Creem；应用内始终可见客服邮箱。',
              '可通过 support@shanhai.app 申请删除账号与导出数据。',
            ],
            ctaPrimary: '先免费体验一次',
            ctaSecondary: '查看定价',
            ctaReport: '获取深度命运报告（$9.9）',
            ctaViewReport: '打开我已保存的报告',
          };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + 12 }]}
      contentContainerStyle={styles.content}
    >
      <SeoHead
        title={STATIC_PAGE_SEO.about.title}
        description={STATIC_PAGE_SEO.about.description}
        keywords={STATIC_PAGE_SEO.about.keywords}
        canonical={STATIC_PAGE_SEO.about.canonical}
      />

      <Text style={styles.brand}>山海灵境</Text>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.slogan}>{copy.slogan}</Text>
      <Text style={styles.lead}>{copy.lead}</Text>

      <TrustStrip />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{copy.whoTitle}</Text>
        <Text style={styles.body}>{copy.whoBody}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{copy.howTitle}</Text>
        {copy.howItems.map((item) => (
          <Text key={item} style={styles.bullet}>
            • {item}
          </Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{copy.trustTitle}</Text>
        {copy.trustItems.map((item) => (
          <Text key={item} style={styles.bullet}>
            • {item}
          </Text>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.primaryBtn, webPointer]}
        onPress={() => router.push('/(tabs)')}
      >
        <Text style={styles.primaryBtnText}>{copy.ctaPrimary}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryBtn, webPointer]}
        onPress={() => router.push('/(tabs)/points')}
      >
        <Text style={styles.secondaryBtnText}>{copy.ctaSecondary}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.reportBtn, webPointer]}
        onPress={() => router.push({ pathname: '/(tabs)/points', params: { focus: 'report' } })}
      >
        <Text style={styles.reportBtnText}>{copy.ctaReport}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryBtn, webPointer]}
        onPress={() => router.push('/deep-destiny-report')}
      >
        <Text style={styles.secondaryBtnText}>{copy.ctaViewReport}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={webPointer}
        onPress={() => Linking.openURL('mailto:support@shanhai.app').catch(() => null)}
      >
        <Text style={styles.support}>
          {t('common.supportEmail', '客服邮箱：{email}').replace('{email}', 'support@shanhai.app')}
        </Text>
      </TouchableOpacity>

      <SiteComplianceFooter variant="compact" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  brand: {
    ...serifTitle,
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 6,
    marginBottom: 10,
  },
  title: {
    ...serifTitle,
    color: colors.text,
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 8,
  },
  slogan: {
    ...serifTitle,
    color: colors.accent,
    fontSize: 17,
    fontStyle: 'italic',
    lineHeight: 26,
    marginBottom: 12,
  },
  lead: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  body: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 22,
  },
  bullet: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#1A1230',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryBtn: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(248, 208, 95, 0.45)',
    paddingVertical: 13,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  reportBtn: {
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(124, 108, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(124, 108, 255, 0.45)',
    paddingVertical: 13,
    alignItems: 'center',
  },
  reportBtnText: {
    color: '#D6D0FF',
    fontSize: 14,
    fontWeight: '700',
  },
  support: {
    marginTop: 18,
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 13,
  },
});
