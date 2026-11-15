// Fix templates for security check ids.

const nginxHeaders = {
  what: "Send the missing security header.",
  why: "Browsers only enforce what you declare. These headers are one line each and close entire attack classes.",
  fix: {
    variants: {
      nginx: {
        lang: "nginx",
        code: `# nginx — server block
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), interest-cohort=()" always;`,
      },
      next: {
        lang: "javascript",
        code: `// next.config.mjs
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};`,
      },
      wordpress: {
        lang: "text",
        code: `Header directives belong at the web-server layer, before PHP runs. If you are on shared hosting without nginx/apache access, use a plugin like "Headers and Security" or an .htaccess snippet:

Header always set X-Content-Type-Options "nosniff"
Header always set X-Frame-Options "DENY"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"`,
      },
    },
  },
  docs: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers",
};

const hsts = {
  what: "Send Strict-Transport-Security.",
  why: "Without HSTS, the very first request can be downgraded to plain http by a man in the middle — even with a valid certificate.",
  fix: {
    variants: {
      nginx: {
        lang: "nginx",
        code: `# start with a small max-age, raise it once you are sure
add_header Strict-Transport-Security "max-age=86400; includeSubDomains" always;
# confident? raise to 31536000 (one year)`,
      },
      next: {
        lang: "javascript",
        code: `// next.config.mjs
async headers() {
  return [
    {
      source: "/:path*",
      headers: [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
      ],
    },
  ];
}`,
      },
    },
  },
  docs: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security",
};

const csp = {
  what: "Ship a Content-Security-Policy.",
  why: "Any injected script currently runs with your origin's full privileges — cookies, DOM, everything. A CSP is the seatbelt for the XSS you have not seen yet.",
  fix: {
    variants: {
      nginx: {
        lang: "nginx",
        code: `# start permissive, tighten per directive you actually need
add_header Content-Security-Policy \\
  "default-src 'self';
   script-src 'self' https://plausible.io;
   style-src 'self' 'unsafe-inline';
   img-src 'self' data: https:;
   frame-ancestors 'none';
   upgrade-insecure-requests" always;

# safer rollout: enforce nothing, log violations first
# add_header Content-Security-Policy-Report-Only "..." always;`,
      },
      next: {
        lang: "javascript",
        code: `// next.config.mjs
async headers() {
  return [
    {
      source: "/:path*",
      headers: [
        {
          key: "Content-Security-Policy",
          value:
            "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; frame-ancestors 'none'; upgrade-insecure-requests",
        },
      ],
    },
  ];
}
// Tip: Next dev needs 'unsafe-inline'/'unsafe-eval' for scripts; tighten for prod.`,
      },
    },
  },
  docs: "https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP",
};

const framing = {
  what: "Forbid framing of your pages.",
  why: "Right now any site can embed this page in an invisible iframe and clickjack it — overlays that steal the tap meant for your button.",
  fix: {
    variants: {
      nginx: {
        lang: "nginx",
        code: `add_header X-Frame-Options "DENY" always;
# or the modern equivalent inside CSP:
# Content-Security-Policy: frame-ancestors 'none'`,
      },
      next: {
        lang: "javascript",
        code: `// next.config.mjs
async headers() {
  return [
    {
      source: "/:path*",
      headers: [{ key: "X-Frame-Options", value: "DENY" }],
    },
  ];
}`,
      },
    },
  },
  docs: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options",
};

const mixedContent = {
  what: "Load every resource over https.",
  why: "Browsers block or flag http:// subresources on an https page. A padlock beside an active mixed-content warning is a broken padlock.",
  fix: {
    kind: "text",
    lang: "text",
    code: `1. Search the codebase and DB for http:// asset URLs (uploads, CDNs, fonts).
2. Replace with https:// (or protocol-relative // where truly needed).
3. WordPress: plugins like Better Search Replace fix post content in one pass.
4. Add upgrade-insecure-requests to CSP as a safety net while cleaning up.`,
  },
  docs: "https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content",
};

const bannerLeak = {
  what: "Stop printing server versions.",
  why: "The banner tells an attacker which CVE list to read. It costs you nothing to remove and them nothing to read.",
  fix: {
    variants: {
      nginx: {
        lang: "nginx",
        code: `# nginx.conf — http block
server_tokens off;`,
      },
      next: {
        lang: "javascript",
        code: `// next.config.mjs
const nextConfig = {
  poweredByHeader: false,
};`,
      },
      wordpress: {
        lang: "text",
        code: `WordPress itself prints little; the leak is usually the web server.
- nginx: server_tokens off;
- apache: ServerTokens Prod in the vhost config.
- Shared hosting: ask the host, or strip headers at the CDN (Cloudflare Transform Rule).`,
      },
    },
  },
  docs: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Server",
};

const cookieFlags = {
  what: "Set Secure, HttpOnly, and SameSite on every cookie.",
  why: "Unflagged cookies can be read by any script on the page, carried over plain http, and attached to cross-site requests. All three fixes are attributes, not code changes.",
  fix: {
    variants: {
      nginx: {
        lang: "nginx",
        code: `# proxying an app that sets cookies? fix them at the edge:
proxy_cookie_path / "/; Secure; HttpOnly; SameSite=Lax";`,
      },
      javascript: {
        lang: "javascript",
        code: `// express / node
res.cookie("session", token, {
  secure: true,     // https only
  httpOnly: true,   // invisible to document.cookie
  sameSite: "lax",  // not sent on cross-site requests
  maxAge: 1000 * 60 * 60 * 24 * 14,
});`,
      },
      php: {
        lang: "php",
        code: `<?php
// PHP 7.3+
setcookie("session", $token, [
  "secure" => true,
  "httponly" => true,
  "samesite" => "Lax",
]);`,
      },
    },
  },
  docs: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie",
};

const FIXES = {
  "security.https.missing": {
    what: "Serve the site over https.",
    why: "Everything a visitor sees travels unencrypted — including anything they type. Certificates are free; there is no remaining excuse.",
    fix: {
      variants: {
        nginx: {
          lang: "nginx",
          code: `# 1. get a free certificate (Let's Encrypt)
certbot --nginx -d example.com -d www.example.com

# 2. send all http traffic to https
server {
  listen 80;
  server_name example.com;
  return 301 https://example.com$request_uri;
}`,
        },
        next: {
          lang: "text",
          code: `On Vercel, https is automatic — the finding means the site is NOT hosted there.
If self-hosted: run certbot --nginx (free Let's Encrypt cert), then force-redirect port 80 to 443. Renewals are automatic.`,
        },
      },
    },
    docs: "https://letsencrypt.org/getting-started/",
  },
  "security.hsts.missing": hsts,
  "security.csp.missing": csp,
  "security.xcto.missing": nginxHeaders,
  "security.framing.missing": framing,
  "security.referrer.missing": nginxHeaders,
  "security.permissions.missing": nginxHeaders,
  "security.mixed.content": mixedContent,
  "security.banner.leak": bannerLeak,
  "security.cookie.flags": cookieFlags,
};

export default FIXES;
