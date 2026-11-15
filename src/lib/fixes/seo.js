// Fix templates for SEO check ids.
// Shape: { what, why, fix: { kind, lang, code } | { variants: { html, next, wordpress } }, docs? }

const title = {
  what: "Write one title tag, 30–65 characters.",
  why: "The title is your headline in search results and the strongest on-page signal you control. Empty or truncated titles waste the only slot where you get to pitch the click.",
  fix: {
    variants: {
      html: {
        lang: "markup",
        code: '<title>Handmade leather bags, made in Portland — Oregonry</title>',
      },
      next: {
        lang: "javascript",
        code: `// app/layout.js or app/page.js
export const metadata = {
  title: "Handmade leather bags, made in Portland — Oregonry",
};`,
      },
      wordpress: {
        lang: "text",
        code: `Install Yoast SEO or Rank Math, then:
1. Open the page in the editor.
2. Expand the SEO panel below the content.
3. Write the title in the "SEO title" field — the snippet preview shows exactly how it truncates.`,
      },
    },
  },
  docs: "https://developers.google.com/search/docs/appearance/title-link",
};

const description = {
  what: "Write a meta description, 70–160 characters.",
  why: "No description means Google stitches one from random page text. You are handing your pitch to an algorithm with no taste.",
  fix: {
    variants: {
      html: {
        lang: "markup",
        code: '<meta name="description" content="Full-grain leather bags cut, stitched, and finished in Portland. Free US shipping, 10-year repair guarantee." />',
      },
      next: {
        lang: "javascript",
        code: `export const metadata = {
  description:
    "Full-grain leather bags cut, stitched, and finished in Portland. Free US shipping, 10-year repair guarantee.",
};`,
      },
      wordpress: {
        lang: "text",
        code: `In the Yoast/Rank Math panel under the editor, write the "Meta description" field. Keep it under 160 characters — the snippet preview cuts it at exactly where Google will.`,
      },
    },
  },
  docs: "https://developers.google.com/search/docs/appearance/snippet",
};

const canonical = {
  what: "Add a self-referencing canonical URL.",
  why: "Query strings, trailing slashes, and tracking params all clone your page. The canonical tells search engines which clone is real.",
  fix: {
    variants: {
      html: {
        lang: "markup",
        code: '<link rel="canonical" href="https://example.com/page" />',
      },
      next: {
        lang: "javascript",
        code: `export const metadata = {
  metadataBase: new URL("https://example.com"),
  alternates: { canonical: "/" }, // resolves against metadataBase
};`,
      },
      wordpress: {
        lang: "text",
        code: `Yoast SEO and Rank Math add self-referencing canonicals automatically once active. Verify: view source on any page and search for rel="canonical". If it points elsewhere, the "Advanced" tab of the SEO panel overrides it.`,
      },
    },
  },
  docs: "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls",
};

const orgSchema = {
  what: "Add Organization or WebSite schema.",
  why: "Structured data is how you claim your name, logo, and links in rich results — and how AI models attribute facts to you instead of whoever ranks above you.",
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
  "logo": "https://example.com/logo.png",
  "sameAs": ["https://github.com/example"]
}
</script>`,
      },
      next: {
        lang: "javascript",
        code: `// app/layout.js
export default function RootLayout({ children }) {
  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Oregonry",
    url: "https://example.com",
    logo: "https://example.com/logo.png",
  };
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(org) }}
        />
        {children}
      </body>
    </html>
  );
}`,
      },
      wordpress: {
        lang: "text",
        code: `Yoast SEO → Settings → Site representation: set Organization (name, logo, social profiles). Yoast emits the Knowledge Graph schema sitewide. Verify at validator.schema.org.`,
      },
    },
  },
  docs: "https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data",
};

const viewport = {
  what: "Add a viewport meta tag.",
  why: "Without it, phones render a 980px zoomed-out canvas. That single missing line is why the site feels broken on mobile — and Google ranks mobile rendering directly.",
  fix: {
    variants: {
      html: {
        lang: "markup",
        code: '<meta name="viewport" content="width=device-width, initial-scale=1" />',
      },
      next: {
        lang: "javascript",
        code: `// app/layout.js
export const viewport = {
  width: "device-width",
  initialScale: 1,
};`,
      },
    },
  },
  docs: "https://web.dev/articles/responsive-design-basics",
};

const robotsTxt = {
  what: "Publish a robots.txt at the root.",
  why: "It is the first file every crawler requests. Missing it means no crawl directives and no sitemap pointer.",
  fix: {
    kind: "config",
    lang: "text",
    code: `User-agent: *
Allow: /

Sitemap: https://example.com/sitemap.xml`,
  },
  docs: "https://developer.mozilla.org/en-US/docs/Web/Robots.txt",
};

const sitemap = {
  what: "Generate an XML sitemap and declare it.",
  why: "A sitemap is the fastest way to get every real URL known and crawled. Without one, discovery is left to luck and links.",
  fix: {
    variants: {
      next: {
        lang: "javascript",
        code: `// app/sitemap.js — generated at /sitemap.xml on every request
import { getAllPageUrls } from "@/lib/pages";

export default async function sitemap() {
  const urls = await getAllPageUrls();
  return urls.map((url) => ({
    url,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));
}`,
      },
      wordpress: {
        lang: "text",
        code: `Yoast SEO → Features → XML sitemaps: enable. Your sitemap lives at /sitemap_index.xml. Declare it in robots.txt:

Sitemap: https://example.com/sitemap_index.xml`,
      },
      html: {
        lang: "markup",
        code: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/</loc></url>
  <url><loc>https://example.com/products</loc></url>
</urlset>`,
      },
    },
  },
  docs: "https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap",
};

const redirectDirect = {
  what: "Redirect once, or not at all.",
  why: "Every hop taxes the visitor and burns crawl budget. Link the entry URL straight to where it actually lives.",
  fix: {
    variants: {
      nginx: {
        lang: "nginx",
        code: `# collapse http → https → www into one hop
server {
  listen 80;
  server_name example.com;
  return 301 https://example.com$request_uri;
}

server {
  listen 443 ssl;
  server_name www.example.com;
  return 301 https://example.com$request_uri;
}`,
      },
      next: {
        lang: "javascript",
        code: `// next.config.mjs
const nextConfig = {
  async redirects() {
    return [
      { source: "/old-page", destination: "/new-page", permanent: true },
    ];
  },
};`,
      },
    },
  },
  docs: "https://developers.google.com/search/docs/crawling-indexing/301-redirects",
};

const altText = {
  what: "Describe every meaningful image with alt text.",
  why: "Alt text is what screen readers announce and what image search indexes. Decorative images get alt=\"\" — that is a feature, not a gap.",
  fix: {
    kind: "snippet",
    lang: "markup",
    code: `<!-- meaningful: describe what it shows -->
<img src="/tote-brass.jpg" alt="Brown leather tote with brass clasp and interior pocket" />

<!-- decorative: say nothing, explicitly -->
<img src="/divider.svg" alt="" />`,
  },
  docs: "https://www.w3.org/WAI/tutorials/images/",
};

const h1 = {
  what: "Exactly one h1, used as the page headline.",
  why: "The h1 is what both screen readers and search engines read first. Zero h1s leave the page headless; several fight over the same slot.",
  fix: {
    kind: "snippet",
    lang: "markup",
    code: `<h1>Handmade leather bags, made in Portland</h1>

<h2>Materials</h2>
<!-- h2s for sections; never skip levels (h1 → h3) -->`,
  },
  docs: "https://www.w3.org/WAI/tutorials/page-structure/headings/",
};

const lang = {
  what: 'Declare the language on <html>.',
  why: "Screen readers pick pronunciation from it and search engines read it as a market signal.",
  fix: {
    variants: {
      html: { lang: "markup", code: '<html lang="en">' },
      next: {
        lang: "javascript",
        code: `// app/layout.js
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}`,
      },
      wordpress: {
        lang: "text",
        code: `Settings → General → Site Language. WordPress prints the correct lang attribute from that setting — no template edit needed.`,
      },
    },
  },
  docs: "https://www.w3.org/International/questions/qa-html-language-declarations",
};

const og = {
  what: "Ship complete Open Graph and Twitter card tags.",
  why: "These tags decide how your link looks everywhere it is shared. An og:image is the cheapest attention you will ever buy.",
  fix: {
    variants: {
      html: {
        lang: "markup",
        code: `<meta property="og:type" content="website" />
<meta property="og:title" content="Handmade leather bags, made in Portland" />
<meta property="og:description" content="Full-grain leather, 10-year repair guarantee." />
<meta property="og:image" content="https://example.com/og-card.png" />
<meta property="og:url" content="https://example.com" />
<meta name="twitter:card" content="summary_large_image" />`,
      },
      next: {
        lang: "javascript",
        code: `export const metadata = {
  openGraph: {
    title: "Handmade leather bags, made in Portland",
    description: "Full-grain leather, 10-year repair guarantee.",
    images: [{ url: "/og-card.png", width: 1200, height: 630 }],
    url: "https://example.com",
  },
  twitter: { card: "summary_large_image" },
};`,
      },
      wordpress: {
        lang: "text",
        code: `Yoast SEO → Settings → Social: fill the site defaults, then set the social image per page in the SEO panel's Social tab. Og image size: 1200×630.`,
      },
    },
  },
  docs: "https://ogp.me/",
};

const FIXES = {
  "seo.title.missing": title,
  "seo.title.length": title,
  "seo.description.missing": description,
  "seo.description.length": description,
  "seo.canonical.missing": canonical,
  "seo.canonical.self": {
    ...canonical,
    what: "Point the canonical at this page, or accept the redirect target as real.",
  },
  "seo.robots.noindex": {
    what: "Remove the noindex from the homepage.",
    why: "You are ordering every search engine to forget this page exists. Unless this is staging, it is self-inflicted invisibility.",
    fix: {
      variants: {
        html: { lang: "markup", code: '<meta name="robots" content="index, follow">' },
        next: {
          lang: "javascript",
          code: `export const metadata = {
  robots: { index: true, follow: true },
};`,
        },
        wordpress: {
          lang: "text",
          code: `Check two places:
1. Settings → Reading → uncheck "Discourage search engines from indexing this site".
2. Yoast/Rank Math: the page's SEO panel → Advanced → "Allow search engines to index".`,
        },
      },
    },
    docs: "https://developers.google.com/search/docs/crawling-indexing/block-indexing",
  },
  "seo.h1.missing": h1,
  "seo.h1.multiple": h1,
  "seo.headings.skip": {
    what: "Keep heading levels sequential.",
    why: "A skipped level (h1 → h4) reads like chapters missing pages. Assistive tech builds the page outline from headings — gaps break navigation.",
    fix: h1.fix,
    docs: h1.docs,
  },
  "seo.lang.missing": lang,
  "seo.viewport.missing": viewport,
  "seo.og.missing": og,
  "seo.twitter.missing": og,
  "seo.jsonld.missing": orgSchema,
  "seo.jsonld.org": orgSchema,
  "seo.jsonld.invalid": {
    what: "Fix the broken JSON-LD block.",
    why: "Broken structured data is worse than none — you are publishing errors and calling it markup. Paste the block into validator.schema.org and read the error.",
    fix: {
      kind: "snippet",
      lang: "markup",
      code: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Example",
  "url": "https://example.com"
}
</script>
<!-- must be valid JSON: no trailing commas, no unescaped quotes -->`,
    },
    docs: "https://validator.schema.org/",
  },
  "seo.robots.missing": robotsTxt,
  "seo.sitemap.missing": sitemap,
  "seo.sitemap.robots": {
    what: "Declare the sitemap in robots.txt.",
    why: "The sitemap exists but crawlers have to guess where. One line ends the guessing.",
    fix: {
      kind: "config",
      lang: "text",
      code: `# robots.txt — add:
Sitemap: https://example.com/sitemap.xml`,
    },
    docs: "https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap",
  },
  "seo.dup.titles": {
    what: "Give every page its own title.",
    why: "Identical titles make pages compete with each other; engines pick one and bury the rest. Differentiate by what each page is actually for.",
    fix: {
      kind: "text",
      lang: "text",
      code: `Pattern that works:
{Page topic} — {differentiator} | {Brand}

e.g.
Leather totes — everyday carry | Oregonry
Leather totes — work bags | Oregonry
Leather care guide | Oregonry`,
    },
    docs: title.docs,
  },
  "seo.dup.descriptions": {
    what: "Write one description per page.",
    why: "Same pitch on different pages tells search engines the pages are interchangeable. It also tells readers nothing.",
    fix: {
      kind: "text",
      lang: "text",
      code: `One sentence per page that only that page could earn:
- what the page covers,
- who it is for,
- the one action available there.`,
    },
    docs: description.docs,
  },
  "seo.thin.content": {
    what: "Merge or flesh out every page under 300 words.",
    why: "Thin pages rank for nothing and drag the whole domain down with them. A page exists to answer a question — if it cannot, it should not exist.",
    fix: {
      kind: "text",
      lang: "text",
      code: `Three options, in order of preference:
1. Merge: fold the thin page into a related page, 301 the old URL there.
2. Write: add the sections a visitor would actually need (spec, comparison, FAQ).
3. Noindex: keep the page out of the index if it must exist for UX reasons.`,
    },
    docs: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
  },
  "seo.image.alt": altText,
  "seo.redirect.chain": redirectDirect,
  "seo.redirect.single": redirectDirect,
};

export default FIXES;
