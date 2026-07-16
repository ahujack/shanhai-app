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
      title: 'Eastern Birth Chart Calculator | BaZi / Four Pillars AI Reading | Shanhai Realm',
      description:
        'Free Eastern birth chart calculator based on BaZi / Four Pillars. Enter birth date and time to explore personality patterns, life timing, and AI guidance in plain English. Entertainment only.',
      keywords:
        'bazi calculator, four pillars chart, chinese astrology, ba zi online, birth chart calculator, 八字排盘, 在线八字',
    },
    hero: {
      badge: 'Eastern Birth Chart · BaZi',
      title: 'Explore Your Eastern Birth Chart',
      subtitle:
        'Turn birth date and time into a Four Pillars chart, then get plain-language insight on personality, relationships, career rhythm, and timing windows.',
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
      title: 'Chinese Symbol Reading Online | AI Character Divination | Shanhai Realm',
      description:
        'Try an AI Chinese symbol reading. Write or type one character and receive a simple interpretation of its shape, imagery, emotional signal, and practical guidance.',
      keywords:
        'chinese character divination, cezi, 测字, character reading, oracle bone script, handwriting analysis',
    },
    hero: {
      badge: 'Symbol Reading · Character Ritual',
      title: 'Pick One Chinese Character. Read the Sign.',
      subtitle:
        'You do not need to know Chinese. Choose a character as a symbol, and Shanhai explains its shape, image, mood, and next-step meaning in plain language.',
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
      title: 'Eastern Oracle AI Reading Online | I Ching-Style Guidance | Shanhai Realm',
      description:
        'Ask one clear question and receive structured Eastern oracle guidance with a direct answer, action steps, risks, and weekly rhythm. Built for decisions, not vague fortune cookies.',
      keywords:
        'i ching reading, iching divination online, hexagram reading, chinese divination, 六爻, 占卜',
    },
    hero: {
      badge: 'Oracle Guidance · I Ching-Inspired',
      title: 'Ask One Question. Get a Clear Reading.',
      subtitle:
        'Bring a real question — stay or leave, pivot or wait — and get a direct answer plus practical next steps.',
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
      title: 'Daily Chinese Fortune & Oracle Slip | Shanhai Realm',
      description:
        'Draw a daily fortune slip with poem, lucky color, number, and mission. Optional deep divination follow-up for the same theme.',
      keywords:
        'daily chinese fortune, oracle slip, daily luck, chinese horoscope daily, 每日运势, 灵签',
    },
    hero: {
      badge: 'Daily · Oracle Slip',
      title: 'Daily Fortune Slip & Lucky Ritual',
      subtitle:
        'A one-minute morning ritual — draw today’s slip, note your lucky anchors, and optionally deepen the same theme with divination.',
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
      title: 'Eastern Oracle AI Companion for Global Users | Shanhai Realm',
      description:
        'An Eastern oracle-style AI companion for love, career, identity, timing, and uncertainty. Explore symbol readings, I Ching-inspired guidance, birth-chart patterns, and empathetic chat.',
      keywords:
        'eastern oracle ai, spiritual ai companion, chinese astrology app, ai fortune reading, overseas chinese ai companion, 华人玄学AI, AI算命',
    },
    hero: {
      badge: 'Eastern Oracle · AI Companion',
      title: 'Eastern Rituals for Modern Uncertainty',
      subtitle:
        'Shanhai Realm turns traditional Chinese symbolic systems into approachable AI guidance for anyone seeking clarity before a life decision.',
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
      title: 'AI Symbol Reading vs Traditional Fortune Teller | Chinese Character Reading Explained',
      description:
        'Compare AI Chinese symbol reading with traditional fortune-telling: what one-character readings can clarify, where the limits are, and how to use them for reflection.',
      keywords:
        'ai cezi, ai chinese character reading, cezi vs fortune teller, 测字AI, AI测字, chinese divination online',
    },
    hero: {
      badge: 'Symbol Reading Guide · AI vs Human',
      title: 'AI Symbol Reading Works Best as Focused Reflection',
      subtitle:
        'Traditional fortune-tellers rely on human experience and ritual context. AI symbol reading is faster, private, repeatable, and useful when you need a first layer of clarity.',
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
    title: 'Eastern Oracle AI Tools | Symbol Reading, Birth Chart, I Ching | Shanhai Realm',
    description:
      'Explore Shanhai Realm tools: Eastern birth chart calculator, Chinese symbol reading, I Ching-style oracle guidance, and daily fortune slips — AI-assisted, entertainment only.',
    keywords: 'eastern oracle ai, chinese metaphysics app, bazi, symbol reading, i ching, daily fortune, shanhai realm',
  },
  hero: {
    title: 'AI Tools for Eastern Insight',
    subtitle: 'Pick a path — explore your birth chart, read one symbol, ask the oracle, or draw today’s slip.',
  },
};
