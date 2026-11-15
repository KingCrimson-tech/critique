import { finding } from "./util";

// UX checks — CTA presence, form labels, OG image, above-fold, viewport consistency.

const CTA_PATTERN =
  /^(get started|start|try|sign ?up|create|buy|shop|order|subscribe|contact|book|demo|download|request|join|apply|donate|add to cart|check out|learn how|get a|get your|talk to|schedule|register)/i;

export function uxCheck(page, ctx) {
  const out = [];
  const $ = page.$ ?? null;

  // -- CTA presence ---------------------------------------------------
  if ($) {
    let ctaCount = 0;
    $("a, button, [role=button], input[type=submit]").each((_, el) => {
      const text = ($(el).text() || $(el).attr("value") || "").replace(/\s+/g, " ").trim();
      if (text && CTA_PATTERN.test(text)) ctaCount += 1;
    });
    if (ctaCount === 0)
      out.push(
        finding({
          id: "ux.cta.missing",
          category: "ux",
          severity: "medium",
          title: "No clear call to action",
          message:
            "Nothing on the homepage says what to do next. If visitors have to infer the action, most will infer leaving.",
          page: page.finalUrl,
        }),
      );
  }

  // -- form labels ----------------------------------------------------
  if ($) {
    const unlabeled = [];
    $("input:not([type=hidden]):not([type=submit]):not([type=button]), textarea, select").each(
      (_, el) => {
        const $el = $(el);
        const id = $el.attr("id");
        const labeled =
          (id && $(`label[for="${CSS.escape(id)}"]`).length > 0) ||
          $el.parents("label").length > 0 ||
          $el.attr("aria-label") ||
          $el.attr("aria-labelledby") ||
          $el.attr("title");
        if (!labeled)
          unlabeled.push({
            type: $el.attr("type") ?? el.tagName ?? "input",
            name: $el.attr("name") ?? null,
            placeholder: $el.attr("placeholder") ?? null,
          });
      },
    );
    if (unlabeled.length)
      out.push(
        finding({
          id: "ux.form.labels",
          category: "ux",
          severity: "medium",
          title: `${unlabeled.length} form field${unlabeled.length > 1 ? "s" : ""} without a label`,
          message:
            "A placeholder is not a label — it disappears the moment someone types. Screen readers announce nothing, and everyone else guesses.",
          detail: { fields: unlabeled.slice(0, 6) },
          page: page.finalUrl,
        }),
      );
  }

  // -- OG image reachable ---------------------------------------------
  if (ctx.ogImage && ctx.ogImage.url && !ctx.ogImage.ok)
    out.push(
      finding({
        id: "ux.og.image.broken",
        category: "ux",
        severity: "medium",
        title: "OG image does not load",
        message: `${ctx.ogImage.url} returns ${ctx.ogImage.status || "an error"}. Every shared link falls back to a blank preview.`,
        detail: { status: ctx.ogImage.status, contentType: ctx.ogImage.contentType },
        page: page.finalUrl,
      }),
    );

  // -- above-fold content heuristic ------------------------------------
  {
    const head = page.html.slice(0, 40_000);
    const visible = head
      .replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (visible.length < 200 && /<script/i.test(page.html))
      out.push(
        finding({
          id: "ux.abovefold.js",
          category: "ux",
          severity: "low",
          title: "First screen renders from JavaScript",
          message:
            "The first 40 KB of HTML carry almost no text. On a slow connection the visitor stares at a blank page while your bundle loads.",
          detail: { visibleChars: visible.length },
          page: page.finalUrl,
        }),
      );
  }

  // -- mobile viewport consistency -------------------------------------
  {
    const viewports = new Map();
    for (const p of ctx.pages) {
      const v = p.meta.viewport;
      if (v) viewports.set(v, (viewports.get(v) ?? 0) + 1);
    }
    if (viewports.size > 1)
      out.push(
        finding({
          id: "ux.viewport.inconsistent",
          category: "ux",
          severity: "low",
          title: `${viewports.size} different viewport declarations across pages`,
          message:
            "Pages disagree about how to render on a phone, so pinch-zoom behavior changes as you navigate. Pick one and apply it everywhere.",
          detail: { variants: [...viewports.entries()].slice(0, 4) },
        }),
      );
  }

  return out;
}
