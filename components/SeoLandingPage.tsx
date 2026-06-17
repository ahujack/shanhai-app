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
import { trackNamedEvent } from '../src/services/analytics';
import {
  LANDING_PAGES,
  type LandingPageConfig,
} from '../src/seo/landingPages';
import { SEO_SITE, buildBreadcrumbJsonLd } from '../src/seo/site';

const colors = theme.dark;
const webPointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as const) : {};

type Props = {
  page: LandingPageConfig;
};

function buildFaqJsonLd(page: LandingPageConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

function buildWebAppJsonLd(page: LandingPageConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Shanhai Realm',
    url: page.canonical,
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web, iOS, Android',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: page.seo.description,
  };
}

export default function SeoLandingPage({ page }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const related = page.relatedSlugs
    .map((slug) => LANDING_PAGES[slug])
    .filter(Boolean);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: SEO_SITE.name, url: SEO_SITE.url },
    { name: 'Tools', url: `${SEO_SITE.url}/tools` },
    { name: page.hero.badge, url: page.canonical },
  ]);

  const goPrimary = () => {
    trackNamedEvent('seo_landing_cta', { slug: page.slug, target: 'primary' });
    router.push(page.ctaRoute as '/bazi-calculator');
  };

  const goRegister = () => {
    trackNamedEvent('seo_landing_cta', { slug: page.slug, target: 'register' });
    router.push('/register');
  };

  const goRelated = (path: string, slug: string) => {
    trackNamedEvent('seo_landing_related', { from: page.slug, to: slug });
    router.push(path as '/bazi-calculator');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <SeoHead
        title={page.seo.title}
        description={page.seo.description}
        keywords={page.seo.keywords}
        canonical={page.canonical}
        jsonLd={[buildFaqJsonLd(page), buildWebAppJsonLd(page), breadcrumbJsonLd]}
      />

      <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, webPointer]} hitSlop={12}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/tools')} style={[styles.toolsLink, webPointer]}>
            <Text style={styles.toolsLinkText}>All tools</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.badge}>{page.hero.badge}</Text>
          <Text style={styles.h1}>{page.hero.title}</Text>
          <Text style={styles.lead}>{page.hero.subtitle}</Text>

          <View style={styles.ctaRow}>
            <TouchableOpacity style={[styles.primaryBtn, webPointer]} onPress={goPrimary}>
              <Text style={styles.primaryBtnText}>{page.cta.primary}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.secondaryBtn, webPointer]} onPress={goRegister}>
              <Text style={styles.secondaryBtnText}>{page.cta.secondary}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Why use this in Shanhai Realm</Text>
          <View style={styles.featureGrid}>
            {page.features.map((f) => (
              <View key={f.title} style={styles.featureCard}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureBody}>{f.body}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>How it works</Text>
          {page.steps.map((step, idx) => (
            <View key={step.title} style={styles.stepRow}>
              <View style={styles.stepIndex}>
                <Text style={styles.stepIndexText}>{idx + 1}</Text>
              </View>
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepText}>{step.body}</Text>
              </View>
            </View>
          ))}

          <Text style={styles.sectionTitle}>FAQ</Text>
          {page.faq.map((item, idx) => (
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

          {related.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Explore more tools</Text>
              <View style={styles.relatedRow}>
                {related.map((rel) => (
                  <TouchableOpacity
                    key={rel.slug}
                    style={[styles.relatedChip, webPointer]}
                    onPress={() => goRelated(rel.path, rel.slug)}
                  >
                    <Text style={styles.relatedChipText}>{rel.hero.badge}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerTitle}>Entertainment disclaimer</Text>
            <Text style={styles.disclaimerText}>
              Shanhai Realm offers AI-assisted metaphysics-inspired content for inspiration and entertainment only.
              It is not medical, legal, or financial advice.{' '}
              <Text
                style={styles.disclaimerLink}
                onPress={() => Linking.openURL('https://www.shanhai.app/terms').catch(() => null)}
              >
                Terms
              </Text>
              {' · '}
              <Text
                style={styles.disclaimerLink}
                onPress={() => Linking.openURL('https://www.shanhai.app/privacy').catch(() => null)}
              >
                Privacy
              </Text>
            </Text>
          </View>

          <SiteComplianceFooter variant="compact" />
        </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.palette.plum,
  },
  backBtn: {
    minWidth: 72,
  },
  backText: {
    color: colors.tabIconSelected,
    fontSize: 16,
    fontWeight: '600',
  },
  toolsLink: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.palette.plum,
  },
  toolsLinkText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
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
    textTransform: 'uppercase',
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
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 38,
    marginBottom: 12,
  },
  lead: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 22,
  },
  ctaRow: {
    gap: 10,
    marginBottom: 28,
  },
  primaryBtn: {
    backgroundColor: colors.tabIconSelected,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#1A1230',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryBtn: {
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.palette.plum,
    backgroundColor: colors.surface,
  },
  secondaryBtnText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 14,
    marginTop: 8,
  },
  featureGrid: {
    gap: 12,
    marginBottom: 24,
  },
  featureCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.palette.plum,
  },
  featureIcon: {
    fontSize: 22,
    marginBottom: 8,
  },
  featureTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  featureBody: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  stepIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(124, 108, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(124, 108, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndexText: {
    color: colors.accent,
    fontWeight: '800',
  },
  stepBody: {
    flex: 1,
  },
  stepTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  stepText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  faqItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.palette.plum,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  faqQuestion: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  faqToggle: {
    color: colors.tabIconSelected,
    fontSize: 18,
    fontWeight: '800',
  },
  faqAnswer: {
    marginTop: 10,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  relatedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  relatedChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.palette.plum,
  },
  relatedChipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  disclaimerBox: {
    marginTop: 8,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(201, 106, 106, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(201, 106, 106, 0.25)',
  },
  disclaimerTitle: {
    color: colors.palette.warn,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  disclaimerText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  disclaimerLink: {
    color: colors.tabIconSelected,
    textDecorationLine: 'underline',
  },
});
