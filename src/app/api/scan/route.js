import { NextResponse } from "next/server";
import { runAndSaveScan, getViewer } from "@/lib/scans";
import { normalizeUrl } from "@/lib/crawler";
import { ANON_COOKIE, newAnonToken, anonCookieOptions } from "@/lib/anon";

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

  const viewer = await getViewer(request);

  // Anonymous scans need a signed cookie so sign-in can claim them later.
  let freshAnonToken = null;
  if (!viewer.sessionUser && !viewer.anonToken) {
    freshAnonToken = newAnonToken();
    viewer.anonToken = freshAnonToken;
  }

  try {
    const scan = await runAndSaveScan(body.url, {
      userId: viewer.sessionUser?.id ?? null,
      anonToken: viewer.sessionUser ? null : viewer.anonToken,
    });
    const response = NextResponse.json(scan);
    if (freshAnonToken)
      response.cookies.set(ANON_COOKIE, freshAnonToken, anonCookieOptions());
    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message, errors: error.errors ?? null }, { status: 502 });
  }
}
