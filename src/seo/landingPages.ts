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
      title: '在线八字排盘 | AI四柱解读·免费BaZi计算器 | 山海灵境',
      description:
        '免费在线八字排盘（四柱命盘）：输入生日时辰，生成年柱月柱日柱时辰，并获得AI通俗解读。适合快速了解性格、关系与运势节奏。仅供娱乐。',
      keywords:
        '八字排盘, 在线八字, AI八字, 四柱排盘, 生辰八字, bazi calculator, four pillars, chinese astrology, 山海灵境',
    },
    hero: {
      badge: '八字排盘 · BaZi Four Pillars',
      title: '在线八字排盘，读懂你的四柱命盘',
      subtitle:
        '输入生日时辰，生成年柱、月柱、日柱、时柱，再用白话看性格倾向、关系模式、事业节奏与时机窗口。仅供娱乐与自我反思。',
    },
    features: [
      {
        icon: '📅',
        title: 'Birth details into patterns',
        body: 'Use solar or lunar birth details to generate the year, month, day, and hour pillars behind the reading.',
      },
      {
        icon: '🧭',
        title: 'Plain-English pattern reading',
        body: 'Understand how the chart may reflect decision style, stress triggers, relationship dynamics, and energy balance.',
      },
      {
        icon: '📈',
        title: 'Timing and direction hints',
        body: 'Start with a concise overview; upgrade for deeper timing commentary and long-range guidance.',
      },
    ],
    steps: [
      { title: 'Enter birth details', body: 'Date, time, calendar type, and optional location for better hour accuracy.' },
      { title: 'Generate your chart', body: 'View Four Pillars, core self marker, and elemental balance at a glance.' },
      { title: 'Read AI guidance', body: 'Get a simple summary first, then continue with deeper follow-up questions.' },
    ],
    faq: [
      {
        question: 'Is this a professional fortune-telling service?',
        answer:
          'No. Shanhai Realm provides AI-assisted interpretations for inspiration and entertainment. Do not use readings as the sole basis for medical, legal, or financial decisions.',
      },
      {
        question: 'Do I need exact birth time?',
        answer:
          'Hour pillar accuracy improves with precise birth time. If unknown, you can still explore approximate patterns and refine later.',
      },
      {
        question: 'What is free vs VIP for BaZi?',
        answer:
          'Free tier includes chart generation and overview. VIP unlocks deeper annual commentary and extended multi-year guidance.',
      },
    ],
    cta: { primary: 'Generate my BaZi chart', secondary: 'Create free account' },
  },
  {
    slug: 'character-divination',
    path: '/character-divination',
    canonical: `${SITE}/character-divination`,
    ctaRoute: '/(tabs)/zi',
    relatedSlugs: ['bazi-calculator', 'i-ching-reading', 'daily-fortune'],
    seo: {
      title: 'AI测字占卜在线 | 写一字看意象与指引 | 山海灵境',
      description:
        '在线AI测字：手写或输入一个汉字，解读字形、意象与情绪信号，并给出感情/事业等方向的实用指引。无需懂古文也能上手。',
      keywords:
        'AI测字, 测字占卜, 在线测字, 汉字测字, chinese character divination, cezi, symbol reading, 山海灵境',
    },
    hero: {
      badge: 'AI测字 · Character Ritual',
      title: '写一个字，看意象与当下指引',
      subtitle:
        '手写或输入一个汉字即可开始。山海灵境会解读字形、意象与情绪信号，并给出感情、事业等方向的白话建议。',
    },
    features: [
      {
        icon: '✍️',
        title: 'Type or handwrite',
        body: 'Use keyboard input or handwriting. Writing by hand adds a small ritual moment before the reading.',
      },
      {
        icon: '🪨',
        title: 'Symbol context',
        body: 'Where available, see classical imagery and component meaning translated into modern, understandable language.',
      },
      {
        icon: '🎯',
        title: 'Focus by life area',
        body: 'Love, career, money, health, study, or general life direction — choose what you actually care about today.',
      },
    ],
    steps: [
      { title: 'Choose your symbol', body: 'Pick one Chinese character that feels connected to your current mood or question.' },
      { title: 'Select a focus', body: 'Optional direction tags sharpen the interpretation.' },
      { title: 'Receive layered results', body: 'Start with a direct answer, then unlock a deeper symbolic breakdown if it resonates.' },
    ],
    faq: [
      {
        question: 'Do I need to understand Chinese?',
        answer:
          'No. You can choose from prompts or type a character you already know. Shanhai explains the symbol in English and connects it to your situation.',
      },
      {
        question: 'Can I re-read the same character?',
        answer: 'Yes. Change focus tags or ask a sharper question to get a different angle on the same character.',
      },
      {
        question: 'How many points does a reading cost?',
        answer: 'Character readings consume in-app points unless you hold an active membership with relevant benefits.',
      },
    ],
    cta: { primary: 'Start symbol reading', secondary: 'Sign up & get bonus points' },
  },
  {
    slug: 'i-ching-reading',
    path: '/i-ching-reading',
    canonical: `${SITE}/i-ching-reading`,
    ctaRoute: '/(tabs)/reading',
    relatedSlugs: ['daily-fortune', 'bazi-calculator', 'character-divination'],
    seo: {
      title: '易经AI占卜在线 | 六爻卦象·决策指引 | 山海灵境',
      description:
        '提出一个具体问题，获得结构化易经/六爻风格解读：直接结论、行动步骤、风险提醒与一周节奏。面向真实决策，而非空泛运势。',
      keywords:
        '易经占卜, AI占卜, 六爻在线, 卦象解读, i ching reading, hexagram, chinese divination, 山海灵境',
    },
    hero: {
      badge: '易经占卜 · I Ching-Inspired',
      title: '问一个具体问题，拿到清晰卦象指引',
      subtitle:
        '适合“该不该”“何时做”“是否适合”这类决策问题：先给直接结论，再给行动步骤与风险提醒。',
    },
    features: [
      {
        icon: '🧿',
        title: 'Decision-first format',
        body: 'Direct answer upfront, then symbol context, risks, and a weekly execution rhythm.',
      },
      {
        icon: '🔁',
        title: 'Continue in chat',
        body: 'Jump from reading to persona-guided conversation to process emotions before acting.',
      },
      {
        icon: '🎴',
        title: 'Daily oracle bridge',
        body: 'Drew a daily oracle slip? Turn the same theme into a full guidance session in one tap.',
      },
    ],
    steps: [
      { title: 'Phrase your question', body: 'Include decision signals — should I, when, is it suitable — for sharper results.' },
      { title: 'Pick a category', body: 'Career, love, wealth, health, or general — tunes the narrative emphasis.' },
      { title: 'Act on the plan', body: 'Use the three-step action list and risk section as a reflection checklist, not a prophecy.' },
    ],
    faq: [
      {
        question: 'What makes a good divination question?',
        answer:
          'Specific and decision-oriented works best: “Should I accept this offer before month-end?” beats “How is my future?”',
      },
      {
        question: 'Are hexagram names shown?',
        answer: 'Yes. Readings include original and changed hexagram names with plain-language explanations.',
      },
      {
        question: 'Can I try before paying?',
        answer: 'New accounts receive starter points; membership may waive point costs for frequent users.',
      },
    ],
    cta: { primary: 'Ask my question now', secondary: 'Register free' },
  },
  {
    slug: 'daily-fortune',
    path: '/daily-fortune',
    canonical: `${SITE}/daily-fortune`,
    ctaRoute: '/(tabs)/index',
    relatedSlugs: ['i-ching-reading', 'character-divination', 'bazi-calculator'],
    seo: {
      title: '每日运势灵签 | 今日幸运色·数字·小任务 | 山海灵境',
      description:
        '每日抽一支灵签：诗句、幸运色、幸运数字与今日小任务。可一键把主题延伸到完整占卜解读，养成轻量晨间仪式。',
      keywords:
        '每日运势, 每日灵签, 今日运势, 幸运色, daily chinese fortune, oracle slip, 山海灵境',
    },
    hero: {
      badge: '每日运势 · Oracle Slip',
      title: '每日灵签：幸运色、数字与今日小任务',
      subtitle:
        '一分钟晨间仪式——抽今日灵签，记下幸运锚点，也可把同一主题延伸成完整占卜。',
    },
    features: [
      {
        icon: '🎋',
        title: 'Poem + mission',
        body: 'Each slip combines classical tone with a concrete micro-mission for the day.',
      },
      {
        icon: '🍀',
        title: 'Lucky anchors',
        body: 'Color, number, and direction hints to frame your day with playful intention.',
      },
      {
        icon: '🔗',
        title: 'Deep reading bridge',
        body: 'Turn “today’s theme” into a full I Ching session without re-explaining context.',
      },
    ],
    steps: [
      { title: 'Open the home tab', body: 'Start from chat home and invoke the daily draw ritual.' },
      { title: 'Reveal your slip', body: 'Wait through the animation — the pause is part of the experience.' },
      { title: 'Optional deep dive', body: 'Tap through to divination if the theme hits a live decision.' },
    ],
    faq: [
      {
        question: 'Is daily fortune personalized?',
        answer:
          'Slips blend daily content with your usage context when logged in. Guests still receive the daily draw experience.',
      },
      {
        question: 'Can I share my slip?',
        answer: 'Yes. Share text or image cards with friends; invite links grant bonus points after registration.',
      },
      {
        question: 'Does check-in stack with fortune?',
        answer: 'Daily check-in awards points separately — combine both for a simple retention habit loop.',
      },
    ],
    cta: { primary: 'Draw today’s fortune', secondary: 'Join & save progress' },
  },
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
    keywords: '玄学AI工具, 八字工具, 测字工具, 易经工具, bazi, cezi, i ching, daily fortune, 山海灵境',
  },
  hero: {
    title: '东方玄学 AI 工具箱',
    subtitle: '选一条路开始：八字排盘、AI测字、易经占卜，或抽今日灵签。',
  },
};
