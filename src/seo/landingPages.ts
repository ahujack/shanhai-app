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
      title: 'BaZi Chart Calculator Online | Four Pillars AI Reading | Shanhai Realm',
      description:
        'Free online BaZi (Four Pillars) chart calculator with AI interpretation. Enter birth date and time to generate pillars, ten gods, and actionable guidance. Entertainment only.',
      keywords:
        'bazi calculator, four pillars chart, chinese astrology, ba zi online, birth chart calculator, 八字排盘, 在线八字',
    },
    hero: {
      badge: 'Four Pillars · BaZi',
      title: 'Online BaZi Chart Calculator with AI Guidance',
      subtitle:
        'Turn birth date and time into a structured Four Pillars chart — then get plain-language insights on career, relationships, and timing windows.',
    },
    features: [
      {
        icon: '📅',
        title: 'Accurate pillar generation',
        body: 'Solar or lunar calendar input with gender-aware pillar calculation for year, month, day, and hour columns.',
      },
      {
        icon: '🧭',
        title: 'Ten Gods structure',
        body: 'See how dominant patterns shape decision style, stress triggers, and relationship dynamics — not just labels.',
      },
      {
        icon: '📈',
        title: 'Annual rhythm hints',
        body: 'Start with a concise overview; upgrade for multi-year flow commentary and master-style notes.',
      },
    ],
    steps: [
      { title: 'Enter birth details', body: 'Date, time, calendar type, and optional location for better hour accuracy.' },
      { title: 'Generate your chart', body: 'View Four Pillars, day master, and elemental balance at a glance.' },
      { title: 'Read AI guidance', body: 'Get empathy-first summaries and optional deep-dive follow-ups in chat.' },
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
      title: 'Chinese Character Divination (测字) Online | AI CeZi Reading | Shanhai Realm',
      description:
        'Try AI-powered Chinese character divination (测字/CeZi). Write or type a character to receive structure analysis, oracle references, and focused life guidance.',
      keywords:
        'chinese character divination, cezi, 测字, character reading, oracle bone script, handwriting analysis',
    },
    hero: {
      badge: 'CeZi · Character Reading',
      title: 'AI Chinese Character Divination (测字)',
      subtitle:
        'One character, multiple layers — stroke structure, classical mapping, and a practical reading you can share with friends.',
    },
    features: [
      {
        icon: '✍️',
        title: 'Type or handwrite',
        body: 'Keyboard input or canvas handwriting with OCR recognition for a more ritual, immersive experience.',
      },
      {
        icon: '🪨',
        title: 'Oracle glyph context',
        body: 'Where available, see oracle-style glyph references to anchor the reading in classical imagery.',
      },
      {
        icon: '🎯',
        title: 'Focus by life area',
        body: 'Career, wealth, love, health, study — narrow the interpretation to what you actually care about today.',
      },
    ],
    steps: [
      { title: 'Choose your character', body: 'Pick a character that matches your current mood or question.' },
      { title: 'Select a focus', body: 'Optional direction tags sharpen the interpretation.' },
      { title: 'Receive layered results', body: 'Preview quick insights, then unlock the full master-style reading.' },
    ],
    faq: [
      {
        question: 'How is 测字 different from BaZi?',
        answer:
          'BaZi uses birth data for a long-term chart. 测字 interprets the symbolic meaning of a character you choose in the moment — better for situational clarity.',
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
    cta: { primary: 'Start character reading', secondary: 'Sign up & get bonus points' },
  },
  {
    slug: 'i-ching-reading',
    path: '/i-ching-reading',
    canonical: `${SITE}/i-ching-reading`,
    ctaRoute: '/(tabs)/reading',
    relatedSlugs: ['daily-fortune', 'bazi-calculator', 'character-divination'],
    seo: {
      title: 'I Ching AI Divination Reading Online | Hexagram Guidance | Shanhai Realm',
      description:
        'Ask a clear question and receive structured I Ching-style divination with verdict, action steps, risks, and weekly rhythm. Built for decisions, not vague fortune cookies.',
      keywords:
        'i ching reading, iching divination online, hexagram reading, chinese divination, 六爻, 占卜',
    },
    hero: {
      badge: 'I Ching · Divination',
      title: 'Structured I Ching Divination with AI',
      subtitle:
        'Bring a real question — stay or leave, pivot or hold — and get a one-line verdict plus executable next steps.',
    },
    features: [
      {
        icon: '🧿',
        title: 'Decision-first format',
        body: 'Conclusion upfront, then hexagram context, risks, and a weekly execution rhythm.',
      },
      {
        icon: '🔁',
        title: 'Continue in chat',
        body: 'Jump from reading to persona-guided conversation to process emotions before acting.',
      },
      {
        icon: '🎴',
        title: 'Fortune slip deep-link',
        body: 'Drew a daily slip? Upgrade the same theme into a full divination session in one tap.',
      },
    ],
    steps: [
      { title: 'Phrase your question', body: 'Include decision signals — should I, when, is it suitable — for sharper results.' },
      { title: 'Pick a category', body: 'Career, love, wealth, health, or general — tunes the narrative emphasis.' },
      { title: 'Act on the plan', body: 'Use the three-step action list and risk section as a checklist, not a prophecy.' },
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
      title: 'Chinese Metaphysics AI Companion for Overseas Chinese | Shanhai Realm',
      description:
        'A Chinese metaphysics AI companion for overseas Chinese users navigating relationships, work, identity, and uncertainty through CeZi, I Ching, BaZi, and empathetic chat.',
      keywords:
        'overseas chinese ai companion, chinese metaphysics ai, chinese astrology app, 华人玄学AI, 海外华人情感陪伴, AI算命',
    },
    hero: {
      badge: 'Overseas Chinese · AI Companion',
      title: 'Chinese Metaphysics Support When Life Abroad Feels Unclear',
      subtitle:
        'Shanhai Realm combines CeZi, I Ching, BaZi, and companion-style chat for overseas Chinese users who want culturally familiar reflection before making life decisions.',
    },
    features: [
      {
        icon: '文',
        title: 'Culturally familiar language',
        body: 'Talk through relationships, career stress, family expectations, and identity questions in Chinese, English, or Traditional Chinese.',
      },
      {
        icon: '卦',
        title: 'Traditional methods, modern flow',
        body: 'Use character divination, I Ching-style readings, and BaZi charts as structured reflection tools, not vague predictions.',
      },
      {
        icon: '问',
        title: 'Decision-first delivery',
        body: 'Start with a clear verdict, then review signals, risks, and practical next steps for the situation you are facing.',
      },
    ],
    steps: [
      { title: 'Name the one thing', body: 'Bring a real question: stay or leave, wait or act, prepare or change direction.' },
      { title: 'Choose a path', body: 'Chat with a persona, measure one character, cast a reading, or generate a BaZi chart.' },
      { title: 'Keep the thread', body: 'Register to save context so future questions can continue from what you already shared.' },
    ],
    faq: [
      {
        question: 'Who is Shanhai Realm built for?',
        answer:
          'It is built for overseas Chinese and Chinese-speaking users who want culturally familiar AI reflection around relationships, work, family pressure, and uncertainty.',
      },
      {
        question: 'Is this a replacement for professional advice?',
        answer:
          'No. Shanhai Realm is for entertainment, self-reflection, and emotional companionship. It is not medical, legal, financial, or immigration advice.',
      },
      {
        question: 'Why combine AI with Chinese metaphysics?',
        answer:
          'AI makes the experience available on demand, while traditional frameworks like CeZi, I Ching, and BaZi provide symbolic structure for reflection.',
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
      title: 'AI CeZi vs Traditional Fortune Teller | Chinese Character Reading Explained',
      description:
        'Compare AI Chinese character divination with traditional fortune-telling: what CeZi can help clarify, where its limits are, and how to use it for reflection.',
      keywords:
        'ai cezi, ai chinese character reading, cezi vs fortune teller, 测字AI, AI测字, chinese divination online',
    },
    hero: {
      badge: 'CeZi Guide · AI vs Human',
      title: 'AI CeZi Is Best Used as a Focused Reflection Tool',
      subtitle:
        'Traditional fortune-tellers rely on human experience and ritual context. AI CeZi is faster, private, repeatable, and useful when you need a first layer of clarity.',
    },
    features: [
      {
        icon: '字',
        title: 'One character, one situation',
        body: 'CeZi works best when the chosen character reflects a live question rather than a general curiosity about fate.',
      },
      {
        icon: '象',
        title: 'Symbolic, not absolute',
        body: 'The reading interprets structure, imagery, and associations. It should not be treated as a guaranteed prediction.',
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
        question: 'Is AI CeZi the same as a human fortune teller?',
        answer:
          'No. Human practitioners bring lived experience, context, and ritual presence. AI CeZi offers an accessible and private first-pass interpretation.',
      },
      {
        question: 'Can AI CeZi predict my future?',
        answer:
          'No reading should be treated as a guaranteed prediction. Use it for symbolic reflection, emotional clarity, and decision framing.',
      },
      {
        question: 'Do I need to handwrite the character?',
        answer:
          'Typing works, but handwriting can make the experience more personal because stroke rhythm and structure add another interpretive layer.',
      },
    ],
    cta: { primary: 'Try AI CeZi now', secondary: 'Register free' },
  },
];

export const LANDING_PAGES: Record<string, LandingPageConfig> = Object.fromEntries(
  LANDING_PAGE_LIST.map((p) => [p.slug, p]),
);

export const TOOLS_HUB = {
  path: '/tools',
  canonical: `${SITE}/tools`,
  seo: {
    title: 'AI Metaphysics Tools | BaZi, CeZi, I Ching, Daily Fortune | Shanhai Realm',
    description:
      'Explore Shanhai Realm tools: BaZi chart calculator, Chinese character divination (测字), I Ching readings, and daily fortune slips — AI-assisted, entertainment only.',
    keywords: 'chinese metaphysics app, bazi, cezi, i ching, daily fortune, shanhai realm',
  },
  hero: {
    title: 'AI Tools for Eastern Insight',
    subtitle: 'Pick a path — chart your birth pillars, read a character, cast a hexagram, or draw today’s slip.',
  },
};
