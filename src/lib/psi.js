// PageSpeed Insights + CrUX. Runs with a PSI_API_KEY when one is configured,
// keyless otherwise (shared quota, often 429s). PSI runs Lighthouse (mobile)
// for us; CrUX field data comes back in the same response when the URL has
// enough real-user traffic. Everything is best-effort: a failure returns
// { ok: false, reason } and the report says so honestly — never a zero.

// Big sites take 50s+ of Lighthouse time (vercel.com measured 53s). 55s fits
// inside the scan route's maxDuration = 60 on Vercel with margin.
const PSI_TIMEOUT_MS = 55_000;

function num(value, digits = 0) {
  if (value === null || value === undefined) return null;
  return Number(value.toFixed(digits));
}

export function formatMs(ms) {
  if (ms === null || ms === undefined) return "—";
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
}

function verdictForMetric(value, thresholds) {
  if (value === null || value === undefined) return null;
  const [good, poor] = thresholds;
  if (value <= good) return "good";
  if (value <= poor) return "needs-work";
  return "poor";
}

// Lighthouse/CrUX thresholds: LCP 2.5s/4s, CLS 0.1/0.25, TBT 200/600ms, FCP 1.8s/3s.
const METRIC_THRESHOLDS = {
  lcp: [2500, 4000],
  cls: [0.1, 0.25],
  tbt: [200, 600],
  fcp: [1800, 3000],
  si: [3400, 5800],
};

export async function runPsi(url, timeoutMs = PSI_TIMEOUT_MS) {
  const target = String(url);
  const endpoint =
    `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(target)}` +
    `&strategy=mobile&category=performance&category=accessibility` +
    (process.env.PSI_API_KEY ? `&key=${process.env.PSI_API_KEY}` : "");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(endpoint, { signal: controller.signal });
    if (!res.ok) {
      // Parse Google's error body — "API key not valid" vs quota vs the URL
      // itself are different problems and the report should say which.
      let detail = `HTTP ${res.status}`;
      try {
        const body = await res.json();
        const message = body?.error?.message ?? body?.error?.errors?.[0]?.message;
        if (message) detail = message.slice(0, 160);
      } catch {
        /* body wasn't JSON — keep the status line */
      }
      return { ok: false, reason: detail };
    }
    const data = await res.json();

    const lh = data.lighthouseResult;
    if (!lh) return null;

    const categories = lh.categories ?? {};
    const audits = lh.audits ?? {};

    const scores = {
      performance:
        categories.performance?.score != null ? Math.round(categories.performance.score * 100) : null,
      accessibility:
        categories.accessibility?.score != null
          ? Math.round(categories.accessibility.score * 100)
          : null,
    };

    const metrics = {
      lcp: { value: num(audits["largest-contentful-paint"]?.numericValue), unit: "ms" },
      cls: { value: num(audits["cumulative-layout-shift"]?.numericValue, 3), unit: "" },
      tbt: { value: num(audits["total-blocking-time"]?.numericValue), unit: "ms" },
      fcp: { value: num(audits["first-contentful-paint"]?.numericValue), unit: "ms" },
      si: { value: num(audits["speed-index"]?.numericValue), unit: "ms" },
    };
    for (const [key, metric] of Object.entries(metrics))
      metric.verdict = verdictForMetric(metric.value, METRIC_THRESHOLDS[key]);

    // Accessibility violations: a11y audits with a failing score, heaviest first.
    const a11yRefs = categories.accessibility?.auditRefs ?? [];
    const a11yIds = new Set(a11yRefs.map((ref) => ref.id));
    const weightById = new Map(a11yRefs.map((ref) => [ref.id, ref.weight ?? 0]));
    const violations = Object.values(audits)
      .filter(
        (audit) =>
          a11yIds.has(audit.id) &&
          audit.score !== null &&
          audit.score < 1 &&
          audit.scoreDisplayMode !== "informative" &&
          audit.scoreDisplayMode !== "notApplicable",
      )
      .sort((a, b) => (weightById.get(b.id) ?? 0) - (weightById.get(a.id) ?? 0))
      .slice(0, 8)
      .map((audit) => ({
        id: audit.id,
        title: audit.title,
        displayValue: audit.displayValue ?? null,
        weight: weightById.get(audit.id) ?? 0,
      }));

    // CrUX field data, when this URL has enough real users.
    let field = null;
    if (data.loadingExperience && data.loadingExperience.metrics) {
      field = {
        overall: data.loadingExperience.overall_category ?? null,
        metrics: Object.fromEntries(
          Object.entries(data.loadingExperience.metrics).map(([key, value]) => [
            key.toLowerCase(),
            { percentile: value.percentile, category: value.category },
          ]),
        ),
      };
    }

    return {
      ok: true,
      device: "mobile",
      keyed: Boolean(process.env.PSI_API_KEY),
      scores,
      metrics,
      violations,
      field,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return { ok: false, reason: error?.name === "AbortError" ? "timed out before Lighthouse finished" : "unreachable" };
  } finally {
    clearTimeout(timer);
  }
}
