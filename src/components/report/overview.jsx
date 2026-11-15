"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/cn";

const BAND = {
  good: "text-green",
  mid: "text-amber",
  bad: "text-vermillion",
};

function bandClass(score) {
  if (score >= 80) return BAND.good;
  if (score >= 50) return BAND.mid;
  return BAND.bad;
}

export function ScoreHeader({ scan }) {
  const { score, counts } = scan;
  return (
    <div className="grid gap-8 border-b border-hairline pb-10 lg:grid-cols-[auto_1fr] lg:gap-16">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink/55">
          Overall score
        </p>
        <p
          className={cn(
            "mt-2 font-display leading-none tracking-tight",
            bandClass(score.overall),
          )}
          style={{ fontSize: "clamp(5rem, 12vw, 7.5rem)" }}
        >
          {score.overall}
        </p>
        <div className="mt-4 w-48">
          <Progress value={score.overall} />
        </div>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-ink/50">
          {score.deductedTotal} points deducted · rubric {score.scoreVersion}
        </p>
      </div>

      <div className="flex flex-col justify-end gap-3">
        <h1 className="font-display text-display leading-[1.05] tracking-tight">
          {score.verdict.title}
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-ink/70">
          {score.verdict.line}
        </p>
        <dl className="mt-2 grid grid-cols-2 gap-x-8 gap-y-1 font-mono text-data sm:grid-cols-4">
          <div>
            <dt className="text-ink/50">URL</dt>
            <dd className="truncate" title={scan.url}>
              {new URL(scan.url).host}
            </dd>
          </div>
          <div>
            <dt className="text-ink/50">Pages</dt>
            <dd>{scan.pages.length}</dd>
          </div>
          <div>
            <dt className="text-ink/50">Findings</dt>
            <dd>
              {scan.findings.length}{" "}
              <span className={counts.critical ? "text-vermillion" : "text-ink/40"}>
                ({counts.critical} critical)
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-ink/50">Scan time</dt>
            <dd>{(scan.stats.elapsedMs / 1000).toFixed(1)}s</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

export function CategoryRail({ score }) {
  const entries = Object.entries(score.categories);
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink/55">
        Category rail
      </p>
      <ul className="mt-3">
        {entries.map(([key, category]) => {
          const label = {
            seo: "SEO",
            performance: "Performance",
            accessibility: "Accessibility",
            ai: "AI readability",
            security: "Security",
            content: "Content",
            ux: "UX",
          }[key];
          return (
            <li
              key={key}
              className="grid grid-cols-[9rem_3rem_1fr] items-center gap-3 border-t border-hairline py-2.5 sm:grid-cols-[11rem_4rem_1fr]"
            >
              <span className="font-mono text-data uppercase tracking-widest text-ink/70">
                {label}
              </span>
              <span
                className={cn(
                  "text-right font-display text-[20px]",
                  category.pending ? "text-ink/25" : bandClass(category.score),
                )}
              >
                {category.pending ? "—" : category.score}
              </span>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Progress
                    value={category.pending ? 0 : category.score}
                    className={category.pending ? "opacity-30" : undefined}
                  />
                </div>
                <span className="w-40 text-right font-mono text-[10px] uppercase tracking-widest text-ink/40">
                  {category.pending
                    ? "lab data pending"
                    : `w ${category.weight.toFixed(2)} · −${category.deducted}`}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 border-t border-hairline pt-2 font-mono text-[10px] uppercase tracking-widest text-ink/40">
        Performance + accessibility join the overall score in Phase 4, when lab data runs.
      </p>
    </div>
  );
}

export function StackPanel({ findings }) {
  const stack = findings.find((f) => f.id === "stack.detected");
  if (!stack) return null;
  const groups = [
    ["framework", "Framework"],
    ["cms", "CMS"],
    ["hosting", "Hosting"],
    ["cdn", "CDN"],
    ["analytics", "Analytics"],
    ["libraries", "Libraries"],
  ].map(([key, label]) => [label, stack.detail?.[key] ?? []]);
  const present = groups.filter(([, names]) => names.length);
  if (!present.length) return null;
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink/55">
        Stack — informational, never scored
      </p>
      <dl className="mt-3 grid grid-cols-[8rem_1fr] gap-x-4 gap-y-1.5 border border-hairline p-4 font-mono text-data sm:grid-cols-[10rem_1fr]">
        {present.map(([label, names]) => (
          <div key={label} className="contents">
            <dt className="text-ink/45">{label}</dt>
            <dd>{names.join(", ")}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function TopCosts({ findings }) {
  const top = findings
    .filter((f) => f.severity !== "info")
    .slice(0, 3);
  if (!top.length) return null;
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink/55">
        Biggest deductions
      </p>
      <ul className="mt-3 border border-hairline">
        {top.map((f) => (
          <li
            key={f.id}
            className="flex items-baseline justify-between gap-4 border-b border-hairline px-4 py-3 last:border-b-0"
          >
            <span className="text-[14px] leading-snug">{f.title}</span>
            <span className="shrink-0 font-mono text-data text-vermillion">
              −{penalty(f)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function penalty(f) {
  return { critical: 25, high: 12, medium: 5, low: 2 }[f.severity] ?? 0;
}
