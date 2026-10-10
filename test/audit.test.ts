import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

import { audit, describeNode, mergeFindings } from "../src/audit.js";
import type { ViewportResult } from "../src/types.js";

const fixture = (name: string) => pathToFileURL(join(import.meta.dirname, "fixtures", name)).href;

describe("mergeFindings", () => {
  it("unions viewports and keeps the larger node count", () => {
    const base = { help: "", helpUrl: "", wcag: [], examples: [] };
    const phone: ViewportResult = {
      viewport: { name: "phone", width: 375, height: 800 },
      facts: {} as ViewportResult["facts"],
      findings: [
        { ...base, id: "a", impact: "serious", nodes: 2, viewports: ["phone"] },
        { ...base, id: "b", impact: "minor", nodes: 1, viewports: ["phone"] },
      ],
      passes: [],
      ms: 0,
    };
    const desktop: ViewportResult = {
      ...phone,
      viewport: { name: "desktop", width: 1280, height: 900 },
      findings: [{ ...base, id: "a", impact: "serious", nodes: 5, viewports: ["desktop"] }],
    };
    const merged = mergeFindings([phone, desktop]);
    expect(merged.map((f) => f.id)).toEqual(["a", "b"]);
    expect(merged[0]?.nodes).toBe(5);
    expect(merged[0]?.viewports).toEqual(["phone", "desktop"]);
    expect(merged[1]?.viewports).toEqual(["phone"]);
  });
});

describe("describeNode", () => {
  it("adds the measured colours to a contrast failure", () => {
    const node = {
      target: [".btn"],
      any: [
        {
          data: {
            fgColor: "#06080e",
            bgColor: "#6d28d9",
            contrastRatio: 2.1,
            expectedContrastRatio: "4.5:1",
          },
        },
      ],
    };
    expect(describeNode(node)).toBe(".btn: text #06080e on #6d28d9, 2.1:1 (needs 4.5:1)");
  });

  it("keeps just the selector for other rules", () => {
    expect(describeNode({ target: ["img.logo"], any: [{ data: null }] })).toBe("img.logo");
    expect(describeNode({ target: ["iframe", "#x"] })).toBe("iframe #x");
  });
});

describe("audit (needs Chromium)", () => {
  it("finds the classic failures on a bad page", async () => {
    const result = await audit(fixture("bad.html"));
    const ids = result.findings.map((f) => f.id);
    for (const expected of [
      "ag-no-lang",
      "ag-zoom-disabled",
      "ag-no-title",
      "ag-no-skip-link",
      "image-alt",
      "label",
      "color-contrast",
      "ag-small-targets",
    ]) {
      expect(ids, expected).toContain(expected);
    }
    expect(result.score).toBeLessThan(60);
    expect(["D", "F"]).toContain(result.grade);
    expect(result.findings[0]?.impact).toBe("critical");
    expect(result.findings.find((f) => f.id === "label")?.fix?.component).toBe("Text input");
    expect(result.findings.find((f) => f.id === "color-contrast")?.examples[0]).toMatch(
      /: text #[0-9a-f]{6} on #[0-9a-f]{6}, [0-9.]+:1 \(needs [0-9.]+:1\)$/,
    );
    expect(result.viewports).toHaveLength(2);
  }, 90_000);

  it("gives a well-built page a high score", async () => {
    const result = await audit(fixture("good.html"), { viewports: ["phone"] });
    expect(result.findings.map((f) => f.id)).toEqual([]);
    expect(result.score).toBe(100);
    expect(result.grade).toBe("A");
    expect(result.viewports[0]?.facts.hasSkipLink).toBe(true);
    expect(result.viewports[0]?.facts.targetsUnder44).toBe(0);
  }, 90_000);

  it("finds a visually hidden skip link and does not count it as a small target", async () => {
    const result = await audit(fixture("sr-only-skip.html"), { viewports: ["phone"] });
    expect(result.findings.map((f) => f.id)).toEqual([]);
    expect(result.viewports[0]?.facts.hasSkipLink).toBe(true);
    expect(result.viewports[0]?.facts.smallTargets).toEqual([]);
  }, 90_000);

  it("rejects an address that is not a URL", async () => {
    await expect(audit("not a url")).rejects.toThrow(/not a valid address/);
  });
});
