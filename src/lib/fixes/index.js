import seoFixes from "./seo";
import securityFixes from "./security";
import miscFixes from "./misc";

// Every check id → { what, why, fix, docs? }. Informational ids (stack, crashed
// checks) intentionally have no entry — there is nothing to fix.
const FIXES = new Map(
  [...Object.entries(seoFixes), ...Object.entries(securityFixes), ...Object.entries(miscFixes)],
);

export function getFix(id) {
  return FIXES.get(id) ?? null;
}

export const fixCount = FIXES.size;
