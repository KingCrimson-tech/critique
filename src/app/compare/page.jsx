"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Progress } from "@/components/ui";
import { cn } from "@/lib/cn";

const CATEGORY_ORDER = ["seo", "performance", "accessibility", "ai", "security", "content", "ux"];
const LABELS = {
  seo: "SEO",
  performance: "Performance",
  accessibility: "Accessibility",
  ai: "AI readability",
  security: "Security",
  content: "Content",
  ux: "UX",
};

const BAND = { good: "text-green", mid: "text-amber", bad: "text-vermillion" };
const VERDICT_CLASS = {
  good: "text-green",
  "needs-work": "text-amber",
  poor: "text-vermillion",
};
function bandClass(score) {
  return score >= 80 ? BAND.good : score >= 50 ? BAND.mid : BAND.bad;
}

function formatCwv(key, psi) {
  const m = psi?.ok ? psi.metrics?.[key] : null;
  if (!m || m.value === null || m.value === undefined) return "—";
  if (key === "cls") return m.value.toFixed(3);
  if (m.value >= 1000) return `${(m.value / 1000).toFixed(1)}s`;
  return `${Math.round(m.value)}ms`;
}

export default function ComparePage() {
  const [scans, setScans] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ids = new URLSearchParams(window.location.search).get("ids");
    if (!ids) {
      setError("No scans picked. Open a report and use Share → Compare.");
      return;
    }
    const list = ids.split(",").slice(0, 3);
    Promise.all(
      list.map((id) =>
        fetch(`/api/scan/${id}`)
          .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`scan ${id} not found`)))),
      ),
    )
      .then(setScans)
      .catch((e) => setError(e.message));
  }, []);

  if (error)
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="font-mono text-data text-vermillion">{error}</p>
        <Link href="/" className="mt-4 inline-block font-mono text-data underline underline-offset-4">
          ← Back to the audit form
        </Link>
      </div>
    );

  if (!scans)
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 font-mono text-data text-ink/45 sm:px-6">
        Loading scans…
      </div>
    );

  const winners = {};
  for (const category of CATEGORY_ORDER) {
    const scored = scans
      .map((scan) => ({ id: scan.id, score: scan.score.categories[category]?.score }))
      .filter((entry) => typeof entry.score === "number");
    if (scored.length >= 2) {
      const top = Math.max(...scored.map((s) => s.score));
      const leaders = scored.filter((s) => s.score === top);
      if (leaders.length === 1) winners[category] = leaders[0].id;
    }
  }
  const leaderCount = Object.values(winners).reduce((acc, id) => {
    acc[id] = (acc[id] ?? 0) + 1;
    return acc;
  }, {});
  const champion = Object.entries(leaderCount).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-headline tracking-tight">Head to head</h1>
        <Link href="/" className="font-mono text-data text-ink/55 hover:text-vermillion">
          New audit →
        </Link>
      </div>
      {champion && (
        <p className="mt-1 text-[15px] text-ink/70">
          <span className="font-medium">{new URL(scans.find((s) => s.id === champion[0]).url).host}</span>{" "}
          leads {champion[1]} of {CATEGORY_ORDER.length} categories.
        </p>
      )}

      {/* overall numerals */}
      <div
        className="mt-8 grid gap-px border border-hairline bg-hairline"
        style={{ gridTemplateColumns: `repeat(${scans.length}, minmax(0, 1fr))` }}
      >
        {scans.map((scan) => (
          <div key={scan.id} className="bg-paper p-5">
            <p className="truncate font-mono text-[11px] uppercase tracking-widest text-ink/55">
              {new URL(scan.url).host}
            </p>
            <p
              className={cn(
                "mt-2 font-display leading-none",
                bandClass(scan.score.overall),
              )}
              style={{ fontSize: "clamp(3.5rem, 8vw, 5.5rem)" }}
            >
              {scan.score.overall}
            </p>
            <div className="mt-3 w-28">
              <Progress value={scan.score.overall} />
            </div>
            <p className="mt-2 text-[13px] text-ink/70">{scan.score.verdict.title}</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink/40">
              {scan.findings.length} findings · {scan.hasPsi ? "psi ✓" : "no psi"}
            </p>
          </div>
        ))}
      </div>

      {/* per-category with explicit winner */}
      <table className="mt-8 w-full">
        <thead>
          <tr className="border-b border-hairline-strong font-mono text-[11px] uppercase tracking-widest text-ink/50">
            <th className="py-2 pr-3 text-left">Category</th>
            {scans.map((scan) => (
              <th key={scan.id} className="py-2 text-right">
                {new URL(scan.url).host}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CATEGORY_ORDER.map((category) => (
            <tr key={category} className="border-b border-hairline">
              <td className="py-3 pr-3 font-mono text-data uppercase tracking-widest text-ink/70">
                {LABELS[category]}
              </td>
              {scans.map((scan) => {
                const category2 = scan.score.categories[category];
                const isWinner = winners[category] === scan.id;
                return (
                  <td key={scan.id} className="py-3 text-right">
                    {category2.pending ? (
                      <span className="font-display text-[20px] text-ink/25">—</span>
                    ) : (
                      <span className={cn("font-display text-[20px]", bandClass(category2.score))}>
                        {isWinner && scans.length > 1 && <span className="mr-1 text-vermillion">▸</span>}
                        {category2.score}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* core web vitals */}
      <div className="mt-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink/55">
          Core Web Vitals — lab, mobile
        </p>
        <table className="mt-3 w-full">
          <thead>
            <tr className="border-b border-hairline-strong font-mono text-[11px] uppercase tracking-widest text-ink/50">
              <th className="py-2 pr-3 text-left">Metric</th>
              {scans.map((scan) => (
                <th key={scan.id} className="py-2 text-right">
                  {new URL(scan.url).host}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ["lcp", "LCP"],
              ["cls", "CLS"],
              ["tbt", "TBT"],
              ["fcp", "FCP"],
            ].map(([key, label]) => (
              <tr key={key} className="border-b border-hairline">
                <td className="py-2.5 pr-3 font-mono text-data text-ink/70">{label}</td>
                {scans.map((scan) => (
                  <td
                    key={scan.id}
                    className={cn(
                      "py-2.5 text-right font-mono text-data",
                      scan.psi?.ok ? VERDICT_CLASS[scan.psi.metrics?.[key]?.verdict] : "text-ink/30",
                    )}
                  >
                    {formatCwv(key, scan.psi)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {scans.some((s) => !s.psi?.ok) && (
          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-ink/40">
            "—" means PSI did not answer for that scan. Nothing was scored zero for it.
          </p>
        )}
      </div>
    </div>
  );
}
