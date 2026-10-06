import { describe, expect, it } from "vitest";

import { FIXES, fixFor, wcagFromTags } from "../src/fixes.js";

describe("wcagFromTags", () => {
  it("converts axe tags to criteria", () => {
    expect(wcagFromTags(["wcag2a", "wcag143", "cat.color"])).toEqual(["1.4.3"]);
    expect(wcagFromTags(["wcag2411", "wcag111"])).toEqual(["1.1.1", "2.4.11"]);
  });

  it("deduplicates and ignores non-criterion tags", () => {
    expect(wcagFromTags(["wcag143", "wcag143", "best-practice", "wcag21aa"])).toEqual(["1.4.3"]);
  });
});

describe("fixes", () => {
  it("knows the common government-site failures", () => {
    for (const id of [
      "color-contrast",
      "label",
      "html-has-lang",
      "image-alt",
      "bypass",
      "ag-zoom-disabled",
    ]) {
      expect(fixFor(id), id).toBeDefined();
    }
    expect(fixFor("no-such-rule")).toBeUndefined();
  });

  it("points every fix at the afrigov docs with advice", () => {
    for (const [id, f] of Object.entries(FIXES)) {
      expect(f.url, id).toMatch(
        /^https:\/\/afrigov\.dev\/[a-z-]+(\/[a-z-]+)?\.html$/,
      );
      expect(f.advice.length, id).toBeGreaterThan(20);
      expect(f.component.length, id).toBeGreaterThan(2);
    }
  });
});
