/**
 * Fail the build if required SEO HTML files are missing or still point at homepage.
 * Run after: expo export + inject-seo-meta.js
 */
const fs = require('fs');
const path = require('path');
const { PAGES } = require('../src/seo/pageMeta.cjs');

const DIST = path.join(__dirname, '..', 'dist');
let failed = false;

function fail(msg) {
  console.error(`[seo-verify] ${msg}`);
  failed = true;
}

if (!fs.existsSync(DIST)) {
  fail('dist/ not found');
  process.exit(1);
}

if (!fs.existsSync(path.join(__dirname, '..', 'public', 'og-image.png'))) {
  fail('public/og-image.png missing');
}

for (const page of PAGES) {
  // Expo emits guides.html for /guides; guides/index.html is optional.
  if (page.file === 'guides/index.html') continue;

  const filePath = path.join(DIST, page.file);
  if (!fs.existsSync(filePath)) {
    if (page.noindex) {
      console.warn(`[seo-verify] skip missing noindex ${page.file}`);
      continue;
    }
    fail(`missing ${page.file}`);
    continue;
  }

  const html = fs.readFileSync(filePath, 'utf8');
  if (!html.includes(`rel="canonical" href="${page.canonical}"`)) {
    fail(`${page.file} missing canonical ${page.canonical}`);
  }
  if (!html.includes(`<title>${page.title.replace(/&/g, '&amp;')}` ) && !html.includes(`<title>${page.title}`)) {
    // Titles may be HTML-escaped; soft check via unique keyword fragment.
    const fragment = page.title.slice(0, 12);
    if (!html.includes(fragment)) {
      fail(`${page.file} title looks wrong (expected to include "${fragment}")`);
    }
  }
  if (page.file === 'index.html') {
    if (!html.includes('id="seo-static-content"') || !html.includes('href="/bazi-calculator"')) {
      fail('index.html missing crawlable hub links to /bazi-calculator');
    }
  }
  if (page.file === 'bazi-calculator.html') {
    if (!html.includes('FAQPage') || !html.includes('id="seo-static-content"')) {
      fail('bazi-calculator.html missing prerendered FAQ/body');
    }
  }
  if (html.includes('hreflang="en"') || html.includes('hrefLang="en"')) {
    fail(`${page.file} still has English hreflang on a Chinese URL`);
  }
  // Soft-404 guard: non-home pages must not canonicalize to homepage.
  if (page.file !== 'index.html' && html.includes('rel="canonical" href="https://www.shanhai.app/"')) {
    fail(`${page.file} incorrectly canonicalizes to homepage`);
  }
}

if (failed) {
  console.error('[seo-verify] failed');
  process.exit(1);
}

console.log(`[seo-verify] ok (${PAGES.length} page configs checked)`);
