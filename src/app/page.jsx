"use client";

import { useState } from "react";
import { Button, Input, Tooltip, useToast } from "@/components/ui";

const CATEGORIES = [
  {
    n: "01",
    name: "SEO",
    line: "Can search engines index you without guessing? Titles, canonicals, schema, sitemaps.",
  },
  {
    n: "02",
    name: "Performance",
    line: "How heavy is the page, and who pays for it? Lab scores plus real-user field data.",
  },
  {
    n: "03",
    name: "Accessibility",
    line: "Does it work with a keyboard and a screen reader? Violations counted, not vibes.",
  },
  {
    n: "04",
    name: "Security",
    line: "What do your headers announce to a stranger? HSTS, CSP, cookies, banner leaks.",
  },
  {
    n: "05",
    name: "Content",
    line: "Is it readable, or just publishable? Reading level, thin pages, duplicates.",
  },
  {
    n: "06",
    name: "AI readability",
    line: "Can the machines quote you correctly? Crawler rules, server-rendered text, schema.",
  },
  {
    n: "07",
    name: "UX",
    line: "Does the page ask for the action you want? CTAs, labels, above-the-fold honesty.",
  },
];

const URL_PATTERN = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}([/?#].*)?$/i;

export default function LandingPage() {
  const toast = useToast();
  const [url, setUrl] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const value = url.trim();
    if (!URL_PATTERN.test(value)) {
      toast({
        title: "That is not a URL.",
        description: "Give me a domain, like example.com.",
      });
      return;
    }
    toast({
      title: "The crawler lands in Phase 2.",
      description: "This form is structural for now. Engine first, then findings.",
    });
  }

  function handleSample() {
    toast({
      title: "The sample report ships with the scoring engine.",
      description: "Phase 3 gives every finding a fix and a price.",
    });
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      {/* hero */}
      <section className="border-b border-hairline pb-16 pt-16 sm:pb-20 sm:pt-24">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink/55">
          An editorial review of the web
        </p>
        <h1 className="mt-4 max-w-4xl text-hero leading-[0.95] tracking-tight">
          Your website,
          <br />
          reviewed <em className="italic text-vermillion">without mercy.</em>
        </h1>
        <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-ink/70">
          Paste a URL. Get a blunt audit of SEO, performance, accessibility,
          security, content, and AI-readability — every finding priced with a
          concrete fix, not a shrug.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 flex max-w-2xl flex-col gap-3 sm:flex-row">
          <label htmlFor="url" className="sr-only">
            Site URL
          </label>
          <Input
            id="url"
            name="url"
            type="text"
            inputMode="url"
            autoComplete="url"
            spellCheck={false}
            placeholder="example.com"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
          <Button type="submit" variant="accent" size="lg" className="sm:w-44">
            Run the audit
          </Button>
        </form>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-ink/50">
          One free scan, no account. Sign in later to keep history.
        </p>

        <Tooltip content="Full report lands with the scoring engine.">
          <button
            type="button"
            onClick={handleSample}
            className="mt-8 font-mono text-data text-ink underline decoration-hairline-strong underline-offset-4 transition-colors hover:text-vermillion"
          >
            Read the sample report →
          </button>
        </Tooltip>
      </section>

      {/* what we check */}
      <section id="checks" className="scroll-mt-20 py-14 sm:py-20">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink/55">
          What we check
        </p>
        <ul className="mt-6">
          {CATEGORIES.map((category) => (
            <li
              key={category.n}
              className="group grid grid-cols-[3rem_9rem_1fr] items-baseline gap-4 border-t border-hairline py-4 last:border-b sm:grid-cols-[4rem_11rem_1fr] sm:py-5"
            >
              <span className="font-mono text-data text-ink/45 transition-colors group-hover:text-vermillion">
                {category.n}
              </span>
              <span className="font-display text-[19px] tracking-tight sm:text-[21px]">
                {category.name}
              </span>
              <span className="text-[13.5px] leading-relaxed text-ink/65">
                {category.line}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
