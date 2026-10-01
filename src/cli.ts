#!/usr/bin/env node
import { parseArgs } from "node:util";

import { audit, AuditError } from "./audit.js";
import { jsonReport, textReport } from "./report.js";
import type { ViewportName } from "./types.js";
import { version } from "./version.js";

const HELP = `afrigov-audit ${version} — accessibility audit for any web page

Usage
  afrigov-audit <url> [options]

Options
  --json               Print the full result as JSON instead of a report
  --all                List every problem, not just the top five
  --phone              Test at phone width only (375px)
  --desktop            Test at desktop width only (1280px)
  --fail-under <n>     Exit with code 1 if the score is below n (for CI)
  --timeout <ms>       Page load timeout, default 30000
  --no-wcag22          Skip the WCAG 2.2 AA rules
  --no-color           Plain output
  -h, --help           Show this help
  -v, --version        Show the version

Examples
  npx afrigov-audit https://example.gov.ng/
  npx afrigov-audit https://example.go.ke/apply --phone --all
  npx afrigov-audit https://example.gov.gh/ --json > report.json
  npx afrigov-audit https://example.gouv.sn/ --fail-under 75

Exit codes
  0  audit ran (and met --fail-under if given)
  1  score below --fail-under
  2  bad arguments
  3  the page could not be loaded
  4  Chromium is not installed (run: npx playwright install chromium)
`;

function fail(message: string, hint: string | undefined, code: number): never {
  process.stderr.write(`afrigov-audit: ${message}\n`);
  if (hint) process.stderr.write(`  ${hint}\n`);
  process.exit(code);
}

async function main(): Promise<void> {
  let parsed;
  try {
    parsed = parseArgs({
      args: process.argv.slice(2),
      allowPositionals: true,
      options: {
        json: { type: "boolean", default: false },
        all: { type: "boolean", default: false },
        phone: { type: "boolean", default: false },
        desktop: { type: "boolean", default: false },
        "fail-under": { type: "string" },
        timeout: { type: "string" },
        "no-wcag22": { type: "boolean", default: false },
        "no-color": { type: "boolean", default: false },
        help: { type: "boolean", short: "h", default: false },
        version: { type: "boolean", short: "v", default: false },
      },
    });
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err), "Run afrigov-audit --help", 2);
  }

  const { values, positionals } = parsed;
  if (values.help) {
    process.stdout.write(HELP);
    return;
  }
  if (values.version) {
    process.stdout.write(`${version}\n`);
    return;
  }
  const url = positionals[0];
  if (!url)
    fail(
      "Give the address of a page to audit.",
      "Example: afrigov-audit https://example.gov.ng/",
      2,
    );

  const viewports: ViewportName[] =
    values.phone && !values.desktop
      ? ["phone"]
      : values.desktop && !values.phone
        ? ["desktop"]
        : ["phone", "desktop"];
  const timeout = values.timeout ? Number(values.timeout) : undefined;
  if (timeout !== undefined && (!Number.isFinite(timeout) || timeout <= 0))
    fail("--timeout must be a number of milliseconds.", undefined, 2);
  const failUnder = values["fail-under"] ? Number(values["fail-under"]) : undefined;
  if (
    failUnder !== undefined &&
    (!Number.isFinite(failUnder) || failUnder < 0 || failUnder > 100)
  ) {
    fail("--fail-under must be between 0 and 100.", undefined, 2);
  }

  let result;
  try {
    result = await audit(url, { viewports, timeout, wcag22: !values["no-wcag22"] });
  } catch (err) {
    if (err instanceof AuditError) {
      fail(err.message, err.hint, err.code === "browser" ? 4 : err.code === "navigation" ? 3 : 2);
    }
    throw err;
  }

  const color = !values["no-color"] && Boolean(process.stdout.isTTY) && !process.env["NO_COLOR"];
  process.stdout.write(
    (values.json ? jsonReport(result) : textReport(result, { all: values.all, color })) + "\n",
  );

  if (failUnder !== undefined && result.score < failUnder) {
    process.stderr.write(`afrigov-audit: score ${result.score} is below ${failUnder}\n`);
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  process.stderr.write(
    `afrigov-audit: ${err instanceof Error ? (err.stack ?? err.message) : String(err)}\n`,
  );
  process.exit(2);
});
