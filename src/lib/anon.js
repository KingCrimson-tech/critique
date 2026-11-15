// Signed anonymous-scan cookie. Value is `<random>.<hmac>`; the HMAC proves the
// token came from us, so claimed scans can't be forged by guessing tokens.

import crypto from "node:crypto";

export const ANON_COOKIE = "critique_anon";
const ONE_YEAR = 60 * 60 * 24 * 365;

function secret() {
  return process.env.AUTH_SECRET ?? "insecure-dev-secret";
}

export function newAnonToken() {
  const token = crypto.randomBytes(24).toString("hex");
  const signature = crypto.createHmac("sha256", secret()).update(token).digest("hex").slice(0, 32);
  return `${token}.${signature}`;
}

export function verifyAnonToken(value) {
  if (!value || typeof value !== "string" || !value.includes(".")) return null;
  const [token, signature] = value.split(".");
  const expected = crypto
    .createHmac("sha256", secret())
    .update(token)
    .digest("hex")
    .slice(0, 32);
  return signature === expected ? value : null;
}

// Read from a Request (route handlers).
export function anonTokenFromRequest(request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`${ANON_COOKIE}=([^;]+)`));
  return match ? verifyAnonToken(decodeURIComponent(match[1])) : null;
}

export function anonCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR,
    path: "/",
  };
}
