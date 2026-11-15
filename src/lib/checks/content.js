import { finding } from "./util";

// Content checks — readability, near-duplicates, freshness, structure.

function syllables(word) {
  const clean = word.toLowerCase().replace(/[^a-z]/g, "");
  if (clean.length <= 3) return 1;
  const groups = clean
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
    .replace(/^y/, "")
    .match(/[aeiouy]{1,2}/g);
  return groups ? groups.length : 1;
}

export function fleschReadingEase(text) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 100) return null;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const sentenceCount = Math.max(1, sentences.length);
  const syllableCount = words.reduce((sum, w) => sum + syllables(w), 0);
  return (
    206.835 - 1.015 * (words.length / sentenceCount) - 84.6 * (syllableCount / words.length)
  );
}

// cyrb53 — fast 53-bit string hash.
function hash53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

function simhash(text) {
  const shingles = [];
  const words = text.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter(Boolean);
  for (let i = 0; i < words.length - 2; i++) shingles.push(words.slice(i, i + 3).join(" "));
  if (!shingles.length) return 0n;
  const bits = new Array(64).fill(0);
  for (const shingle of shingles) {
    const h = hash53(shingle);
    for (let b = 0; b < 64; b++) bits[b] += (h >> b) & 1 ? 1 : -1;
  }
  let value = 0n;
  for (let b = 0; b < 64; b++) if (bits[b] > 0) value |= 1n << BigInt(b);
  return value;
}

function hamming(a, b) {
  let x = a ^ b;
  let distance = 0;
  while (x) {
    distance += 1;
    x &= x - 1n;
  }
  return distance;
}

export function contentCheck(page, ctx) {
  const out = [];

  // -- readability ---------------------------------------------------
  const flesch = fleschReadingEase(page.text ?? "");
  if (flesch !== null) {
    const score = Math.round(flesch);
    if (score < 30)
      out.push(
        finding({
          id: "content.readability.low",
          category: "content",
          severity: "medium",
          title: `Reading ease ${score}/100 — graduate level`,
          message:
            "Your homepage reads like a contract. Most visitors skim; sentences this dense get abandoned. Shorten sentences, simpler words, more paragraphs.",
          detail: { flesch: score },
          page: page.finalUrl,
        }),
      );
    else if (score < 50)
      out.push(
        finding({
          id: "content.readability.dense",
          category: "content",
          severity: "low",
          title: `Reading ease ${score}/100 — college level`,
          message: "Dense but survivable. Cutting average sentence length in half would move this up a full band.",
          detail: { flesch: score },
          page: page.finalUrl,
        }),
      );
  }

  // -- near-duplicate pages (simhash) --------------------------------
  {
    const hashed = ctx.pages
      .filter((p) => p.wordCount >= 50)
      .map((p) => ({ url: p.finalUrl, hash: simhash(p.text ?? "") }));
    const pairs = [];
    for (let i = 0; i < hashed.length; i++) {
      for (let j = i + 1; j < hashed.length; j++) {
        const distance = hamming(hashed[i].hash, hashed[j].hash);
        if (distance <= 8) pairs.push({ a: hashed[i].url, b: hashed[j].url, distance });
      }
    }
    if (pairs.length)
      out.push(
        finding({
          id: "content.near.duplicate",
          category: "content",
          severity: "medium",
          title: `${pairs.length} near-duplicate page pair${pairs.length > 1 ? "s" : ""}`,
          message:
            "These pages are reworded copies of each other. Search engines pick one winner and ignore the losers — merge them.",
          detail: { pairs: pairs.slice(0, 5) },
        }),
      );
  }

  // -- freshness signal ----------------------------------------------
  {
    const lastModified = page.headers["last-modified"];
    const hasSchemaDate = /datepublished|datemodified/i.test(page.html);
    const hasOgDate = /article:modified_time|article:published_time/i.test(page.html);
    if (!lastModified && !hasSchemaDate && !hasOgDate)
      out.push(
        finding({
          id: "content.freshness.missing",
          category: "content",
          severity: "low",
          title: "No freshness signal",
          message:
            "Nothing says when this was written or updated — no dateModified, no article:modified_time, no Last-Modified header. Readers and ranking systems both look for it.",
          page: page.finalUrl,
        }),
      );
  }

  // -- heading structure on long pages -------------------------------
  {
    const h2s = page.headings.filter((h) => h.level === 2).length;
    if (page.wordCount > 1500 && h2s === 0)
      out.push(
        finding({
          id: "content.structure.wall",
          category: "content",
          severity: "medium",
          title: `${page.wordCount} words, zero subheadings`,
          message:
            "You shipped a wall of text. Readers scan first and read second; without h2s they scan nothing and leave.",
          page: page.finalUrl,
        }),
      );
  }

  return out;
}
