import { NextResponse } from "next/server";
import { getScan } from "@/lib/scans";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  const { id } = await params;
  const scan = getScan(id);
  if (!scan) return NextResponse.json({ error: "No such scan." }, { status: 404 });
  return NextResponse.json(scan);
}
