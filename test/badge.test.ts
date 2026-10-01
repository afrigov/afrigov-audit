import { describe, expect, it } from "vitest";

import { BADGE_COLORS, badgeJson, badgeMessage, badgeSvg } from "../src/badge.js";

describe("badge", () => {
  it("shows the grade then the score", () => {
    expect(badgeMessage({ score: 100, grade: "A" })).toBe("A 100");
    expect(badgeMessage({ score: 52, grade: "D" })).toBe("D 52");
    expect(badgeMessage({ score: 89.5, grade: "B" })).toBe("B 89.5");
  });

  it("writes an svg with a name, the label, the message and the grade's colour", () => {
    const svg = badgeSvg({ score: 100, grade: "A" });
    expect(svg.startsWith("<svg ")).toBe(true);
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-label="accessibility: A 100"');
    expect(svg).toContain("<title>accessibility: A 100</title>");
    expect(svg).toContain(BADGE_COLORS.A);
    expect(svg).not.toContain(BADGE_COLORS.F);
  });

  it("uses a different colour for every grade", () => {
    expect(new Set(Object.values(BADGE_COLORS)).size).toBe(5);
    expect(badgeSvg({ score: 12, grade: "F" })).toContain(BADGE_COLORS.F);
  });

  it("takes a custom label and escapes it", () => {
    const svg = badgeSvg({ score: 73, grade: "C" }, { label: 'real site <"home">' });
    expect(svg).toContain("real site &lt;&quot;home&quot;&gt;: C 73");
    expect(svg).not.toContain('<"home">');
  });

  it("grows with its text", () => {
    const width = (svg: string) => Number(/width="(\d+)"/.exec(svg)?.[1]);
    expect(
      width(badgeSvg({ score: 100, grade: "A" }, { label: "accessibility of the rebuild" })),
    ).toBeGreaterThan(width(badgeSvg({ score: 100, grade: "A" }, { label: "a11y" })));
  });

  it("writes a shields.io endpoint document", () => {
    const doc = JSON.parse(badgeJson({ score: 58, grade: "D" }, { label: "real site" })) as Record<
      string,
      unknown
    >;
    expect(doc).toEqual({
      schemaVersion: 1,
      label: "real site",
      message: "D 58",
      color: BADGE_COLORS.D.slice(1),
    });
  });
});
