import type { AuditResult } from "./types.js";

type Grade = AuditResult["grade"];

/** The two facts a badge shows. An AuditResult satisfies this. */
export interface BadgeInput {
  score: number;
  grade: Grade;
}

export interface BadgeOptions {
  /** Text on the left of the badge. Default "accessibility". */
  label?: string;
}

/** Background per grade. Each carries white text at AA contrast or better. */
export const BADGE_COLORS: Record<Grade, string> = {
  A: "#1b7a3d",
  B: "#1f6f9f",
  C: "#8a6d00",
  D: "#b35c00",
  F: "#b3261e",
};

const LABEL_COLOR = "#3d3d3d";
const DEFAULT_LABEL = "accessibility";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Rough width of text at 11px Verdana. Good enough to size a badge without measuring fonts. */
function textWidth(text: string): number {
  let width = 0;
  for (const ch of text) {
    if (/[iljI.,:;'|! ]/.test(ch)) width += 3.6;
    else if (/[mwMW]/.test(ch)) width += 9.6;
    else if (/[A-Z0-9]/.test(ch)) width += 7.6;
    else width += 6.4;
  }
  return Math.ceil(width);
}

/** The right-hand text: grade then score, like "A 100" or "D 52". */
export function badgeMessage(input: BadgeInput): string {
  return `${input.grade} ${input.score}`;
}

/** A self-contained SVG badge: label on the left, grade and score on the right. */
export function badgeSvg(input: BadgeInput, options: BadgeOptions = {}): string {
  const label = options.label ?? DEFAULT_LABEL;
  const message = badgeMessage(input);
  const labelWidth = textWidth(label) + 14;
  const messageWidth = textWidth(message) + 14;
  const width = labelWidth + messageWidth;
  const name = `${escapeXml(label)}: ${escapeXml(message)}`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20" role="img" aria-label="${name}">` +
    `<title>${name}</title>` +
    `<rect width="${labelWidth}" height="20" fill="${LABEL_COLOR}"/>` +
    `<rect x="${labelWidth}" width="${messageWidth}" height="20" fill="${BADGE_COLORS[input.grade]}"/>` +
    `<g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">` +
    `<text x="${labelWidth / 2}" y="14">${escapeXml(label)}</text>` +
    `<text x="${labelWidth + messageWidth / 2}" y="14" font-weight="bold">${escapeXml(message)}</text>` +
    `</g></svg>\n`
  );
}

/** The same badge as a shields.io endpoint document, for https://img.shields.io/endpoint?url=… */
export function badgeJson(input: BadgeInput, options: BadgeOptions = {}): string {
  return (
    JSON.stringify(
      {
        schemaVersion: 1,
        label: options.label ?? DEFAULT_LABEL,
        message: badgeMessage(input),
        color: BADGE_COLORS[input.grade].slice(1),
      },
      null,
      2,
    ) + "\n"
  );
}
