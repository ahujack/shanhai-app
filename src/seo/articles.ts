import { SEO_SITE } from './site';

export type ArticleSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type ArticleFaq = { question: string; answer: string };

export type SeoArticle = {
  slug: string;
  path: string;
  canonical: string;
  toolPath: string;
  toolLabel: string;
  publishedAt: string;
  updatedAt: string;
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
  sections: ArticleSection[];
  faq: ArticleFaq[];
  cta: { primary: string; secondary: string };
};

const SITE = SEO_SITE.url;

export const SEO_ARTICLE_LIST: SeoArticle[] = [
  {
    slug: 'bazi-chart-tutorial',
    path: '/guides/bazi-chart-tutorial',
    canonical: `${SITE}/guides/bazi-chart-tutorial`,
    toolPath: '/bazi-calculator',
    toolLabel: '免费在线八字排盘',
    publishedAt: '2026-08-08',
    updatedAt: '2026-08-08',
    seo: {
      title: '八字排盘教程：怎么看年柱月柱日柱时柱 | 山海灵境',
      description:
        '零基础八字排盘教程：如何输入生日时辰、认识四柱、日主与五行强弱，以及怎样用AI白话解读做自我反思。附常见误区与在线排盘入口。',
      keywords:
        '八字排盘教程, 怎么看八字, 四柱八字, 日主, 五行, 在线八字排盘, AI八字, 生辰八字入门',
    },
    hero: {
      badge: '指南 · 八字排盘',
      title: '八字排盘教程：从生日到四柱，看懂第一层结构',
      subtitle:
        '这篇面向零基础：你会学会怎么准备出生信息、四柱分别代表什么、哪些结果先看、哪些先别当真。看完可直接去山海灵境做一次在线排盘。',
    },
    sections: [
      {
        heading: '八字排盘到底在排什么？',
        paragraphs: [
          '八字（四柱）把出生的年、月、日、时转换成四个“柱”，每柱由天干与地支组成，一共八个字，所以叫八字。它不是“算死你的命运”，而更像一张出生时刻的符号地图，用来观察性格倾向、压力模式、关系节奏与阶段议题。',
          '对普通人最有用的用法是：先看结构与倾向，再用现实信息做决策，而不是把排盘结果当成唯一答案。',
        ],
      },
      {
        heading: '开始前准备：这 4 个信息越准确越好',
        paragraphs: [
          '排盘质量高度依赖输入信息。建议按下面顺序准备：',
        ],
        bullets: [
          '出生日期：公历（阳历）优先；若只有农历，需标明闰月。',
          '出生时间：尽量精确到小时；不知道时辰时，可先排“日柱为主”的近似盘。',
          '出生地点：影响真太阳时校正，对时柱更有帮助。',
          '性别与当前问题：不是排盘必需，但能让后续解读更聚焦。',
        ],
      },
      {
        heading: '四柱分别看什么（入门版）',
        paragraphs: [
          '你可以先用“角色分工”来理解四柱，不必一次学完所有术语：',
        ],
        bullets: [
          '年柱：大环境、家族背景、早期成长氛围的象征层。',
          '月柱：季节与资源背景，常用来观察阶段性气场。',
          '日柱：核心自我（日主）与亲密关系的重要线索。',
          '时柱：后期发展、成果表达、子女/传承议题的象征。',
        ],
      },
      {
        heading: '新手建议的阅读顺序',
        paragraphs: [
          '第一次看盘，不要被十神、大运、流年一次淹没。建议按这个顺序：',
        ],
        bullets: [
          '先确认日主：这是“我是谁”的核心锚点。',
          '再看五行旺衰：哪些能量偏多，哪些偏少。',
          '然后看关系宫位线索：亲密、合作、冲突更容易落在哪里。',
          '最后才看阶段节奏：近期更适合冲、还是更适合守。',
        ],
      },
      {
        heading: '常见误区：这 5 件事别急着下结论',
        paragraphs: ['很多人第一次排盘会踩这些坑：'],
        bullets: [
          '把“喜用神”理解成绝对命令，而不是倾向参考。',
          '时辰不准却强行解读时柱细节。',
          '只看凶吉标签，不看具体行动建议。',
          '用一次排盘否定现实努力与选择空间。',
          '把娱乐向 AI 解读当成专业命理鉴定。',
        ],
      },
      {
        heading: '如何在山海灵境做一次有效排盘',
        paragraphs: [
          '打开「在线八字排盘」后：输入生日时辰 → 生成四柱与概览 → 先读白话总结 → 再针对“感情/事业/时机”追问。',
          '如果你是第一次用，建议先问一个具体问题，例如：“今年换工作是否合适？”比“我一生怎么样？”更容易得到可执行的反馈。',
        ],
      },
    ],
    faq: [
      {
        question: '不知道出生时辰还能排八字吗？',
        answer:
          '可以先排到日柱并看大体倾向；但时柱相关细节会变弱。有条件时尽量补齐出生时间。',
      },
      {
        question: 'AI八字和传统命理师有什么区别？',
        answer:
          'AI更适合快速结构化与白话解释；传统命理师更强在经验判断与复杂取用。山海灵境定位是娱乐与自我反思工具，不是替代专业鉴定。',
      },
      {
        question: '排盘结果能直接用来做重大决定吗？',
        answer:
          '不建议。请把它当作视角补充，重大医疗、法律、财务决策仍需现实信息与专业意见。',
      },
    ],
    cta: { primary: '立刻在线八字排盘', secondary: '查看全部指南' },
  },
  {
    slug: 'cezi-examples',
    path: '/guides/cezi-examples',
    canonical: `${SITE}/guides/cezi-examples`,
    toolPath: '/character-divination',
    toolLabel: '开始 AI 测字',
    publishedAt: '2026-08-08',
    updatedAt: '2026-08-08',
    seo: {
      title: '测字例子大全：感情事业怎么测更准 | 山海灵境',
      description:
        '用真实场景讲测字例子：感情复合、跳槽、合作是否合适。教你怎么选字、怎么提问、怎么读结果，并附可直接套用的测字模板。',
      keywords:
        '测字例子, AI测字, 测字占卜示例, 感情测字, 事业测字, 怎么测字, 汉字测字',
    },
    hero: {
      badge: '指南 · 测字例子',
      title: '测字例子：选对字，比问得玄更重要',
      subtitle:
        '测字不是随便抓一个字碰运气。下面用感情、事业、合作三类例子，演示“怎么选字、怎么聚焦、怎么把结果变成行动”。',
    },
    sections: [
      {
        heading: '先记住测字的三条原则',
        paragraphs: ['在看例子前，先建立正确预期：'],
        bullets: [
          '一字一事：一次只围绕一个具体问题。',
          '字要有连接感：选当下最先想到、或与情境强相关的字。',
          '结果当镜子：看意象与提醒，不把它当判决书。',
        ],
      },
      {
        heading: '例子 1：感情——要不要复合？',
        paragraphs: [
          '情境：分手两个月，对方突然联系，你犹豫要不要复合。',
          '可选字：复、回、缘、等、放。假设你选了「复」。',
          '阅读重点：字形是否有“反复/重叠/受阻”，情绪上是渴望修复还是害怕重蹈覆辙。若结果提示“先修复自己节奏，再谈重逢”，行动建议通常是：先沟通边界，再决定见面，而不是立刻复合。',
        ],
        bullets: [
          '更好的提问：我现在与对方复合，是否有利于双方成长？',
          '避免的提问：我们会不会永远在一起？',
        ],
      },
      {
        heading: '例子 2：事业——这份 offer 接不接？',
        paragraphs: [
          '情境：有一份薪资更高但加班更多的 offer。',
          '可选字：跳、稳、升、压、机。假设你选了「机」。',
          '阅读重点：这个字是“机会窗口”还是“机而不稳”。若解读强调窗口短、代价高，可把行动拆成：谈清楚岗位预期、试用期目标、退出条件，再签字。',
        ],
      },
      {
        heading: '例子 3：合作——该不该入伙？',
        paragraphs: [
          '情境：朋友邀你合伙创业，感情好但分工不清。',
          '可选字：合、伙、分、信、守。假设你选了「合」。',
          '阅读重点：合是否建立在规则上。若结果提示“先定契约再合力”，就不要只靠信任推进；先写清出资、职责、退出机制。',
        ],
      },
      {
        heading: '可直接套用的测字模板',
        paragraphs: ['把下面句子填空后，再选字：'],
        bullets: [
          '关于【感情/事业/合作】，我在犹豫【A还是B】。',
          '我最担心的是【具体风险】。',
          '我希望接下来 30 天先看清【一个关键信号】。',
        ],
      },
      {
        heading: '如何在山海灵境做一次高质量测字',
        paragraphs: [
          '进入「AI测字」→ 手写或输入汉字 → 选择感情/事业等聚焦标签 → 先看结论与意象 → 再用追问把“下一步行动”问清楚。',
          '同一字可以换聚焦标签重测，但不要短时间反复刷同一问题来“抽到想听的答案”。',
        ],
      },
    ],
    faq: [
      {
        question: '测字一定要手写吗？',
        answer:
          '不一定。打字也可以；手写会多一层笔势信息，仪式感更强，但不是强制。',
      },
      {
        question: '同一个字测两次结果不同正常吗？',
        answer:
          '正常。问题措辞、聚焦标签、当下情绪不同，解读角度就会变化。关键是看是否指向可验证的行动。',
      },
      {
        question: '测字能预测未来吗？',
        answer:
          '不能也不应如此使用。它更适合澄清当下心态与选择框架，决策仍要结合现实信息。',
      },
    ],
    cta: { primary: '去做一次 AI 测字', secondary: '查看全部指南' },
  },
  {
    slug: 'iching-question-templates',
    path: '/guides/iching-question-templates',
    canonical: `${SITE}/guides/iching-question-templates`,
    toolPath: '/i-ching-reading',
    toolLabel: '开始易经占卜',
    publishedAt: '2026-08-08',
    updatedAt: '2026-08-08',
    seo: {
      title: '易经占卜提问模板：这样问才有用 | 山海灵境',
      description:
        '易经/六爻提问模板大全：感情、事业、时机三类可直接套用的问题句式。教你避免空泛提问，拿到可执行的卦象指引。',
      keywords:
        '易经占卜提问, 六爻怎么问, 占卜问题模板, 易经问题示例, AI占卜, 卦象解读',
    },
    hero: {
      badge: '指南 · 易经提问',
      title: '易经占卜提问模板：把问题问具体，答案才可执行',
      subtitle:
        '占卜质量一半取决于提问。下面给你可直接复制的模板，并说明哪些问法无效、怎样把卦象结果变成一周行动。',
    },
    sections: [
      {
        heading: '好问题的标准：具体、可决策、有时间框',
        paragraphs: [
          '好的占卜问题通常具备三点：有选项、有场景、有时间范围。例如“本月内是否适合接受这份工作”就比“我前途如何”有用得多。',
        ],
        bullets: [
          '具体：对象、事件清楚。',
          '可决策：答案能导向做/不做/暂缓。',
          '有时间框：本周、本月、这一季。',
        ],
      },
      {
        heading: '感情提问模板',
        paragraphs: ['可直接改括号内容后使用：'],
        bullets: [
          '在【当前关系状态】下，我是否适合在【30天内】主动沟通复合/分手/确定关系？',
          '若我继续与【对方】保持现状，未来【两个月】最需要注意什么风险？',
          '关于这段关系，我更该先处理【情绪】还是先处理【现实条件】？',
        ],
      },
      {
        heading: '事业提问模板',
        paragraphs: ['适合跳槽、创业、合作、项目推进：'],
        bullets: [
          '我是否适合在【本季度】接受【公司/岗位】的 offer？',
          '推进【项目名】时，本月更适合扩张还是先稳固基础？',
          '与【合作方】合作，最需要先明确的规则是什么？',
        ],
      },
      {
        heading: '时机提问模板',
        paragraphs: ['当你卡在“现在做还是再等等”：'],
        bullets: [
          '就【这件事】而言，【未来两周】行动是否优于继续等待？',
          '如果我选择等待到【某个时间点】，需要准备哪些条件？',
          '当前最大阻力来自外部条件，还是我自己的节奏未准备好？',
        ],
      },
      {
        heading: '无效提问（尽量别这样问）',
        paragraphs: ['这些问法很难得到可用指引：'],
        bullets: [
          '我一生会不会成功？',
          '他到底爱不爱我？（无行动选项）',
          '求今晚中奖号码。（超出反思工具边界）',
        ],
      },
      {
        heading: '拿到卦象后怎么用',
        paragraphs: [
          '建议把结果拆成四格：直接结论、有利信号、风险提醒、未来 7 天行动。然后只选 1 个最小行动去验证，例如“本周内发一封确认职责的邮件”，而不是一次改变人生方向。',
          '在山海灵境里，你可以问完后继续用灵伴对话，把情绪层与执行层分开处理。',
        ],
      },
    ],
    faq: [
      {
        question: '同一个问题可以连续占多次吗？',
        answer:
          '不建议短时间反复重占来抽答案。先按第一次结果执行一个小验证，再根据新信息重问。',
      },
      {
        question: '没有卦名基础也能用吗？',
        answer:
          '可以。先看白话结论与行动建议；卦名作为补充语境即可。',
      },
      {
        question: '占卜结果和我现实判断冲突怎么办？',
        answer:
          '以现实约束为先。把占卜当作提醒风险与启发视角，不替代合同、体检、财务计算等硬信息。',
      },
    ],
    cta: { primary: '用模板去占一卦', secondary: '查看全部指南' },
  },
];

export const SEO_ARTICLES: Record<string, SeoArticle> = Object.fromEntries(
  SEO_ARTICLE_LIST.map((article) => [article.slug, article]),
);

export const GUIDES_HUB = {
  path: '/guides',
  canonical: `${SITE}/guides`,
  seo: {
    title: '玄学使用指南 | 八字教程·测字例子·占卜提问模板 | 山海灵境',
    description:
      '山海灵境内容指南：八字排盘教程、测字例子、易经提问模板。用可执行步骤学会东方符号工具，再去在线体验。',
    keywords: '八字教程, 测字例子, 易经提问模板, 玄学指南, 山海灵境指南',
  },
  hero: {
    title: '玄学使用指南',
    subtitle: '先看懂怎么用，再开始排盘、测字与占卜——内容可收藏，也可分享给朋友。',
  },
};

export function buildArticleJsonLd(article: SeoArticle) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.hero.title,
    description: article.seo.description,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      '@type': 'Organization',
      name: SEO_SITE.name,
      url: SEO_SITE.url,
    },
    publisher: {
      '@type': 'Organization',
      name: SEO_SITE.name,
      logo: {
        '@type': 'ImageObject',
        url: SEO_SITE.ogImage,
      },
    },
    mainEntityOfPage: article.canonical,
    image: SEO_SITE.ogImage,
    inLanguage: 'zh-CN',
  };
}

export function buildHowToJsonLd(article: SeoArticle) {
  const steps = article.sections.slice(0, 5).map((section, index) => ({
    '@type': 'HowToStep',
    position: index + 1,
    name: section.heading,
    text: section.paragraphs.join(' '),
  }));
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: article.hero.title,
    description: article.seo.description,
    step: steps,
    inLanguage: 'zh-CN',
  };
}
