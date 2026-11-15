// Scoring rubric — v1.
// category score = max(0, 100 − Σ severity penalties)
// penalties: critical 25 · high 12 · medium 5 · low 2 · info 0
// Stack findings are informational and never scored.
// Performance + Accessibility score from PSI field data in Phase 4;
// until then they are pending and their weight redistributes.

export const SCORE_VERSION = "v1";

export const PENALTY = { critical: 25, high: 12, medium: 5, low: 2, info: 0 };

export const WEIGHTS = {
  seo: 0.25,
  performance: 0.2,
  accessibility: 0.15,
  ai: 0.15,
  security: 0.1,
  content: 0.1,
  ux: 0.05,
};

export const CATEGORY_LABELS = {
  seo: "SEO",
  performance: "Performance",
  accessibility: "Accessibility",
  ai: "AI readability",
  security: "Security",
  content: "Content",
  ux: "UX",
};

const PENDING_UNTIL_PSI = ["performance", "accessibility"];

function verdictFor(overall) {
  if (overall >= 90)
    return { title: "Ship-ready.", line: "Nothing here is blocking. Fix the small stuff on a quiet afternoon." };
  if (overall >= 80)
    return { title: "Solid, with leaks.", line: "Good bones. The deductions below are cheap to close and worth real points." };
  if (overall >= 60)
    return { title: "Passable, and leaking.", line: "It works, it ranks worse than it should, and the gap is growing every week." };
  if (overall >= 40)
    return { title: "This is costing you visitors.", line: "Search engines, screen readers, or security scanners are already filing you under 'avoid'." };
  return { title: "Structurally broken.", line: "Fix the criticals first. Everything else is decoration until they are gone." };
}

export function computeScore(findings, psi = null) {
  const categories = {};
  let deductedTotal = 0;

  for (const [category, weight] of Object.entries(WEIGHTS)) {
    if (PENDING_UNTIL_PSI.includes(category)) {
      const psiScore =
        psi?.ok &&
        (category === "performance" ? psi.scores.performance : psi.scores.accessibility);
      if (typeof psiScore === "number") {
        categories[category] = {
          score: psiScore,
          pending: false,
          weight,
          deducted: 0,
          findings: category === "accessibility" ? (psi.violations?.length ?? 0) : 0,
        };
      } else {
        categories[category] = { score: null, pending: true, weight, deducted: 0, findings: 0 };
      }
      continue;
    }
    const own = findings.filter((f) => f.category === category && f.severity !== "info");
    const deducted = own.reduce((sum, f) => sum + (PENALTY[f.severity] ?? 0), 0);
    const score = Math.max(0, 100 - deducted);
    categories[category] = { score, pending: false, weight, deducted, findings: own.length };
    deductedTotal += deducted;
  }

  const scored = Object.entries(categories).filter(([, c]) => !c.pending);
  const weightSum = scored.reduce((sum, [, c]) => sum + c.weight, 0);
  const overall = Math.round(
    scored.reduce((sum, [, c]) => sum + c.score * c.weight, 0) / (weightSum || 1),
  );

  return {
    scoreVersion: SCORE_VERSION,
    overall,
    verdict: verdictFor(overall),
    categories,
    deductedTotal,
    weightSum: Number(weightSum.toFixed(2)),
  };
}
