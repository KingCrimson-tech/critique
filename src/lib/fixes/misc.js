// Fix templates for content + AI-readability + UX check ids.

const readability = {
  what: "Bring the copy down to plain-English range.",
  why: "Visitors skim; they do not read. Dense, long-sentence prose loses them mid-scroll — and loses rankings, because engines model readability too.",
  fix: {
    kind: "text",
    lang: "text",
    code: `Rewrite rules that actually move the score:
- One idea per sentence. Target under 20 words average.
- Swap latinate verbs: "utilize" → "use", "facilitate" → "help".
- One paragraph, one point, 2–4 sentences.
- Read it aloud. Where you breathe, put a period.`,
  },
  docs: "https://www.plainlanguage.gov/guidelines/",
};

const freshness = {
  what: "Publish a visible update date.",
  why: "Readers and ranking systems both look for a signal that the page is alive. Without one, everything looks abandoned.",
  fix: {
    variants: {
      html: {
        lang: "markup",
        code: `<meta property="article:modified_time" content="2026-11-15T09:00:00Z" />

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "datePublished": "2026-06-01",
  "dateModified": "2026-11-15"
}
</script>`,
      },
      wordpress: {
        lang: "text",
        code: `WordPress emits article:modified_time automatically on posts with Yoast active. Make sure the theme displays "Updated: November 2026" near the byline — visible dates also update in search snippets.`,
      },
    },
  },
  docs: "https://developers.google.com/search/docs/appearance/structured-data/article",
};

const structure = {
  what: "Break the wall with subheadings.",
  why: "Readers scan first and read second. Without h2s there is nothing to scan, so most visitors never start.",
  fix: {
    kind: "snippet",
    lang: "markup",
    code: `Rule of thumb: one h2 per 200–300 words.

<h2>Materials</h2>
<p>…</p>

<h2>Care</h2>
<p>…</p>

<!-- mirror the scan of the page: if a section answers a distinct question, it earns an h2 -->`,
  },
  docs: "https://www.w3.org/WAI/tutorials/page-structure/headings/",
};

const dedupe = {
  what: "Merge the copies into one page.",
  why: "Near-duplicate pages compete with each other; engines pick one winner and ignore the rest. Consolidate and redirect — one strong page beats three thin ones.",
  fix: {
    kind: "text",
    lang: "text",
    code: `1. Pick the strongest version (most links, best rank).
2. Fold the unique bits of the others into it.
3. 301 redirect the old URLs to the survivor.
4. Drop them from the sitemap.`,
  },
  docs: "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls",
};

const robotsAi = {
  what: "Decide your AI crawler policy in robots.txt.",
  why: "These named rules control whether your content appears in AI answers. Blocking by accident is the worst of both worlds — invisible to models, invisible by mistake.",
  fix: {
    kind: "config",
    lang: "text",
    code: `# robots.txt — allow the major AI crawlers
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: CCBot
Allow: /

User-agent: Google-Extended
Allow: /

# to block instead, use Disallow: / on each block`,
  },
  docs: "https://developer.mozilla.org/en-US/docs/Web/Robots.txt",
};

const llmsTxt = {
  what: "Publish an llms.txt.",
  why: "A plain-text pointer file that tells models what is worth reading on your site. It is one static file and adoption is growing fast.",
  fix: {
    kind: "config",
    lang: "text",
    code: `# /llms.txt — markdown, served from the root

# Oregonry
> Handmade full-grain leather bags, cut and stitched in Portland.

## Products
- [Totes](https://example.com/totes): everyday-carry leather totes.
- [Work bags](https://example.com/work-bags): padded, fits a 16" laptop.

## Support
- [Repairs](https://example.com/repairs): free 10-year repair guarantee.
- [Shipping](https://example.com/shipping): free in the US.`,
  },
  docs: "https://llmstxt.org/",
};

const serverRender = {
  what: "Put real text in the raw HTML.",
  why: "A model (or a crawler without a renderer) that fetches your page gets an empty shell. Server-rendering is not a framework debate — it decides whether machines can read you at all.",
  fix: {
    variants: {
      next: {
        lang: "javascript",
        code: `// Server Components render on the server by default.
// The usual offender is data fetched client-side in useEffect.
// Move it up:

export default async function Page() {
  const data = await getData(); // runs on the server
  return <main>{data.summary}</main>;
}`,
      },
      html: {
        lang: "markup",
        code: `<!-- test: view-source of your page. If the copy is missing,
the content only exists after JS executes. -->

<!-- prerender as a fallback (build-time snapshot): -->
<!-- npx react-snap  |  npx prerenderer  -->
<script src="/prerendered-homepage.html" hidden></script>`,
      },
    },
  },
  docs: "https://web.dev/articles/rendering-on-the-web",
};

const noscript = {
  what: "Give <noscript> real content.",
  why: "Right now there is JavaScript but nothing behind it. Anything that refuses to execute your code — or a visitor on a locked-down browser — gets a blank page.",
  fix: {
    kind: "snippet",
    lang: "markup",
    code: `<noscript>
  <h1>Handmade leather bags, made in Portland</h1>
  <p>Browse the collection, or call us at (503) 555-0100.</p>
</noscript>`,
  },
  docs: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/noscript",
};

const authorship = {
  what: "Sign the content.",
  why: "Attribution is part of how models and readers decide which sources are quotable. An unsigned page has no one to hold accountable.",
  fix: {
    kind: "snippet",
    lang: "markup",
    code: `<meta name="author" content="June Park" />

<!-- and show it on the page: -->
<p class="byline">By June Park · <time datetime="2026-11-15">Nov 15, 2026</time></p>`,
  },
  docs: "https://developers.google.com/search/docs/appearance/structured-data/article",
};

const chunking = {
  what: "Break paragraphs into quotable chunks.",
  why: "Models and readers both work in chunks. Anything that cannot be quoted cleanly in two sentences will not be quoted at all.",
  fix: {
    kind: "text",
    lang: "text",
    code: `- Target 2–4 sentences (200–400 characters) per paragraph.
- One claim per paragraph — it makes the claim quotable.
- Lists beat run-ons for anything enumerable.`,
  },
  docs: readability.docs,
};

const labels = {
  what: "Label every form field.",
  why: "A placeholder is not a label — it vanishes on first keystroke. Screen readers announce an unlabeled field as just 'edit text'.",
  fix: {
    kind: "snippet",
    lang: "markup",
    code: `<label for="email">Email</label>
<input id="email" name="email" type="email" />

<!-- inline labels: wrap the field -->
<label>
  Email
  <input name="email" type="email" />
</label>

<!-- icon-only fields still need an accessible name -->
<input type="search" aria-label="Search" />`,
  },
  docs: "https://www.w3.org/WAI/tutorials/forms/labels/",
};

const cta = {
  what: "Give the page one obvious action.",
  why: "Visitors do not infer next steps; they click them. If nothing says 'do this', most do nothing — or leave.",
  fix: {
    kind: "snippet",
    lang: "markup",
    code: `<!-- verb-first, one primary action above the fold -->
<a class="cta" href="/start">Run the free audit</a>

<!-- supporting action, visually secondary -->
<a href="/sample-report">See a sample report</a>`,
  },
  docs: "https://www.nngroup.com/articles/call-to-action-buttons/",
};

const ogImageFix = {
  what: "Fix the OG image URL.",
  why: "Every shared link currently falls back to a blank preview. The image is the cheapest attention you will ever buy — it just has to actually load.",
  fix: {
    kind: "text",
    lang: "text",
    code: `Checklist:
- URL is absolute (https://…), not relative.
- Opens in a browser incognito window — no auth wall, no 404.
- 1200×630px, < 1 MB, PNG or JPG.
- After fixing, invalidate the platform cache (Facebook Sharing Debugger, X Card Validator).`,
  },
  docs: "https://developer.twitter.com/en/docs/twitter-for-websites/cards/guides/troubleshooting-cards",
};

const viewportConsistency = {
  what: "Use one viewport declaration everywhere.",
  why: "Pages disagree about how to render on a phone, so pinch-zoom behavior changes as you navigate. One line, applied globally, ends it.",
  fix: {
    variants: {
      html: {
        lang: "markup",
        code: '<meta name="viewport" content="width=device-width, initial-scale=1" />',
      },
      next: {
        lang: "javascript",
        code: `// app/layout.js — one export covers every route
export const viewport = {
  width: "device-width",
  initialScale: 1,
};`,
      },
    },
  },
  docs: "https://web.dev/articles/responsive-design-basics",
};

const FIXES = {
  "content.readability.low": readability,
  "content.readability.dense": readability,
  "content.near.duplicate": dedupe,
  "content.freshness.missing": freshness,
  "content.structure.wall": structure,
  "ai.robots.missing": robotsAi,
  "ai.robots.blocked": robotsAi,
  "ai.robots.named": robotsAi,
  "ai.llms.txt.missing": llmsTxt,
  "ai.text.js-only": serverRender,
  "ai.noscript.missing": noscript,
  "ai.schema.identity": {
    what: "Add Organization/WebSite schema.",
    why: "Nothing in the structured data says who runs this site. Identity schema is how models attribute facts to you instead of whoever ranks above you.",
    fix: {
      variants: {
        html: {
          lang: "markup",
          code: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Oregonry",
  "url": "https://example.com",
  "logo": "https://example.com/logo.png"
}
</script>`,
        },
      },
    },
  },
  "ai.author.missing": authorship,
  "ai.chunking.walls": chunking,
  "ux.cta.missing": cta,
  "ux.form.labels": labels,
  "ux.og.image.broken": ogImageFix,
  "ux.abovefold.js": {
    what: "Server-render the first screen.",
    why: "The first 40 KB of HTML carry almost no text, so a slow connection shows a blank page while your bundle loads.",
    fix: serverRender.fix,
    docs: serverRender.docs,
  },
  "ux.viewport.inconsistent": viewportConsistency,
};

export default FIXES;
