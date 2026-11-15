// In-memory scan store — Phase 3 stopgap so reports get stable URLs
// (/scan/[id]) before the database lands in Phase 5. Survives across
// requests in one server process; resets on deploy. The API surface
// (saveScan/getScan) is what Phase 5 swaps to Prisma.

import { computeScore } from "./score";
import { runChecks } from "./checks";
import { crawl, summarizePages } from "./crawler";
import { runPsi } from "./psi";

const MAX_KEPT = 50;
const store = new Map();
const shareLinks = new Map(); // slug → scanId

export async function runAndSaveScan(url) {
  // Crawl and PSI run in parallel; PSI gets its own 28s budget and degrades
  // to null when Google doesn't answer — the scan never waits on it twice.
  const [result, psi] = await Promise.all([
    crawl(url),
    runPsi(url).catch(() => null),
  ]);
  if (!result.homepage) {
    const error = new Error(
      "Could not fetch the site. It refused the connection, timed out, or does not resolve.",
    );
    error.errors = result.errors;
    throw error;
  }
  const { findings, counts } = runChecks(result);
  const score = computeScore(findings, psi);
  const record = {
    id: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
    createdAt: new Date().toISOString(),
    url: result.homepage.finalUrl,
    origin: result.origin,
    stats: result.stats,
    counts,
    findings,
    psi,
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

export function listRecentScans(limit = 20) {
  return [...store.values()]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map((scan) => ({
      id: scan.id,
      url: scan.url,
      overall: scan.score.overall,
      createdAt: scan.createdAt,
      hasPsi: Boolean(scan.psi?.ok),
    }));
}

export function createShareLink(scanId) {
  const scan = store.get(scanId);
  if (!scan) return null;
  for (const [existingSlug, id] of shareLinks) {
    if (id === scanId) return { slug: existingSlug, scan };
  }
  const slug = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  shareLinks.set(slug, scanId);
  return { slug, scan };
}

export function resolveShareLink(slug) {
  const scanId = shareLinks.get(slug);
  if (!scanId) return null;
  return store.get(scanId) ?? null;
}
