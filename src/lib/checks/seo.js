import { finding } from "./util";

// SEO checks. `page` is the homepage; sitewide aggregates come from ctx.pages.

function jsonLdTypes(node, out = []) {
  if (!node || typeof node !== "object") return out;
  if (Array.isArray(node)) {
    node.forEach((child) => jsonLdTypes(child, out));
    return out;
  }
  if (node["@type"]) (Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]]).forEach((t) => out.push(String(t)));
  Object.values(node).forEach((value) => {
    if (value && typeof value === "object") jsonLdTypes(value, out);
  });
  return out;
}

function validJsonLd(page) {
  const parsed = [];
  let invalid = 0;
  for (const node of page.meta.jsonLd) {
    if (node && node.__invalid) invalid += 1;
    else parsed.push(node);
  }
  return { parsed, invalid, types: jsonLdTypes(parsed) };
}

export function seoCheck(page, ctx) {
  const out = [];
  const $ = page.$ ?? null;
  const meta = page.meta;

  // -- title --------------------------------------------------------
  const title = page.title;
  if (!title)
    out.push(
      finding({
        id: "seo.title.missing",
        category: "seo",
        severity: "critical",
        title: "No title tag",
        message:
          "The browser tab is blank and so is your headline in search results. You left the strongest on-page signal unset.",
        page: page.finalUrl,
      }),
    );
  else if (title.length < 30 || title.length > 65)
    out.push(
      finding({
        id: "seo.title.length",
        category: "seo",
        severity: "medium",
        title: `Title is ${title.length} characters`,
        message:
          title.length < 30
            ? `A ${title.length}-character title wastes the headline space you were handed. Aim for 30–65 characters and say what the page actually is.`
            : `At ${title.length} characters the tail gets cut off in results. Aim for 30–65 characters.`,
        detail: { title },
        page: page.finalUrl,
      }),
    );

  // -- meta description ---------------------------------------------
  const description = meta.metaDescription;
  if (!description)
    out.push(
      finding({
        id: "seo.description.missing",
        category: "seo",
        severity: "high",
        title: "No meta description",
        message:
          "Google will stitch one from random page text instead. You are handing your pitch to an algorithm with no taste.",
        page: page.finalUrl,
      }),
    );
  else if (description.length < 70 || description.length > 160)
    out.push(
      finding({
        id: "seo.description.length",
        category: "seo",
        severity: "low",
        title: `Description is ${description.length} characters`,
        message: "Keep it between 70 and 160 characters. Shorter sells nothing; longer gets truncated.",
        detail: { description },
        page: page.finalUrl,
      }),
    );

  // -- canonical ----------------------------------------------------
  if (!meta.canonical)
    out.push(
      finding({
        id: "seo.canonical.missing",
        category: "seo",
        severity: "medium",
        title: "No canonical URL",
        message:
          "Query strings and trailing slashes now create duplicate versions of your page. Pick one URL and tell search engines about it.",
        page: page.finalUrl,
      }),
    );
  else {
    const canonicalUrl = new URL(meta.canonical, page.finalUrl).toString();
    const selfUrl = page.finalUrl.split("?")[0];
    const canonicalClean = canonicalUrl.split("?")[0];
    if (canonicalClean !== selfUrl && canonicalClean !== page.finalUrl)
      out.push(
        finding({
          id: "seo.canonical.self",
          category: "seo",
          severity: "medium",
          title: "Canonical points elsewhere",
          message: `The page canonicalizes to ${canonicalClean}. If that is intentional, fine — if it is a copy-paste from staging, you just deindexed yourself.`,
          detail: { canonical: canonicalUrl },
          page: page.finalUrl,
        }),
      );
  }

  // -- robots meta / X-Robots-Tag -----------------------------------
  const robotsMeta = (meta.robotsMeta ?? "").toLowerCase();
  const xRobots = (page.headers["x-robots-tag"] ?? "").toLowerCase();
  const noindex = /noindex/.test(robotsMeta) || /noindex/.test(xRobots);
  if (noindex)
    out.push(
      finding({
        id: "seo.robots.noindex",
        category: "seo",
        severity: "critical",
        title: "Homepage is noindex",
        message:
          "You are telling every search engine to forget this page exists. Unless this is staging, remove it.",
        detail: { robotsMeta, xRobotsTag: xRobots || null },
        page: page.finalUrl,
      }),
    );

  // -- headings -----------------------------------------------------
  const h1s = page.headings.filter((h) => h.level === 1);
  if (h1s.length === 0)
    out.push(
      finding({
        id: "seo.h1.missing",
        category: "seo",
        severity: "high",
        title: "No h1",
        message: "The page has no headline that says what it is. Search engines and screen readers both start looking there.",
        page: page.finalUrl,
      }),
    );
  else if (h1s.length > 1)
    out.push(
      finding({
        id: "seo.h1.multiple",
        category: "seo",
        severity: "medium",
        title: `${h1s.length} h1 elements`,
        message: "One page, one headline. Split the rest into h2s or delete them.",
        detail: { h1s: h1s.map((h) => h.text) },
        page: page.finalUrl,
      }),
    );
  {
    let last = 0;
    let skipped = 0;
    for (const heading of page.headings) {
      if (heading.level - last > 1) skipped += 1;
      last = Math.max(last, heading.level);
    }
    if (skipped > 0)
      out.push(
        finding({
          id: "seo.headings.skip",
          category: "seo",
          severity: "low",
          title: `Heading levels skip a step (${skipped}×)`,
          message: "h2 jumps straight to h4 somewhere. The outline reads like chapters missing pages.",
          page: page.finalUrl,
        }),
      );
  }

  // -- lang ---------------------------------------------------------
  if (!meta.lang)
    out.push(
      finding({
        id: "seo.lang.missing",
        category: "seo",
        severity: "medium",
        title: "No lang attribute",
        message:
          'The <html> tag does not declare a language. Screen readers guess pronunciation and search engines guess your market.',
        page: page.finalUrl,
      }),
    );

  // -- viewport -----------------------------------------------------
  if (!meta.viewport)
    out.push(
      finding({
        id: "seo.viewport.missing",
        category: "seo",
        severity: "high",
        title: "No viewport meta",
        message:
          "Mobile browsers assume a 980px canvas and zoom out. Your site is not mobile-ready by default, and Google ranks it accordingly.",
        page: page.finalUrl,
      }),
    );

  // -- Open Graph / Twitter -----------------------------------------
  if (!meta.ogTitle || !meta.ogImage)
    out.push(
      finding({
        id: "seo.og.missing",
        category: "seo",
        severity: "medium",
        title: "Open Graph incomplete",
        message: !meta.ogTitle && !meta.ogImage
          ? "No og:title and no og:image. Every link you share renders as a bare URL."
          : !meta.ogTitle
            ? "No og:title. Shared links get a random headline or none."
            : "No og:image. Shared links get no preview picture — the cheapest attention you will ever buy.",
        detail: { ogTitle: meta.ogTitle, ogImage: meta.ogImage },
        page: page.finalUrl,
      }),
    );
  if (!meta.twitterCard)
    out.push(
      finding({
        id: "seo.twitter.missing",
        category: "seo",
        severity: "low",
        title: "No Twitter card",
        message: 'Add meta[name="twitter:card"]. Without it, X formats your link however it feels.',
        page: page.finalUrl,
      }),
    );

  // -- structured data ----------------------------------------------
  {
    const { parsed, invalid, types } = validJsonLd(page);
    if (invalid > 0)
      out.push(
        finding({
          id: "seo.jsonld.invalid",
          category: "seo",
          severity: "medium",
          title: `${invalid} JSON-LD block${invalid > 1 ? "s" : ""} do not parse`,
          message: "Broken structured data is worse than none — you are publishing errors and calling it markup.",
          page: page.finalUrl,
        }),
      );
    if (parsed.length === 0)
      out.push(
        finding({
          id: "seo.jsonld.missing",
          category: "seo",
          severity: "medium",
          title: "No structured data",
          message:
            "No JSON-LD anywhere. Rich results, breadcrumbs, and knowledge panels are all gated behind it.",
          page: page.finalUrl,
        }),
      );
    else if (!types.some((t) => /organization|website|localbusiness|store|person/i.test(t)))
      out.push(
        finding({
          id: "seo.jsonld.org",
          category: "seo",
          severity: "medium",
          title: "No Organization/WebSite schema",
          message: `Structured data exists (${types.slice(0, 5).join(", ")}) but nothing says who runs this site. Add Organization or WebSite schema.`,
          page: page.finalUrl,
        }),
      );
  }

  // -- robots.txt / sitemap -----------------------------------------
  if (ctx.robotsStatus !== 200 || !ctx.robots)
    out.push(
      finding({
        id: "seo.robots.missing",
        category: "seo",
        severity: "medium",
        title: "No robots.txt",
        message:
          "There is no robots.txt at the root. Crawlers default to full access, but you also lose the sitemap pointer and crawl directives.",
        page: page.finalUrl,
      }),
    );
  if (ctx.sitemapUrls.length === 0)
    out.push(
      finding({
        id: "seo.sitemap.missing",
        category: "seo",
        severity: "high",
        title: "No sitemap found",
        message:
          "Nothing at /sitemap.xml, no sitemap index, nothing declared in robots.txt. Discovery of your deeper pages is left to luck.",
        page: page.finalUrl,
      }),
    );
  else if (ctx.robots && !ctx.robots.sitemaps.length)
    out.push(
      finding({
        id: "seo.sitemap.robots",
        category: "seo",
        severity: "low",
        title: "Sitemap not declared in robots.txt",
        message: "The sitemap exists but robots.txt does not point at it. Add the Sitemap: line.",
        page: page.finalUrl,
      }),
    );

  // -- sitewide: duplicate titles / descriptions ---------------------
  {
    const byTitle = new Map();
    const byDescription = new Map();
    for (const p of ctx.pages) {
      if (p.title) (byTitle.get(p.title) ?? byTitle.set(p.title, []).get(p.title)).push(p.finalUrl);
      const d = p.meta.metaDescription;
      if (d) (byDescription.get(d) ?? byDescription.set(d, []).get(d)).push(p.finalUrl);
    }
    const dupTitles = [...byTitle.values()].filter((urls) => urls.length > 1);
    if (dupTitles.length)
      out.push(
        finding({
          id: "seo.dup.titles",
          category: "seo",
          severity: "medium",
          title: `${dupTitles.length} duplicate title${dupTitles.length > 1 ? "s" : ""} across pages`,
          message:
            "Several pages fight over the same headline, so search engines pick one and bury the rest. Differentiate them.",
          detail: { groups: dupTitles.slice(0, 3).map((urls) => urls.slice(0, 4)) },
        }),
      );
    const dupDescriptions = [...byDescription.values()].filter((urls) => urls.length > 1);
    if (dupDescriptions.length)
      out.push(
        finding({
          id: "seo.dup.descriptions",
          category: "seo",
          severity: "low",
          title: `${dupDescriptions.length} duplicated meta description${dupDescriptions.length > 1 ? "s" : ""}`,
          message: "Same pitch on different pages. Write one per page or ship none and let it be generated.",
          detail: { groups: dupDescriptions.slice(0, 3).map((urls) => urls.slice(0, 4)) },
        }),
      );
  }

  // -- sitewide: thin content ---------------------------------------
  {
    const thin = ctx.pages.filter((p) => p.wordCount < 300);
    if (thin.length)
      out.push(
        finding({
          id: "seo.thin.content",
          category: "seo",
          severity: thin.some((p) => p.depth === 0) ? "high" : "medium",
          title: `${thin.length} page${thin.length > 1 ? "s" : ""} under 300 words`,
          message:
            "Thin pages rank for nothing and drag the domain down with them. Merge them into something worth reading or noindex them.",
          detail: { pages: thin.slice(0, 5).map((p) => ({ url: p.finalUrl, words: p.wordCount })) },
        }),
      );
  }

  // -- sitewide: image alt coverage ---------------------------------
  {
    const totals = ctx.pages.reduce(
      (acc, p) => ({ total: acc.total + p.images.total, noAlt: acc.noAlt + p.images.noAlt }),
      { total: 0, noAlt: 0 },
    );
    if (totals.total > 0 && totals.noAlt > 0) {
      const ratio = totals.noAlt / totals.total;
      out.push(
        finding({
          id: "seo.image.alt",
          category: "seo",
          severity: ratio >= 0.2 ? "medium" : "low",
          title: `${totals.noAlt} of ${totals.total} images missing alt text`,
          message:
            ratio >= 0.2
              ? "One in five images ships with no description. Screen reader users hit silence; image search hits nothing."
              : `${totals.noAlt} image${totals.noAlt > 1 ? "s" : ""} lack alt text. Fix them — it is the cheapest accessibility win on the page.`,
          detail: { total: totals.total, missing: totals.noAlt },
        }),
      );
    }
  }

  // -- redirect chains ----------------------------------------------
  if (page.chain.length > 2)
    out.push(
      finding({
        id: "seo.redirect.chain",
        category: "seo",
        severity: "medium",
        title: `Homepage redirects ${page.chain.length - 1} times`,
        message:
          "Every visitor pays for the hops and every crawler subtracts crawl budget. Point the entry URL directly at its destination.",
        detail: { chain: page.chain.map((hop) => `${hop.status} ${hop.url}`) },
        page: page.finalUrl,
      }),
    );
  else if (page.redirected)
    out.push(
      finding({
        id: "seo.redirect.single",
        category: "seo",
        severity: "low",
        title: "Homepage redirects once",
        message: `The entry URL lands on ${page.finalUrl} via a ${page.chain[0].status}. Link straight to the destination.`,
        detail: { chain: page.chain.map((hop) => `${hop.status} ${hop.url}`) },
        page: page.finalUrl,
      }),
    );

  // -- AI crawler rules live in checks/ai-readability.js -------------

  return out;
}
