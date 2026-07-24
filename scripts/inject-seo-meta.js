/**
 * Post-process expo static export: inject per-route <title> and meta tags.
 * Run after: npx expo export --platform web
 *
 * Keep page titles/descriptions aligned with src/seo/site.ts and landingPages.ts.
 */
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
const OG_IMAGE = 'https://www.shanhai.app/og-image.png';

const PAGES = [
  {
    file: 'index.html',
    title: '山海灵境 Shanhai Realm | AI BaZi, CeZi, I Ching & Daily Fortune',
    description:
      '山海灵境 Shanhai Realm is an AI-assisted Eastern oracle companion: BaZi Four Pillars chart, Chinese character divination (测字), I Ching readings, and daily oracle slips. Entertainment only.',
    keywords:
      'shanhai realm, bazi calculator, chinese character divination, cezi, i ching reading, daily fortune, 八字, 测字, 占卜, 山海灵境',
    canonical: 'https://www.shanhai.app/',
  },
  {
    file: 'bazi-calculator.html',
    title: 'BaZi Chart Calculator Online | Four Pillars AI Reading | Shanhai Realm',
    description:
      'Free online BaZi (Four Pillars) chart calculator with AI interpretation. Enter birth date and time to generate pillars, ten gods, and actionable guidance. Entertainment only.',
    keywords:
      'bazi calculator, four pillars chart, chinese astrology, ba zi online, birth chart calculator, 八字排盘, 在线八字',
    canonical: 'https://www.shanhai.app/bazi-calculator',
  },
  {
    file: 'character-divination.html',
    title: 'Chinese Character Divination (测字) Online | AI CeZi Reading | Shanhai Realm',
    description:
      'Try AI-powered Chinese character divination (测字/CeZi). Write or type a character to receive structure analysis, oracle references, and focused life guidance.',
    keywords:
      'chinese character divination, cezi, 测字, character reading, oracle bone script, handwriting analysis',
    canonical: 'https://www.shanhai.app/character-divination',
  },
  {
    file: 'i-ching-reading.html',
    title: 'I Ching AI Divination Reading Online | Hexagram Guidance | Shanhai Realm',
    description:
      'Ask a clear question and receive structured I Ching-style divination with verdict, action steps, risks, and weekly rhythm. Built for decisions, not vague fortune cookies.',
    keywords:
      'i ching reading, iching divination online, hexagram reading, chinese divination, 六爻, 占卜',
    canonical: 'https://www.shanhai.app/i-ching-reading',
  },
  {
    file: 'daily-fortune.html',
    title: 'Daily Chinese Fortune & Oracle Slip | Shanhai Realm',
    description:
      'Draw a daily fortune slip with poem, lucky color, number, and mission. Optional deep divination follow-up for the same theme.',
    keywords:
      'daily chinese fortune, oracle slip, daily luck, chinese horoscope daily, 每日运势, 灵签',
    canonical: 'https://www.shanhai.app/daily-fortune',
  },
  {
    file: 'overseas-chinese-metaphysics-ai.html',
    title: 'Eastern Oracle AI Companion for Global Users | Shanhai Realm',
    description:
      'An Eastern oracle-style AI companion for love, career, identity, timing, and uncertainty. Explore symbol readings, I Ching-inspired guidance, birth-chart patterns, and empathetic chat.',
    keywords:
      'eastern oracle ai, spiritual ai companion, chinese astrology app, ai fortune reading, overseas chinese ai companion, 华人玄学AI, AI算命',
    canonical: 'https://www.shanhai.app/overseas-chinese-metaphysics-ai',
  },
  {
    file: 'ai-cezi-vs-fortune-teller.html',
    title: 'AI Symbol Reading vs Traditional Fortune Teller | Chinese Character Reading Explained',
    description:
      'Compare AI Chinese symbol reading with traditional fortune-telling: what one-character readings can clarify, where the limits are, and how to use them for reflection.',
    keywords:
      'ai cezi, ai chinese character reading, cezi vs fortune teller, 测字AI, AI测字, chinese divination online',
    canonical: 'https://www.shanhai.app/ai-cezi-vs-fortune-teller',
  },
  {
    file: 'tools.html',
    title: 'AI Metaphysics Tools | BaZi, CeZi, I Ching, Daily Fortune | Shanhai Realm',
    description:
      'Explore Shanhai Realm tools: BaZi chart calculator, Chinese character divination (测字), I Ching readings, and daily fortune slips — AI-assisted, entertainment only.',
    keywords: 'chinese metaphysics app, bazi, cezi, i ching, daily fortune, shanhai realm',
    canonical: 'https://www.shanhai.app/tools',
  },
  {
    file: 'pricing.html',
    title: 'Pricing & Membership | Shanhai Realm',
    description:
      'Compare Shanhai Realm free and VIP plans. Unlock deeper BaZi commentary, unlimited readings, and premium AI guidance. Points packs available.',
    keywords: 'shanhai realm pricing, membership, vip, points, bazi premium',
    canonical: 'https://www.shanhai.app/pricing',
  },
  {
    file: 'faq.html',
    title: 'FAQ | Shanhai Realm — BaZi, CeZi & I Ching Help',
    description:
      'Answers about Shanhai Realm: points, VIP benefits, check-in rewards, data privacy, and how AI-assisted BaZi, 测字, and I Ching readings work.',
    keywords: 'shanhai realm faq, help, points, vip, bazi help',
    canonical: 'https://www.shanhai.app/faq',
  },
  {
    file: 'privacy.html',
    title: 'Privacy Policy | Shanhai Realm',
    description:
      'How Shanhai Realm collects, uses, and protects your account, birth chart, and usage data. We do not sell personal information.',
    keywords: 'shanhai realm privacy policy, data protection',
    canonical: 'https://www.shanhai.app/privacy',
  },
  {
    file: 'terms.html',
    title: 'Terms of Service | Shanhai Realm',
    description:
      'Terms for using Shanhai Realm AI metaphysics tools. Readings are for entertainment and inspiration only — not medical, legal, or financial advice.',
    keywords: 'shanhai realm terms of service, disclaimer',
    canonical: 'https://www.shanhai.app/terms',
  },
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function injectPage(config) {
  const filePath = path.join(DIST, config.file);
  if (!fs.existsSync(filePath)) {
    console.warn(`[seo-inject] skip missing ${config.file}`);
    return;
  }

  let html = fs.readFileSync(filePath, 'utf8');
  const title = escapeHtml(config.title);
  const description = escapeHtml(config.description);
  const keywords = escapeHtml(config.keywords);
  const canonical = escapeHtml(config.canonical);
  const ogImage = escapeHtml(OG_IMAGE);

  html = html
    .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\s+name=["']description["'][^>]*>/gi, '')
    .replace(/<meta\s+name=["']keywords["'][^>]*>/gi, '')
    .replace(/<meta\s+name=["']robots["'][^>]*>/gi, '')
    .replace(/<meta\s+property=["']og:(title|description|url|image)["'][^>]*>/gi, '')
    .replace(/<meta\s+name=["']twitter:(title|description|image)["'][^>]*>/gi, '')
    .replace(/<link\s+rel=["']canonical["'][^>]*>/gi, '');

  const extraMeta = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}"/>`,
    `<meta name="keywords" content="${keywords}"/>`,
    `<meta name="robots" content="index, follow"/>`,
    `<meta property="og:title" content="${title}"/>`,
    `<meta property="og:description" content="${description}"/>`,
    `<meta property="og:url" content="${canonical}"/>`,
    `<meta property="og:image" content="${ogImage}"/>`,
    `<meta name="twitter:title" content="${title}"/>`,
    `<meta name="twitter:description" content="${description}"/>`,
    `<meta name="twitter:image" content="${ogImage}"/>`,
    `<link rel="canonical" href="${canonical}"/>`,
  ].join('');

  html = html.replace(/<head>/i, `<head>${extraMeta}`);
  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`[seo-inject] updated ${config.file}`);
}

if (!fs.existsSync(DIST)) {
  console.error('[seo-inject] dist/ not found. Run expo export --platform web first.');
  process.exit(1);
}

PAGES.forEach(injectPage);
console.log('[seo-inject] done');
