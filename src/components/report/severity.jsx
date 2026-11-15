import { PENALTY } from "@/lib/score";

const SEV_CLASS = {
  critical: "border-vermillion text-vermillion",
  high: "border-amber text-amber",
  medium: "border-ink text-ink",
  low: "border-ink/40 text-ink/60",
  info: "border-ink/20 text-ink/40",
};

export function SeverityTag({ severity }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-xs border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest ${SEV_CLASS[severity] ?? SEV_CLASS.info}`}
    >
      {severity}
    </span>
  );
}

export function penaltyOf(finding) {
  return PENALTY[finding.severity] ?? 0;
}
