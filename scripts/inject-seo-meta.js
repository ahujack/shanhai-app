/**
 * Post-process expo static export: inject per-route <title> and meta tags.
 * Run after: npx expo export --platform web
 *
 * Meta source of truth: src/seo/pageMeta.cjs
 * Keep site.ts / landingPages.ts aligned with the same copy.
 */
const fs = require('fs');
const path = require('path');
const { OG_IMAGE, PAGES } = require('../src/seo/pageMeta.cjs');

const DIST = path.join(__dirname, '..', 'dist');

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
  const isHome = config.file === 'index.html';

  html = html
    .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\s+name=["']description["'][^>]*>/gi, '')
    .replace(/<meta\s+name=["']keywords["'][^>]*>/gi, '')
    .replace(/<meta\s+name=["']robots["'][^>]*>/gi, '')
    .replace(/<meta\s+property=["']og:(title|description|url|image|locale)["'][^>]*>/gi, '')
    .replace(/<meta\s+name=["']twitter:(title|description|image)["'][^>]*>/gi, '')
    .replace(/<link\s+rel=["']canonical["'][^>]*>/gi, '')
    // Root shell incorrectly stamps homepage hreflang onto every route — strip it.
    .replace(/<link\s+rel=["']alternate["'][^>]*>/gi, '');

  html = html.replace(/<html\b[^>]*>/i, '<html lang="zh-CN">');

  const hreflang = isHome
    ? [
        `<link rel="alternate" hrefLang="x-default" href="${canonical}"/>`,
        `<link rel="alternate" hrefLang="zh-CN" href="${canonical}"/>`,
        `<link rel="alternate" hrefLang="en" href="${canonical}"/>`,
      ].join('')
    : `<link rel="alternate" hrefLang="x-default" href="${canonical}"/>`;

  const headMeta = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}"/>`,
    `<meta name="keywords" content="${keywords}"/>`,
    `<meta name="robots" content="index, follow"/>`,
    `<meta property="og:title" content="${title}"/>`,
    `<meta property="og:description" content="${description}"/>`,
    `<meta property="og:url" content="${canonical}"/>`,
    `<meta property="og:image" content="${ogImage}"/>`,
    `<meta property="og:locale" content="zh_CN"/>`,
    `<meta name="twitter:title" content="${title}"/>`,
    `<meta name="twitter:description" content="${description}"/>`,
    `<meta name="twitter:image" content="${ogImage}"/>`,
    `<link rel="canonical" href="${canonical}"/>`,
    hreflang,
  ].join('');

  html = html.replace(/<head>/i, `<head>${headMeta}`);
  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`[seo-inject] updated ${config.file}`);
}

if (!fs.existsSync(DIST)) {
  console.error('[seo-inject] dist/ not found. Run expo export --platform web first.');
  process.exit(1);
}

PAGES.forEach(injectPage);
console.log('[seo-inject] done');
