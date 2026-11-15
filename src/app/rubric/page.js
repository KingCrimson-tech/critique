import Link from "next/link";

export const metadata = {
  title: "The rubric",
  description:
    "How Critique scores a website: penalty weights, category weights, and what every check means.",
};

const PENALTIES = [
  ["critical", 25, "Broken or harmful. No index, no HTTPS, unreadable pages."],
  ["high", 12, "Actively costing you traffic, users, or trust."],
  ["medium", 5, "Real friction, cheap to fix."],
  ["low", 2, "Polish. Worth a quiet afternoon."],
];

const CATEGORIES = [
  {
    key: "SEO",
    weight: "0.25",
    why: "Search is still how strangers arrive. It is the heaviest category because SEO failures compound silently: nothing breaks today, everything shrinks tomorrow.",
    checks: [
      ["seo.title.missing / length", "A title tag that exists and fits the result page."],
      ["seo.description.missing / length", "Meta description presence and sane length."],
      ["seo.canonical.missing / self", "Canonical declared and pointing at itself, not a stranger."],
      ["seo.robots.noindex / missing", "robots.txt exists and is not telling bots to go away."],
      ["seo.sitemap.missing / robots", "Sitemap exists and robots.txt declares it."],
      ["seo.h1.missing / multiple / headings.skip", "One h1, and heading levels that don't skip."],
      ["seo.lang.missing / viewport.missing", "Language declared, viewport meta present."],
      ["seo.og.missing / twitter.missing", "Share cards for social and chat clients."],
      ["seo.jsonld.invalid / missing / org", "Structured data that parses and names the organization."],
      ["seo.dup.titles / descriptions", "Unique titles and descriptions across crawled pages."],
      ["seo.thin.content", "Pages with under 300 words of server-rendered text."],
      ["seo.image.alt", "Alt coverage on images across the crawl."],
      ["seo.redirect.chain / single", "Short redirect chains; hops are cheap but not free."],
    ],
  },
  {
    key: "Performance",
    weight: "0.20",
    why: "Measured, not vibes: the PageSpeed Insights lab score on mobile. Without lab data the category is honestly pending — the weight redistributes instead of inventing a number.",
    checks: [
      ["PSI performance score", "Lighthouse performance, mobile, keyless quota permitting."],
      ["Core Web Vitals", "LCP, CLS, TBT, FCP, speed index with threshold verdicts."],
      ["CrUX field data", "Real-user data when the URL has enough traffic."],
    ],
  },
  {
    key: "Accessibility",
    weight: "0.15",
    why: "A site that screen readers cannot parse excludes people, and increasingly excludes search too. Scored from Lighthouse's accessibility audit; pending without lab data.",
    checks: [
      ["PSI accessibility score", "Lighthouse accessibility audit, ranked violations in the report."],
    ],
  },
  {
    key: "AI readability",
    weight: "0.15",
    why: "Assistant-era discoverability: if the machines cannot quote you, the people who ask machines will never hear of you. Equal weight to accessibility because it is the same audience shift, one decade apart.",
    checks: [
      ["ai.robots.missing / blocked / named", "robots.txt rules for GPTBot, ClaudeBot, PerplexityBot, CCBot, Google-Extended."],
      ["ai.llms.txt.missing", "llms.txt presence — the polite front door for assistants."],
      ["ai.text.js-only", "Meaningful text must exist in the raw HTML, not only after hydration."],
      ["ai.noscript.missing", "A fallback for when JavaScript never runs."],
      ["ai.schema.identity", "Machine-readable identity: who runs this site."],
      ["ai.author.missing", "Byline signals — who wrote this."],
      ["ai.chunking.walls", "Paragraphs that can be quoted in chunks, not concrete slabs."],
    ],
  },
  {
    key: "Security",
    weight: "0.10",
    why: "Lower weight than SEO because most failures are configuration, not architecture — but every one of them is a public announcement.",
    checks: [
      ["security.https.missing", "HTTPS. Non-negotiable."],
      ["security.hsts.missing", "HSTS: once is not enough, the browser must remember."],
      ["security.csp.missing", "Content Security Policy."],
      ["security.xcto.missing", "X-Content-Type-Options: nosniff."],
      ["security.framing.missing", "Frame protection against clickjacking."],
      ["security.referrer.missing / permissions.missing", "Referrer policy and permissions policy."],
      ["security.mixed.content", "HTTP assets on an HTTPS page."],
      ["security.banner.leak", "Server banners announcing exact versions."],
      ["security.cookie.flags", "HttpOnly, Secure, SameSite on cookies."],
    ],
  },
  {
    key: "Content",
    weight: "0.10",
    why: "Publishable is not readable. Ten percent because it is the hardest to fix from a checklist — but walls of text are measurable.",
    checks: [
      ["content.readability.low / dense", "Flesch reading ease."],
      ["content.near.duplicate", "Near-duplicate pages via simhash."],
      ["content.freshness.missing", "No freshness signal anywhere."],
      ["content.structure.wall", "Wall-of-text detection."],
    ],
  },
  {
    key: "UX",
    weight: "0.05",
    why: "The smallest weight because it is the most subjective — yet a missing call to action or an unlabeled form field is worth more than zero.",
    checks: [
      ["ux.cta.missing", "Some visible call to action above the fold."],
      ["ux.form.labels", "Form fields with real labels."],
      ["ux.og.image.broken", "The OG image actually resolves."],
      ["ux.abovefold.js", "Something readable above the fold without JavaScript."],
      ["ux.viewport.inconsistent", "Viewport consistency across pages."],
    ],
  },
];

function verdictBand(overall) {
  if (overall >= 90) return "Ship-ready.";
  if (overall >= 80) return "Solid, with leaks.";
  if (overall >= 60) return "Passable, and leaking.";
  if (overall >= 40) return "This is costing you visitors.";
  return "Structurally broken.";
}

export default function RubricPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-12 sm:px-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink/55">
        The rubric · scoreVersion v1
      </p>
      <h1 className="mt-3 font-display text-display tracking-tight">
        Scores are penalties, not vibes.
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-ink/70">
        Every category starts at 100 and loses points for each finding. No category
        starts below zero, no finding is unnamed, and no score changes retroactively —
        every scan records its rubric version, so a trend never compares old math to
        new math.
      </p>

      <section className="mt-10">
        <h2 className="font-display text-headline tracking-tight">The penalties</h2>
        <ul className="mt-4">
          {PENALTIES.map(([severity, points, line]) => (
            <li
              key={severity}
              className="grid grid-cols-[7rem_4rem_1fr] items-baseline gap-4 border-t border-hairline py-3 last:border-b"
            >
              <span className="font-mono text-[11px] uppercase tracking-widest text-ink/70">
                {severity}
              </span>
              <span className="font-display text-[22px] leading-none text-vermillion">
                −{points}
              </span>
              <span className="text-[13.5px] leading-relaxed text-ink/65">{line}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[13px] text-ink/55">
          Informational findings (stack detection) carry zero penalty and never touch a score.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-headline tracking-tight">The weights</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink/70">
          The overall score is the weighted average. When Performance or Accessibility
          has no lab data, their weight redistributes to the categories that did run —
          a missing measurement is never a zero.
        </p>
        {CATEGORIES.map((category) => (
          <div key={category.key} className="mt-8 border-t border-hairline pt-5 first:border-t-0 first:pt-0">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-display text-[22px] tracking-tight">{category.key}</h3>
              <span className="font-mono text-data text-vermillion">{category.weight}</span>
            </div>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink/65">{category.why}</p>
            <ul className="mt-3 flex flex-col">
              {category.checks.map(([id, line]) => (
                <li key={id} className="grid grid-cols-1 gap-0.5 border-b border-hairline py-2 last:border-b-0 sm:grid-cols-[16rem_1fr] sm:gap-4">
                  <span className="font-mono text-[11px] leading-relaxed text-ink/50">{id}</span>
                  <span className="text-[13px] leading-relaxed text-ink/70">{line}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-headline tracking-tight">The verdicts</h2>
        <ul className="mt-4">
          {[95, 85, 65, 45, 20].map((n) => (
            <li key={n} className="grid grid-cols-[4rem_1fr] items-baseline gap-4 border-t border-hairline py-3 last:border-b">
              <span className="font-display text-[22px] leading-none">{n}</span>
              <span className="text-[13.5px] text-ink/70">{verdictBand(n)}</span>
            </li>
          ))}
        </ul>
      </section>

      <Link
        href="/"
        className="mt-12 inline-block font-mono text-data text-ink underline decoration-hairline-strong underline-offset-4 transition-colors hover:text-vermillion"
      >
        Run the audit →
      </Link>
    </div>
  );
}
