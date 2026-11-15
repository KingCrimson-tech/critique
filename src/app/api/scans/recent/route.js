import { NextResponse } from "next/server";
import { listRecentScans } from "@/lib/scans";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ scans: listRecentScans(20) });
}
