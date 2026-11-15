import { NextResponse } from "next/server";
import { createShareLink } from "@/lib/scans";

export const runtime = "nodejs";

export async function POST(request) {
  let body = null;
  try {
    body = await request.json();
  } catch {
    /* handled below */
  }
  const result = createShareLink(body?.scanId);
  if (!result) return NextResponse.json({ error: "No such scan." }, { status: 404 });
  return NextResponse.json({ slug: result.slug });
}
