import React from 'react';
import Head from 'expo-router/head';
import { SEO_SITE, type SeoMeta } from '../src/seo/site';
import { LANDING_PAGES } from '../src/seo/landingPages';

type Props = SeoMeta & {
  jsonLd?: object | object[];
  noindex?: boolean;
  ogType?: 'website' | 'article';
};

export function SeoHead({
  title,
  description,
  keywords,
  canonical,
  jsonLd,
  noindex = false,
  ogType = 'website',
}: Props) {
  const canonicalUrl = canonical ?? SEO_SITE.url;
  const robots = noindex ? 'noindex, nofollow' : 'index, follow';
  const jsonLdBlocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords ? <meta name="keywords" content={keywords} /> : null}
      <meta name="robots" content={robots} />
      <meta name="author" content={SEO_SITE.name} />
      <meta name="theme-color" content={SEO_SITE.themeColor} />
      <link rel="canonical" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />
      <link rel="alternate" hrefLang="zh-CN" href={canonicalUrl} />
      <link rel="alternate" hrefLang="en" href={canonicalUrl} />

      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SEO_SITE.name} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={SEO_SITE.ogImage} />
      <meta property="og:locale" content={SEO_SITE.locale} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={SEO_SITE.twitterHandle} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={SEO_SITE.ogImage} />

      {jsonLdBlocks.map((block, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </Head>
  );
}

/** App tool routes (/bazi, /zi, /reading) should point at the SEO landing. */
export function LandingSeoHead({ slug }: { slug: string }) {
  const page = LANDING_PAGES[slug];
  if (!page) return null;
  return (
    <SeoHead
      title={page.seo.title}
      description={page.seo.description}
      keywords={page.seo.keywords}
      canonical={page.canonical}
    />
  );
}
