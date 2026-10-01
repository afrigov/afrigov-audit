import type { AuditResult, Finding, Impact } from "./types.js";

/**
 * Scoring. Documented in the README so a number can be quoted and argued with.
 *
 * Start at 100. For each distinct rule that fails, subtract a weight for its
 * impact, multiplied by how many elements fail it, capped at five so one broken
 * template with 300 links does not hide everything else. Floor at 0.
 */
export const WEIGHTS: Record<Impact, number> = {
  critical: 6,
  serious: 3,
  moderate: 1.5,
  minor: 0.5,
};

export const NODE_CAP = 5;

export function penalty(finding: Pick<Finding, "impact" | "nodes">): number {
  return WEIGHTS[finding.impact] * Math.min(Math.max(finding.nodes, 1), NODE_CAP);
}

export function score(findings: Pick<Finding, "impact" | "nodes">[]): number {
  const total = findings.reduce((sum, f) => sum + penalty(f), 0);
  return Math.max(0, Math.round((100 - total) * 10) / 10);
}

export function grade(value: number): AuditResult["grade"] {
  if (value >= 90) return "A";
  if (value >= 75) return "B";
  if (value >= 60) return "C";
  if (value >= 40) return "D";
  return "F";
}

const ORDER: Impact[] = ["critical", "serious", "moderate", "minor"];

export function impactRank(impact: Impact): number {
  return ORDER.indexOf(impact);
}

/** Most severe first, then most nodes, then by id for stable output. */
export function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort(
    (a, b) =>
      impactRank(a.impact) - impactRank(b.impact) || b.nodes - a.nodes || a.id.localeCompare(b.id),
  );
}

export function summarise(findings: Finding[]): Record<Impact, number> {
  const out: Record<Impact, number> = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  for (const f of findings) out[f.impact] += 1;
  return out;
}
