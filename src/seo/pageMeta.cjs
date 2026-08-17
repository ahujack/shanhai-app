/**
 * Single source of truth for static SEO meta used by scripts/inject-seo-meta.js.
 * Keep titles/descriptions in sync with src/seo/site.ts and landingPages.ts.
 */
const SITE = 'https://www.shanhai.app';
const OG_IMAGE = `${SITE}/og-image.png`;

const PAGES = [
  {
    file: 'index.html',
    title: '免费在线八字排盘·AI测字 | 山海灵境',
    description:
      '山海灵境：免费在线八字排盘、测字与每日定向。不是判决，是下一步的坐标。输入生日即可看四柱白话，写一个字看当下指引。深度命运报告可保存重开。仅供娱乐与自我反思。',
    keywords:
      '山海灵境, 免费八字排盘, 在线八字排盘, AI测字, 在线测字, 测字占卜, 今日运势, 四柱命盘, 生辰八字',
    canonical: `${SITE}/`,
  },
  {
    file: 'bazi-calculator.html',
    title: '免费八字排盘在线 | 四柱命盘白话解读 | 山海灵境',
    description:
      '免费在线八字排盘：输入生日时辰，30 秒生成年柱月柱日柱时柱，再用白话看性格、关系与今年重点。不是判决，是下一步的坐标。仅供娱乐。',
    keywords:
      '免费八字排盘, 八字排盘在线, 在线八字排盘, 四柱八字, 生辰八字, 日主, 免费排盘, 山海灵境',
    canonical: `${SITE}/bazi-calculator`,
  },
  {
    file: 'character-divination.html',
    title: '测字算命在线 | 写一个字看下一步 | 山海灵境',
    description:
      '免费测字算命（也称拆字、相字）：心里想着那件事，写一个汉字，看字形意象和今天能做的一步。不用生日、不会八字也能看。仅供娱乐。',
    keywords:
      '测字算命, 在线测字, 免费测字, 拆字算命, 相字, 写一个字算命, 测字占卜, 山海灵境',
    canonical: `${SITE}/character-divination`,
  },
  {
    file: 'i-ching-reading.html',
    title: '易经占卜在线 | 问具体问题给下一步 | 山海灵境',
    description:
      '在线易经/六爻风格占卜：先写一个具体问题，再拿结论、行动步骤与风险提醒。适合该不该、何时做、是否继续。不是泛泛算命。',
    keywords: '易经占卜, 在线占卜, 六爻占卜, 卦象解读, 问事占卜, 山海灵境',
    canonical: `${SITE}/i-ching-reading`,
  },
  {
    file: 'daily-fortune.html',
    title: '今日运势免费抽签 | 每日一招·幸运色 | 山海灵境',
    description:
      '免费抽今日运势：一招可执行的下一步，加上幸运色与数字。不是判决，是晨间定向。可把同一主题延伸成完整占卜。',
    keywords: '今日运势, 每日运势, 免费抽签, 今日一招, 幸运色, 每日灵签, 山海灵境',
    canonical: `${SITE}/daily-fortune`,
  },
  {
    file: 'overseas-chinese-metaphysics-ai.html',
    title: '华人玄学AI伴侣 | 感情事业时机的东方指引 | 山海灵境',
    description:
      '面向全球华人与国际用户的东方玄学AI伴侣：测字、易经、八字与共情对话，用白话帮你梳理感情、事业与不确定性。',
    keywords:
      '华人玄学AI, AI算命, 海外华人占卜, eastern oracle ai, spiritual ai companion, 山海灵境, shanhai realm',
    canonical: `${SITE}/overseas-chinese-metaphysics-ai`,
  },
  {
    file: 'ai-cezi-vs-fortune-teller.html',
    title: 'AI测字 vs 传统算命师 | 汉字测字能做什么 | 山海灵境',
    description:
      '对比AI测字与传统算命：一字解读适合澄清什么、边界在哪里，以及如何把它当作自我反思工具而非绝对预言。',
    keywords:
      'AI测字对比, 测字AI, AI算命 vs 算命师, cezi vs fortune teller, chinese character reading, 山海灵境',
    canonical: `${SITE}/ai-cezi-vs-fortune-teller`,
  },
  {
    file: 'tools.html',
    title: '东方玄学AI工具箱 | 八字·测字·易经·每日运势 | 山海灵境',
    description:
      '一站体验山海灵境工具：在线八字排盘、AI测字、易经占卜与每日灵签。AI辅助解读，仅供娱乐与灵感。',
    keywords:
      '玄学AI工具, 免费八字排盘, 在线测字, 易经占卜, 今日运势, 山海灵境',
    canonical: `${SITE}/tools`,
  },
  {
    file: 'pricing.html',
    title: '会员与定价 | 山海灵境 VIP权益对比',
    description:
      '对比山海灵境免费版与VIP：更深八字年运、完整解读、积分消耗更省。支持积分包补充。',
    keywords: '山海灵境会员, VIP定价, 积分, shanhai realm pricing, membership',
    canonical: `${SITE}/pricing`,
  },
  {
    file: 'faq.html',
    title: '常见问题 | 山海灵境 AI八字·测字·易经帮助',
    description:
      '关于山海灵境的常见问题：积分获取、VIP权益、邀请奖励、隐私保护，以及AI八字/测字/易经如何使用。',
    keywords: '山海灵境帮助, FAQ, 积分, VIP, 八字帮助, 测字帮助',
    canonical: `${SITE}/faq`,
  },
  {
    file: 'privacy.html',
    title: '隐私政策 | 山海灵境 Shanhai Realm',
    description:
      '山海灵境如何收集、使用与保护你的账号、命盘与使用数据。我们不会出售个人信息。',
    keywords: '山海灵境隐私政策, privacy policy, 数据保护',
    canonical: `${SITE}/privacy`,
  },
  {
    file: 'terms.html',
    title: '服务条款 | 山海灵境 Shanhai Realm',
    description:
      '使用山海灵境AI玄学工具的服务条款。所有解读仅供娱乐与灵感，不构成医疗、法律或财务建议。',
    keywords: '山海灵境服务条款, terms of service, 免责声明',
    canonical: `${SITE}/terms`,
  },
  {
    file: 'about.html',
    title: '关于山海灵境 | 东方玄学AI陪伴与信任说明',
    description:
      '了解山海灵境：我们如何用八字、测字与易经式指引帮你反思决策；隐私、支付与客服承诺。解读仅供娱乐与自我反思。',
    keywords: '关于山海灵境, about shanhai realm, 东方玄学AI, 信任与安全',
    canonical: `${SITE}/about`,
  },
  {
    file: 'guides.html',
    title: '玄学使用指南 | 八字日主·测字避坑·占卜模板 | 山海灵境',
    description:
      '山海灵境内容指南：八字排盘教程、日主怎么看、测字例子与选字避坑、易经提问模板。用可执行步骤学会东方符号工具。',
    keywords: '八字教程, 八字日主, 测字例子, 测字避坑, 易经提问模板, 玄学指南, 山海灵境指南',
    canonical: `${SITE}/guides`,
  },
  {
    file: 'guides/index.html',
    title: '玄学使用指南 | 八字日主·测字避坑·占卜模板 | 山海灵境',
    description:
      '山海灵境内容指南：八字排盘教程、日主怎么看、测字例子与选字避坑、易经提问模板。用可执行步骤学会东方符号工具。',
    keywords: '八字教程, 八字日主, 测字例子, 测字避坑, 易经提问模板, 玄学指南, 山海灵境指南',
    canonical: `${SITE}/guides`,
  },
  {
    file: 'guides/bazi-chart-tutorial.html',
    title: '八字排盘教程：怎么看年柱月柱日柱时柱 | 山海灵境',
    description:
      '零基础八字排盘教程：如何输入生日时辰、认识四柱、日主与五行强弱，以及怎样用AI白话解读做自我反思。附常见误区与在线排盘入口。',
    keywords:
      '八字排盘教程, 怎么看八字, 四柱八字, 日主, 五行, 在线八字排盘, AI八字, 生辰八字入门',
    canonical: `${SITE}/guides/bazi-chart-tutorial`,
  },
  {
    file: 'guides/cezi-examples.html',
    title: '测字例子大全：感情事业怎么测更准 | 山海灵境',
    description:
      '用真实场景讲测字例子：感情复合、跳槽、合作是否合适。教你怎么选字、怎么提问、怎么读结果，并附可直接套用的测字模板。',
    keywords:
      '测字例子, AI测字, 测字占卜示例, 感情测字, 事业测字, 怎么测字, 汉字测字',
    canonical: `${SITE}/guides/cezi-examples`,
  },
  {
    file: 'guides/iching-question-templates.html',
    title: '易经占卜提问模板：这样问才有用 | 山海灵境',
    description:
      '易经/六爻提问模板大全：感情、事业、时机三类可直接套用的问题句式。教你避免空泛提问，拿到可执行的卦象指引。',
    keywords:
      '易经占卜提问, 六爻怎么问, 占卜问题模板, 易经问题示例, AI占卜, 卦象解读',
    canonical: `${SITE}/guides/iching-question-templates`,
  },
  {
    file: 'guides/bazi-day-master.html',
    title: '八字日主怎么看：十天干性格与行动建议 | 山海灵境',
    description:
      '八字日主入门：日主是什么、怎么在四柱里找到它，甲乙丙丁等到癸的白话解读，以及日主强弱常见误区。看完可直接在线排盘对照。',
    keywords:
      '八字日主, 日主怎么看, 十天干, 日主强弱, 甲木日主, 在线八字, 日柱解读, 八字入门',
    canonical: `${SITE}/guides/bazi-day-master`,
  },
  {
    file: 'guides/cezi-character-pitfalls.html',
    title: '测字选字避坑清单：别选这几类字 | 山海灵境',
    description:
      '测字选字避坑清单：哪些字别选、为什么失效、感情事业场景怎么选更准。附 30 秒自检表与可直接套用的选字步骤。',
    keywords:
      '测字选字, 测字避坑, 怎么选字, AI测字技巧, 测字不准原因, 汉字测字方法',
    canonical: `${SITE}/guides/cezi-character-pitfalls`,
  },
  // App tool shells share +html.tsx homepage meta unless rewritten.
  // Canonicalize to the SEO landing so Google does not treat them as home duplicates.
  {
    file: 'bazi.html',
    title: '免费八字排盘在线 | 四柱命盘白话解读 | 山海灵境',
    description:
      '免费在线八字排盘：输入生日时辰，30 秒生成年柱月柱日柱时柱，再用白话看性格、关系与今年重点。不是判决，是下一步的坐标。仅供娱乐。',
    keywords:
      '免费八字排盘, 八字排盘在线, 在线八字排盘, 四柱八字, 生辰八字, 日主, 免费排盘, 山海灵境',
    canonical: `${SITE}/bazi-calculator`,
  },
  {
    file: 'zi.html',
    title: '测字算命在线 | 写一个字看下一步 | 山海灵境',
    description:
      '免费测字算命（也称拆字、相字）：心里想着那件事，写一个汉字，看字形意象和今天能做的一步。不用生日、不会八字也能看。仅供娱乐。',
    keywords:
      '测字算命, 在线测字, 免费测字, 拆字算命, 相字, 写一个字算命, 测字占卜, 山海灵境',
    canonical: `${SITE}/character-divination`,
  },
  {
    file: 'reading.html',
    title: '易经占卜在线 | 问具体问题给下一步 | 山海灵境',
    description:
      '在线易经/六爻风格占卜：先写一个具体问题，再拿结论、行动步骤与风险提醒。适合该不该、何时做、是否继续。不是泛泛算命。',
    keywords: '易经占卜, 在线占卜, 六爻占卜, 卦象解读, 问事占卜, 山海灵境',
    canonical: `${SITE}/i-ching-reading`,
  },
  {
    file: 'points.html',
    title: '积分与会员 | 山海灵境',
    description: '山海灵境积分、签到与会员权益。登录后使用。',
    keywords: '山海灵境积分',
    canonical: `${SITE}/points`,
    noindex: true,
  },
  {
    file: 'profile.html',
    title: '个人资料 | 山海灵境',
    description: '山海灵境账号、命盘与签到设置。登录后使用。',
    keywords: '山海灵境账号',
    canonical: `${SITE}/profile`,
    noindex: true,
  },
  {
    file: 'meditation.html',
    title: '冥想 | 山海灵境',
    description: '山海灵境冥想与白噪音。应用内功能页。',
    keywords: '山海灵境冥想',
    canonical: `${SITE}/meditation`,
    noindex: true,
  },
];

module.exports = {
  SITE,
  OG_IMAGE,
  PAGES,
};
