export const SEO_SITE = {
  url: 'https://www.shanhai.app',
  name: 'Shanhai Realm',
  nameZh: '山海灵境',
  ogImage: 'https://www.shanhai.app/og-image.png',
  twitterHandle: '@shanhaiapp',
  supportEmail: 'support@shanhai.app',
  locale: 'en_US',
  themeColor: '#7C6CFF',
} as const;

export type SeoMeta = {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
};

export const HOME_SEO: SeoMeta = {
  title: 'Shanhai Realm | Eastern Oracle AI for Clarity, Love & Life Decisions',
  description:
    'Shanhai Realm turns Eastern oracle traditions into simple AI guidance for modern questions. Try symbol readings, I Ching-style oracle guidance, birth-chart patterns, and companion chat. Entertainment only.',
  keywords:
    'shanhai realm, eastern oracle ai, ai fortune reading, spiritual ai companion, chinese astrology, bazi calculator, symbol reading, i ching reading, chinese character divination, 八字, 测字, 易经占卜, 山海灵境',
  canonical: SEO_SITE.url,
};

export const STATIC_PAGE_SEO = {
  pricing: {
    title: 'Pricing & Membership | Shanhai Realm',
    description:
      'Compare Shanhai Realm free and VIP plans. Unlock deeper oracle guidance, birth-chart commentary, follow-up conversations, and premium AI readings. Points packs available.',
    keywords: 'shanhai realm pricing, membership, vip, points, oracle reading premium',
    canonical: `${SEO_SITE.url}/pricing`,
  },
  faq: {
    title: 'FAQ | Shanhai Realm — Eastern Oracle AI Help',
    description:
      'Answers about Shanhai Realm: how the AI companion helps with love, career, timing, points, VIP benefits, privacy, symbol readings, I Ching, and birth-chart guidance.',
    keywords: 'shanhai realm faq, eastern oracle ai help, points, vip, ai fortune reading',
    canonical: `${SEO_SITE.url}/faq`,
  },
  privacy: {
    title: 'Privacy Policy | Shanhai Realm',
    description:
      'How Shanhai Realm collects, uses, and protects your account, birth chart, and usage data. We do not sell personal information.',
    keywords: 'shanhai realm privacy policy, data protection',
    canonical: `${SEO_SITE.url}/privacy`,
  },
  terms: {
    title: 'Terms of Service | Shanhai Realm',
    description:
      'Terms for using Shanhai Realm AI oracle and metaphysics tools. Readings are for entertainment and inspiration only — not medical, legal, or financial advice.',
    keywords: 'shanhai realm terms of service, disclaimer',
    canonical: `${SEO_SITE.url}/terms`,
  },
} as const satisfies Record<string, SeoMeta>;

/** English FAQ schema for /faq — stable for crawlers regardless of UI language. */
export const FAQ_SCHEMA_ITEMS = [
  {
    question: 'What is Shanhai Realm?',
    answer:
      'Shanhai Realm is an Eastern oracle-style AI companion for people who want to reflect on relationships, career choices, timing, and uncertainty through symbolic tools such as character readings, I Ching-style guidance, and birth-chart patterns.',
  },
  {
    question: 'Are readings guaranteed accurate?',
    answer:
      'No. Readings are for inspiration and entertainment only. Do not use them as the sole basis for medical, legal, or financial decisions.',
  },
  {
    question: 'How can I get more points?',
    answer:
      'Earn points through daily check-in, consecutive check-in streaks, and inviting friends. Both sides receive bonus points after successful registration.',
  },
  {
    question: 'What are VIP benefits?',
    answer:
      'VIP typically includes more complete readings, deeper annual commentary, advanced guidance modules, and reduced point costs for frequent use.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'We use encryption and access controls to protect your data and do not sell personal information. See our Privacy Policy for details.',
  },
] as const;

export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SEO_SITE.name,
    alternateName: SEO_SITE.nameZh,
    url: SEO_SITE.url,
    logo: SEO_SITE.ogImage,
    email: SEO_SITE.supportEmail,
    sameAs: [] as string[],
  };
}

export function buildWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SEO_SITE.name,
    url: SEO_SITE.url,
    description: HOME_SEO.description,
    inLanguage: ['en', 'zh-CN', 'zh-TW'],
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SEO_SITE.url}/tools?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildSoftwareApplicationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SEO_SITE.name,
    alternateName: SEO_SITE.nameZh,
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web, iOS, Android',
    url: SEO_SITE.url,
    image: SEO_SITE.ogImage,
    inLanguage: ['en', 'zh-CN', 'zh-TW'],
    description: HOME_SEO.description,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };
}

export function buildFaqPageJsonLd(
  items: ReadonlyArray<{ question: string; answer: string }> = FAQ_SCHEMA_ITEMS,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function buildBreadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
