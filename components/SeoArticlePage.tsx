import React, { useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import theme from '../constants/Colors';
import { SiteComplianceFooter } from './SiteComplianceFooter';
import { SeoHead } from './SeoHead';
import {
  SEO_ARTICLE_LIST,
  buildArticleJsonLd,
  buildHowToJsonLd,
  type SeoArticle,
} from '../src/seo/articles';
import { SEO_SITE, buildBreadcrumbJsonLd, buildFaqPageJsonLd } from '../src/seo/site';
import { trackNamedEvent } from '../src/services/analytics';

const colors = theme.dark;
const webPointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as const) : {};

type Props = {
  article: SeoArticle;
};

export default function SeoArticlePage({ article }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const related = SEO_ARTICLE_LIST.filter((item) => item.slug !== article.slug).slice(0, 3);

  const jsonLd = [
    buildArticleJsonLd(article),
    buildHowToJsonLd(article),
    buildFaqPageJsonLd(article.faq),
    buildBreadcrumbJsonLd([
      { name: SEO_SITE.name, url: SEO_SITE.url },
      { name: '指南', url: `${SEO_SITE.url}/guides` },
      { name: article.hero.badge, url: article.canonical },
    ]),
  ];

  const goTool = () => {
    trackNamedEvent('seo_article_cta', { slug: article.slug, target: 'tool' });
    router.push(article.toolPath as '/bazi-calculator');
  };

  const goGuides = () => {
    trackNamedEvent('seo_article_cta', { slug: article.slug, target: 'guides' });
    router.push('/guides');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <SeoHead
        title={article.seo.title}
        description={article.seo.description}
        keywords={article.seo.keywords}
        canonical={article.canonical}
        ogType="article"
        jsonLd={jsonLd}
      />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, webPointer]} hitSlop={12}>
          <Text style={styles.backText}>‹ 返回</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goGuides} style={[styles.toolsLink, webPointer]}>
          <Text style={styles.toolsLinkText}>全部指南</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.badge}>{article.hero.badge}</Text>
        <Text style={styles.h1}>{article.hero.title}</Text>
        <Text style={styles.meta}>
          更新于 {article.updatedAt} · 可转载请注明出处并链接原文
        </Text>
        <Text style={styles.lead}>{article.hero.subtitle}</Text>

        <View style={styles.ctaRow}>
          <TouchableOpacity style={[styles.primaryBtn, webPointer]} onPress={goTool}>
            <Text style={styles.primaryBtnText}>{article.cta.primary}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.secondaryBtn, webPointer]} onPress={goGuides}>
            <Text style={styles.secondaryBtnText}>{article.cta.secondary}</Text>
          </TouchableOpacity>
        </View>

        {article.sections.map((section) => (
          <View key={section.heading} style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>{section.heading}</Text>
            {section.paragraphs.map((p) => (
              <Text key={p.slice(0, 24)} style={styles.paragraph}>
                {p}
              </Text>
            ))}
            {section.bullets?.map((bullet) => (
              <Text key={bullet} style={styles.bullet}>
                · {bullet}
              </Text>
            ))}
          </View>
        ))}

        <Text style={styles.sectionTitle}>常见问题</Text>
        {article.faq.map((item, idx) => (
          <TouchableOpacity
            key={item.question}
            style={styles.faqItem}
            onPress={() => setOpenFaq(openFaq === idx ? null : idx)}
            activeOpacity={0.85}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>{item.question}</Text>
              <Text style={styles.faqToggle}>{openFaq === idx ? '−' : '+'}</Text>
            </View>
            {openFaq === idx ? <Text style={styles.faqAnswer}>{item.answer}</Text> : null}
          </TouchableOpacity>
        ))}

        <View style={styles.citeBox}>
          <Text style={styles.citeTitle}>欢迎引用与外链</Text>
          <Text style={styles.citeText}>
            若本页对你有帮助，欢迎在博客、小红书、知乎或社群分享，并附上原文链接：
          </Text>
          <Text
            style={styles.citeLink}
            onPress={() => Linking.openURL(article.canonical).catch(() => null)}
          >
            {article.canonical}
          </Text>
        </View>

        {related.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>继续阅读</Text>
            <View style={styles.relatedRow}>
              {related.map((rel) => (
                <TouchableOpacity
                  key={rel.slug}
                  style={[styles.relatedChip, webPointer]}
                  onPress={() => {
                    trackNamedEvent('seo_article_related', { from: article.slug, to: rel.slug });
                    router.push(rel.path as '/guides/bazi-chart-tutorial');
                  }}
                >
                  <Text style={styles.relatedChipText}>{rel.hero.badge}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.relatedChip, webPointer]}
                onPress={() => router.push(article.toolPath as '/bazi-calculator')}
              >
                <Text style={styles.relatedChipText}>{article.toolLabel}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}

        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerTitle}>娱乐免责声明</Text>
          <Text style={styles.disclaimerText}>
            本指南与山海灵境工具仅供灵感与娱乐，不构成医疗、法律或财务建议。
          </Text>
        </View>

        <SiteComplianceFooter variant="compact" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.palette.plum,
  },
  backBtn: { minWidth: 72 },
  backText: { color: colors.tabIconSelected, fontSize: 16, fontWeight: '600' },
  toolsLink: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.palette.plum,
  },
  toolsLinkText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  content: {
    padding: 20,
    paddingBottom: 48,
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
  },
  badge: {
    alignSelf: 'flex-start',
    color: colors.tabIconSelected,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    backgroundColor: 'rgba(214, 179, 106, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(214, 179, 106, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 14,
  },
  h1: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 38,
    marginBottom: 8,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 12,
  },
  lead: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 20,
  },
  ctaRow: { gap: 10, marginBottom: 24 },
  primaryBtn: {
    backgroundColor: colors.tabIconSelected,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#1A1230', fontSize: 15, fontWeight: '800' },
  secondaryBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.palette.plum,
    backgroundColor: colors.surface,
  },
  secondaryBtnText: { color: colors.text, fontSize: 15, fontWeight: '700' },
  sectionBlock: { marginBottom: 18 },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 10,
    marginTop: 8,
  },
  paragraph: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 26,
    marginBottom: 8,
  },
  bullet: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 4,
    paddingLeft: 2,
  },
  faqItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.palette.plum,
    padding: 14,
    marginBottom: 8,
  },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  faqQuestion: { color: colors.text, fontSize: 15, fontWeight: '700', flex: 1 },
  faqToggle: { color: colors.tabIconSelected, fontSize: 18, fontWeight: '700' },
  faqAnswer: { color: colors.textSecondary, fontSize: 14, lineHeight: 22, marginTop: 10 },
  citeBox: {
    marginTop: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(214, 179, 106, 0.35)',
    backgroundColor: 'rgba(214, 179, 106, 0.08)',
  },
  citeTitle: { color: colors.tabIconSelected, fontSize: 15, fontWeight: '800', marginBottom: 6 },
  citeText: { color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
  citeLink: { color: colors.accent, fontSize: 13, marginTop: 8, fontWeight: '600' },
  relatedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  relatedChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.palette.plum,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  relatedChipText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  disclaimerBox: {
    marginTop: 8,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.palette.plum,
  },
  disclaimerTitle: { color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  disclaimerText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
});
