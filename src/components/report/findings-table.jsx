"use client";

import { useMemo, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui";
import { getFix } from "@/lib/fixes";
import { SeverityTag } from "./severity";
import { FixPanel } from "./fix-panel";

const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

export function FindingsTable({ findings }) {
  const [severity, setSeverity] = useState("all");
  const [scope, setScope] = useState("all");

  const filtered = useMemo(
    () =>
      findings.filter((f) => {
        if (severity !== "all" && f.severity !== severity) return false;
        if (scope === "sitewide" && f.page) return false;
        if (scope === "page" && !f.page) return false;
        return true;
      }),
    [findings, severity, scope],
  );

  const fixable = useMemo(
    () =>
      [...findings]
        .filter((f) => f.severity !== "info")
        .sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]),
    [findings],
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
      <div>
        <div className="no-print flex flex-wrap items-center gap-3">
          <ToggleGroup
            type="single"
            value={severity}
            onValueChange={(v) => v && setSeverity(v)}
            aria-label="Severity filter"
          >
            {["all", "critical", "high", "medium", "low"].map((sev) => (
              <ToggleGroupItem key={sev} value={sev}>
                {sev}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <ToggleGroup
            type="single"
            value={scope}
            onValueChange={(v) => v && setScope(v)}
            aria-label="Scope filter"
          >
            <ToggleGroupItem value="all">all</ToggleGroupItem>
            <ToggleGroupItem value="sitewide">sitewide</ToggleGroupItem>
            <ToggleGroupItem value="page">page</ToggleGroupItem>
          </ToggleGroup>
          <span className="font-mono text-[11px] text-ink/45">
            {filtered.length} of {findings.length}
          </span>
        </div>

        <Accordion type="single" collapsible className="mt-4">
          {filtered.map((f) => (
            <FindingRow key={f.id} finding={f} />
          ))}
          {filtered.length === 0 && (
            <p className="border-b border-hairline py-6 font-mono text-data text-ink/45">
              No findings at this filter. That is a good sign, or a too-narrow filter.
            </p>
          )}
        </Accordion>
      </div>

      {/* ranked fix queue — impact order, cheapest first */}
      <aside className="no-print">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink/55">
          Fix queue
        </p>
        <ol className="mt-3 border border-hairline">
          {fixable.map((f, i) => (
            <li
              key={f.id}
              className="flex items-start gap-3 border-b border-hairline px-3 py-2.5 last:border-b-0"
            >
              <span className="font-mono text-[10px] text-ink/35">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-[12.5px] leading-snug text-ink/80">{f.title}</span>
            </li>
          ))}
          {fixable.length === 0 && (
            <li className="px-3 py-3 font-mono text-data text-ink/45">Nothing to fix.</li>
          )}
        </ol>
      </aside>
    </div>
  );
}

function FindingRow({ finding }) {
  return (
    <AccordionItem value={finding.id}>
      <AccordionTrigger className="items-start py-4">
        <div className="flex flex-1 flex-col gap-1.5 pr-2">
          <div className="flex flex-wrap items-center gap-3">
            <SeverityTag severity={finding.severity} />
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink/40">
              {finding.category}
            </span>
          </div>
          <span className="text-[15px] font-medium leading-snug tracking-tight">
            {finding.title}
          </span>
          <span className="max-w-3xl text-[13px] leading-relaxed text-ink/60">
            {finding.message}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="flex flex-col gap-3">
          {finding.page && (
            <p className="font-mono text-[10px] break-all text-ink/40">
              evidence: {finding.page}
            </p>
          )}
          {finding.detail && (
            <details className="border border-hairline p-3">
              <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-widest text-ink/50">
                Detail
              </summary>
              <pre className="mt-2 overflow-x-auto font-mono text-[11px] leading-relaxed text-ink/65">
                {JSON.stringify(finding.detail, null, 2)}
              </pre>
            </details>
          )}
          <FixLoader id={finding.id} />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

// Fix templates are resolved at render time, not stored on the scan.
function FixLoader({ id }) {
  const fix = getFix(id);
  if (!fix) return null;
  return (
    <div>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/45">
        The fix
      </p>
      <FixPanel fix={fix} />
    </div>
  );
}
