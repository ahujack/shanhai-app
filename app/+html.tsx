import { ScrollViewStyleReset } from 'expo-router/html';
import { HOME_SEO, SEO_SITE, buildOrganizationJsonLd, buildSoftwareApplicationJsonLd, buildWebSiteJsonLd } from '../src/seo/site';

// This file is web-only and configures the root HTML shell for static rendering.
export default function Root({ children }: { children: React.ReactNode }) {
  const organizationJsonLd = JSON.stringify(buildOrganizationJsonLd());
  const websiteJsonLd = JSON.stringify(buildWebSiteJsonLd());
  const softwareJsonLd = JSON.stringify(buildSoftwareApplicationJsonLd());

  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <title>{HOME_SEO.title}</title>
        <meta name="description" content={HOME_SEO.description} />
        <meta name="keywords" content={HOME_SEO.keywords} />
        <meta name="robots" content="index, follow" />
        <meta name="author" content={SEO_SITE.name} />
        <meta name="theme-color" content={SEO_SITE.themeColor} />
        <link rel="canonical" href={HOME_SEO.canonical} />
        {/* Only self-referencing hreflang on the homepage shell.
            Landing pages get per-route alternates via inject-seo-meta.js.
            Do NOT point every language tag at the homepage from all routes. */}
        <link rel="alternate" hrefLang="x-default" href={HOME_SEO.canonical} />
        <link rel="alternate" hrefLang="zh-CN" href={HOME_SEO.canonical} />

        <meta property="og:site_name" content={SEO_SITE.name} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={HOME_SEO.canonical} />
        <meta property="og:title" content={HOME_SEO.title} />
        <meta property="og:description" content={HOME_SEO.description} />
        <meta property="og:image" content={SEO_SITE.ogImage} />
        <meta property="og:locale" content={SEO_SITE.locale} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content={SEO_SITE.twitterHandle} />
        <meta name="twitter:title" content={HOME_SEO.title} />
        <meta name="twitter:description" content={HOME_SEO.description} />
        <meta name="twitter:image" content={SEO_SITE.ogImage} />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: organizationJsonLd }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: websiteJsonLd }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: softwareJsonLd }} />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, viewport-fit=cover"
        />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body {
  background-color: #fff;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #000;
  }
}`;
