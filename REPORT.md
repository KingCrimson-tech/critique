# Critique — build report

Paste a URL, get a blunt, actionable audit: SEO, performance, accessibility, security,
content, and AI-readability. Free, no tiers, no gating.

---

## Phase 1 — Foundation & design system

The app is a Next.js 15 shell (App Router, JavaScript only — no TypeScript anywhere),
built on Tailwind v4 with a CSS-first token system. The visual language is ink on paper:
a single ink/paper/vermillion palette, hairline dividers instead of cards, radii capped
at 4px, no shadows, no gradients. Typography is Instrument Serif for display, Inter Tight
for body, JetBrains Mono for data and URLs, all wired through `next/font`.

All interactive primitives are owned: Radix provides the behavior (focus management,
keyboard nav, `data-state` attributes), and every component is styled from scratch against
the tokens — buttons, inputs, tabs, accordion, collapsible, dialog, alert-dialog, form,
toast (with a `useToast()` hook), dropdown menu, toggle group, progress, select,
scroll area. Radix data-state transitions run at 120–160ms and respect
`prefers-reduced-motion`. Nothing bounces.

The landing page carries an oversized serif hero, a URL box with a blunt validation toast,
and a seven-row hairline "what we check" list. Header is a thin sticky bar; footer points
at the rubric. Keyboard navigation works end to end; focus rings are vermillion and visible.

The data model is defined for the whole product: users, sites, scans (findings, scores,
pages, PSI all as JSONB on the scan), and share links. Anonymous scans will live without
a `siteId` until claimed on sign-in. The database itself is wired for Postgres/Neon but
nothing reads or writes yet — persistence arrives with auth in Phase 5.

**Verified:** lint and production build clean; landing renders at 360px and 1440px;
all token utilities and fonts confirmed in the compiled CSS output.

## Phase 2 — Crawler + core checks

The scan engine is real. A POST to `/api/scan` takes a URL, normalizes it (scheme
tolerant, https preferred with http fallback so a dead certificate still yields
findings), fetches the homepage, pulls `robots.txt`, discovers sitemaps (robots-declared
first, then the conventional paths, one level of index expansion), and then crawls the
site breadth-first: same-origin only, depth ≤ 2, up to 15 pages, 8-way concurrency, a
per-request minimum interval to stay polite, and a hard 45-second wall clock. Requests
follow redirects by hand so the exact redirect chain is preserved as evidence, bodies are
capped at 2 MB, and each request has its own 8-second timeout. Failures degrade
gracefully — a dead page becomes a logged error, never a dead scan.

Every fetched page is parsed into a full record — title, meta set, canonical, JSON-LD,
headings, paragraphs, images with alt coverage, internal/external link counts,
server-rendered text length — which the checks consume. Six check families run against
the homepage plus sitewide aggregates, each producing findings on a shared shape
(`id`, `category`, `severity`, `title`, `message`, `detail`, `page`):

- **SEO** — title presence/length, meta description, canonical self-reference, noindex
  in meta or `X-Robots-Tag`, single-h1 and heading-level integrity, `lang`, viewport,
  Open Graph and Twitter cards, JSON-LD validity plus Organization/WebSite identity,
  robots.txt, sitemap existence and declaration, duplicate titles/descriptions across
  pages, thin content under 300 words, image alt coverage, redirect chains.
- **Security** — HTTPS, HSTS, CSP, `X-Content-Type-Options`, framing protection,
  referrer policy, permissions policy, mixed content with sample evidence, server
  banner version leaks, and cookie flags (`HttpOnly`/`Secure`/`SameSite`).
- **Content** — Flesch reading ease, near-duplicate page detection via simhash
  (3-word shingles, 64-bit hamming distance), freshness signals
  (`dateModified`/`article:modified_time`/`Last-Modified`), and wall-of-text detection.
- **AI-readability** — robots.txt rules for GPTBot, ClaudeBot, PerplexityBot, CCBot and
  Google-Extended, `llms.txt` presence, whether meaningful text ships in the raw HTML
  versus being JavaScript-only, `noscript` fallbacks, machine-readable identity, author
  byline signals, and paragraph chunkability.
- **UX** — call-to-action presence, form fields without real labels, OG image
  reachability, an above-the-fold text heuristic, and viewport consistency across pages.
- **Stack** — framework/CMS/CDN/analytics detection from headers and HTML signatures
  (Next, Nuxt, SvelteKit, Astro, WordPress, Shopify, Wix, Squarespace, Drupal, Rails,
  Laravel, Django, GA/GTM, Plausible, Meta Pixel, and more). Strictly informational —
  it never affects a score.

A crashing check degrades to an info finding instead of killing the scan. The `/debug`
page drives the engine end to end: scan progress with a live timer, severity counts,
a sortable findings table with evidence IDs, crawled-page and fetch-error listings,
and the raw JSON.

**Verified:** five live scans of real, varied sites — a Next.js marketing site, a
WordPress blog, a Shopify store, a documentation site, and a JS-only SPA — all produce
sane, non-crashing findings well inside the time budget (0.8s–12.6s). Page cap enforced
at 15; stack detection correctly identified Next.js/Vercel, WordPress, and
Shopify/Cloudflare on their respective targets.

## Coming next

- **Phase 3** — scoring rubric, hand-written fix templates per finding, and the report UI
  (oversized score numeral, category rail, severity filters, expandable rows, fix panels
  with HTML/Next/WordPress variants).
- **Phase 4** — PageSpeed Insights + CrUX (keyless), compare mode, public share pages
  with OG images, print stylesheet.
- **Phase 5** — Better Auth, anonymous scan claiming, site history and deltas.
- **Phase 6** — the "Ask the AIs" panel, empty/error/rate-limit states, accessibility
  pass, rubric page, deploy.
