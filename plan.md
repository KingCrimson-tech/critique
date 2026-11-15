# Critique — Build Plan

Paste a URL, get a blunt, actionable audit of the site: SEO, performance, accessibility, security, content, and AI-readability. Every finding comes with a concrete fix.

## Constraints (locked)

- Free, no tiers, no gating.
- Single Next.js app on Vercel + Neon Postgres. No queue, no worker, no object storage, no email.
- JavaScript only. Use `.js` and `.jsx` files; do not introduce TypeScript, type annotations, or TypeScript config.
- Crawl runs synchronously in one route handler. Cap ~15 pages, concurrent fetches, 60s budget.
- Plain `fetch` + `cheerio` for crawling. No headless browser.
- Perf + a11y numbers come from the PageSpeed Insights API (free, runs Lighthouse for us).
- UI built from **Radix Primitives**, styled by us. No shadcn defaults, no template look.
- One anonymous scan allowed; sign in to save/history.

## Design direction (anti-slop)

**Concept:** an editorial review, not a SaaS dashboard. Ink on paper, hard rules, big numbers, dense data, no decoration.

- **Type:** display `Instrument Serif` (headlines, score numerals), body `Inter Tight`, data/URLs/mono `JetBrains Mono`.
- **Palette:** ink `#0B0B0C`, paper `#F4F1EA`, accent `#D93A1F` (vermillion), severity amber `#B26A00`, pass green `#1E6B4E`. Two colors per screen, max.
- **Layout:** 12-col grid, 1px hairline dividers instead of floating cards, radius 0–4px, no shadows, no gradients, no glass, no purple, no emoji.
- **Score:** oversized numeral (80–120px serif) with a thin progress rule beneath — not a gauge, not a donut.
- **Findings:** table rows that expand in place (Radix `Accordion` inside a row layout), severity rendered as a mono tag, never as a pastel pill.
- **Motion:** only Radix `data-state` transitions, 120–160ms. Nothing bounces.
- **Microcopy:** blunt. "Your homepage ships 1.4 MB of JavaScript. That's why it feels slow." No hedge words.

**Radix usage map**

| Surface | Primitives |
|---|---|
| URL input + scan form | `Form`, `Tooltip`, `Toast` |
| Report tabs (Overview / Pages / Fixes) | `Tabs`, `ScrollArea` |
| Finding rows | `Accordion`, `Collapsible` |
| Severity filters | `ToggleGroup`, `Select` |
| Fix code blocks | `Tabs` (HTML/Next/WordPress), `Tooltip` copy |
| Compare picker | `Dialog`, `Popover` |
| Share/export menu | `DropdownMenu`, `Dialog` |
| AI panel | `Dialog`, `Progress`, `Badge`-less custom tags |
| Auth | `Dialog` (magic link), `Label`, `Form` |
| Global feedback | `Toast`, `AlertDialog` (destructive only) |

## Project layout

```
critique/
  src/
    app/
      page.jsx                  landing + URL box
      scan/[id]/page.jsx        report
      s/[slug]/page.jsx         public share view
      login/page.jsx
      api/scan/route.js         POST: crawl + analyze
      api/scan/[id]/route.js    GET: poll status/result
      api/ai-probe/route.js     POST: on-demand LLM panel
    lib/
      crawler.js                fetch, robots, sitemap, concurrency, caps
      stack-detect.js           headers + HTML signatures
      score.js                  rubric + penalties
      fixes/                    fix templates keyed by check id
      checks/
        seo.js
        security.js
        content.js
        ai-readability.js
        ux.js
      psi.js                    PageSpeed Insights + CrUX
      ai.js                     prompt set, providers, caching
      auth.js
      db.js
    components/
      ui/                       Radix-based primitives (owned by us, JSX)
      report/                   score header, finding row, category rail (JSX)
    styles/tokens.css           palette, type scale, spacing
  prisma/schema.prisma
  plan.md
```

## Data model

- `User` — id, email, createdAt
- `Site` — id, userId, origin, createdAt
- `Scan` — id, siteId?, url, status (`queued|running|done|failed`), scoreVersion, scores JSONB, findings JSONB, pages JSONB, psi JSONB, error, createdAt
- `ShareLink` — slug, scanId, createdAt
- Anonymous scans: `siteId = null`, linked to a signed cookie token; claimed on login.

Findings are stored as one JSONB array — no per-finding table until it's actually needed.

## Check set (v1)

**SEO** — title present/length, meta description, canonical (self-referencing), robots meta + `X-Robots-Tag`, single h1 + no skipped levels, `lang`, viewport, Open Graph + Twitter card, JSON-LD parses and has required fields, sitemap.xml exists + referenced in robots.txt, robots.txt exists, duplicate titles/descriptions across crawled pages, thin content (<300 words), image alt coverage, redirect chains.

**Security** — HTTPS + certificate validity, HSTS, CSP, `X-Content-Type-Options`, frame protection, `Referrer-Policy`, `Permissions-Policy`, mixed content, server banner leak, cookie flags.

**Content** — Flesch readability, word count, near-duplicate pages (simhash), freshness signal (`dateModified` / `Last-Modified`), heading structure quality.

**AI-readability** — robots rules for `GPTBot`, `ClaudeBot`, `PerplexityBot`, `CCBot`, `Google-Extended`; `llms.txt`; text present in raw HTML (not JS-only); server-rendered body vs `noscript`; `Organization`/`WebSite` schema; author byline; paragraph/length chunkability.

**UX** — CTA presence, form labels, OG image reachable, above-fold content heuristic, mobile viewport consistency.

**Performance & a11y** — PSI on the homepage: performance score, LCP, CLS, TBT, plus Lighthouse accessibility violations. Field data from CrUX when available.

**Stack** — header/HTML signature detection (framework, CMS, CDN, analytics). Informational only, never scored.

## Scoring

`category = max(0, 100 − Σ severity penalty)` with critical 25, high 12, medium 5, low 2.
Overall weights: SEO .25 · Perf .20 · A11y .15 · AI .15 · Security .10 · Content .10 · UX .05.
`scoreVersion` is stored on every scan; trends only compare identical versions.

## Fix templates

Every check id maps to `{ what, why, fix: { kind: 'snippet'|'config'|'text', lang, code }, docs }`.
Deterministic, no LLM in this path. Ranked by `impact / effort`. Code blocks render with real syntax highlighting and per-variant tabs (HTML / Next.js / WordPress).

---

# Phases

Whilst building, after the completion of one phase stop and provide a report of what is built, provide a commit message and ask questions if needed.

## Phase 1 — Foundation & design system

**Goal:** an empty but unmistakably non-generic shell.

- Scaffold Next.js 15 (App Router, JavaScript, Tailwind v4), Prisma, `@radix-ui/*` primitives. Keep the project JavaScript-only and omit `tsconfig.json`.
- `styles/tokens.css`: palette, type scale, spacing, hairline rules. Fonts via `next/font`.
- Build owned primitives in `components/ui/`: Button, Input, Tabs, Accordion, Tooltip, Toast, Dialog, DropdownMenu, ToggleGroup, Progress, Select.
- Landing page: oversized serif headline, one-line promise, URL input + scan button, a "what we check" hairline list, sample report link.
- Layout: sticky thin header, no nav clutter, footer with rubric link.

**Done when:** landing renders on Vercel-preview, looks intentional at 360px and 1440px, keyboard-navigable, zero default-Radix visual leakage.

## Phase 2 — Crawler + core checks

**Goal:** real findings from a real URL, no UI polish yet.

- `crawler.js`: normalize URL → fetch robots.txt → sitemap discovery → BFS up to 15 same-origin URLs, depth ≤ 2, per-domain delay, 8-way concurrency, hard 45s wall clock.
- `checks/`: SEO, security, content, AI-readability, UX, stack detection. Each is `(page, ctx) => Finding[]`, registered in one array.
- `POST /api/scan` returns the findings JSON; add a temporary `/debug` page to inspect.

**Done when:** scanning 5 varied real sites (a Next.js app, a WordPress blog, a Shopify store, a docs site, a JS-only SPA) produces sane, non-crashing findings within the time budget.

## Phase 3 — Scoring, fixes, report UI

**Goal:** the product looks like the product.

- `score.js` + rubric config, `scoreVersion`.
- `fixes/` templates for every check id (snippets written by hand, reviewed for accuracy).
- Report page: huge score numeral, thin per-category rail, severity filter, sitewide vs page-level split, expandable finding rows, fix panel with variant tabs and copy.
- Blunt copy pass over every finding message.

**Done when:** a full report is readable in under 30 seconds, every finding has a fix, and the page holds up with 40+ findings without becoming noise.

## Phase 4 — Performance, compare, share

**Goal:** the report becomes shareable evidence.

- `psi.js`: PageSpeed Insights + CrUX, 3s-timeout tolerant; degrade gracefully when it fails (show "unavailable", not a 0).
- Compare mode: 2–3 scan ids → side-by-side verdict (Dialog picker + comparison view).
- Public share pages `/s/[slug]` with a dedicated OG image generated from the score.
- Print stylesheet for Cmd+P PDF.

**Done when:** share link renders for a logged-out visitor, compare shows an explicit winner per category, PSI failure never breaks a scan.

## Phase 5 — Auth, persistence, history

**Goal:** accounts, saved sites, re-scan.

- Better Auth (magic link + Google), login dialog.
- Anonymous scan cookie, claim-on-signup.
- Site list with last score + delta, scan history, manual re-scan that diffs against the previous scan.
- Ownership checks on every read.

**Done when:** an anonymous scan survives sign-in, history shows a correct delta, and no user can read another's scan.

## Phase 6 — AI panel, polish, launch

**Goal:** the differentiator and the finish.

- "Ask the AIs": on-demand fixed prompt set ("best X for Y", "is {brand} legit", "compare {brand} vs {competitor}"), 2 providers, results cached 72h, renders mentions / sentiment / cited URLs. Rate-limited, clearly labelled as a snapshot.
- Empty, loading, error, and rate-limit states for every surface. Skeleton = hairlines, not shimmer.
- Accessibility pass: axe clean on all own pages, focus rings visible, reduced-motion respected.
- Rubric page documenting what each check means and why it's weighted that way.
- Deploy to Vercel + Neon, environment vars, `robots.txt` for the app itself.

**Done when:** a stranger can go from URL to shared report without an account, and the site scores well on its own rubric.

---

## Verification per phase

`pnpm lint` · `pnpm build` · manual keyboard pass · mobile 360px pass · scan 2 real sites · check Vercel logs for runtime errors.
