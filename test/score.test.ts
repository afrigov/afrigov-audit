import { describe, expect, it } from "vitest";

import { grade, NODE_CAP, penalty, score, sortFindings, summarise, WEIGHTS } from "../src/score.js";
import type { Finding } from "../src/types.js";

const finding = (over: Partial<Finding>): Finding => ({
  id: "x",
  impact: "minor",
  help: "",
  helpUrl: "",
  wcag: [],
  nodes: 1,
  examples: [],
  viewports: ["phone"],
  ...over,
});

describe("penalty", () => {
  it("weights by impact", () => {
    expect(penalty({ impact: "critical", nodes: 1 })).toBe(WEIGHTS.critical);
    expect(penalty({ impact: "minor", nodes: 1 })).toBe(WEIGHTS.minor);
  });

  it("scales with nodes up to the cap", () => {
    expect(penalty({ impact: "serious", nodes: 3 })).toBe(WEIGHTS.serious * 3);
    expect(penalty({ impact: "serious", nodes: 300 })).toBe(WEIGHTS.serious * NODE_CAP);
  });

  it("never rewards zero nodes", () => {
    expect(penalty({ impact: "moderate", nodes: 0 })).toBe(WEIGHTS.moderate);
  });
});

describe("score", () => {
  it("is 100 with no findings", () => {
    expect(score([])).toBe(100);
  });

  it("subtracts penalties and floors at zero", () => {
    expect(score([{ impact: "critical", nodes: 1 }])).toBe(94);
    expect(
      score(Array.from({ length: 40 }, () => ({ impact: "critical" as const, nodes: 5 }))),
    ).toBe(0);
  });

  it("rounds to one decimal", () => {
    expect(score([{ impact: "minor", nodes: 1 }])).toBe(99.5);
  });
});

describe("grade", () => {
  it("maps bands", () => {
    expect(grade(100)).toBe("A");
    expect(grade(90)).toBe("A");
    expect(grade(89.9)).toBe("B");
    expect(grade(75)).toBe("B");
    expect(grade(60)).toBe("C");
    expect(grade(40)).toBe("D");
    expect(grade(39.9)).toBe("F");
  });
});

describe("sortFindings and summarise", () => {
  it("orders most severe first, then by nodes, then id", () => {
    const sorted = sortFindings([
      finding({ id: "b", impact: "minor", nodes: 9 }),
      finding({ id: "a", impact: "critical", nodes: 1 }),
      finding({ id: "c", impact: "critical", nodes: 4 }),
      finding({ id: "d", impact: "serious", nodes: 2 }),
    ]);
    expect(sorted.map((f) => f.id)).toEqual(["c", "a", "d", "b"]);
  });

  it("counts by impact", () => {
    expect(
      summarise([
        finding({ impact: "critical" }),
        finding({ impact: "critical" }),
        finding({ impact: "minor" }),
      ]),
    ).toEqual({
      critical: 2,
      serious: 0,
      moderate: 0,
      minor: 1,
    });
  });
});
