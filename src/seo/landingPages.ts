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
  cta: { primary: string; secondary: string; secondaryPath?: string };
  sections?: { why: string; how: string };
  /** 给搜索引擎和用户补一层俗称解释，例如测字=拆字/相字 */
  bridge?: { title: string; body: string };
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
      {
        question: '没有生日或时辰，还能看吗？',
        answer:
          '八字需要出生信息。若只是当下卡住，可以先去测字：写一个字看这一步，不用排盘。',
      },
    ],
    cta: { primary: '立即免费排盘', secondary: '免费注册' },
    sections: { why: '为什么在这里做免费八字排盘', how: '怎么在线排盘' },
  },
  {
    slug: 'character-divination',
    path: '/character-divination',
    canonical: `${SITE}/character-divination`,
    ctaRoute: '/(tabs)/zi',
    relatedSlugs: ['bazi-calculator', 'i-ching-reading', 'daily-fortune'],
    seo: {
      title: '测字算命在线 | 写一个字看下一步 | 山海灵境',
      description:
        '免费测字算命（也称拆字、相字）：心里想着那件事，写一个汉字，看字形意象和今天能做的一步。不用生日、不会八字也能看。仅供娱乐。',
      keywords:
        '测字算命, 在线测字, 免费测字, 拆字算命, 相字, 写一个字算命, 测字占卜, 山海灵境',
    },
    hero: {
      badge: '测字算命 · 拆字',
      title: '写一个字，带走今天能做的一步',
      subtitle:
        '测字又称拆字、相字。心里想着感情或事业里卡住的事，手写或输入一个字，先看结论，再落到下一步。',
    },
    bridge: {
      title: '不知道八字，也能先看当下',
      body: '八字要生日时辰，看的是长期节奏。测字更轻：不用排盘，写一个字看这一步。适合「现在该不该」「心里过不去」。若要看流年格局，再去免费八字排盘。我们做的是拆字看意象，不是诸葛神算那种三字查签。',
    },
    features: [
      {
        icon: '✍️',
        title: '可打字，也可手写',
        body: '键盘输入更快；手写多一层仪式，字一落下，问题也更聚焦。',
      },
      {
        icon: '🪨',
        title: '拆字，用人话讲',
        body: '拆偏旁、看字形联想，翻译成：现在卡在哪，下一步宜守还是宜动。',
      },
      {
        icon: '🎯',
        title: '一字一事',
        body: '一次只问一件。一个字同时问感情、赚钱、搬家，结果会糊。',
      },
    ],
    steps: [
      { title: '心里只想一件事', body: '该不该复合、offer 接不接，先收成一个问题。' },
      { title: '写下最先想到的字', body: '选和问题有关的字，不要挑字典里最吉的字。' },
      { title: '先看结论再追问', body: '带走一招；卡住了就把这一招带回对话拆小。' },
    ],
    faq: [
      {
        question: '测字算命是什么？现在还有人用吗？',
        answer:
          '测字就是拆字、相字：解析一个汉字的形与意，用来看当下处境。古代很普遍，现代知道的人少，但「写个字算一下」仍是常见的民间问事方式。山海把它做成白话下一步，而不是古文批命。',
      },
      {
        question: '测字和八字有什么区别？',
        answer:
          '八字看出生盘面和长期节奏，需要生日。测字看眼前这一步，不需要生辰。不会排盘、时辰不准，或只是今晚要不要行动，更适合先测字。',
      },
      {
        question: '和诸葛神算、在线算命是一回事吗？',
        answer:
          '不是。诸葛神算通常是报三个字、按笔画对签文。山海测字是一字拆形，给出结论和下一步。若你想看长期格局，请用八字排盘。',
      },
      {
        question: '不会繁体或古文也能测吗？',
        answer: '可以。输入一个你会写的字即可，解读用白话。',
      },
    ],
    cta: { primary: '免费测一字', secondary: '免费排八字', secondaryPath: '/bazi-calculator' },
    sections: { why: '测字算命适合问什么', how: '怎么在线测一字' },
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
    sections: { why: '易经占卜适合问什么', how: '怎么在线起卦' },
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
    sections: { why: '今日运势和普通抽签有何不同', how: '怎么领取今日一招' },
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
      badge: '华人玄学AI',
      title: '东方符号，服务现代人的不确定时刻',
      subtitle:
        '山海灵境把测字、易经与八字做成可随时使用的AI伴侣，帮你在感情、事业与时机选择前先理清思路。',
    },
    features: [
      {
        icon: '文',
        title: '先说人话',
        body: '感情、工作压力、家庭期待，用简体、繁体或英文都能聊，先接住你，再给下一步。',
      },
      {
        icon: '卦',
        title: '用符号，不当判决',
        body: '测字、易经式指引和八字是反思框架，用来看清节奏，不是替你做决定。',
      },
      {
        icon: '问',
        title: '先结论，再行动',
        body: '开头给判断，再看信号、风险和今天能做的一小步。',
      },
    ],
    steps: [
      { title: '先说出卡住的那件事', body: '留下还是走、等还是动、换方向还是先稳住。' },
      { title: '选一条路', body: '对话、测字、问卦或排八字，按问题选工具。' },
      { title: '留下线索下次接着问', body: '注册后可保存上下文，不用每次从零解释。' },
    ],
    faq: [
      {
        question: '山海灵境是给谁用的？',
        answer:
          '先服务海外华人，也给想用东方符号做自我反思的人。适合感情、事业、时机里说不清的决定。',
      },
      {
        question: '能替代专业建议吗？',
        answer: '不能。仅供娱乐与自我反思，不构成医疗、法律、财务或移民建议。',
      },
      {
        question: '为什么把 AI 和命理放一起？',
        answer: 'AI 让你随时能问；八字、测字、易经提供结构，避免空聊。结论仍要你自己拿。',
      },
    ],
    cta: { primary: '先问一件真事', secondary: '免费注册' },
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
      badge: '测字指南',
      title: 'AI测字更适合做聚焦式自我反思',
      subtitle:
        '传统算命依赖人的经验与仪式语境；AI测字更快、更私密、可反复尝试，适合先拿一层清晰感再做现实决策。',
    },
    features: [
      {
        icon: '字',
        title: '一字一事',
        body: '选和当下问题有关的字，不要用一个字去问整个人生。',
      },
      {
        icon: '象',
        title: '看意象，不当预言',
        body: '拆字形、读联想，用来整理心情和选项，不是保证未来会发生什么。',
      },
      {
        icon: '行',
        title: '落到下一步',
        body: '结果会收成结论、信号、风险和今天能做的一招。',
      },
    ],
    steps: [
      { title: '诚实选字', body: '选第一个跳出来、和问题有关的字，不要挑最吉的字。' },
      { title: '标明场景', body: '感情或事业，让解读对准这件事。' },
      { title: '对照现实再决定', body: '用解读整理思路，决定仍要看现实信息。' },
    ],
    faq: [
      {
        question: 'AI测字等于找算命师吗？',
        answer: '不等于。算命师有现场经验和仪式；AI测字适合私下、快速拿第一层清晰。',
      },
      {
        question: '能预测未来吗？',
        answer: '不能当预言。用来反思情绪和选项即可。',
      },
      {
        question: '一定要手写吗？',
        answer: '打字可以；手写会多一层专注，字一落下问题也更清楚。',
      },
    ],
    cta: { primary: '免费测一字', secondary: '免费注册' },
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
