"use client";

import { useEffect, useState } from "react";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";

// Renders a fix template: what/why + code (single or multi-variant) + copy + docs.

const VARIANT_LABELS = { html: "HTML", next: "Next.js", wordpress: "WordPress" };

async function highlight(code, lang) {
  if (lang === "text") return null;
  try {
    const Prism = (await import("prismjs")).default;
    await import("prismjs/components/prism-markup");
    await import("prismjs/components/prism-clike");
    await import("prismjs/components/prism-javascript");
    await import("prismjs/components/prism-css");
    await import("prismjs/components/prism-nginx");
    const grammar = Prism.languages[lang] ?? Prism.languages.markup;
    return Prism.highlight(code, grammar, lang);
  } catch {
    return null;
  }
}

function CodeBlock({ code, lang }) {
  const [highlighted, setHighlighted] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let live = true;
    highlight(code, lang).then((html) => {
      if (live) setHighlighted(html);
    });
    return () => {
      live = false;
    };
  }, [code, lang]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="relative">
      <Tooltip content={copied ? "Copied." : "Copy"}>
        <button
          type="button"
          onClick={copy}
          className="absolute right-2 top-2 z-10 border border-hairline-strong bg-paper px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-ink/60 transition-colors hover:border-ink hover:text-ink"
        >
          {copied ? "copied" : "copy"}
        </button>
      </Tooltip>
      {highlighted ? (
        <pre
          className="overflow-x-auto border border-hairline bg-ink p-4 font-mono text-[12px] leading-relaxed text-paper"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      ) : (
        <pre className="overflow-x-auto border border-hairline bg-ink p-4 font-mono text-[12px] leading-relaxed text-paper">
          {code}
        </pre>
      )}
    </div>
  );
}

export function FixPanel({ fix }) {
  if (!fix) return null;
  const variantEntries = fix.fix?.variants
    ? Object.entries(fix.fix.variants)
    : null;

  return (
    <div className="border border-hairline bg-ink/[0.025] p-4">
      <p className="font-display text-[17px] tracking-tight">{fix.what}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-ink/70">{fix.why}</p>

      <div className="mt-3">
        {variantEntries ? (
          <VariantTabs variants={variantEntries} />
        ) : fix.fix?.code ? (
          <CodeBlock code={fix.fix.code} lang={fix.fix.lang ?? "text"} />
        ) : null}
      </div>

      {fix.docs && (
        <a
          href={fix.docs}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block font-mono text-[11px] text-ink/55 underline decoration-hairline-strong underline-offset-4 hover:text-vermillion"
        >
          Reference docs ↗
        </a>
      )}
    </div>
  );
}

function VariantTabs({ variants }) {
  const [active, setActive] = useState(variants[0]?.[0]);
  const current = variants.find(([key]) => key === active) ?? variants[0];
  return (
    <div>
      <div className="flex gap-px border border-hairline">
        {variants.map(([key]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActive(key)}
            className={cn(
              "px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-colors duration-[120ms]",
              key === current[0]
                ? "bg-ink text-paper"
                : "bg-transparent text-ink/55 hover:text-ink",
            )}
          >
            {VARIANT_LABELS[key] ?? key}
          </button>
        ))}
      </div>
      <div className="mt-2">
        <CodeBlock code={current[1].code} lang={current[1].lang ?? "text"} />
      </div>
    </div>
  );
}
