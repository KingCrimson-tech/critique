import { NextResponse } from "next/server";
import { getViewer, getOwnedSite, runAndSaveScan } from "@/lib/scans";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request, { params }) {
  const { siteId } = await params;
  const viewer = await getViewer(request);
  if (!viewer.sessionUser)
    return NextResponse.json({ error: "Sign in to re-scan." }, { status: 401 });

  const site = await getOwnedSite(siteId, viewer.sessionUser.id);
  if (!site) return NextResponse.json({ error: "No such site." }, { status: 404 });

  try {
    const scan = await runAndSaveScan(site.origin, { userId: viewer.sessionUser.id });
    return NextResponse.json(scan);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }
}
