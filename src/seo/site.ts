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
  title: 'Shanhai Realm | Eastern Metaphysics AI Companion for Life Decisions',
  description:
    'Shanhai Realm helps overseas Chinese users process relationships, career choices, and life uncertainty with an AI companion grounded in BaZi, CeZi, I Ching, and daily oracle slips. Entertainment only.',
  keywords:
    'shanhai realm, bazi calculator, chinese character divination, cezi, i ching reading, daily fortune, 八字, 测字, 占卜, 山海灵境',
  canonical: SEO_SITE.url,
};

export const STATIC_PAGE_SEO = {
  pricing: {
    title: 'Pricing & Membership | Shanhai Realm',
    description:
      'Compare Shanhai Realm free and VIP plans. Unlock deeper BaZi commentary, unlimited readings, and premium AI guidance. Points packs available.',
    keywords: 'shanhai realm pricing, membership, vip, points, bazi premium',
    canonical: `${SEO_SITE.url}/pricing`,
  },
  faq: {
    title: 'FAQ | Shanhai Realm — BaZi, CeZi & I Ching Help',
    description:
      'Answers about Shanhai Realm: how the AI companion helps with life decisions, points, VIP benefits, check-in rewards, data privacy, and BaZi, 测字, and I Ching readings.',
    keywords: 'shanhai realm faq, help, points, vip, bazi help',
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
      'Terms for using Shanhai Realm AI metaphysics tools. Readings are for entertainment and inspiration only — not medical, legal, or financial advice.',
    keywords: 'shanhai realm terms of service, disclaimer',
    canonical: `${SEO_SITE.url}/terms`,
  },
} as const satisfies Record<string, SeoMeta>;

/** English FAQ schema for /faq — stable for crawlers regardless of UI language. */
export const FAQ_SCHEMA_ITEMS = [
  {
    question: 'What is Shanhai Realm?',
    answer:
      'Shanhai Realm is an AI companion for overseas Chinese users who want to reflect on relationships, career choices, and uncertainty through traditional Eastern metaphysics, including BaZi, character divination, and I Ching readings.',
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
