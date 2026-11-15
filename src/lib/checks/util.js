// Shared finding shape + severity metadata.
//
// A Finding is the atomic unit of the report:
//   { id, category, severity, title, message, detail?, page? }
// Every check returns a list of these. Nothing else ships to the UI.

export const SEVERITY_WEIGHT = { critical: 25, high: 12, medium: 5, low: 2, info: 0 };
export const SEVERITY_RANK = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };

export function finding({ id, category, severity, title, message, detail, page }) {
  return {
    id,
    category,
    severity,
    title,
    message,
    ...(detail !== undefined ? { detail } : {}),
    ...(page !== undefined ? { page } : {}),
  };
}

export function sortFindings(findings) {
  return [...findings].sort(
    (a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || a.id.localeCompare(b.id),
  );
}

export function countBySeverity(findings) {
  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const f of findings) if (f.severity in counts) counts[f.severity] += 1;
  return counts;
}
