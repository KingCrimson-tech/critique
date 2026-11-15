import { NextResponse } from "next/server";
import { createShareLink, getViewer } from "@/lib/scans";

export const runtime = "nodejs";

export async function POST(request) {
  let body = null;
  try {
    body = await request.json();
  } catch {
    /* handled below */
  }
  const viewer = await getViewer(request);
  const result = await createShareLink(body?.scanId, viewer);
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ slug: result.slug });
}
