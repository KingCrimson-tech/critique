// In-memory scan store — Phase 3 stopgap so reports get stable URLs
// (/scan/[id]) before the database lands in Phase 5. Survives across
// requests in one server process; resets on deploy. The API surface
// (saveScan/getScan) is what Phase 5 swaps to Prisma.

import { computeScore } from "./score";
import { runChecks } from "./checks";
import { crawl, summarizePages } from "./crawler";

const MAX_KEPT = 50;
const store = new Map();

export async function runAndSaveScan(url) {
  const result = await crawl(url);
  if (!result.homepage) {
    const error = new Error(
      "Could not fetch the site. It refused the connection, timed out, or does not resolve.",
    );
    error.errors = result.errors;
    throw error;
  }
  const { findings, counts } = runChecks(result);
  const score = computeScore(findings);
  const record = {
    id: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
    createdAt: new Date().toISOString(),
    url: result.homepage.finalUrl,
    origin: result.origin,
    stats: result.stats,
    counts,
    findings,
    pages: summarizePages(result.pages),
    sitemapUrls: result.sitemapUrls.slice(0, 50),
    robotsStatus: result.robotsStatus,
    errors: result.errors,
    score,
  };
  store.set(record.id, record);
  if (store.size > MAX_KEPT) {
    const oldest = store.keys().next().value;
    store.delete(oldest);
  }
  return record;
}

export function getScan(id) {
  return store.get(id) ?? null;
}
