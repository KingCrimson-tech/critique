import { NextResponse } from "next/server";
import { crawl, normalizeUrl, summarizePages } from "@/lib/crawler";
import { runChecks } from "@/lib/checks";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request) {
  let body = null;
  try {
    body = await request.json();
  } catch {
    /* handled below */
  }

  let target;
  try {
    target = normalizeUrl(body?.url);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  console.log("[scan] raw body:", JSON.stringify(body)?.slice(0, 200), "typeof target after normalize:", typeof target, String(target));
  const result = await crawl(target).catch((error) => {
    console.error("[scan] crawl crashed", error);
    return null;
  });

  if (!result) return NextResponse.json({ error: "Scan crashed." }, { status: 500 });

  if (!result.homepage)
    return NextResponse.json(
      {
        error: "Could not fetch the site. It refused the connection, timed out, or does not resolve.",
        target: target.toString(),
        errors: result.errors,
      },
      { status: 502 },
    );

  const { findings, counts } = runChecks(result);

  return NextResponse.json({
    url: result.homepage.finalUrl,
    origin: result.origin,
    stats: result.stats,
    counts,
    findings,
    pages: summarizePages(result.pages),
    sitemapUrls: result.sitemapUrls.slice(0, 50),
    robotsStatus: result.robotsStatus,
    errors: result.errors,
  });
}
