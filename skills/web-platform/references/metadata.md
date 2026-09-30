# Metadata, SEO, and Social Sharing Basics

The minimum correct `<head>` for every page, how the tags must agree, and what never to invent.

## Contents
- Priority order
- Head template
- Titles and descriptions
- Canonical, robots, and indexing
- Open Graph and Twitter/X cards
- Icons, manifest, theme color
- Structured data (JSON-LD)
- Locales and alternates
- Framework notes
- Verification
- Rules

## Priority order

1. **Correctness and duplication**: one metadata source per page; no duplicate `<title>`, description, canonical, or robots tags.
2. **Title and description** on every page.
3. **Canonical and indexing** match intent (staging/preview never indexed).
4. **Social cards** render correctly.
5. **Icons, manifest, theme color.**
6. **Structured data** that mirrors visible content.
7. **Locale alternates** only where localized pages exist.

## Head template

```html
<!doctype html>
<html lang="en" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Invoices · Ledgerly</title>
  <meta name="description" content="Create, send, and track invoices in 40 currencies. Free for up to 5 clients.">
  <link rel="canonical" href="https://ledgerly.example/invoices">

  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Ledgerly">
  <meta property="og:title" content="Invoices · Ledgerly">
  <meta property="og:description" content="Create, send, and track invoices in 40 currencies.">
  <meta property="og:url" content="https://ledgerly.example/invoices">
  <meta property="og:image" content="https://ledgerly.example/og/invoices.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Ledgerly invoice editor showing a draft invoice">
  <meta name="twitter:card" content="summary_large_image">

  <link rel="icon" href="/favicon.ico" sizes="32x32">
  <link rel="icon" href="/icon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/manifest.webmanifest">
  <meta name="color-scheme" content="light dark">
  <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff">
  <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#111111">
</head>
```

(Ledgerly and its copy are placeholder examples.) Never add `maximum-scale=1` or `user-scalable=no` to the viewport.

## Titles and descriptions

- Unique per page; a consistent pattern (`Page · Site` or `Page | Site`), most specific part first.
- Short enough to read in a tab and a result snippet (roughly under ~60 characters shows fully in most results; it is a guideline, not a rule).
- SPAs update `document.title` on every route change (also WCAG 2.4.2).
- Descriptions: plain text, one or two sentences that describe the page; not keyword lists, not markdown.
- Escape user-generated or dynamic values.

## Canonical, robots, and indexing

- `rel="canonical"` points to the preferred absolute URL (strip tracking parameters; choose one of trailing slash or not).
- `og:url` equals the canonical.
- `noindex` for staging, preview deployments, internal search results, and private pages; do it with `<meta name="robots" content="noindex">` or an `X-Robots-Tag` header. Blocking in `robots.txt` alone does not remove already-known URLs from the index.
- Paginated lists: each page canonicalizes to itself, not to page 1.
- Provide `sitemap.xml` for sites with many pages; reference it from `robots.txt`.
- Custom 404 page with navigation and a real 404 status code.

## Open Graph and Twitter/X cards

- Required on shareable pages: `og:title`, `og:description`, `og:image` (absolute HTTPS URL), `og:url`, `og:type` (`website` or `article`).
- Image: 1200×630 is the common large-card size (1.91:1); keep key content away from edges; include `og:image:alt`. Keep file size modest (a few hundred KB) so crawlers fetch it.
- `twitter:card="summary_large_image"` by default; X falls back to OG tags for title, description, and image.
- Dynamic OG images (per article or product) can be generated at build or request time (e.g. Satori-based renderers); cache them.
- Test on a real public URL; crawlers cannot fetch localhost, and platforms cache previews (use their debug/refresh tools).

## Icons, manifest, theme color

- Minimum: `favicon.ico` (32×32) or an SVG icon, plus `apple-touch-icon` (180×180 PNG, no transparency).
- SVG favicons can include a `prefers-color-scheme` media query so they stay visible on dark tabs.
- Web app manifest when the site is installable: `name`, `short_name`, `icons` (192 and 512, plus a maskable variant), `start_url`, `display`, `theme_color`, `background_color`.
- `theme-color` intentionally set per color scheme so browser chrome matches the page.

## Structured data (JSON-LD)

- Add only types that match visible content: `Organization`, `WebSite`, `BreadcrumbList`, `Article`, `Product` (with real price and availability), `FAQPage` only if the FAQ is on the page, `SoftwareApplication`.
- **Never invent** ratings, review counts, prices, awards, or organization details; structured data must reflect what is rendered.
- One JSON-LD block per page unless several types genuinely apply; validate with a structured-data testing tool.

```html
<script type="application/ld+json">
{ "@context": "https://schema.org", "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Docs", "item": "https://example.com/docs" },
    { "@type": "ListItem", "position": 2, "name": "Billing", "item": "https://example.com/docs/billing" } ] }
</script>
```

## Locales and alternates

- `<html lang>` always; `og:locale` when localized.
- `hreflang` alternates (`<link rel="alternate" hreflang="de" href="…">` plus `x-default`) only when the localized page exists; every locale lists all alternates including itself.
- Each localized page canonicalizes to itself, not to the default language.

## Framework notes

- **Next.js App Router**: `export const metadata` / `generateMetadata` per route; `metadataBase` so relative OG URLs resolve to absolute; file conventions (`opengraph-image`, `icon`, `apple-icon`, `sitemap`, `robots`).
- **Astro / SvelteKit / Nuxt**: a single `<Head>`/`<svelte:head>`/`useHead` component with defaults and per-page overrides.
- **SPA without SSR**: crawlers and social scrapers may not run JS; prerender or server-render metadata for shareable routes.
- Follow the project's existing pattern; do not introduce a second metadata system.

## Verification

- [ ] View source (not DevTools DOM) shows one title, description, canonical, and full OG set.
- [ ] Share-preview debuggers render the card from the production URL.
- [ ] Staging/preview responses carry `noindex`.
- [ ] Structured data validates and matches on-page content.
- [ ] Favicon visible on light and dark browser tabs.

## Rules

### Keep title, description, canonical, and og:url in agreement
**Rule.** All four describe the same page at the same preferred URL.
**Apply when.** Creating routes, templates, or redirects.
**Do / Avoid.** Do derive them from one route-level source. Avoid a layout default title plus a page title both emitted.
**Why.** Conflicting signals split ranking and produce wrong share previews; duplicates are the most common metadata defect.

### Never fabricate structured data
**Rule.** Only mark up facts visible on the page.
**Apply when.** Adding JSON-LD or rich-result markup.
**Do / Avoid.** Do mark up a real product price shown on the page. Avoid `aggregateRating` with invented numbers.
**Why.** It misleads users and search engines and violates search-engine policies (ethics floor: no fake social proof).

## Sources

- ibelick ui-skills `fixing-metadata`: https://github.com/ibelick/ui-skills
- Open Graph protocol: https://ogp.me/
- Google Search Central, canonicalization and robots meta: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- Google Search Central, structured data guidelines: https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- X (Twitter) cards markup: https://developer.x.com/en/docs/x-for-websites/cards/overview/markup
- web.dev, Add a web app manifest: https://web.dev/articles/add-manifest
- Next.js Metadata API: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
