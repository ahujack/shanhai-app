/**
 * Build crawlable HTML + JSON-LD for inject-seo-meta.js from landing/article copy.
 */
const { loadSeoTs } = require('./load-seo-ts.cjs');
const { HOME_SEO, FAQ_SCHEMA_ITEMS, STATIC_PAGE_SEO } = loadSeoTs('../src/seo/site.ts');
const { LANDING_PAGE_LIST, LANDING_PAGES, TOOLS_HUB } = loadSeoTs('../src/seo/landingPages.ts');
const { SEO_ARTICLE_LIST, SEO_ARTICLES, GUIDES_HUB } = loadSeoTs('../src/seo/articles.ts');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function p(text) {
  return `<p>${escapeHtml(text)}</p>`;
}

function jsonLdTag(data) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}

function faqJsonLd(items) {
  if (!items?.length) return '';
  return jsonLdTag({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  });
}

function howToJsonLd(name, description, steps) {
  if (!steps?.length) return '';
  return jsonLdTag({
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    inLanguage: 'zh-CN',
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.title || step.name,
      text: step.body || step.text,
    })),
  });
}

function wrap(inner) {
  return `<main id="seo-static-content">${inner}</main>`;
}

function hubNav() {
  return `<nav class="seo-hub">
    <a href="/bazi-calculator">免费八字排盘</a>
    <a href="/character-divination">测字算命</a>
    <a href="/daily-fortune">今日运势</a>
    <a href="/guides">使用指南</a>
  </nav>`;
}

function faqHtml(items) {
  if (!items?.length) return '';
  return `<section><h2>常见问题</h2>${items
    .map((item) => `<h3>${escapeHtml(item.question)}</h3>${p(item.answer)}`)
    .join('')}</section>`;
}

function buildHome() {
  const html = wrap(`
    <h1>${escapeHtml(HOME_SEO.title)}</h1>
    ${p(HOME_SEO.description)}
    ${hubNav()}
  `);
  return { html, jsonLd: '' };
}

function buildLanding(page) {
  const features = (page.features || [])
    .map((item) => `<h2>${escapeHtml(item.title)}</h2>${p(item.body)}`)
    .join('');
  const steps = (page.steps || [])
    .map((step, index) => `<li><strong>${escapeHtml(step.title)}</strong> ${escapeHtml(step.body)}</li>`)
    .join('');
  const bridge = page.bridge ? `<h2>${escapeHtml(page.bridge.title)}</h2>${p(page.bridge.body)}` : '';
  const related = (page.relatedSlugs || [])
    .map((slug) => LANDING_PAGES[slug])
    .filter(Boolean)
    .map((rel) => `<a href="${escapeHtml(rel.path)}">${escapeHtml(rel.hero.badge || rel.seo.title)}</a>`)
    .join(' ');
  const html = wrap(`
    <p>${escapeHtml(page.hero.badge)}</p>
    <h1>${escapeHtml(page.hero.title)}</h1>
    ${p(page.hero.subtitle)}
    ${bridge}
    ${features}
    ${steps ? `<h2>${escapeHtml(page.sections?.how || '怎么用')}</h2><ol>${steps}</ol>` : ''}
    ${faqHtml(page.faq)}
    <p><a href="${escapeHtml(page.path)}">${escapeHtml(page.cta.primary)}</a></p>
    ${related ? `<nav>${related}</nav>` : ''}
    ${hubNav()}
  `);
  const jsonLd = [
    faqJsonLd(page.faq),
    howToJsonLd(page.hero.title, page.seo.description, page.steps),
  ].join('');
  return { html, jsonLd };
}

function buildArticle(article) {
  const sections = (article.sections || [])
    .map((section) => {
      const paras = (section.paragraphs || []).map(p).join('');
      const bullets = section.bullets?.length
        ? `<ul>${section.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
        : '';
      return `<h2>${escapeHtml(section.heading)}</h2>${paras}${bullets}`;
    })
    .join('');
  const html = wrap(`
    <p>${escapeHtml(article.hero.badge)}</p>
    <h1>${escapeHtml(article.hero.title)}</h1>
    ${p(article.hero.subtitle)}
    ${sections}
    ${faqHtml(article.faq)}
    <p><a href="${escapeHtml(article.toolPath)}">${escapeHtml(article.toolLabel)}</a></p>
    ${hubNav()}
  `);
  const jsonLd = [
    jsonLdTag({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.hero.title,
      description: article.seo.description,
      datePublished: article.publishedAt,
      dateModified: article.updatedAt,
      inLanguage: 'zh-CN',
      mainEntityOfPage: article.canonical,
    }),
    howToJsonLd(
      article.hero.title,
      article.seo.description,
      (article.sections || []).slice(0, 5).map((section) => ({
        title: section.heading,
        body: (section.paragraphs || []).join(' '),
      })),
    ),
    faqJsonLd(article.faq),
  ].join('');
  return { html, jsonLd };
}

function buildTools() {
  const cards = LANDING_PAGE_LIST.map(
    (page) =>
      `<p><a href="${escapeHtml(page.path)}">${escapeHtml(page.hero.badge)}</a> ${escapeHtml(page.hero.subtitle)}</p>`,
  ).join('');
  const guides = SEO_ARTICLE_LIST.map(
    (article) => `<p><a href="${escapeHtml(article.path)}">${escapeHtml(article.hero.title)}</a></p>`,
  ).join('');
  return {
    html: wrap(`
      <h1>${escapeHtml(TOOLS_HUB.hero.title)}</h1>
      ${p(TOOLS_HUB.hero.subtitle)}
      ${cards}
      <h2>使用指南</h2>
      ${guides}
      ${hubNav()}
    `),
    jsonLd: '',
  };
}

function buildGuidesHub() {
  const cards = SEO_ARTICLE_LIST.map(
    (article) =>
      `<p><a href="${escapeHtml(article.path)}">${escapeHtml(article.hero.title)}</a> ${escapeHtml(article.hero.subtitle)}</p>`,
  ).join('');
  return {
    html: wrap(`
      <h1>${escapeHtml(GUIDES_HUB.hero.title)}</h1>
      ${p(GUIDES_HUB.hero.subtitle)}
      ${cards}
      ${hubNav()}
    `),
    jsonLd: '',
  };
}

function buildStatic(key) {
  const meta = STATIC_PAGE_SEO[key];
  if (!meta) return { html: '', jsonLd: '' };
  const faq = key === 'faq' ? faqHtml(FAQ_SCHEMA_ITEMS) : '';
  return {
    html: wrap(`
      <h1>${escapeHtml(meta.title)}</h1>
      ${p(meta.description)}
      ${faq}
      ${hubNav()}
    `),
    jsonLd: key === 'faq' ? faqJsonLd(FAQ_SCHEMA_ITEMS) : '',
  };
}

function buildAlias(href, label) {
  return {
    html: wrap(`<p>工具页。请使用规范地址：<a href="${escapeHtml(href)}">${escapeHtml(label)}</a></p>${hubNav()}`),
    jsonLd: '',
  };
}

const FILE_BUILDERS = {
  'index.html': buildHome,
  'bazi-calculator.html': () => buildLanding(LANDING_PAGES['bazi-calculator']),
  'character-divination.html': () => buildLanding(LANDING_PAGES['character-divination']),
  'i-ching-reading.html': () => buildLanding(LANDING_PAGES['i-ching-reading']),
  'daily-fortune.html': () => buildLanding(LANDING_PAGES['daily-fortune']),
  'overseas-chinese-metaphysics-ai.html': () => buildLanding(LANDING_PAGES['overseas-chinese-metaphysics-ai']),
  'ai-cezi-vs-fortune-teller.html': () => buildLanding(LANDING_PAGES['ai-cezi-vs-fortune-teller']),
  'tools.html': buildTools,
  'guides.html': buildGuidesHub,
  'guides/index.html': buildGuidesHub,
  'guides/bazi-chart-tutorial.html': () => buildArticle(SEO_ARTICLES['bazi-chart-tutorial']),
  'guides/cezi-examples.html': () => buildArticle(SEO_ARTICLES['cezi-examples']),
  'guides/iching-question-templates.html': () => buildArticle(SEO_ARTICLES['iching-question-templates']),
  'guides/bazi-day-master.html': () => buildArticle(SEO_ARTICLES['bazi-day-master']),
  'guides/cezi-character-pitfalls.html': () => buildArticle(SEO_ARTICLES['cezi-character-pitfalls']),
  'pricing.html': () => buildStatic('pricing'),
  'faq.html': () => buildStatic('faq'),
  'privacy.html': () => buildStatic('privacy'),
  'terms.html': () => buildStatic('terms'),
  'about.html': () => buildStatic('about'),
  'bazi.html': () => buildAlias('/bazi-calculator', '免费八字排盘'),
  'zi.html': () => buildAlias('/character-divination', '测字算命'),
  'reading.html': () => buildAlias('/i-ching-reading', '易经占卜'),
};

function buildPrerender(file) {
  const builder = FILE_BUILDERS[file];
  if (!builder) return { html: '', jsonLd: '' };
  return builder();
}

module.exports = { buildPrerender };
