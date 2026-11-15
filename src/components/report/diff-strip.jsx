"use client";

import { CATEGORY_LABELS } from "@/lib/score";

// Shown on re-scans of a known site: what moved since the previous scan.
export function DiffStrip({ diff }) {
  if (!diff) return null;

  const movers = Object.entries(diff.categories ?? {})
    .filter(([, c]) => c.delta !== null && c.delta !== undefined && c.delta !== 0)
    .map(([key, c]) => ({
      label: CATEGORY_LABELS[key] ?? key,
      delta: c.delta,
    }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 5);

  return (
    <div className="print-avoid-break mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border border-hairline px-4 py-3 font-mono text-[11px] uppercase tracking-widest">
      <span className="text-ink/45">vs previous scan</span>
      {diff.overallDelta !== null && diff.overallDelta !== undefined && (
        <span className={diff.overallDelta > 0 ? "text-green" : diff.overallDelta < 0 ? "text-vermillion" : "text-ink/45"}>
          overall {diff.overallDelta > 0 ? "+" : "−"}
          {Math.abs(diff.overallDelta)}
        </span>
      )}
      {movers.map((m) => (
        <span
          key={m.label}
          className={m.delta > 0 ? "text-green" : "text-vermillion"}
        >
          {m.label} {m.delta > 0 ? "+" : "−"}
          {Math.abs(m.delta)}
        </span>
      ))}
      <span className="text-ink/55">
        {diff.fixedCount} fixed · {diff.addedCount} new
      </span>
    </div>
  );
}
