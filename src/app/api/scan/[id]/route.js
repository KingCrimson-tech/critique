import { NextResponse } from "next/server";
import { getScanForViewer, getViewer } from "@/lib/scans";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  const { id } = await params;
  const viewer = await getViewer(request);
  const { scan, allowed } = await getScanForViewer(id, viewer);
  // 404, not 403 — existence is not information we hand out.
  if (!scan || !allowed) return NextResponse.json({ error: "No such scan." }, { status: 404 });
  return NextResponse.json(scan);
}
