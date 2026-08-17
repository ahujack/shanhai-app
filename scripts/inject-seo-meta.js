/**
 * Post-process expo static export: inject per-route <title>, meta, JSON-LD, and crawlable body copy.
 * Run after: npx expo export --platform web
 *
 * Meta source of truth: src/seo/pageMeta.cjs
 * Body copy: src/seo/landingPages.ts + articles.ts via scripts/seo-prerender.cjs
 */
const fs = require('fs');
const path = require('path');
const { OG_IMAGE, PAGES } = require('../src/seo/pageMeta.cjs');
const { buildPrerender } = require('./seo-prerender.cjs');

const DIST = path.join(__dirname, '..', 'dist');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

const SEO_STATIC_STYLE = `<style data-seo-inject="1">
#seo-static-content{max-width:720px;margin:0 auto;padding:24px 20px 48px;color:#E8ECF3;font-family:ui-sans-serif,system-ui,sans-serif;line-height:1.7}
#seo-static-content h1{font-size:28px;line-height:1.3;margin:0 0 12px;color:#F5E6C8}
#seo-static-content h2{font-size:18px;margin:24px 0 8px;color:#F5E6C8}
#seo-static-content h3{font-size:16px;margin:16px 0 6px}
#seo-static-content a{color:#D6B36A}
#seo-static-content nav a{margin-right:12px}
#seo-static-content[hidden]{display:none}
</style>`;

const SEO_HIDE_SCRIPT = `<script data-seo-inject="1">
(function(){
  function hide(){
    var el=document.getElementById('seo-static-content');
    if(el) el.setAttribute('hidden','');
  }
  if(document.readyState==='complete') hide();
  else window.addEventListener('load', hide);
})();
</script>`;

function stripPreviousInject(html) {
  return html
    .replace(/<main id="seo-static-content">[\s\S]*?<\/main>/i, '')
    .replace(/<(script|style)[^>]*data-seo-inject="1"[^>]*>[\s\S]*?<\/\1>/gi, '');
}

function injectPage(config) {
  const filePath = path.join(DIST, config.file);
  if (!fs.existsSync(filePath)) {
    console.warn(`[seo-inject] skip missing ${config.file}`);
    return;
  }

  let html = stripPreviousInject(fs.readFileSync(filePath, 'utf8'));
  const title = escapeHtml(config.title);
  const description = escapeHtml(config.description);
  const keywords = escapeHtml(config.keywords);
  const canonical = escapeHtml(config.canonical);
  const ogImage = escapeHtml(OG_IMAGE);
  const isHome = config.file === 'index.html';
  const robots = config.noindex ? 'noindex, nofollow' : 'index, follow';
  const prerender = config.noindex ? { html: '', jsonLd: '' } : buildPrerender(config.file);

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

  const hreflang = [
    `<link rel="alternate" hrefLang="x-default" href="${canonical}"/>`,
    `<link rel="alternate" hrefLang="zh-CN" href="${canonical}"/>`,
  ].join('');

  const headMeta = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}"/>`,
    `<meta name="keywords" content="${keywords}"/>`,
    `<meta name="robots" content="${robots}"/>`,
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
    prerender.jsonLd,
    SEO_STATIC_STYLE,
  ].join('');

  html = html.replace(/<head>/i, `<head>${headMeta}`);

  if (prerender.html) {
    if (/<\/body>/i.test(html)) {
      html = html.replace(/<\/body>/i, `${prerender.html}${SEO_HIDE_SCRIPT}</body>`);
    } else {
      html += prerender.html + SEO_HIDE_SCRIPT;
    }
  }

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`[seo-inject] updated ${config.file}${isHome ? ' (home hub)' : ''}`);
}

if (!fs.existsSync(DIST)) {
  console.error('[seo-inject] dist/ not found. Run expo export --platform web first.');
  process.exit(1);
}

PAGES.forEach(injectPage);
console.log('[seo-inject] done');
