// Stack detection from response headers + HTML signatures.
// Informational only — never scored.

const HEADER_SIGNATURES = [
  { key: "x-vercel-id", name: "Vercel", kind: "hosting" },
  { key: "x-nextjs-cache", name: "Next.js", kind: "framework" },
  { key: "cf-ray", name: "Cloudflare", kind: "cdn" },
  { key: "x-amz-cf-id", name: "CloudFront", kind: "cdn" },
  { key: "x-fastly-request-id", name: "Fastly", kind: "cdn" },
  { key: "x-akamai-transformed", name: "Akamai", kind: "cdn" },
  { key: "x-github-request-id", name: "GitHub Pages", kind: "hosting" },
  { key: "x-shopify-stage", name: "Shopify", kind: "cms" },
  { key: "x-drupal-cache", name: "Drupal", kind: "cms" },
  { key: "x-generator", name: null, kind: "generator" }, // value inspected separately
  { key: "x-powered-by", name: null, kind: "generator" }, // value inspected separately
  { key: "x-litespeed-cache", name: "LiteSpeed", kind: "server" },
];

const HTML_SIGNATURES = [
  { pattern: /__NEXT_DATA__|\/_next\/static/i, name: "Next.js", kind: "framework" },
  { pattern: /__NUXT__|\/_nuxt\//i, name: "Nuxt", kind: "framework" },
  { pattern: /__sveltekit|\/_app\/immutable/i, name: "SvelteKit", kind: "framework" },
  { pattern: /astro-island|astro-/i, name: "Astro", kind: "framework" },
  { pattern: /___gatsby|gatsby-/i, name: "Gatsby", kind: "framework" },
  { pattern: /data-reactroot|react-dom|_reactListening/i, name: "React", kind: "framework" },
  { pattern: /data-v-app|vue(?:\.runtime)?(?:\.min)?\.js/i, name: "Vue", kind: "framework" },
  { pattern: /wp-content|wp-includes|wp-json/i, name: "WordPress", kind: "cms" },
  { pattern: /cdn\.shopify\.com|shopify\.theme|myshopify\.com/i, name: "Shopify", kind: "cms" },
  { pattern: /sites\/all\/|drupal\.js|drupal-settings-json/i, name: "Drupal", kind: "cms" },
  { pattern: /\/media\/jui\/|option=com_content/i, name: "Joomla", kind: "cms" },
  { pattern: /static\.ghost\.org|ghost-sdk|content_api_key/i, name: "Ghost", kind: "cms" },
  { pattern: /squarespace\.com|sqs-/i, name: "Squarespace", kind: "cms" },
  { pattern: /wix(?:static|apps)|x-wix/i, name: "Wix", kind: "cms" },
  { pattern: /webflow(?:\.js|-cdn)/i, name: "Webflow", kind: "cms" },
  { pattern: /laravel_session|\/vendor\/livewire/i, name: "Laravel", kind: "framework" },
  { pattern: /csrfmiddlewaretoken/i, name: "Django", kind: "framework" },
  { pattern: /csrf-param|rails-ujs|turbo-/i, name: "Ruby on Rails", kind: "framework" },
  { pattern: /googletagmanager\.com|gtag\/js|google-analytics\.com/i, name: "Google Analytics / GTM", kind: "analytics" },
  { pattern: /plausible\.io/i, name: "Plausible", kind: "analytics" },
  { pattern: /usefathom\.com/i, name: "Fathom", kind: "analytics" },
  { pattern: /cloudflareinsights\.com/i, name: "Cloudflare Web Analytics", kind: "analytics" },
  { pattern: /static\.hotjar\.com/i, name: "Hotjar", kind: "analytics" },
  { pattern: /connect\.facebook\.net/i, name: "Meta Pixel", kind: "analytics" },
  { pattern: /clarity\.ms/i, name: "Microsoft Clarity", kind: "analytics" },
  { pattern: /cdn\.segment\.com/i, name: "Segment", kind: "analytics" },
  { pattern: /js\.intercom(?:cdn)?\.com/i, name: "Intercom", kind: "analytics" },
  { pattern: /js\.hs-scripts\.com/i, name: "HubSpot", kind: "analytics" },
  { pattern: /_vercel\/insights|va\.vercel-scripts\.com/i, name: "Vercel Analytics", kind: "analytics" },
  { pattern: /cdn\.cookiebot\.com|cookieyes|onetrust/i, name: "Consent manager (Cookiebot/OneTrust)", kind: "other" },
  { pattern: /jquery[-.\d]*\.js/i, name: "jQuery", kind: "library" },
  { pattern: /tailwind/i, name: "Tailwind CSS", kind: "library" },
  { pattern: /bootstrap(?:\.min)?\.css/i, name: "Bootstrap", kind: "library" },
];

const GENERATOR_PATTERNS = [
  { pattern: /wordpress/i, name: "WordPress", kind: "cms" },
  { pattern: /next\.js/i, name: "Next.js", kind: "framework" },
  { pattern: /gatsby/i, name: "Gatsby", kind: "framework" },
  { pattern: /joomla/i, name: "Joomla", kind: "cms" },
  { pattern: /drupal/i, name: "Drupal", kind: "cms" },
  { pattern: /ghost/i, name: "Ghost", kind: "cms" },
  { pattern: /hugo/i, name: "Hugo", kind: "framework" },
];

function cleanVersion(value) {
  return String(value).split(";")[0].trim().slice(0, 120);
}

export function detectStack(page) {
  const detected = new Map();

  const add = (name, kind, evidence) => {
    if (!name) return;
    const key = name.toLowerCase();
    if (!detected.has(key)) detected.set(key, { name, kind, evidence: [] });
    detected.get(key).evidence.push(evidence);
  };

  for (const sig of HEADER_SIGNATURES) {
    const value = page.headers[sig.key];
    if (!value) continue;
    if (sig.name === null) {
      for (const gen of GENERATOR_PATTERNS) {
        if (gen.pattern.test(value)) add(gen.name, gen.kind, `${sig.key}: ${cleanVersion(value)}`);
      }
      if (sig.key === "x-powered-by" && !/wordpress|next|gatsby|php|express/i.test(value)) {
        add(cleanVersion(value), "generator", `x-powered-by: ${cleanVersion(value)}`);
      }
    } else {
      add(sig.name, sig.kind, `${sig.key} header`);
    }
  }

  const server = page.headers["server"];
  if (server && /\d/.test(server)) {
    add(server.split("/")[0].trim(), "server", `server banner exposes version: ${cleanVersion(server)}`);
  }

  const html = page.html ?? "";
  for (const sig of HTML_SIGNATURES) {
    if (sig.pattern.test(html)) add(sig.name, sig.kind, "html signature");
  }

  const generator = page.html.match(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)/i);
  if (generator) add(cleanVersion(generator[1]), "generator", "meta generator tag");

  return [...detected.values()];
}
