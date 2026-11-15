import { NextResponse } from "next/server";
import { getScanForViewer, getViewer } from "@/lib/scans";
import {
  probeHost,
  getCachedProbe,
  brandFromHost,
  viewerKey,
  rateLimitStatus,
  RATE_LIMIT_MAX,
  CACHE_TTL_MS,
} from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request) {
  let body = null;
  try {
    body = await request.json();
  } catch {
    /* handled below */
  }

  const { scanId, competitor } = body ?? {};
  if (typeof competitor === "string" && (competitor.length > 60 || /[\r\n]/.test(competitor))) {
    return NextResponse.json({ error: "Competitor is too long or malformed." }, { status: 400 });
  }

  const viewer = await getViewer(request);
  const { scan, allowed } = await getScanForViewer(scanId, viewer);
  if (!scan || !allowed) return NextResponse.json({ error: "No such scan." }, { status: 404 });

  const host = new URL(scan.url).host;
  const brand = brandFromHost(host);
  // Topic from the homepage title — the site's own words, minus the brand echo.
  // Titles like "Best X | Brand" reduce to the part before the separator.
  const homeTitle = scan.pages.find((p) => p.url === scan.url)?.title ?? scan.pages[0]?.title ?? "";
  const topic =
    homeTitle
      .split(/[|·—–]/)[0]
      .replace(new RegExp(brand, "ig"), "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 60) || brand;

  const key = viewerKey(viewer, request);
  // Cached snapshots are free — the limit only gates fresh probes.
  const cachedProbe = await getCachedProbe(host);
  if (!cachedProbe) {
    const limit = await rateLimitStatus(key);
    if (limit.remaining <= 0) {
      return NextResponse.json(
        {
          error: "Probe limit reached.",
          detail: `${RATE_LIMIT_MAX} fresh probes per day. Snapshots are cached for ${CACHE_TTL_MS / 3_600_000}h.`,
          rate: limit,
        },
        { status: 429 },
      );
    }
  }

  try {
    const probe = await probeHost({ host, brand, topic, competitor, viewerKey: key });
    const rate = cachedProbe ? null : await rateLimitStatus(key);
    return NextResponse.json({
      host,
      brand,
      topic,
      ...probe,
      rate,
    });
  } catch {
    return NextResponse.json({ error: "The probe engine did not answer." }, { status: 502 });
  }
}
