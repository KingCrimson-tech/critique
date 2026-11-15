import { NextResponse } from "next/server";
import { listRecentScansForViewer, getViewer } from "@/lib/scans";

export const runtime = "nodejs";

export async function GET(request) {
  const viewer = await getViewer(request);
  return NextResponse.json({ scans: await listRecentScansForViewer(viewer) });
}
