import { finding } from "./util";
import { robotsAllows } from "../crawler";

// AI-readability — can a language model fetch, parse, and quote this site correctly?

const AI_BOTS = ["GPTBot", "ClaudeBot", "PerplexityBot", "CCBot", "Google-Extended"];

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

export function aiReadabilityCheck(page, ctx) {
  const out = [];
  const meta = page.meta;

  // -- crawler rules -------------------------------------------------
  if (!ctx.robots) {
    out.push(
      finding({
        id: "ai.robots.missing",
        category: "ai",
        severity: "info",
        title: "No robots.txt — AI crawlers default to allowed",
        message:
          "With no robots.txt, GPTBot, ClaudeBot, PerplexityBot, and friends may crawl everything by default. Decide on purpose, not by omission.",
        page: page.finalUrl,
      }),
    );
  } else {
    const blocked = AI_BOTS.filter((bot) => !robotsAllows(ctx.robots, bot, page.finalUrl));
    if (blocked.length)
      out.push(
        finding({
          id: "ai.robots.blocked",
          category: "ai",
          severity: "medium",
          title: `robots.txt blocks AI crawlers: ${blocked.join(", ")}`,
          message:
            "These crawlers are told to stay out, so your content will not appear in their answers. If it is a policy choice, fine — just make it a choice, not an accident.",
          detail: { blocked },
          page: page.finalUrl,
        }),
      );
    const named = AI_BOTS.filter((bot) =>
      ctx.robots.groups.some((g) =>
        g.agents.some(
          (agent) =>
            agent === bot.toLowerCase() ||
            agent.split(" ").some((token) => token === bot.toLowerCase()),
        ),
      ),
    );
    if (named.length > blocked.length)
      out.push(
        finding({
          id: "ai.robots.named",
          category: "ai",
          severity: "info",
          title: `robots.txt explicitly allows: ${named.filter((bot) => !blocked.includes(bot)).join(", ")}`,
          message: "Some AI crawlers are named and allowed. Good — that is a deliberate stance.",
          detail: { allowed: named.filter((bot) => !blocked.includes(bot)) },
          page: page.finalUrl,
        }),
      );
  }

  // -- llms.txt ------------------------------------------------------
  if (!ctx.llmsTxt || !ctx.llmsTxt.ok)
    out.push(
      finding({
        id: "ai.llms.txt.missing",
        category: "ai",
        severity: "low",
        title: "No llms.txt",
        message:
          "No /llms.txt — the plain-text pointer file that tells models what is worth reading on your site. Cheap to add, growing adoption.",
        page: page.finalUrl,
      }),
    );

  // -- server-rendered text ------------------------------------------
  if (page.rawTextLength < 500)
    out.push(
      finding({
        id: "ai.text.js-only",
        category: "ai",
        severity: "high",
        title: "Page is JavaScript-only",
        message: `Only ${page.rawTextLength} characters of text ship in the raw HTML. A model that fetches your page gets an empty shell — no rendering, no content, no answer.`,
        detail: { rawTextLength: page.rawTextLength },
        page: page.finalUrl,
      }),
    );

  // -- noscript ------------------------------------------------------
  if (meta.noscriptLength < 50 && /<script/i.test(page.html))
    out.push(
      finding({
        id: "ai.noscript.missing",
        category: "ai",
        severity: "low",
        title: "Empty <noscript> fallback",
        message:
          "There is JavaScript but nothing behind it. Anyone — or anything — that refuses to execute your code gets a blank page.",
        page: page.finalUrl,
      }),
    );

  // -- Organization / WebSite schema ---------------------------------
  {
    const types = jsonLdTypes(meta.jsonLd.filter((node) => !node.__invalid));
    if (!types.some((t) => /organization|website|localbusiness|store|person/i.test(t)))
      out.push(
        finding({
          id: "ai.schema.identity",
          category: "ai",
          severity: "medium",
          title: "No machine-readable identity",
          message:
            "Nothing in the structured data says who runs this site. Organization/WebSite schema is how models attribute facts to you instead of whoever ranks above you.",
          page: page.finalUrl,
        }),
      );
  }

  // -- authorship ----------------------------------------------------
  {
    const byline = /\bby\s+[A-Z][a-z]+/.test(page.text?.slice(0, 2000) ?? "");
    const hasAuthor =
      Boolean(meta.author) ||
      /rel="author"|itemprop="author"|class="[^"]*byline/i.test(page.html) ||
      byline;
    if (!hasAuthor)
      out.push(
        finding({
          id: "ai.author.missing",
          category: "ai",
          severity: "low",
          title: "No author byline",
          message:
            "No author in meta tags, no byline in the markup. Attribution is part of how models decide which sources are quotable.",
          page: page.finalUrl,
        }),
      );
  }

  // -- chunkability ---------------------------------------------------
  {
    const paragraphs = page.paragraphs ?? [];
    if (paragraphs.length >= 3) {
      const avg = paragraphs.reduce((sum, p) => sum + p.length, 0) / paragraphs.length;
      if (avg > 600)
        out.push(
          finding({
            id: "ai.chunking.walls",
            category: "ai",
            severity: "low",
            title: `Paragraphs average ${Math.round(avg)} characters`,
            message:
              "Models and readers both work in chunks. Anything that cannot be quoted cleanly in two sentences will not be quoted at all. Break paragraphs at 200–400 characters.",
            detail: { avgParagraphChars: Math.round(avg), paragraphs: paragraphs.length },
            page: page.finalUrl,
          }),
        );
    }
  }

  return out;
}
