import { NextResponse } from "next/server";
import { runAndSaveScan } from "@/lib/scans";
import { normalizeUrl } from "@/lib/crawler";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request) {
  let body = null;
  try {
    body = await request.json();
  } catch {
    /* handled below */
  }

  try {
    normalizeUrl(body?.url);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  try {
    const scan = await runAndSaveScan(body.url);
    return NextResponse.json(scan);
  } catch (error) {
    return NextResponse.json({ error: error.message, errors: error.errors ?? null }, { status: 502 });
  }
}
