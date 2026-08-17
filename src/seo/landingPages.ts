import { SEO_SITE } from './site';

export type LandingFaq = { question: string; answer: string };

export type LandingPageConfig = {
  slug: string;
  path: string;
  canonical: string;
  ctaRoute: '/(tabs)/bazi' | '/(tabs)/zi' | '/(tabs)/reading' | '/(tabs)/index' | '/register';
  relatedSlugs: string[];
  seo: {
    title: string;
    description: string;
    keywords: string;
  };
  hero: {
    badge: string;
    title: string;
    subtitle: string;
  };
  features: Array<{ icon: string; title: string; body: string }>;
  steps: Array<{ title: string; body: string }>;
  faq: LandingFaq[];
  cta: { primary: string; secondary: string };
};

const SITE = SEO_SITE.url;

export const LANDING_PAGE_LIST: LandingPageConfig[] = [
  {
    slug: 'bazi-calculator',
    path: '/bazi-calculator',
    canonical: `${SITE}/bazi-calculator`,
    ctaRoute: '/(tabs)/bazi',
    relatedSlugs: ['character-divination', 'i-ching-reading', 'daily-fortune'],
    seo: {
      title: '免费八字排盘在线 | 四柱命盘白话解读 | 山海灵境',
      description:
        '免费在线八字排盘：输入生日时辰，30 秒生成年柱月柱日柱时柱，再用白话看性格、关系与今年重点。不是判决，是下一步的坐标。仅供娱乐。',
      keywords:
        '免费八字排盘, 八字排盘在线, 在线八字排盘, 四柱八字, 生辰八字, 日主, 免费排盘, 山海灵境',
    },
    hero: {
      badge: '免费八字排盘',
      title: '免费在线八字排盘，先看懂四柱再决定下一步',
      subtitle:
        '输入生日时辰，生成年柱、月柱、日柱、时柱。先读白话总论，再针对感情、事业与时机追问。仅供娱乐与自我反思。',
    },
    features: [
      {
        icon: '📅',
        title: '生日换成四柱',
        body: '支持阳历/农历生日，生成年柱、月柱、日柱、时柱，先看盘面结构再看解读。',
      },
      {
        icon: '🧭',
        title: '白话，不堆术语',
        body: '先给结论：性格节奏、关系模式、压力触发点。需要时再展开日主与五行。',
      },
      {
        icon: '📈',
        title: '从命盘走到本周一招',
        body: '免费先看清方向；深度命运报告把今年重点收成可保存、可追问的下一步。',
      },
    ],
    steps: [
      { title: '填写出生信息', body: '日期、时辰、历法；时辰越准，时柱越稳。不知道时辰也可以先排。' },
      { title: '生成命盘', body: '立刻看到四柱、日主与盘面概览。' },
      { title: '追问下一步', body: '先读白话总结，再把今年重点带回对话或深度报告。' },
    ],
    faq: [
      {
        question: '这个八字排盘是免费的吗？',
        answer:
          '基础排盘与白话概览可免费使用。深度命运报告是可保存的付费快照，不是把免费盘藏起来。',
      },
      {
        question: '不知道出生时辰还能排吗？',
        answer:
          '可以。时柱会弱一些，年日柱仍可看。之后补上时辰再重排即可。',
      },
      {
        question: '免费版和深度报告差在哪？',
        answer:
          '免费看盘面与白话概览。深度命运报告是可重开的快照：总论、今年重点、本周一招，并可继续追问。',
      },
    ],
    cta: { primary: '立即免费排盘', secondary: '免费注册' },
  },
  {
    slug: 'character-divination',
    path: '/character-divination',
    canonical: `${SITE}/character-divination`,
    ctaRoute: '/(tabs)/zi',
    relatedSlugs: ['bazi-calculator', 'i-ching-reading', 'daily-fortune'],
    seo: {
      title: '免费在线测字 | 写一字看下一步 | 山海灵境',
      description:
        '免费在线测字：手写或输入一个汉字，看字形意象、当下状态与可执行下一步。适合感情、事业里说不清的那件事。仅供娱乐。',
      keywords: '在线测字, 免费测字, 测字占卜, AI测字, 汉字测字, 测字算命, 山海灵境',
    },
    hero: {
      badge: '免费在线测字',
      title: '写一个字，带走今天能做的一步',
      subtitle:
        '手写或输入一个汉字即可开始。先看结论，再看字形意象与情绪信号，最后落到感情或事业的下一步。',
    },
    features: [
      {
        icon: '✍️',
        title: '可打字，也可手写',
        body: '键盘输入更快；手写多一层仪式，字一落下，问题也更聚焦。',
      },
      {
        icon: '🪨',
        title: '拆字，但不掉进古文',
        body: '字形、部首与意象会翻译成白话：现在卡在哪，下一步宜守还是宜动。',
      },
      {
        icon: '🎯',
        title: '一字一事',
        body: '感情、事业、钱、身体，选一个方向。一个字同时问三件事，结果会糊。',
      },
    ],
    steps: [
      { title: '选定一个字', body: '选和当下问题有关的那个字，不要选字典里最吉的字。' },
      { title: '标明问的是哪件事', body: '感情 / 事业 / 其他，让解读对准场景。' },
      { title: '先看结论再追问', body: '带走一招；卡住了就把这一招带回对话拆小。' },
    ],
    faq: [
      {
        question: '不会繁体/古文也能测字吗？',
        answer: '可以。输入一个你会写的字即可，解读用白话，不需要先懂拆字理论。',
      },
      {
        question: '同一个字可以再测吗？',
        answer: '可以。换一个更具体的问题或方向，同一字会给出不同切入，而不是换一套鸡汤。',
      },
      {
        question: '测字要扣积分吗？',
        answer: '按规则消耗积分；月卡有效期内按会员规则免扣。先测一字，再决定要不要追问。',
      },
    ],
    cta: { primary: '免费测一字', secondary: '注册领积分' },
  },
  {
    slug: 'i-ching-reading',
    path: '/i-ching-reading',
    canonical: `${SITE}/i-ching-reading`,
    ctaRoute: '/(tabs)/reading',
    relatedSlugs: ['daily-fortune', 'bazi-calculator', 'character-divination'],
    seo: {
      title: '易经占卜在线 | 问具体问题给下一步 | 山海灵境',
      description:
        '在线易经/六爻风格占卜：先写一个具体问题，再拿结论、行动步骤与风险提醒。适合该不该、何时做、是否继续。不是泛泛算命。',
      keywords: '易经占卜, 在线占卜, 六爻占卜, 卦象解读, 问事占卜, 山海灵境',
    },
    hero: {
      badge: '易经占卜',
      title: '问一个具体问题，拿走清晰的下一步',
      subtitle:
        '适合「该不该」「何时做」「还要不要继续」：先给结论，再给行动步骤与风险。不是空泛运势。',
    },
    features: [
      {
        icon: '🧿',
        title: '先结论，再依据',
        body: '开头就回答你的问题，然后才是卦象依据、风险与本周一招。',
      },
      {
        icon: '🔁',
        title: '解完可以追问',
        body: '把这一招带回对话，拆成今天能做的更小一步。',
      },
      {
        icon: '🎴',
        title: '可从今日定向接过来',
        body: '抽过今日一招，也能把同一主题做成完整问事占卜。',
      },
    ],
    steps: [
      { title: '写成一个决策问题', body: '「月底前该不该接这个 offer」比「我未来怎么样」有用。' },
      { title: '选感情或事业', body: '让解读对准场景，而不是什么都说一点。' },
      { title: '按清单做，不当预言', body: '三步行动和风险提醒是反思清单，不是判决。' },
    ],
    faq: [
      {
        question: '怎样提问比较准？',
        answer: '写成一个具体选择。带时间、人物、卡点，比问「我的运势」清楚得多。',
      },
      {
        question: '会显示卦名吗？',
        answer: '会。本卦、变卦用白话解释，不要求你先会读易经。',
      },
      {
        question: '可以先试再付费吗？',
        answer: '新账号有起步积分；月卡适合需要反复追问的人。',
      },
    ],
    cta: { primary: '去问一个问题', secondary: '免费注册' },
  },
  {
    slug: 'daily-fortune',
    path: '/daily-fortune',
    canonical: `${SITE}/daily-fortune`,
    ctaRoute: '/(tabs)/index',
    relatedSlugs: ['i-ching-reading', 'character-divination', 'bazi-calculator'],
    seo: {
      title: '今日运势免费抽签 | 每日一招·幸运色 | 山海灵境',
      description:
        '免费抽今日运势：一招可执行的下一步，加上幸运色与数字。不是判决，是晨间定向。可把同一主题延伸成完整占卜。',
      keywords: '今日运势, 每日运势, 免费抽签, 今日一招, 幸运色, 每日灵签, 山海灵境',
    },
    hero: {
      badge: '今日运势',
      title: '每天回来看一招：今日定向',
      subtitle:
        '一分钟抽一张轻量定向。带走今天能做的一步，需要时再把同一主题做成完整问事。',
    },
    features: [
      {
        icon: '🎋',
        title: '诗句 + 一招',
        body: '不是空泛吉凶，而是今天能做的一小步。',
      },
      {
        icon: '🍀',
        title: '幸运锚点',
        body: '颜色、数字作轻提醒，帮助把一天定个调，不当成迷信指令。',
      },
      {
        icon: '🔗',
        title: '能接到完整占卜',
        body: '这招对上了真实决定，就延伸成解签，不用重新解释背景。',
      },
    ],
    steps: [
      { title: '打开首页', body: '点「领取今日一招」，完成一次轻仪式。' },
      { title: '看清这一招', body: '先记住下一步，而不是收藏一堆签文。' },
      { title: '需要再追问', body: '卡住了，把这一招带回对话或解签。' },
    ],
    faq: [
      {
        question: '今日运势会针对我吗？',
        answer: '登录后会结合使用上下文；未登录也能抽当日定向。',
      },
      {
        question: '可以分享吗？',
        answer: '可以。分享卡给朋友；邀请注册双方都有积分。',
      },
      {
        question: '和签到是一回事吗？',
        answer: '不是。签到拿积分，今日一招拿方向。两者可以同一天做。',
      },
    ],
    cta: { primary: '领取今日一招', secondary: '注册保存进度' },
  {
    slug: 'overseas-chinese-metaphysics-ai',
    path: '/overseas-chinese-metaphysics-ai',
    canonical: `${SITE}/overseas-chinese-metaphysics-ai`,
    ctaRoute: '/(tabs)/index',
    relatedSlugs: ['character-divination', 'i-ching-reading', 'bazi-calculator'],
    seo: {
      title: '华人玄学AI伴侣 | 感情事业时机的东方指引 | 山海灵境',
      description:
        '面向全球华人与国际用户的东方玄学AI伴侣：测字、易经、八字与共情对话，用白话帮你梳理感情、事业与不确定性。',
      keywords:
        '华人玄学AI, AI算命, 海外华人占卜, eastern oracle ai, spiritual ai companion, 山海灵境, shanhai realm',
    },
    hero: {
      badge: '华人玄学AI · AI Companion',
      title: '东方符号，服务现代人的不确定时刻',
      subtitle:
        '山海灵境把测字、易经与八字做成可随时使用的AI伴侣，帮你在感情、事业与时机选择前先理清思路。',
    },
    features: [
      {
        icon: '文',
        title: 'Plain language first',
        body: 'Talk through relationships, career stress, family pressure, and identity questions in English, Simplified Chinese, or Traditional Chinese.',
      },
      {
        icon: '卦',
        title: 'Ancient symbols, modern flow',
        body: 'Use symbol readings, I Ching-inspired oracle guidance, and birth-chart patterns as structured reflection tools, not vague predictions.',
      },
      {
        icon: '问',
        title: 'Decision-first delivery',
        body: 'Start with a clear verdict, then review signals, risks, and practical next steps for the situation you are facing.',
      },
    ],
    steps: [
      { title: 'Name the one thing', body: 'Bring a real question: stay or leave, wait or act, prepare or change direction.' },
      { title: 'Choose a path', body: 'Chat with a companion, read one symbol, ask the oracle, or generate an Eastern birth chart.' },
      { title: 'Keep the thread', body: 'Register to save context so future questions can continue from what you already shared.' },
    ],
    faq: [
      {
        question: 'Who is Shanhai Realm built for?',
        answer:
          'It started with overseas Chinese users, but the English experience is built for global users who are curious about Eastern symbolic guidance and want practical reflection around love, work, timing, and uncertainty.',
      },
      {
        question: 'Is this a replacement for professional advice?',
        answer:
          'No. Shanhai Realm is for entertainment, self-reflection, and emotional companionship. It is not medical, legal, financial, or immigration advice.',
      },
      {
        question: 'Why combine AI with Chinese metaphysics?',
        answer:
          'AI makes the experience available on demand, while traditional frameworks such as Chinese character symbolism, I Ching-inspired patterns, and BaZi birth charts provide a symbolic structure for reflection.',
      },
    ],
    cta: { primary: 'Ask one real question', secondary: 'Create free account' },
  },
  {
    slug: 'ai-cezi-vs-fortune-teller',
    path: '/ai-cezi-vs-fortune-teller',
    canonical: `${SITE}/ai-cezi-vs-fortune-teller`,
    ctaRoute: '/(tabs)/zi',
    relatedSlugs: ['character-divination', 'i-ching-reading', 'overseas-chinese-metaphysics-ai'],
    seo: {
      title: 'AI测字 vs 传统算命师 | 汉字测字能做什么 | 山海灵境',
      description:
        '对比AI测字与传统算命：一字解读适合澄清什么、边界在哪里，以及如何把它当作自我反思工具而非绝对预言。',
      keywords:
        'AI测字对比, 测字AI, AI算命 vs 算命师, cezi vs fortune teller, chinese character reading, 山海灵境',
    },
    hero: {
      badge: '测字指南 · AI vs 传统算命',
      title: 'AI测字更适合做聚焦式自我反思',
      subtitle:
        '传统算命依赖人的经验与仪式语境；AI测字更快、更私密、可反复尝试，适合先拿一层清晰感再做现实决策。',
    },
    features: [
      {
        icon: '字',
        title: 'One symbol, one situation',
        body: 'A character reading works best when the chosen symbol reflects a live question rather than a general curiosity about fate.',
      },
      {
        icon: '象',
        title: 'Symbolic, not absolute',
        body: 'The reading interprets structure, imagery, and associations. It should be used for reflection, not treated as a guaranteed prediction.',
      },
      {
        icon: '行',
        title: 'Turn meaning into action',
        body: 'Shanhai Realm formats results into a verdict, signals, risks, and next steps so the insight is easier to use.',
      },
    ],
    steps: [
      { title: 'Pick a character honestly', body: 'Choose the first character that feels connected to your current question.' },
      { title: 'Add a life focus', body: 'Career, love, wealth, health, or study focus makes the interpretation less generic.' },
      { title: 'Review the result critically', body: 'Use the reading to organize thoughts, then make decisions with real-world information.' },
    ],
    faq: [
      {
        question: 'Is AI symbol reading the same as a human fortune teller?',
        answer:
          'No. Human practitioners bring lived experience, context, and ritual presence. AI symbol reading offers an accessible and private first-pass interpretation.',
      },
      {
        question: 'Can AI symbol reading predict my future?',
        answer:
          'No reading should be treated as a guaranteed prediction. Use it for symbolic reflection, emotional clarity, and decision framing.',
      },
      {
        question: 'Do I need to handwrite the character?',
        answer:
          'Typing works, but handwriting can make the experience more personal because stroke rhythm and structure add another interpretive layer.',
      },
    ],
    cta: { primary: 'Try symbol reading now', secondary: 'Register free' },
  },
];

export const LANDING_PAGES: Record<string, LandingPageConfig> = Object.fromEntries(
  LANDING_PAGE_LIST.map((p) => [p.slug, p]),
);

export const TOOLS_HUB = {
  path: '/tools',
  canonical: `${SITE}/tools`,
  seo: {
    title: '东方玄学AI工具箱 | 八字·测字·易经·每日运势 | 山海灵境',
    description:
      '一站体验山海灵境工具：在线八字排盘、AI测字、易经占卜与每日灵签。AI辅助解读，仅供娱乐与灵感。',
    keywords: '玄学AI工具, 免费八字排盘, 在线测字, 易经占卜, 今日运势, 山海灵境',
  },
  hero: {
    title: '东方玄学 AI 工具箱',
    subtitle: '选一条路开始：八字排盘、AI测字、易经占卜，或抽今日灵签。',
  },
};
