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

    const focusable =
      'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="link"], [tabindex]:not([tabindex="-1"])';
    const interactive = Array.from(document.querySelectorAll<HTMLElement>(focusable));

    // Hidden for the eye but not for a keyboard: clipped to nothing or shrunk to
    // 1px, the usual .sr-only / .visually-hidden recipe. Such a link only shows
    // when focused, so it is not a pointer target while hidden.
    const visuallyHidden = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      if (r.width <= 1 && r.height <= 1) return true;
      const s = getComputedStyle(el);
      if (s.position !== "absolute" && s.position !== "fixed") return false;
      const clip = /rect\(([^)]*)\)/.exec(s.clip);
      if (clip?.[1]) {
        const [top = 0, right = 0, bottom = 0, left = 0] = clip[1]
          .split(/[\s,]+/)
          .map((v) => parseFloat(v) || 0);
        if (bottom <= top || right <= left) return true;
      }
      return /inset\(\s*(50|100)%/.test(s.clipPath);
    };

    // Skip link: one of the first three focusable elements points at an element
    // on this page, or any control before main says it skips to the content.
    // Words count because some sites move focus with a click handler on
    // href="#", and a cookie banner may come first (GOV.UK's order).
    const skipWords =
      /skip|jump to|main content|contenu|saltar|ir al contenido|ir para o conte|zum inhalt|تخط|المحتوى|ruka|maudhui/i;
    const pointsInPage = (el: HTMLElement) => {
      if (!(el instanceof HTMLAnchorElement)) return false;
      const url = new URL(el.href, location.href);
      if (url.origin + url.pathname !== location.origin + location.pathname) return false;
      const id = decodeURIComponent(url.hash.slice(1));
      return id !== "" && !!(document.getElementById(id) || document.getElementsByName(id)[0]);
    };
    const reachable = interactive.filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 || r.height > 0 || getComputedStyle(el).position === "absolute";
    });
    const main = document.querySelector('main, [role="main"]');
    const beforeMain = main
      ? reachable.filter(
          (el) => el.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING,
        )
      : reachable.slice(0, 10);
    const hasSkipLink =
      reachable.slice(0, 3).some(pointsInPage) ||
      beforeMain.some((el) =>
        skipWords.test(`${el.textContent ?? ""} ${el.getAttribute("aria-label") ?? ""}`),
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
      if (visuallyHidden(el)) continue;
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
