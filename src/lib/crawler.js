import * as cheerio from "cheerio";

// ------------------------------------------------------------------
// Crawler caps. A scan is synchronous and cheap: max 15 pages,
// depth ≤ 2, 8-way concurrency, hard 45s wall clock.
// ------------------------------------------------------------------
export const CAPS = {
  pages: 15,
  depth: 2,
  concurrency: 8,
  wallMs: 45_000,
  requestTimeoutMs: 8_000,
  domainDelayMs: 250,
  bodyBytes: 2_000_000,
  robotsBytes: 512_000,
  redirects: 5,
};

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 CritiqueAudit/1.0";

const SKIP_EXT =
  /\.(jpg|jpeg|png|gif|webp|avif|svg|ico|css|js|mjs|json|xml|txt|pdf|zip|gz|mp3|mp4|webm|woff2?|ttf|eot|docx?|xlsx?|pptx?|rss)(\?|$)/i;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function normalizeUrl(input) {
  if (!input || (typeof input !== "string" && !(input instanceof URL)))
    throw new Error("No URL supplied.");
  let value = String(input).trim();
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("That is not a URL.");
  }
  if (!/^https?:$/.test(parsed.protocol) || !parsed.hostname.includes("."))
    throw new Error("That is not a URL.");
  parsed.hash = "";
  return parsed;
}

function lowerHeaders(res) {
  const headers = {};
  for (const [key, value] of res.headers.entries()) headers[key.toLowerCase()] = value;
  return headers;
}

function setCookies(res) {
  try {
    return res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  } catch {
    return [];
  }
}

async function readBody(res, cap) {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: false });
  let bytes = 0;
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.length;
    text += decoder.decode(value, { stream: true });
    if (bytes >= cap) {
      reader.cancel().catch(() => {});
      break;
    }
  }
  return text + decoder.decode();
}

async function fetchWithTimeout(url, { method = "GET", timeoutMs = CAPS.requestTimeoutMs } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method,
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "user-agent": UA,
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

// Follow redirects by hand so the exact chain is preserved for checks.
export async function fetchPage(url, { timeoutMs } = {}) {
  const started = Date.now();
  let current = String(url);
  const chain = [];
  let res;
  for (let hops = 0; ; hops++) {
    res = await fetchWithTimeout(current, { timeoutMs });
    chain.push({ url: current, status: res.status });
    const location = res.headers.get("location");
    const isRedirect = [301, 302, 303, 307, 308].includes(res.status);
    if (isRedirect && location && hops < CAPS.redirects) {
      current = new URL(location, current).toString();
      continue;
    }
    break;
  }
  const body = await readBody(res, CAPS.bodyBytes);
  return {
    requestedUrl: String(url),
    finalUrl: current,
    status: res.status,
    ok: res.status >= 200 && res.status < 300,
    redirected: chain.length > 1,
    chain,
    ms: Date.now() - started,
    headers: lowerHeaders(res),
    setCookies: setCookies(res),
    body,
  };
}

export async function fetchText(url, { cap = CAPS.robotsBytes, timeoutMs = 6_000 } = {}) {
  const res = await fetchWithTimeout(url, { timeoutMs });
  const body = await readBody(res, cap);
  return {
    url: String(url),
    finalUrl: res.headers.get("location") ? new URL(res.headers.get("location"), url).toString() : String(url),
    status: res.status,
    ok: res.status >= 200 && res.status < 300,
    headers: lowerHeaders(res),
    body,
  };
}

// ------------------------------------------------------------------
// robots.txt
// ------------------------------------------------------------------
export function parseRobots(text) {
  const groups = [];
  const sitemaps = [];
  let current = null;
  const newGroup = () => {
    current = { agents: [], allow: [], disallow: [], crawlDelay: null };
    groups.push(current);
  };
  for (let line of text.split(/\r?\n/)) {
    line = line.replace(/#.*$/, "").trim();
    const match = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!match) continue;
    const key = match[1].toLowerCase();
    const value = match[2].trim();
    if (key === "user-agent") {
      if (!current || (current.agents.length && (current.allow.length || current.disallow.length)))
        newGroup();
      current.agents.push(value.toLowerCase());
    } else if (key === "allow" || key === "disallow") {
      if (!current) continue;
      (key === "allow" ? current.allow : current.disallow).push(value);
    } else if (key === "crawl-delay") {
      if (current) current.crawlDelay = parseFloat(value) || null;
    } else if (key === "sitemap") {
      if (/^https?:\/\//i.test(value)) sitemaps.push(value);
    }
  }
  return { groups, sitemaps };
}

function ruleMatches(rule, path) {
  if (rule === "") return false; // empty directive means "no restriction"
  if (rule === "/") return true;
  const anchored = rule.endsWith("$");
  const pattern = rule
    .replace(/\$$/, "")
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  return new RegExp(`^${pattern}${anchored ? "$" : ""}`).test(path);
}

function pickGroups(robots, agent) {
  const exact = robots.groups.filter((g) => g.agents.includes(agent.toLowerCase()));
  if (exact.length) return exact;
  return robots.groups.filter((g) => g.agents.includes("*"));
}

// Longest matching rule wins; allow wins ties.
export function robotsAllows(robots, agent, url) {
  if (!robots) return true;
  const groups = pickGroups(robots, agent);
  if (!groups.length) return true;
  const u = new URL(url);
  const path = u.pathname + (u.search || "");
  let best = null;
  for (const group of groups) {
    const rules = [
      ...group.allow.map((value) => ["allow", value]),
      ...group.disallow.map((value) => ["disallow", value]),
    ];
    for (const [kind, rule] of rules) {
      if (!ruleMatches(rule, path)) continue;
      if (
        !best ||
        rule.length > best[1].length ||
        (rule.length === best[1].length && kind === "allow" && best[0] !== "allow")
      )
        best = [kind, rule];
    }
  }
  return !best || best[0] === "allow";
}

// ------------------------------------------------------------------
// Sitemaps: robots-declared first, then the conventional paths.
// One level of sitemap-index expansion.
// ------------------------------------------------------------------
async function collectSitemapUrls(robots, origin) {
  const queue = [...(robots?.sitemaps ?? []), `${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`].slice(0, 5);
  const seen = new Set();
  const urls = [];
  let childBudget = 3;
  while (queue.length && urls.length < 200) {
    const sitemapUrl = queue.shift();
    if (seen.has(sitemapUrl)) continue;
    seen.add(sitemapUrl);
    let xml;
    try {
      const res = await fetchText(sitemapUrl);
      if (!res.ok) continue;
      xml = res.body;
    } catch {
      continue;
    }
    if (!/<(urlset|sitemapindex)/i.test(xml)) continue;
    const $ = cheerio.load(xml, { xmlMode: true });
    if ($("sitemap").length) {
      $("sitemap > loc").each((_, el) => {
        const loc = $(el).text().trim();
        if (loc && childBudget-- > 0) queue.push(loc);
      });
    } else {
      $("url > loc").each((_, el) => {
        const loc = $(el).text().trim();
        if (loc) urls.push(loc);
      });
    }
  }
  return urls;
}

// ------------------------------------------------------------------
// Page fetch + parse. The DOM ($) stays in memory for checks;
// a serializable summary is what ever gets persisted.
// ------------------------------------------------------------------
async function fetchAndParse(url, depth) {
  const fetched = await fetchPage(url);
  if (fetched.status >= 400) {
    const error = new Error(`HTTP ${fetched.status}`);
    error.status = fetched.status;
    throw error;
  }
  const contentType = fetched.headers["content-type"] ?? "";
  if (contentType && !/text\/html|application\/xhtml/i.test(contentType)) {
    const error = new Error(`Not HTML (${contentType.split(";")[0]})`);
    error.status = fetched.status;
    throw error;
  }

  const $ = cheerio.load(fetched.body);
  $("script, style, template, svg").remove();
  const bodyText = ($("body").text() || "").replace(/\s+/g, " ").trim();

  const headings = [];
  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    const level = Number(el.tagName?.[1]);
    headings.push({ level, text: $(el).text().replace(/\s+/g, " ").trim().slice(0, 200) });
  });

  let images = { total: 0, noAlt: 0 };
  {
    const $full = cheerio.load(fetched.body);
    const imgs = $full("img");
    images.total = imgs.length;
    imgs.each((_, el) => {
      const alt = $full(el).attr("alt");
      if (alt === undefined || alt.trim() === "") images.noAlt += 1;
    });
  }

  let links = { internal: 0, external: 0 };
  {
    const $full = cheerio.load(fetched.body);
    const origin = new URL(fetched.finalUrl).origin;
    $full("a[href]").each((_, el) => {
      const href = $full(el).attr("href");
      if (!href || href.startsWith("#") || /^(mailto|tel|javascript):/i.test(href)) return;
      try {
        const resolved = new URL(href, fetched.finalUrl);
        if (SKIP_EXT.test(resolved.pathname)) return;
        if (resolved.origin === origin) links.internal += 1;
        else links.external += 1;
      } catch {
        /* malformed href */
      }
    });
  }

  const paragraphs = [];
  $("p").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text) paragraphs.push(text);
  });

  return {
    url: String(url),
    finalUrl: fetched.finalUrl,
    status: fetched.status,
    ok: fetched.ok,
    redirected: fetched.redirected,
    chain: fetched.chain,
    ms: fetched.ms,
    depth,
    headers: fetched.headers,
    setCookies: fetched.setCookies,
    html: fetched.body,
    htmlBytes: fetched.body.length,
    rawTextLength: bodyText.length,
    text: bodyText,
    wordCount: bodyText ? bodyText.split(/\s+/).length : 0,
    title: (cheerio.load(fetched.body)("head title").first().text() || "").trim(),
    paragraphs,
    headings,
    images,
    links,
    $: cheerio.load(fetched.body), // in-memory DOM for checks; never serialized
  };
}

function parseMeta(fetchedBody) {
  const $ = cheerio.load(fetchedBody);
  const meta = (sel) => $(sel).first().attr("content")?.trim() || null;
  const jsonLdRaw = [];
  $('script[type="application/ld+json"]').each((_, el) => jsonLdRaw.push($(el).contents().text()));
  const jsonLd = jsonLdRaw.map((raw) => {
    try {
      return JSON.parse(raw);
    } catch {
      return { __invalid: true };
    }
  });
  return {
    metaDescription: meta('meta[name="description"]'),
    robotsMeta: meta('meta[name="robots"]'),
    viewport: meta('meta[name="viewport"]'),
    author: meta('meta[name="author"]') || meta('meta[property="article:author"]'),
    ogTitle: meta('meta[property="og:title"]'),
    ogImage: meta('meta[property="og:image"]') || meta('meta[name="twitter:image"]'),
    twitterCard: meta('meta[name="twitter:card"]'),
    canonical: $('link[rel="canonical"]').first().attr("href") || null,
    lang: $("html").attr("lang") || null,
    noscriptLength: $("noscript").text().replace(/\s+/g, " ").trim().length,
    jsonLd,
  };
}

// Attach meta to a parsed page (kept separate so parse stays readable).
function withMeta(page) {
  return { ...page, meta: parseMeta(page.html) };
}

// ------------------------------------------------------------------
// The scan. Normalize → homepage → robots.txt → sitemaps → BFS.
// ------------------------------------------------------------------
export async function crawl(inputUrl) {
  const startedAt = Date.now();
  const target = normalizeUrl(inputUrl);
  const errors = [];

  // 1. Homepage — try https, fall back to http so a dead cert still yields findings.
  let homepage;
  try {
    homepage = await fetchAndParse(target.toString(), 0);
  } catch (error) {
    try {
      const httpUrl = new URL(target.toString());
      httpUrl.protocol = "http:";
      homepage = await fetchAndParse(httpUrl.toString(), 0);
    } catch {
      return {
        homepage: null,
        pages: [],
        origin: target.origin,
        robots: null,
        robotsRaw: null,
        robotsStatus: 0,
        sitemapUrls: [],
        llmsTxt: null,
        ogImage: null,
        errors: [{ url: target.toString(), message: error.message }],
        stats: { elapsedMs: Date.now() - startedAt, fetched: 0, failed: 1 },
      };
    }
  }
  homepage = withMeta(homepage);

  const origin = new URL(homepage.finalUrl).origin;
  const sameOrigin = (candidate) => {
    try {
      const u = new URL(candidate);
      return (u.protocol === "http:" || u.protocol === "https:") && u.origin === origin;
    } catch {
      return false;
    }
  };

  // 2. robots.txt
  let robotsRaw = null;
  let robotsStatus = 0;
  let robots = null;
  try {
    const robotsRes = await fetchText(`${origin}/robots.txt`);
    robotsStatus = robotsRes.status;
    if (robotsRes.ok && /user-agent|disallow|sitemap/i.test(robotsRes.body)) {
      robotsRaw = robotsRes.body;
      robots = parseRobots(robotsRes.body);
    }
  } catch {
    /* robots fetch failure is itself a finding */
  }

  // 3. Sitemaps
  let sitemapUrls = [];
  try {
    sitemapUrls = await collectSitemapUrls(robots, origin);
  } catch {
    /* handled by the seo.sitemap checks */
  }

  // 4. Cheap side-fetches in parallel: llms.txt + og:image reachability.
  const [llmsRes, ogImageRes] = await Promise.allSettled([
    fetchText(`${origin}/llms.txt`, { cap: 100_000 }),
    homepage.meta.ogImage
      ? fetchText(new URL(homepage.meta.ogImage, homepage.finalUrl).toString(), { cap: 1_000 })
      : Promise.resolve(null),
  ]);
  const llmsTxt = llmsRes.status === "fulfilled" ? llmsRes.value : null;
  const ogImage =
    ogImageRes.status === "fulfilled" && ogImageRes.value
      ? {
          url: ogImageRes.value.url,
          status: ogImageRes.value.status,
          contentType: ogImageRes.value.headers["content-type"] ?? null,
          ok: ogImageRes.value.ok,
        }
      : homepage.meta.ogImage
        ? { url: homepage.meta.ogImage, status: 0, contentType: null, ok: false }
        : null;

  // 5. BFS: homepage first, sitemap URLs as extra seeds, same-origin only.
  const pages = [homepage];
  const visited = new Set([homepage.finalUrl.replace(/\/$/, ""), homepage.requestedUrl]);
  const queue = [];
  for (const url of sitemapUrls) {
    const clean = url.split("#")[0];
    if (sameOrigin(clean) && !SKIP_EXT.test(new URL(clean).pathname) && !visited.has(clean)) {
      queue.push({ url: clean, depth: 0 });
      visited.add(clean);
    }
  }
  {
    const homeOrigin = new URL(homepage.finalUrl).origin;
    const $links = cheerio.load(homepage.html);
    $links("a[href]").each((_, el) => {
      const href = $links(el).attr("href");
      if (!href || href.startsWith("#") || /^(mailto|tel|javascript):/i.test(href)) return;
      try {
        const resolved = new URL(href, homepage.finalUrl);
        resolved.hash = "";
        const clean = resolved.toString().replace(/\/$/, "");
        if (
          resolved.origin === homeOrigin &&
          !SKIP_EXT.test(resolved.pathname) &&
          !visited.has(clean)
        ) {
          queue.push({ url: clean, depth: 1 });
          visited.add(clean);
        }
      } catch {
        /* malformed href */
      }
    });
  }

  const deadline = startedAt + CAPS.wallMs;
  const lastStart = { at: 0 };
  let inFlight = 0;
  let queueIndex = 0;
  let claimed = 0;

  async function worker() {
    for (;;) {
      if (Date.now() >= deadline || claimed >= CAPS.pages) return;
      const job = queue[queueIndex];
      if (job === undefined) {
        if (inFlight === 0) return;
        await sleep(150);
        continue;
      }
      queueIndex += 1;
      claimed += 1;
      inFlight += 1;
      try {
        const wait = lastStart.at + CAPS.domainDelayMs - Date.now();
        if (wait > 0) await sleep(wait);
        lastStart.at = Date.now();
        if (Date.now() >= deadline) return;
        const page = withMeta(await fetchAndParse(job.url, job.depth));
        pages.push(page);
        if (page.depth + 1 <= CAPS.depth) {
          const $links = cheerio.load(page.html);
          const pageOrigin = new URL(page.finalUrl).origin;
          $links("a[href]").each((_, el) => {
            const href = $links(el).attr("href");
            if (!href || href.startsWith("#") || /^(mailto|tel|javascript):/i.test(href)) return;
            try {
              const resolved = new URL(href, page.finalUrl);
              resolved.hash = "";
              const clean = resolved.toString().replace(/\/$/, "");
              if (resolved.origin === pageOrigin && !SKIP_EXT.test(resolved.pathname) && !visited.has(clean)) {
                queue.push({ url: clean, depth: page.depth + 1 });
                visited.add(clean);
              }
            } catch {
              /* malformed href */
            }
          });
        }
      } catch (error) {
        errors.push({ url: job.url, message: error.message, status: error.status ?? null });
      } finally {
        inFlight -= 1;
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CAPS.concurrency, Math.max(1, queue.length)) }, worker),
  );

  return {
    homepage,
    pages,
    origin,
    robots,
    robotsRaw,
    robotsStatus,
    sitemapUrls,
    llmsTxt,
    ogImage,
    errors,
    stats: {
      elapsedMs: Date.now() - startedAt,
      fetched: pages.length,
      failed: errors.length,
    },
  };
}

// Serializable page summaries — what would be stored in the Scan.pages JSONB.
export function summarizePages(pages) {
  return pages.map((page) => ({
    url: page.finalUrl,
    status: page.status,
    depth: page.depth,
    ms: page.ms,
    redirected: page.redirected,
    wordCount: page.wordCount,
    htmlBytes: page.htmlBytes,
    rawTextLength: page.rawTextLength,
    title: page.title,
    images: page.images,
    links: page.links,
    headingCount: page.headings.length,
  }));
}
