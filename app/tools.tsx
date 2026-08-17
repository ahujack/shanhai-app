import React from 'react';
import { ScrollView, Text, View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import theme from '../constants/Colors';
import { SiteComplianceFooter } from '../components/SiteComplianceFooter';
import { SeoHead } from '../components/SeoHead';
import { LANDING_PAGE_LIST, TOOLS_HUB } from '../src/seo/landingPages';
import { SEO_ARTICLE_LIST } from '../src/seo/articles';
import { trackNamedEvent } from '../src/services/analytics';
import { SEO_SITE, buildBreadcrumbJsonLd } from '../src/seo/site';

const colors = theme.dark;
const webPointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as const) : {};

export default function ToolsHubScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <>
      <SeoHead
        title={TOOLS_HUB.seo.title}
        description={TOOLS_HUB.seo.description}
        keywords={TOOLS_HUB.seo.keywords}
        canonical={TOOLS_HUB.canonical}
        jsonLd={buildBreadcrumbJsonLd([
          { name: SEO_SITE.name, url: SEO_SITE.url },
          { name: '工具', url: TOOLS_HUB.canonical },
        ])}
      />

      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, webPointer]}>
            <Text style={styles.backText}>‹ 返回</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.h1}>{TOOLS_HUB.hero.title}</Text>
          <Text style={styles.lead}>{TOOLS_HUB.hero.subtitle}</Text>

          {LANDING_PAGE_LIST.map((page) => (
            <TouchableOpacity
              key={page.slug}
              style={[styles.card, webPointer]}
              onPress={() => {
                trackNamedEvent('seo_tools_hub_click', { slug: page.slug });
                router.push(page.path as '/bazi-calculator');
              }}
            >
              <Text style={styles.cardBadge}>{page.hero.badge}</Text>
              <Text style={styles.cardTitle}>{page.hero.title}</Text>
              <Text style={styles.cardSub} numberOfLines={2}>
                {page.hero.subtitle}
              </Text>
              <Text style={styles.cardLink}>打开工具 →</Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.sectionTitle}>使用指南（适合收藏与分享）</Text>
          {SEO_ARTICLE_LIST.map((article) => (
            <TouchableOpacity
              key={article.slug}
              style={[styles.card, webPointer]}
              onPress={() => {
                trackNamedEvent('seo_tools_guide_click', { slug: article.slug });
                router.push(article.path as '/guides/bazi-chart-tutorial');
              }}
            >
              <Text style={styles.cardBadge}>{article.hero.badge}</Text>
              <Text style={styles.cardTitle}>{article.hero.title}</Text>
              <Text style={styles.cardSub} numberOfLines={2}>
                {article.hero.subtitle}
              </Text>
              <Text style={styles.cardLink}>阅读指南 →</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={[styles.registerBtn, webPointer]} onPress={() => router.push('/guides')}>
            <Text style={styles.registerBtnText}>查看全部指南</Text>
          </TouchableOpacity>

          <SiteComplianceFooter variant="compact" />
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.palette.plum,
  },
  backBtn: { alignSelf: 'flex-start' },
  backText: { color: colors.tabIconSelected, fontSize: 16, fontWeight: '600' },
  content: {
    padding: 20,
    paddingBottom: 40,
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
  },
  h1: { color: colors.text, fontSize: 28, fontWeight: '800', marginBottom: 10 },
  lead: { color: colors.textSecondary, fontSize: 15, lineHeight: 24, marginBottom: 22 },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.palette.plum,
  },
  cardBadge: {
    color: colors.tabIconSelected,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: 6 },
  cardSub: { color: colors.textSecondary, fontSize: 14, lineHeight: 21 },
  cardLink: { color: colors.accent, fontSize: 14, fontWeight: '700', marginTop: 10 },
  registerBtn: {
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: colors.tabIconSelected,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  registerBtnText: { color: '#1A1230', fontSize: 15, fontWeight: '800' },
});
