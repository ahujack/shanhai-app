export const SEO_SITE = {
  url: 'https://www.shanhai.app',
  name: '山海灵境 Shanhai Realm',
  nameZh: '山海灵境',
  ogImage: 'https://www.shanhai.app/og-image.png',
  twitterHandle: '@shanhaiapp',
  supportEmail: 'support@shanhai.app',
  locale: 'zh_CN',
  themeColor: '#7C6CFF',
} as const;

export type SeoMeta = {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
};

export const HOME_SEO: SeoMeta = {
  title: '山海灵境 | AI八字排盘·测字·易经占卜·每日运势 Shanhai Realm',
  description:
    '山海灵境 Shanhai Realm：不是判决，是下一步的坐标。在线AI八字排盘、测字、易经解读与可保存的深度命运报告。用东方符号系统帮你梳理感情、事业与时机。仅供娱乐与自我反思。',
  keywords:
    '山海灵境, AI八字, 八字排盘, 在线八字, AI测字, 测字占卜, 易经占卜, 六爻, 每日运势, AI算命, bazi calculator, chinese character divination, i ching, shanhai realm',
  canonical: SEO_SITE.url,
};

export const STATIC_PAGE_SEO = {
  pricing: {
    title: '会员与定价 | 山海灵境 VIP权益对比',
    description:
      '对比山海灵境免费版与VIP：更深八字年运、完整解读、积分消耗更省。支持积分包补充。',
    keywords: '山海灵境会员, VIP定价, 积分, shanhai realm pricing, membership',
    canonical: `${SEO_SITE.url}/pricing`,
  },
  faq: {
    title: '常见问题 | 山海灵境 AI八字·测字·易经帮助',
    description:
      '关于山海灵境的常见问题：积分获取、VIP权益、邀请奖励、隐私保护，以及AI八字/测字/易经如何使用。',
    keywords: '山海灵境帮助, FAQ, 积分, VIP, 八字帮助, 测字帮助',
    canonical: `${SEO_SITE.url}/faq`,
  },
  privacy: {
    title: '隐私政策 | 山海灵境 Shanhai Realm',
    description:
      '山海灵境如何收集、使用与保护你的账号、命盘与使用数据。我们不会出售个人信息。',
    keywords: '山海灵境隐私政策, privacy policy, 数据保护',
    canonical: `${SEO_SITE.url}/privacy`,
  },
  terms: {
    title: '服务条款 | 山海灵境 Shanhai Realm',
    description:
      '使用山海灵境AI玄学工具的服务条款。所有解读仅供娱乐与灵感，不构成医疗、法律或财务建议。',
    keywords: '山海灵境服务条款, terms of service, 免责声明',
    canonical: `${SEO_SITE.url}/terms`,
  },
  about: {
    title: '关于山海灵境 | 东方玄学AI陪伴与信任说明',
    description:
      '了解山海灵境：不是判决，是下一步的坐标。深度命运报告为独立快照；隐私、支付与客服承诺。解读仅供娱乐与自我反思。',
    keywords: '关于山海灵境, about shanhai realm, 东方玄学AI, 信任与安全',
    canonical: `${SEO_SITE.url}/about`,
  },
} as const satisfies Record<string, SeoMeta>;

/** FAQ schema for /faq — bilingual for richer search snippets. */
export const FAQ_SCHEMA_ITEMS = [
  {
    question: '山海灵境是什么？What is Shanhai Realm?',
    answer:
      '山海灵境是一款东方玄学风格的AI伴侣，通过测字、易经式指引与八字命盘等符号工具，帮助你反思感情、事业选择与时机。Shanhai Realm is an Eastern oracle-style AI companion for reflection — entertainment only.',
  },
  {
    question: '解读一定准吗？Are readings guaranteed accurate?',
    answer:
      '不会。所有解读仅供灵感与娱乐，请勿作为医疗、法律或财务决策的唯一依据。No. Readings are for inspiration and entertainment only.',
  },
  {
    question: '如何获得更多积分？How can I get more points?',
    answer:
      '可通过每日签到、连续签到与邀请好友获得积分；好友成功注册后双方都有奖励。Earn points via daily check-in, streaks, and invites.',
  },
  {
    question: 'VIP有什么权益？What are VIP benefits?',
    answer:
      'VIP通常包含更完整解读、更深年运点评、进阶指引模块，以及更低的积分消耗。VIP unlocks deeper commentary and lower point costs.',
  },
  {
    question: '我的数据安全吗？Is my data secure?',
    answer:
      '我们使用加密与访问控制保护数据，不会出售个人信息。付费命运报告以独立快照保存，不随聊天讨好漂移。详见隐私政策。Paid destiny reports are independent snapshots. We do not sell personal information.',
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
