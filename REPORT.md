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

## Phase 3 — Scoring, fixes, report UI

Every scan now ends in a number and every finding ends in a fix.

**Scoring.** Category scores are pure penalties: start at 100, subtract 25 for a
critical, 12 for a high, 5 for a medium, 2 for a low. Overall score is the weighted
average — SEO .25, Performance .20, Accessibility .15, AI-readability .15, Security .10,
Content .10, UX .05 — with the score version recorded on every scan so future rubric
changes never compare apples to old oranges. Performance and Accessibility score from
PageSpeed lab data in Phase 4; until then they show as pending in the rail and their
weight redistributes across the categories that did run. The overall score carries a
blunt verdict line (five bands from "Ship-ready" to "Structurally broken") instead of
adjectives like "needs improvement".

**Fixes.** Every check id maps to a hand-written fix template: what to do, why it costs
you, and a real snippet — with per-variant tabs (HTML / Next.js / WordPress / nginx /
PHP) wherever the same fix genuinely differs by stack. Security header fixes ship as
both nginx config and `next.config.mjs` headers; sitemap fixes as both `app/sitemap.js`
and a Yoast walkthrough. Code blocks render with Prism syntax highlighting and a
copy-to-clipboard button. Informational findings (stack, crashed checks) deliberately
have no fix — there is nothing to fix.

**Persistence (stopgap).** Scans get stable IDs and are served from an in-process store
capped at the last 50, exposed through `GET /api/scan/[id]` for polling. Reports live at
`/scan/[id]`. The store interface is exactly what Phase 5 swaps to the database —
nothing else changes.

**The report.** `/scan/[id]` opens on an oversized serif score numeral over a thin
progress rule, the verdict, and the scan's vital stats, then three tabs:

- **Overview** — the category rail (one thin rule per category, scored bands colored
  green/amber/vermillion, pending rows shown as an honest dash), the three biggest
  point deductions, and the detected stack.
- **Findings & fixes** — every finding as an expandable row: severity as a mono tag,
  blunt one-liner verdict, evidence URL, raw detail on request, and the fix inline.
  Severity and scope filters (all/sitewide/page) as segmented toggles, plus a ranked
  fix queue in the margin ordered by penalty.
- **Pages** — the crawl itself: status, depth, response time, word count and title per
  page, plus robots/sitemap/error stats.

The landing form is live: submit runs a real scan and routes to the finished report;
errors surface as blunt toasts. The "sample report" link runs a real scan of a small
site instead of faking one.

**Verified:** lint and build clean; full round trips (scan → id → report) against four
live sites including the JS-only SPA; 404 on unknown scan ids; report weight math
spot-checked by hand against the rubric.

## Phase 4 — Performance, compare, share

The report becomes shareable evidence, and the two missing categories in the rail come
to life.

**Lab data.** Every scan now runs the PageSpeed Insights API (keyless, mobile) in
parallel with the crawl — Lighthouse performance and accessibility scores, Core Web
Vitals (LCP, CLS, TBT, FCP, speed index) with threshold-based verdicts, the failing
accessibility audits ranked by weight, and CrUX real-user field data when the URL has
enough traffic. PSI and the crawler answer at different speeds and fail differently, so
the integration is strictly best-effort: a timeout or a refusal means the report says
"did not answer in time" and the category shows a dash — never a zero, never a broken
scan. (In practice the keyless shared quota is frequently exhausted — HTTP 429 — so the
degraded state is the path most visitors will see until a key is added; the UI treats
it as honest absence, not error.) The scoring rubric folds both categories into the
overall when lab data exists and renormalizes when it doesn't; the weighting math is
verified against hand computation.

**Compare mode.** The report's share menu opens a picker of recent scans (up to three
total). The comparison view puts the overall numerals side by side with a champion
call-out ("X leads 4 of 7 categories"), a per-category table with an explicit ▸ winner
marker per row, and a Core Web Vitals table — dashes where PSI was absent, with a note
that nothing was scored zero for it.

**Public share pages.** Share → "Copy public link" creates a permanent-style link at
`/s/[slug]` that renders the full report for a logged-out visitor with no account, plus
a generated 1200×630 OG card (`/api/og/[slug]`) drawn from the scan: the score numeral
in its band color, the verdict line, the target host, and the wordmark. Share metadata
(Open Graph + Twitter card) is wired for embeds.

**Print.** Cmd+P (or Share → Print/Save PDF) produces a clean PDF: site chrome,
filters, and controls drop out, background stays paper-white, rows don't break across
pages.

**Verified:** lint and build clean; end-to-end share flow (link → public page → OG
image render); compare view loads two scans; PSI parser verified against a realistic
fixture including violation filtering and CrUX normalization; scoring hand-checked both
with and without lab data. Known constraint of the Phase 3 stopgap: scan and share
state are process-local, so a server restart clears old ids — persistence is exactly
what Phase 5 replaces with the database.

## Phase 5 — Accounts, persistence, history

Scans stop evaporating and every visitor gets a paper trail — signed in or not.

**Durable persistence.** The Phase 3 in-process stopgap is gone. Postgres runs locally
(Docker), Prisma owns the schema and migrations, and scans, sites, users, sessions, and
share links live in the database. The data model is the Phase 1 sketch made real:
findings, scores, crawled pages, PSI output, and the re-scan diff are all JSONB on the
scan row, with indexes on the anonymous token and `(siteId, createdAt)` for history
queries. Share slugs are unique rows that cascade with their scan — deleting a scan
deletes its public link, not leaves a dangling one.

**Accounts without friction.** Better Auth (Prisma adapter) with magic-link sign-in:
paste your email, get a link, click it, done. There is no email service in this build by
design — the link is printed to the server console and the UI says exactly that instead
of pretending a message was sent. Google sign-in is wired and only renders when
credentials exist in the environment; otherwise the button doesn't exist. Email +
password is deliberately off — this product has no tiers and no reason to hold
passwords. Sign-out clears the session; the auth handler mounts under
`/api/auth/[...all]`, and non-browser requests without an Origin header are rejected
(missing-Origin 403), matching Better Auth's CSRF posture.

**Anonymous scans with claim-on-signup.** A scan run without an account works exactly
as before, but now it's stamped with a signed anonymous cookie (`critique_anon` — a
random token plus an HMAC of it, so tokens can't be forged by guessing). When that
browser signs in, the dashboard claims every anonymous scan the cookie produced: each
site gets a `Site` record and the scans attach to it, idempotently. The dashboard says
"claimed N scans from this browser" when it happens.

**Ownership rules.** A scan is viewable by its owner (via session), by the anonymous
cookie that created it, or by anyone holding a share link — nobody else, and
unauthorized reads return 404, not 403, so scan IDs aren't an oracle for existence.
Sharing enforces the same rule server-side; creating a share link for someone else's
scan is a 403. Share links are one-per-scan (creating twice returns the same slug).

**Your sites + history.** `/sites` lists each site's latest score, critical count, and
last-scan date, with a one-click re-scan. `/sites/[id]` is the site's full scan history:
score, delta vs the previous run, and the finding counts per run. Reports show a delta
strip on re-scans — overall movement, the five biggest category movers, and how many
findings were fixed vs newly introduced — computed from the previous completed scan of
the same site at scan time and stored on the row, so old diffs never shift.

**Verified:** lint and build clean; full anonymous round trip (scan → cookie set →
owner sees report, stranger 404); magic-link sign-in end to end (link printed to the
console, verify → session → redirect); claim-on-signup verified in the database
(scan's `siteId` set, anonymous token cleared, "claimed 1 scan" shown); re-scan
produces a stored diff (+9 overall, 6 fixed / 2 new in the live test) rendered by the
report; share flow verified under the database (slug → public page → OG PNG, stranger
share 403); recent-scans endpoint only returns scans the viewer may see.

## Coming next

- **Phase 6** — the "Ask the AIs" panel, empty/error/rate-limit states, accessibility
  pass, rubric page, deploy.
