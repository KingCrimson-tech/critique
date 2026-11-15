import { sortFindings, countBySeverity } from "./util";
import { seoCheck } from "./seo";
import { securityCheck } from "./security";
import { contentCheck } from "./content";
import { aiReadabilityCheck } from "./ai-readability";
import { uxCheck } from "./ux";
import { stackCheck } from "./stack";

// Every check is (homepage, ctx) => Finding[] and registered here.
// A crashing check degrades to an info finding instead of killing the scan.
export const CHECKS = [
  { name: "seo", run: seoCheck },
  { name: "security", run: securityCheck },
  { name: "content", run: contentCheck },
  { name: "ai", run: aiReadabilityCheck },
  { name: "ux", run: uxCheck },
  { name: "stack", run: stackCheck },
];

export function runChecks(ctx) {
  const homepage = ctx.homepage;
  const findings = [];
  for (const check of CHECKS) {
    try {
      findings.push(...check.run(homepage, ctx));
    } catch (error) {
      findings.push({
        id: `${check.name}.crashed`,
        category: check.name,
        severity: "info",
        title: `${check.name} check crashed`,
        message: `This check failed mid-run and reported nothing. The rest of the scan is unaffected. (${error.message})`,
      });
    }
  }
  const sorted = sortFindings(findings);
  return { findings: sorted, counts: countBySeverity(sorted) };
}
