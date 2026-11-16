// Scan persistence — Postgres via Prisma (replaces the Phase 3 in-memory stopgap).
// Ownership: a scan belongs to its site's user; an anonymous scan belongs to the
// signed anon cookie that created it; a shared scan is public.

import { prisma } from "./db";
import { computeScore } from "./score";
import { runChecks } from "./checks";
import { crawl, summarizePages, normalizeUrl } from "./crawler";
import { runPsi } from "./psi";
import { ANON_COOKIE, verifyAnonToken, anonTokenFromRequest } from "./anon";
import { createHash } from "node:crypto";

async function resolveSite(userId, origin) {
  const existing = await prisma.site.findUnique({
    where: { userId_origin: { userId, origin } },
  });
  return existing ?? prisma.site.create({ data: { userId, origin } });
}

export async function runAndSaveScan(url, { userId, anonToken } = {}) {
  // PSI gets the normalized URL too — a bare "example.com" (scheme-less input)
  // is a 400 from Google otherwise, while the crawler normalizes on its own.
  const normalized = normalizeUrl(url);
  const [result, psi] = await Promise.all([crawl(normalized), runPsi(normalized).catch(() => null)]);
  if (!result.homepage) {
    const error = new Error(
      "Could not fetch the site. It refused the connection, timed out, or does not resolve.",
    );
    error.errors = result.errors;
    throw error;
  }

  // Logged-in scans attach to the user's Site record; anonymous scans carry
  // the signed cookie token so sign-in can claim them later.
  let siteId = null;
  if (userId) {
    const site = await resolveSite(userId, new URL(result.homepage.finalUrl).origin);
    siteId = site.id;
    anonToken = null;
  }

  const { findings, counts } = runChecks(result);
  const score = computeScore(findings, psi);

  // Diff against the latest scan of the same site, when re-scanning a known site.
  let diff = null;
  if (siteId) {
    const previous = await prisma.scan.findFirst({
      where: { siteId, status: "done" },
      orderBy: { createdAt: "desc" },
    });
    if (previous?.scores) diff = computeDiff(previous, { score, findings });
  }

  const created = await prisma.scan.create({
    data: {
      siteId,
      url: result.homepage.finalUrl,
      status: "done",
      scoreVersion: score.scoreVersion,
      scores: score,
      findings,
      pages: summarizePages(result.pages),
      psi,
      diff,
      anonToken: userId ? null : anonToken,
      elapsedMs: result.stats.elapsedMs,
    },
    include: { site: true, shareLinks: true },
  });

  return serializeScan(created, result);
}

function computeDiff(previous, next) {
  const prevScores = previous.scores ?? {};
  const categories = {};
  for (const [key, value] of Object.entries(next.score.categories)) {
    const before = prevScores.categories?.[key]?.score;
    categories[key] = {
      before: before ?? null,
      after: value.score,
      delta: typeof before === "number" && !value.pending ? value.score - before : null,
    };
  }
  const beforeIds = new Set((previous.findings ?? []).filter((f) => f.severity !== "info").map((f) => f.id));
  const afterIds = new Set(next.findings.filter((f) => f.severity !== "info").map((f) => f.id));
  const fixed = [...beforeIds].filter((id) => !afterIds.has(id));
  const added = [...afterIds].filter((id) => !beforeIds.has(id));
  return {
    overallDelta: typeof prevScores.overall === "number" ? next.score.overall - prevScores.overall : null,
    categories,
    fixedCount: fixed.length,
    addedCount: added.length,
    fixed,
    added,
  };
}

function serializeScan(scan, crawlResult = null) {
  // Wall-clock scan time from the crawler when available (a fresh scan);
  // for stored scans without it, the page-response sum is the honest fallback.
  const stats = crawlResult
    ? { ...crawlResult.stats, fetched: crawlResult.stats.fetched, failed: crawlResult.stats.failed }
    : {
        elapsedMs: (scan.pages ?? []).reduce((sum, p) => sum + (p.ms ?? 0), 0) || null,
        fetched: (scan.pages ?? []).length,
        failed: 0,
      };
  return {
    id: scan.id,
    createdAt: scan.createdAt.toISOString(),
    url: scan.url,
    origin: scan.origin ?? new URL(scan.url).origin,
    siteId: scan.siteId,
    site: scan.site ? { id: scan.site.id, userId: scan.site.userId } : null,
    scoreVersion: scan.scoreVersion,
    score: scan.scores,
    counts: countFindings(scan.findings),
    findings: scan.findings ?? [],
    pages: scan.pages ?? [],
    psi: scan.psi,
    diff: scan.diff,
    stats,
    sitemapUrls: [],
    robotsStatus: null,
    errors: [],
    shareLinks: (scan.shareLinks ?? []).map((l) => l.slug),
  };
}

function countFindings(findings) {
  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const f of findings ?? []) if (f.severity in counts) counts[f.severity] += 1;
  return counts;
}

export async function getScanById(id, { includeSite = true } = {}) {
  const scan = await prisma.scan.findUnique({
    where: { id },
    include: includeSite ? { site: true, shareLinks: true } : { shareLinks: true },
  });
  return scan ? serializeScan(scan) : null;
}

// ---- viewer context -------------------------------------------------

export async function getViewer(request) {
  const { auth } = await import("./auth");
  let sessionUser = null;
  let anonToken = null;
  try {
    const headers = request?.headers ?? new Headers();
    const result = await auth.api.getSession({ headers });
    sessionUser = result?.user ?? null;
  } catch {
    /* unauthenticated */
  }
  if (request) anonToken = anonTokenFromRequest(request);
  return { sessionUser, anonToken };
}

// Server-component variant (no Request object available).
export async function getViewerFromHeaders() {
  const { headers, cookies } = await import("next/headers");
  const { auth } = await import("./auth");
  let sessionUser = null;
  try {
    const result = await auth.api.getSession({ headers: await headers() });
    sessionUser = result?.user ?? null;
  } catch {
    /* unauthenticated */
  }
  const raw = (await cookies()).get(ANON_COOKIE)?.value;
  return { sessionUser, anonToken: raw ? verifyAnonToken(raw) : null };
}

export function canViewScan(scan, { sessionUser, anonToken }) {
  if (scan.shareLinks?.length) return true; // shared = public
  if (scan.site?.userId && sessionUser && scan.site.userId === sessionUser.id) return true;
  if (!scan.siteId && anonToken && scan.anonToken === anonToken) return true;
  return false;
}

// Raw row access (shares resolved separately).
async function getScanRow(id) {
  return prisma.scan.findUnique({
    where: { id },
    include: { site: true, shareLinks: true },
  });
}

export async function getScanForViewer(id, viewer) {
  const row = await getScanRow(id);
  if (!row) return { scan: null, allowed: false };
  // Ownership decisions use the raw row (anonToken is stripped from output).
  const allowed = canViewScan(row, viewer ?? {});
  return { scan: serializeScan(row), allowed };
}

// ---- claiming --------------------------------------------------------

// Claim all scans created under the anonymous cookie. Idempotent.
export async function claimAnonScans(userId, anonToken) {
  if (!userId || !anonToken) return { claimed: 0 };
  const unclaimed = await prisma.scan.findMany({
    where: { anonToken, siteId: null, status: "done" },
  });
  const byOrigin = new Map();
  for (const scan of unclaimed) {
    const origin = new URL(scan.url).origin;
    if (!byOrigin.has(origin)) byOrigin.set(origin, []);
    byOrigin.get(origin).push(scan);
  }
  let claimed = 0;
  for (const [origin, scans] of byOrigin) {
    const site = await resolveSite(userId, origin);
    await prisma.scan.updateMany({
      where: { id: { in: scans.map((s) => s.id) } },
      data: { siteId: site.id, anonToken: null },
    });
    claimed += scans.length;
  }
  return { claimed };
}

// ---- share links -------------------------------------------------------

export async function createShareLink(scanId, viewer) {
  const row = await getScanRow(scanId);
  if (!row) return { error: "No such scan.", status: 404 };
  if (!canViewScan(row, viewer)) return { error: "Not yours to share.", status: 403 };
  if (row.shareLinks.length) return { slug: row.shareLinks[0].slug };
  const slug = createHash("sha256")
    .update(scanId + cryptoRandom())
    .digest("hex")
    .slice(0, 10);
  await prisma.shareLink.create({ data: { slug, scanId } });
  return { slug };
}

function cryptoRandom() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function resolveShareLink(slug) {
  const link = await prisma.shareLink.findUnique({ where: { slug }, include: { scan: true } });
  if (!link) return null;
  const row = await getScanRow(link.scanId);
  return row ? serializeScan(row) : null;
}

// ---- sites + history ----------------------------------------------------

export async function listSitesWithScores(userId) {
  const sites = await prisma.site.findMany({
    where: { userId },
    include: {
      scans: { where: { status: "done" }, orderBy: { createdAt: "desc" }, take: 2 },
    },
    orderBy: { createdAt: "desc" },
  });
  return sites.map((site) => {
    const latest = site.scans[0] ?? null;
    const previous = site.scans[1] ?? null;
    return {
      id: site.id,
      origin: site.origin,
      createdAt: site.createdAt.toISOString(),
      scanCount: site.scans.length,
      latest: latest
        ? {
            id: latest.id,
            url: latest.url,
            overall: latest.scores?.overall ?? null,
            criticals: countFindings(latest.findings).critical,
            createdAt: latest.createdAt.toISOString(),
            delta: latest.diff?.overallDelta ?? null,
          }
        : null,
      previousId: previous?.id ?? null,
    };
  });
}

export async function listSiteHistory(siteId, userId) {
  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site || site.userId !== userId) return null;
  const scans = await prisma.scan.findMany({
    where: { siteId, status: "done" },
    orderBy: { createdAt: "desc" },
  });
  return {
    site: { id: site.id, origin: site.origin, createdAt: site.createdAt.toISOString() },
    scans: scans.map((scan) => ({
      id: scan.id,
      overall: scan.scores?.overall ?? null,
      counts: countFindings(scan.findings),
      delta: scan.diff?.overallDelta ?? null,
      createdAt: scan.createdAt.toISOString(),
    })),
  };
}

export async function getOwnedSite(siteId, userId) {
  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site || site.userId !== userId) return null;
  return site;
}

export async function listRecentScansForViewer(viewer, limit = 20) {
  const rows = await prisma.scan.findMany({
    where: { status: "done" },
    orderBy: { createdAt: "desc" },
    take: limit * 4,
    include: { site: true, shareLinks: true },
  });
  return rows
    .filter((row) => canViewScan(row, viewer ?? {}))
    .slice(0, limit)
    .map((row) => {
      const scan = serializeScan(row);
      return {
        id: scan.id,
        url: scan.url,
        overall: scan.score?.overall ?? null,
        createdAt: scan.createdAt,
        hasPsi: Boolean(scan.psi?.ok),
      };
    });
}
