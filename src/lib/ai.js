// "Ask the AIs" — a fixed three-prompt probe of how LLMs describe a brand.
// Two providers run the same prompt set; results are cached per host for 72h
// and every fresh probe is rate-limited. This is a snapshot, not an oracle —
// the UI says so.
//
// Providers are OpenAI-compatible chat endpoints configured by env keys. With
// no keys the panel degrades honestly ("not configured") the same way PSI
// degrades without a key.

import { prisma } from "./db";
import { createHash } from "node:crypto";

export const CACHE_TTL_MS = 72 * 60 * 60 * 1000; // 72 hours
export const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;
export const RATE_LIMIT_MAX = 10; // fresh probes per viewer per day

const PROVIDERS = [
  {
    id: "groq",
    label: "Llama 3.3 70B (Groq)",
    apiKeyEnv: "GROQ_API_KEY",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama-3.3-70b-versatile",
  },
  {
    id: "openrouter",
    label: "Llama 3.3 70B (OpenRouter)",
    apiKeyEnv: "OPENROUTER_API_KEY",
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    model: "meta-llama/llama-3.3-70b-instruct:free",
  },
];

const REQUEST_TIMEOUT_MS = 25_000;

// The fixed prompt set. {brand}, {topic} and {competitor} are the only slots;
// everything else is verbatim so answers stay comparable across hosts.
export const PROMPTS = [
  {
    id: "best",
    label: "The shortlist",
    build: ({ brand, topic, competitor }) =>
      `Someone searching for ${topic} asks an AI assistant: "what are the best options for ${topic}?" ` +
      `Name the options you would actually list, in order. Then state whether ${brand} makes the list. ` +
      `Cite the URLs you would point the searcher to.`,
  },
  {
    id: "legit",
    label: "The trust check",
    build: ({ brand, topic }) =>
      `A cautious shopper asks an AI assistant: "is ${brand} legit?" ` +
      `Answer the way a careful assistant would for ${topic}: trustworthy, mixed, or avoid — and why. ` +
      `Cite the URLs behind your judgment.`,
  },
  {
    id: "vs",
    label: "The head-to-head",
    build: ({ brand, topic, competitor }) =>
      `A buyer asks an AI assistant: "${brand} vs ${competitor} for ${topic} — which one should I pick?" ` +
      `Give a straight recommendation and what would change your mind. Cite the URLs you would send the buyer to.`,
  },
];

// Strict JSON in, structured answer out — the schema every provider must return.
const SCHEMA_INSTRUCTION =
  ' Reply with ONLY a JSON object, no markdown fences, matching exactly: ' +
  '{"verdict": string (one blunt sentence), "mentioned": boolean (does the answer name the brand), ' +
  '"sentiment": "positive"|"neutral"|"negative"|"absent", ' +
  '"rank": number|null (position of the brand in any ranked list, 1-based), ' +
  '"citedUrls": string[] (the exact URLs cited, 0-5 of them)}';

export function brandFromHost(host) {
  const name = host.replace(/^www\./, "").split(".")[0];
  return name
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

// Viewer key for rate limiting: user id, else the signed anon token, else IP hash.
export function viewerKey(viewer, request) {
  if (viewer?.sessionUser?.id) return `u:${viewer.sessionUser.id}`;
  if (viewer?.anonToken) return `a:${viewer.anonToken}`;
  const ip = request?.headers?.get("x-forwarded-for") ?? "unknown";
  return `i:${createHash("sha256").update(ip).digest("hex").slice(0, 16)}`;
}

export async function rateLimitStatus(key) {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const used = await prisma.aiProbe.count({ where: { requestedBy: key, createdAt: { gte: since } } });
  return { used, remaining: Math.max(0, RATE_LIMIT_MAX - used) };
}

// A cached snapshot is free and rate-limit-immune.
export async function getCachedProbe(host) {
  const row = await prisma.aiProbe.findUnique({ where: { host } });
  if (row && Date.now() - row.createdAt.getTime() < CACHE_TTL_MS) {
    return { cached: true, createdAt: row.createdAt.toISOString(), results: row.data };
  }
  return null;
}

async function callProvider(provider, prompt) {
  const apiKey = process.env[provider.apiKeyEnv];
  if (!apiKey) {
    return { provider: provider.id, providerLabel: provider.label, ok: false, error: "not_configured" };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(provider.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: provider.model,
        temperature: 0,
        max_tokens: 600,
        messages: [{ role: "user", content: prompt + SCHEMA_INSTRUCTION }],
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const detail = res.status === 429 ? "rate_limited" : `http_${res.status}`;
      return { provider: provider.id, providerLabel: provider.label, ok: false, error: detail };
    }
    const json = await res.json();
    const text = json.choices?.[0]?.message?.content ?? "";
    const parsed = parseAnswer(text);
    if (!parsed) {
      return { provider: provider.id, providerLabel: provider.label, ok: false, error: "unparseable" };
    }
    return {
      provider: provider.id,
      providerLabel: provider.label,
      ok: true,
      ...parsed,
    };
  } catch (error) {
    const timedOut = error?.name === "AbortError";
    return {
      provider: provider.id,
      providerLabel: provider.label,
      ok: false,
      error: timedOut ? "timeout" : "unreachable",
    };
  } finally {
    clearTimeout(timer);
  }
}

function parseAnswer(text) {
  if (!text) return null;
  // Tolerate fences or chatter around the JSON object.
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const raw = JSON.parse(text.slice(start, end + 1));
    const sentiment = ["positive", "neutral", "negative", "absent"].includes(raw.sentiment)
      ? raw.sentiment
      : "neutral";
    const citedUrls = Array.isArray(raw.citedUrls)
      ? raw.citedUrls.filter((u) => typeof u === "string").slice(0, 5)
      : [];
    return {
      verdict: typeof raw.verdict === "string" ? raw.verdict.slice(0, 400) : "",
      mentioned: Boolean(raw.mentioned),
      sentiment,
      rank: Number.isFinite(raw.rank) ? raw.rank : null,
      citedUrls,
    };
  } catch {
    return null;
  }
}

// Runs (or returns cached) the full probe for a host.
export async function probeHost({ host, brand, topic, competitor, viewerKey: key }) {
  const cached = await getCachedProbe(host);
  if (cached) return cached;

  const slots = { brand, topic, competitor: competitor || `the leading ${topic} alternative` };
  const results = [];
  let anyOk = false;
  for (const prompt of PROMPTS) {
    const text = prompt.build(slots);
    const answers = await Promise.all(PROVIDERS.map((provider) => callProvider(provider, text)));
    if (answers.some((a) => a.ok)) anyOk = true;
    results.push({
      promptId: prompt.id,
      label: prompt.label,
      question: text,
      answers,
    });
  }

  // Nothing answered (no keys, all errors): do not cache the failure and do
  // not consume a rate-limit slot — the probe cost nothing.
  if (!anyOk) return { cached: false, createdAt: new Date().toISOString(), results };

  await prisma.aiProbe.upsert({
    where: { host },
    create: { host, brand, data: results, requestedBy: key },
    update: { brand, data: results, requestedBy: key, createdAt: new Date() },
  });

  return { cached: false, createdAt: new Date().toISOString(), results };
}
