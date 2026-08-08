import React from 'react';
import { ScrollView, Text, View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import theme from '../../constants/Colors';
import { SiteComplianceFooter } from '../../components/SiteComplianceFooter';
import { SeoHead } from '../../components/SeoHead';
import { GUIDES_HUB, SEO_ARTICLE_LIST } from '../../src/seo/articles';
import { SEO_SITE, buildBreadcrumbJsonLd } from '../../src/seo/site';
import { trackNamedEvent } from '../../src/services/analytics';

const colors = theme.dark;
const webPointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as const) : {};

export default function GuidesHubScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <>
      <SeoHead
        title={GUIDES_HUB.seo.title}
        description={GUIDES_HUB.seo.description}
        keywords={GUIDES_HUB.seo.keywords}
        canonical={GUIDES_HUB.canonical}
        jsonLd={buildBreadcrumbJsonLd([
          { name: SEO_SITE.name, url: SEO_SITE.url },
          { name: '指南', url: GUIDES_HUB.canonical },
        ])}
      />

      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, webPointer]}>
            <Text style={styles.backText}>‹ 返回</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/tools')} style={[styles.toolsLink, webPointer]}>
            <Text style={styles.toolsLinkText}>工具箱</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.h1}>{GUIDES_HUB.hero.title}</Text>
          <Text style={styles.lead}>{GUIDES_HUB.hero.subtitle}</Text>

          {SEO_ARTICLE_LIST.map((article) => (
            <TouchableOpacity
              key={article.slug}
              style={[styles.card, webPointer]}
              onPress={() => {
                trackNamedEvent('seo_guides_hub_click', { slug: article.slug });
                router.push(article.path as '/guides/bazi-chart-tutorial');
              }}
            >
              <Text style={styles.cardBadge}>{article.hero.badge}</Text>
              <Text style={styles.cardTitle}>{article.hero.title}</Text>
              <Text style={styles.cardSub} numberOfLines={3}>
                {article.hero.subtitle}
              </Text>
              <Text style={styles.cardLink}>阅读指南 →</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={[styles.registerBtn, webPointer]} onPress={() => router.push('/tools')}>
            <Text style={styles.registerBtnText}>去体验工具</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: { alignSelf: 'flex-start' },
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
    paddingBottom: 40,
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
  },
  h1: { color: colors.text, fontSize: 28, fontWeight: '800', marginBottom: 10 },
  lead: { color: colors.textSecondary, fontSize: 15, lineHeight: 24, marginBottom: 22 },
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
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: 6, lineHeight: 24 },
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
