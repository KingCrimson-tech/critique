import { finding } from "./util";
import { detectStack } from "../stack-detect";

// Stack detection is informational only — never scored.

export function stackCheck(page) {
  const stack = detectStack(page);
  if (!stack.length) return [];

  const group = (kind) => stack.filter((s) => s.kind === kind).map((s) => s.name);

  return [
    finding({
      id: "stack.detected",
      category: "stack",
      severity: "info",
      title: "Stack detected",
      message:
        "Detected from response headers and HTML signatures. Informational only — it never affects the score.",
      detail: {
        framework: group("framework"),
        cms: group("cms"),
        hosting: [...group("hosting"), ...group("server")],
        cdn: group("cdn"),
        analytics: group("analytics"),
        libraries: [...group("library"), ...group("generator")],
        other: group("other"),
        raw: stack.map((s) => ({ name: s.name, kind: s.kind, evidence: s.evidence })),
      },
      page: page.finalUrl,
    }),
  ];
}
