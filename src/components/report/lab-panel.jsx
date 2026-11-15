"use client";

import { formatMs } from "@/lib/psi";

const METRIC_LABELS = {
  lcp: "LCP",
  cls: "CLS",
  tbt: "TBT",
  fcp: "FCP",
  si: "Speed index",
};

const VERDICT_CLASS = {
  good: "text-green",
  "needs-work": "text-amber",
  poor: "text-vermillion",
};

function formatValue(key, metric) {
  if (metric.value === null || metric.value === undefined) return "—";
  if (key === "cls") return metric.value.toFixed(3);
  return formatMs(metric.value);
}

export function LabPanel({ psi }) {
  if (!psi || !psi.ok)
    return (
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink/55">
          Lab data
        </p>
        <p className="mt-3 border border-hairline p-4 text-[13px] leading-relaxed text-ink/60">
          PageSpeed Insights did not answer in time, so no lab or field data this round.
          The scores above stand on crawler evidence alone — re-scan later for the full picture.
        </p>
      </div>
    );

  const metrics = psi.metrics ?? {};
  const field = psi.field;

  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink/55">
        Lab data — PageSpeed Insights, mobile
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-px border border-hairline bg-hairline sm:grid-cols-3">
        {Object.entries(METRIC_LABELS).map(([key, label]) => {
          const metric = metrics[key];
          return (
            <div key={key} className="bg-paper p-3">
              <dt className="font-mono text-[10px] uppercase tracking-widest text-ink/45">
                {label}
              </dt>
              <dd className={`mt-1 font-display text-[24px] ${VERDICT_CLASS[metric?.verdict] ?? ""}`}>
                {metric ? formatValue(key, metric) : "—"}
              </dd>
            </div>
          );
        })}
      </dl>

      {psi.violations?.length > 0 && (
        <div className="mt-4">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink/45">
            {psi.violations.length} accessibility audit{psi.violations.length > 1 ? "s" : ""} failing
          </p>
          <ul className="mt-2 border border-hairline">
            {psi.violations.map((v) => (
              <li
                key={v.id}
                className="flex items-baseline justify-between gap-4 border-b border-hairline px-3 py-2 last:border-b-0"
              >
                <span className="text-[13px] leading-snug">{v.title}</span>
                <span className="shrink-0 font-mono text-[11px] text-ink/50">
                  {v.displayValue ?? "fails"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 border border-hairline p-3 font-mono text-data">
        <p className="text-[10px] uppercase tracking-widest text-ink/45">
          Field data — real users (CrUX)
        </p>
        {field ? (
          <p className="mt-1">
            {field.overall ?? "measured"} ·{" "}
            {["fcp", "lcp", "cls", "inp", "fid"]
              .filter((key) => field.metrics?.[key])
              .map((key) => {
                const m = field.metrics[key];
                const unit = key === "cls" ? "" : "ms";
                return `${key.toUpperCase()} ${m.percentile}${unit} (${m.category.toLowerCase()})`;
              })
              .join(" · ")}
          </p>
        ) : (
          <p className="mt-1 text-ink/55">
            No real-user data for this URL — not enough Chrome traffic yet. Lab numbers above stand in.
          </p>
        )}
      </div>
    </div>
  );
}
