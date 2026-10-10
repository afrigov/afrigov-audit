import { AxeBuilder } from "@axe-core/playwright";
import { chromium, type Browser } from "playwright";

import { collectFacts, factsToFindings } from "./checks.js";
import { watchWeight } from "./weight.js";
import { fixFor, wcagFromTags } from "./fixes.js";
import { grade, score, sortFindings, summarise } from "./score.js";
import type {
  AuditOptions,
  AuditResult,
  Finding,
  Impact,
  Viewport,
  ViewportResult,
} from "./types.js";
import { axeVersion, version } from "./version.js";

export const VIEWPORTS: Record<Viewport["name"], Viewport> = {
  phone: { name: "phone", width: 375, height: 800 },
  desktop: { name: "desktop", width: 1280, height: 900 },
};

export class AuditError extends Error {
  constructor(
    message: string,
    public readonly hint: string,
    public readonly code: "browser" | "navigation" | "usage",
  ) {
    super(message);
    this.name = "AuditError";
  }
}

const UA_SUFFIX = `afrigov-audit/${version} (+https://github.com/afrigov/afrigov-audit)`;

async function launch(): Promise<Browser> {
  try {
    return await chromium.launch();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/Executable doesn't exist|browserType.launch|install/i.test(message)) {
      throw new AuditError(
        "Chromium is not installed for Playwright.",
        "Run: npx playwright install chromium",
        "browser",
      );
    }
    throw err;
  }
}

export async function auditViewport(
  browser: Browser,
  url: string,
  viewport: Viewport,
  options: AuditOptions,
): Promise<{ result: ViewportResult; finalUrl: string }> {
  const started = Date.now();
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.name === "phone" ? 2 : 1,
    isMobile: viewport.name === "phone",
    hasTouch: viewport.name === "phone",
    userAgent: `Mozilla/5.0 (${viewport.name === "phone" ? "Linux; Android 13; Pixel 7" : "X11; Linux x86_64"}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 ${viewport.name === "phone" ? "Mobile " : ""}Safari/537.36 ${UA_SUFFIX}${options.userAgent ? ` ${options.userAgent}` : ""}`,
  });
  const page = await context.newPage();
  const timeout = options.timeout ?? 30_000;
  // Page weight is measured at phone width, where the reader is most likely paying for the data.
  const finishWeight = viewport.name === "phone" ? await watchWeight(page) : null;
  try {
    const response = await page.goto(url, { waitUntil: "load", timeout });
    if (!response)
      throw new AuditError(
        `No response from ${url}`,
        "Check the address and try again.",
        "navigation",
      );
    if (response.status() >= 400) {
      throw new AuditError(
        `${url} returned HTTP ${response.status()}`,
        "The page could not be loaded, so it was not audited.",
        "navigation",
      );
    }
    await page
      .waitForLoadState("networkidle", { timeout: Math.min(timeout, 10_000) })
      .catch(() => undefined);

    const tags = [
      "wcag2a",
      "wcag2aa",
      "wcag21a",
      "wcag21aa",
      ...(options.wcag22 === false ? [] : ["wcag22aa"]),
    ];
    const axe = await new AxeBuilder({ page }).withTags(tags).analyze();

    const findings: Finding[] = axe.violations.map((v) => ({
      id: v.id,
      impact: (v.impact ?? "minor") as Impact,
      help: v.help,
      helpUrl: v.helpUrl,
      wcag: wcagFromTags(v.tags),
      nodes: v.nodes.length,
      examples: v.nodes.slice(0, 5).map(describeNode),
      viewports: [viewport.name],
      fix: fixFor(v.id),
    }));

    const facts = await collectFacts(page);
    if (finishWeight) {
      const weight = await finishWeight();
      facts.weight = weight;
      facts.bytes = weight ? weight.totalBytes : null;
    }
    findings.push(...factsToFindings(facts, viewport.name));

    return {
      result: {
        viewport,
        facts,
        findings,
        passes: axe.passes.map((p) => p.id),
        ms: Date.now() - started,
      },
      finalUrl: page.url(),
    };
  } catch (err) {
    if (err instanceof AuditError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    if (/Timeout|net::ERR|ENOTFOUND|ECONNREFUSED/i.test(message)) {
      throw new AuditError(
        `Could not load ${url}: ${message.split("\n")[0]}`,
        "Check the address, your connection, or raise --timeout.",
        "navigation",
      );
    }
    throw err;
  } finally {
    await context.close();
  }
}

interface ContrastData {
  fgColor?: string;
  bgColor?: string;
  contrastRatio?: number;
  expectedContrastRatio?: string;
}

/**
 * The element's selector, plus the colours axe measured when it is a contrast
 * failure. The colours shown are the ones that render, so a white label turned
 * dark by a stray rule is plain to see.
 */
export function describeNode(node: { target: unknown[]; any?: { data?: unknown }[] }): string {
  const selector = node.target.join(" ");
  const data = node.any?.find((check) => {
    const d = check.data as ContrastData | null | undefined;
    return d?.fgColor && d.bgColor && d.contrastRatio;
  })?.data as ContrastData | undefined;
  if (!data) return selector;
  const needs = data.expectedContrastRatio ? ` (needs ${data.expectedContrastRatio})` : "";
  return `${selector}: text ${data.fgColor} on ${data.bgColor}, ${data.contrastRatio}:1${needs}`;
}

/** Merge per-viewport findings by rule id, keeping the worst impact and the union of viewports. */
export function mergeFindings(perViewport: ViewportResult[]): Finding[] {
  const byId = new Map<string, Finding>();
  for (const vr of perViewport) {
    for (const f of vr.findings) {
      const existing = byId.get(f.id);
      if (!existing) {
        byId.set(f.id, { ...f, viewports: [...f.viewports], examples: [...f.examples] });
        continue;
      }
      existing.nodes = Math.max(existing.nodes, f.nodes);
      existing.viewports = [...new Set([...existing.viewports, ...f.viewports])];
      for (const ex of f.examples)
        if (!existing.examples.includes(ex) && existing.examples.length < 5)
          existing.examples.push(ex);
    }
  }
  return sortFindings([...byId.values()]);
}

export async function audit(url: string, options: AuditOptions = {}): Promise<AuditResult> {
  let target: URL;
  try {
    target = new URL(/^[a-z]+:\/\//i.test(url) ? url : `https://${url}`);
  } catch {
    throw new AuditError(
      `"${url}" is not a valid address.`,
      "Pass a full URL, like https://example.gov.ng/",
      "usage",
    );
  }
  const names = options.viewports?.length ? options.viewports : (["phone", "desktop"] as const);
  const browser = await launch();
  try {
    const results: ViewportResult[] = [];
    let finalUrl = target.href;
    for (const name of names) {
      const { result, finalUrl: landed } = await auditViewport(
        browser,
        target.href,
        VIEWPORTS[name],
        options,
      );
      results.push(result);
      finalUrl = landed;
    }
    const findings = mergeFindings(results);
    const value = score(findings);
    return {
      url: target.href,
      finalUrl,
      checkedAt: new Date().toISOString(),
      tool: { name: "afrigov-audit", version, axeVersion },
      viewports: results,
      findings,
      score: value,
      grade: grade(value),
      summary: summarise(findings),
    };
  } finally {
    await browser.close();
  }
}
