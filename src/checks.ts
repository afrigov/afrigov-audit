import type { Page } from "playwright";

import { fixFor } from "./fixes.js";
import type { Finding, PageFacts } from "./types.js";

/**
 * Runs inside the page. Gathers the facts axe does not report but that decide
 * whether a government page is usable on a cheap phone.
 */
export async function collectFacts(page: Page): Promise<PageFacts> {
  return page.evaluate(() => {
    const html = document.documentElement;
    const viewportMeta =
      document.querySelector('meta[name="viewport"]')?.getAttribute("content") ?? null;
    const lower = (viewportMeta ?? "").toLowerCase();
    const maxScale = /maximum-scale\s*=\s*([0-9.]+)/.exec(lower);
    const allowsZoom =
      !/user-scalable\s*=\s*(no|0)/.test(lower) && !(maxScale && Number(maxScale[1]) < 2);

    // Skip link: the first focusable link points at an element on the page.
    const firstLink = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]")).find(
      (a) => {
        const r = a.getBoundingClientRect();
        return r.width > 0 || r.height > 0 || getComputedStyle(a).position === "absolute";
      },
    );
    let hasSkipLink = false;
    if (firstLink) {
      const href = firstLink.getAttribute("href") ?? "";
      if (href.startsWith("#") && href.length > 1 && document.getElementById(href.slice(1)))
        hasSkipLink = true;
    }

    const interactive = Array.from(
      document.querySelectorAll<HTMLElement>(
        'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="link"], [tabindex]:not([tabindex="-1"])',
      ),
    );
    const smallTargets: string[] = [];
    let targetsUnder44 = 0;
    let interactiveCount = 0;
    const describe = (el: Element) => {
      const id = el.id ? `#${el.id}` : "";
      const cls =
        el.className && typeof el.className === "string"
          ? `.${el.className.trim().split(/\s+/)[0]}`
          : "";
      return `${el.tagName.toLowerCase()}${id || cls}`;
    };
    for (const el of interactive) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      // Off-screen elements, like a skip link parked at left: -999em, are not targets.
      if (r.right <= 0 || r.bottom <= 0) continue;
      // Links inside running text are exempt under WCAG 2.5.8.
      if (el.tagName === "A" && el.closest("p, li, td, th, dd, dt, figcaption, blockquote"))
        continue;
      interactiveCount += 1;
      if (r.height < 24 || r.width < 24) smallTargets.push(describe(el));
      if (r.height < 44) targetsUnder44 += 1;
    }

    return {
      title: document.title.trim(),
      lang: html.getAttribute("lang"),
      hasSkipLink,
      viewportMeta,
      allowsZoom,
      smallTargets: smallTargets.slice(0, 20),
      targetsUnder44,
      interactiveCount,
      bytes: null,
    };
  });
}

/** Turn page facts into findings in the same shape as axe's. */
export function factsToFindings(
  facts: PageFacts,
  viewport: Finding["viewports"][number],
): Finding[] {
  const out: Finding[] = [];
  const add = (
    id: string,
    impact: Finding["impact"],
    help: string,
    wcag: string[],
    nodes = 1,
    examples: string[] = [],
  ) =>
    out.push({
      id,
      impact,
      help,
      helpUrl: fixFor(id)?.url ?? "https://afrigov.dev",
      wcag,
      nodes,
      examples,
      viewports: [viewport],
      fix: fixFor(id),
    });

  if (!facts.lang)
    add("ag-no-lang", "serious", "The page does not declare its language", ["3.1.1"]);
  if (!facts.allowsZoom)
    add("ag-zoom-disabled", "critical", "Pinch zoom is disabled in the viewport meta tag", [
      "1.4.4",
    ]);
  if (!facts.hasSkipLink)
    add("ag-no-skip-link", "moderate", "No skip link to the main content", ["2.4.1"]);
  if (!facts.title) add("ag-no-title", "serious", "The page has no title", ["2.4.2"]);
  if (viewport === "phone" && facts.smallTargets.length) {
    add(
      "ag-small-targets",
      "serious",
      "Links or controls smaller than 24px at phone width",
      ["2.5.8"],
      facts.smallTargets.length,
      facts.smallTargets.slice(0, 5),
    );
  }
  return out;
}
