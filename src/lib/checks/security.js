import { finding } from "./util";

// Security checks — response headers, mixed content, cookies. All page-level.

export function securityCheck(page) {
  const out = [];
  const headers = page.headers;
  const isHttps = page.finalUrl.startsWith("https://");

  if (!isHttps)
    out.push(
      finding({
        id: "security.https.missing",
        category: "security",
        severity: "critical",
        title: "Served over plain HTTP",
        message:
          "Everything a visitor sees travels unencrypted, including anything they type. Get a certificate — Let's Encrypt is free — and redirect everything to https.",
        page: page.finalUrl,
      }),
    );

  if (isHttps && !headers["strict-transport-security"])
    out.push(
      finding({
        id: "security.hsts.missing",
        category: "security",
        severity: "medium",
        title: "No HSTS header",
        message:
          "The first request can still be downgraded to http by a man in the middle. Send Strict-Transport-Security and close that door.",
        page: page.finalUrl,
      }),
    );

  if (!headers["content-security-policy"])
    out.push(
      finding({
        id: "security.csp.missing",
        category: "security",
        severity: "high",
        title: "No Content-Security-Policy",
        message:
          "Any injected script runs with your origin's full privileges. A CSP is the seatbelt for every XSS attempt you have not seen yet.",
        page: page.finalUrl,
      }),
    );

  if (headers["x-content-type-options"] !== "nosniff")
    out.push(
      finding({
        id: "security.xcto.missing",
        category: "security",
        severity: "medium",
        title: "No X-Content-Type-Options",
        message:
          "Browsers are free to sniff file types and second-guess your Content-Type. One header removes the guesswork: nosniff.",
        page: page.finalUrl,
      }),
    );

  {
    const csp = headers["content-security-policy"] ?? "";
    const frameAncestors = /frame-ancestors/i.test(csp);
    if (!headers["x-frame-options"] && !frameAncestors)
      out.push(
        finding({
          id: "security.framing.missing",
          category: "security",
          severity: "medium",
          title: "No framing protection",
          message:
            "Any site can embed this page in an invisible iframe and clickjack it. Send X-Frame-Options: DENY or a CSP frame-ancestors directive.",
          page: page.finalUrl,
        }),
      );
  }

  if (!headers["referrer-policy"])
    out.push(
      finding({
        id: "security.referrer.missing",
        category: "security",
        severity: "low",
        title: "No Referrer-Policy",
        message:
          "Full URLs — including any query-string tokens — leak to every site you link to. Send Referrer-Policy: strict-origin-when-cross-origin.",
        page: page.finalUrl,
      }),
    );

  if (!headers["permissions-policy"])
    out.push(
      finding({
        id: "security.permissions.missing",
        category: "security",
        severity: "low",
        title: "No Permissions-Policy",
        message:
          "Embedded third parties can ask for camera, microphone, or geolocation and the browser has no reason to refuse. Deny by default.",
        page: page.finalUrl,
      }),
    );

  if (isHttps) {
    const matches = page.html.match(/(?:src|href)=["']http:\/\/[^"']+["']/gi) ?? [];
    const relevant = matches.filter((m) => !/http:\/\/(?:www\.)?w3\.org/.test(m));
    if (relevant.length)
      out.push(
        finding({
          id: "security.mixed.content",
          category: "security",
          severity: "high",
          title: `${relevant.length} insecure (http://) resource${relevant.length > 1 ? "s" : ""} on a secure page`,
          message:
            "Browsers block or flag these. A padlock next to an active mixed-content warning is a broken padlock.",
          detail: { samples: relevant.slice(0, 5) },
          page: page.finalUrl,
        }),
      );
  }

  {
    const server = headers["server"];
    const poweredBy = headers["x-powered-by"];
    const bannerBits = [];
    if (server && /\d/.test(server)) bannerBits.push(`Server: ${server.split(";")[0].trim()}`);
    if (poweredBy) bannerBits.push(`X-Powered-By: ${poweredBy.split(";")[0].trim()}`);
    if (bannerBits.length)
      out.push(
        finding({
          id: "security.banner.leak",
          category: "security",
          severity: "low",
          title: "Server banner leaks version",
          message: `${bannerBits.join(" · ")} is printed on every response. It is free recon for attackers looking for a known CVE. Strip it.`,
          detail: { server: server ?? null, poweredBy: poweredBy ?? null },
          page: page.finalUrl,
        }),
      );
  }

  {
    const problems = [];
    for (const cookie of page.setCookies) {
      const name = cookie.split("=")[0]?.trim() || "(unnamed)";
      const missing = [];
      if (!/httponly/i.test(cookie)) missing.push("HttpOnly");
      if (!/secure/i.test(cookie)) missing.push("Secure");
      if (!/samesite/i.test(cookie)) missing.push("SameSite");
      if (missing.length) problems.push({ name, missing });
    }
    if (problems.length)
      out.push(
        finding({
          id: "security.cookie.flags",
          category: "security",
          severity: "medium",
          title: `${problems.length} cookie${problems.length > 1 ? "s" : ""} missing security flags`,
          message:
            "Cookies ship without HttpOnly, Secure, or SameSite. JavaScript can read them, plain HTTP can carry them, and any cross-site request brings them along.",
          detail: { cookies: problems.slice(0, 6) },
          page: page.finalUrl,
        }),
      );
  }

  return out;
}
