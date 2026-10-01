import { describe, expect, it } from "vitest";

import { gradeSentence, jsonReport, textReport } from "../src/report.js";
import { grade, score, summarise } from "../src/score.js";
import type { AuditResult, Finding, PageFacts } from "../src/types.js";

const facts: PageFacts = {
  title: "Renew a passport",
  lang: "en",
  hasSkipLink: true,
  viewportMeta: "width=device-width, initial-scale=1",
  allowsZoom: true,
  smallTargets: [],
  targetsUnder44: 2,
  interactiveCount: 12,
  bytes: null,
};

function result(findings: Finding[]): AuditResult {
  const value = score(findings);
  return {
    url: "https://example.gov.ng/",
    finalUrl: "https://example.gov.ng/",
    checkedAt: "2026-10-02T00:00:00.000Z",
    tool: { name: "afrigov-audit", version: "0.1.0", axeVersion: "4.10.3" },
    viewports: [
      {
        viewport: { name: "phone", width: 375, height: 800 },
        facts,
        findings,
        passes: [],
        ms: 100,
      },
    ],
    findings,
    score: value,
    grade: grade(value),
    summary: summarise(findings),
  };
}

const f = (id: string, impact: Finding["impact"], nodes = 1): Finding => ({
  id,
  impact,
  help: `Problem ${id}`,
  helpUrl: `https://dequeuniversity.com/rules/axe/4.10/${id}`,
  wcag: ["1.4.3"],
  nodes,
  examples: ["#x"],
  viewports: ["phone", "desktop"],
  fix: {
    component: "Colour",
    url: "https://omoyolab.github.io/afrigov/styles/colour.html",
    advice: "Use the tokens.",
  },
});

describe("textReport", () => {
  it("shows the score, grade and top five by default", () => {
    const findings = Array.from({ length: 7 }, (_, i) => f(`rule-${i}`, "serious"));
    const text = textReport(result(findings));
    expect(text).toContain("Score");
    expect(text).toContain("Top 5 to fix first");
    expect(text).toContain("1. Problem rule-0");
    expect(text).toContain("5. Problem rule-4");
    expect(text).not.toContain("6. Problem rule-5");
    expect(text).toContain("2 more. Run with --all");
    expect(text).toContain("Fix: Use the tokens.");
    expect(text).toContain("Touch targets under 44px at phone width: 2 of 12");
  });

  it("lists everything with all", () => {
    const text = textReport(result(Array.from({ length: 7 }, (_, i) => f(`rule-${i}`, "minor"))), {
      all: true,
    });
    expect(text).toContain("All problems");
    expect(text).toContain("7. Problem rule-6");
  });

  it("has no ANSI codes unless colour is on", () => {
    expect(textReport(result([f("a", "critical")])).includes("\u001b[")).toBe(false);
    expect(textReport(result([f("a", "critical")]), { color: true }).includes("\u001b[")).toBe(
      true,
    );
  });

  it("says when nothing was found", () => {
    expect(gradeSentence(result([]))).toMatch(/No WCAG 2.1 AA problems/);
    expect(gradeSentence(result([f("a", "critical")]))).toMatch(/cannot use/);
    expect(gradeSentence(result([f("a", "minor")]))).toMatch(/friction/);
  });
});

describe("jsonReport", () => {
  it("round-trips", () => {
    const r = result([f("a", "serious", 3)]);
    const parsed = JSON.parse(jsonReport(r)) as AuditResult;
    expect(parsed.score).toBe(r.score);
    expect(parsed.findings[0]?.id).toBe("a");
  });
});
