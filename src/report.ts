import type { AuditResult, Finding } from "./types.js";

export interface ReportOptions {
  /** Show every finding instead of the top five. */
  all?: boolean;
  /** Use ANSI colour. */
  color?: boolean;
}

const paint = (on: boolean) => ({
  bold: (s: string) => (on ? `\u001b[1m${s}\u001b[22m` : s),
  dim: (s: string) => (on ? `\u001b[2m${s}\u001b[22m` : s),
  red: (s: string) => (on ? `\u001b[31m${s}\u001b[39m` : s),
  yellow: (s: string) => (on ? `\u001b[33m${s}\u001b[39m` : s),
  green: (s: string) => (on ? `\u001b[32m${s}\u001b[39m` : s),
  cyan: (s: string) => (on ? `\u001b[36m${s}\u001b[39m` : s),
});

export function gradeSentence(result: AuditResult): string {
  const n = result.findings.length;
  if (n === 0)
    return "No WCAG 2.1 AA problems found by automated checks. A manual screen reader pass is still needed.";
  const worst = result.findings[0]!;
  const who =
    worst.impact === "critical" || worst.impact === "serious"
      ? "Some people cannot use this page."
      : "Most people can use this page, with friction.";
  return `${n} problem${n === 1 ? "" : "s"} found. ${who}`;
}

function describeFinding(f: Finding, p: ReturnType<typeof paint>, index: number): string {
  const impact =
    f.impact === "critical" || f.impact === "serious"
      ? p.red(f.impact)
      : f.impact === "moderate"
        ? p.yellow(f.impact)
        : p.dim(f.impact);
  const where = f.viewports.length === 2 ? "phone and desktop" : f.viewports[0]!;
  const wcag = f.wcag.length ? ` · WCAG ${f.wcag.join(", ")}` : "";
  const lines = [
    `${p.bold(`${index}. ${f.help}`)}`,
    `   ${impact} · ${f.nodes} element${f.nodes === 1 ? "" : "s"} · ${where}${wcag}`,
  ];
  if (f.examples.length) lines.push(`   ${p.dim("e.g. " + f.examples.slice(0, 2).join("  "))}`);
  if (f.fix) lines.push(`   ${p.green("Fix:")} ${f.fix.advice} ${p.cyan(f.fix.url)}`);
  else lines.push(`   ${p.dim(f.helpUrl)}`);
  return lines.join("\n");
}

export function textReport(result: AuditResult, options: ReportOptions = {}): string {
  const p = paint(options.color ?? false);
  const s = result.summary;
  const out: string[] = [];
  out.push(`${p.bold("afrigov-audit")} ${p.dim(result.tool.version)}  ${result.finalUrl}`);
  out.push("");
  const gradeColour =
    result.grade === "A" || result.grade === "B"
      ? p.green
      : result.grade === "C"
        ? p.yellow
        : p.red;
  out.push(`${p.bold("Score")} ${gradeColour(`${result.score} / 100  (${result.grade})`)}`);
  out.push(gradeSentence(result));
  out.push(
    p.dim(
      `${s.critical} critical · ${s.serious} serious · ${s.moderate} moderate · ${s.minor} minor · checked at ${result.viewports
        .map((v) => `${v.viewport.name} ${v.viewport.width}px`)
        .join(" and ")}`,
    ),
  );
  out.push("");

  const shown = options.all ? result.findings : result.findings.slice(0, 5);
  if (shown.length) {
    out.push(p.bold(options.all ? "All problems" : `Top ${shown.length} to fix first`));
    out.push("");
    shown.forEach((f, i) => {
      out.push(describeFinding(f, p, i + 1));
      out.push("");
    });
    if (!options.all && result.findings.length > shown.length) {
      out.push(
        p.dim(
          `${result.findings.length - shown.length} more. Run with --all to see them, or --json for everything.`,
        ),
      );
      out.push("");
    }
  }

  const facts = result.viewports[0]?.facts;
  if (facts) {
    out.push(p.bold("Page facts"));
    out.push(`   Title: ${facts.title || p.red("none")}`);
    out.push(`   Language: ${facts.lang ?? p.red("not declared")}`);
    out.push(`   Zoom: ${facts.allowsZoom ? "allowed" : p.red("disabled")}`);
    out.push(`   Skip link: ${facts.hasSkipLink ? "yes" : p.yellow("no")}`);
    out.push(
      `   Touch targets under 44px at phone width: ${facts.targetsUnder44 === 0 ? "none" : p.yellow(String(facts.targetsUnder44))} of ${facts.interactiveCount}`,
    );
    out.push("");
  }
  out.push(
    p.dim(
      "Automated checks find about a third of real accessibility problems. Test with a screen reader too.",
    ),
  );
  return out.join("\n");
}

export function jsonReport(result: AuditResult): string {
  return JSON.stringify(result, null, 2);
}
