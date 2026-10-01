# afrigov-audit

**Audit any web page for accessibility from the command line.** Runs axe-core at phone and desktop widths, adds the checks that government sites fail most, scores the page, and tells you which [afrigov](https://github.com/omoyolab/afrigov) component fixes each problem.

[![npm](https://img.shields.io/npm/v/afrigov-audit?color=1f4e79)](https://www.npmjs.com/package/afrigov-audit)
[![CI](https://github.com/omoyolab/afrigov-audit/actions/workflows/ci.yml/badge.svg)](https://github.com/omoyolab/afrigov-audit/actions/workflows/ci.yml)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

```sh
npx afrigov-audit https://example.gov.ng/
```

```
afrigov-audit 0.1.0  https://example.gov.ng/

Score 41.5 / 100  (D)
9 problems found. Some people cannot use this page.
1 critical · 4 serious · 3 moderate · 1 minor · checked at phone 375px and desktop 1280px

Top 5 to fix first

1. Pinch zoom is disabled in the viewport meta tag
   critical · 1 element · phone and desktop · WCAG 1.4.4
   Fix: Remove user-scalable=no and maximum-scale from the viewport meta. https://omoyolab.github.io/afrigov/get-started.html

2. Form elements must have labels
   serious · 6 elements · phone and desktop · WCAG 1.3.1, 4.1.2
   e.g. #nin  #email
   Fix: Every control gets a visible label tied by for/id. https://omoyolab.github.io/afrigov/components/text-input.html

…
```

The first run downloads Chromium once:

```sh
npx playwright install chromium
```

## Why

Most government websites in Africa fail basic accessibility checks. Not because anyone decided they should, but because nobody runs the check. This makes the check one command, with the fix next to each failure.

It pairs with [afrigov](https://github.com/omoyolab/afrigov), the open-source design system for African public services, but it audits any page. You do not need to use afrigov to use this.

## Options

| Option             | What it does                                               |
| ------------------ | ---------------------------------------------------------- |
| `--json`           | Full result as JSON, for tooling and dashboards            |
| `--all`            | Every problem, not just the top five                       |
| `--phone`          | Test at 375px only                                         |
| `--desktop`        | Test at 1280px only                                        |
| `--fail-under <n>` | Exit 1 if the score is below n. For CI.                    |
| `--timeout <ms>`   | Page load timeout, default 30000                           |
| `--no-wcag22`      | Skip the WCAG 2.2 AA rules                                 |
| `--no-color`       | Plain output. `NO_COLOR` in the environment does the same. |

Exit codes: 0 ran, 1 below `--fail-under`, 2 bad arguments, 3 page could not be loaded, 4 Chromium not installed.

## In CI

```yaml
- run: npx playwright install --with-deps chromium
- run: npx afrigov-audit https://staging.example.gov.ng/apply --fail-under 90
```

## What it checks

1. **axe-core**, with the WCAG 2.0 A and AA, 2.1 A and AA, and 2.2 AA rule sets, at phone width (375px, touch, 2x) and desktop width (1280px).
2. **The afrigov checks**, for things axe does not score but that decide whether a page works on a cheap phone:
   - the page declares a language
   - pinch zoom is not disabled
   - there is a skip link to the main content
   - the page has a title
   - links and controls are at least 24px at phone width (WCAG 2.5.8), with a count of those under afrigov's own 44px floor

Findings from both viewports are merged by rule, so one problem on both widths is one problem in the report.

## How the score is calculated

Start at 100. For each distinct failing rule, subtract a weight for its impact, multiplied by the number of affected elements, capped at five:

| Impact   | Weight |
| -------- | ------ |
| critical | 6      |
| serious  | 3      |
| moderate | 1.5    |
| minor    | 0.5    |

Floor at 0. Grades: A at 90 and above, B at 75, C at 60, D at 40, F below.

The cap means one broken template with 300 unlabelled links costs 15 points, not 900, so the other problems stay visible. The weights are arbitrary but public, so a score can be argued with. If you think they are wrong, open an issue with the page that proves it.

## What it does not do

- **It does not replace a person.** Automated checks find about a third of real accessibility problems. A screen reader pass by someone who uses one every day is still needed.
- **One page per run.** No crawling yet. Run it on the pages that matter: the home page, the start of a service, a form, a confirmation.
- **No login.** It loads the page as an anonymous visitor.
- **It never bypasses anything.** One page load, a real browser, a user agent that names this tool. If a site blocks it, it says so and stops.

## Library

```js
import { audit, textReport } from "afrigov-audit";

const result = await audit("https://example.gov.ng/", { viewports: ["phone"] });
console.log(result.score, result.grade);
console.log(textReport(result));
```

`result` has the shape of the `--json` output. Types are included.

## Development

```sh
pnpm install
pnpm exec playwright install chromium
pnpm check          # lint, typecheck, format, build, test
```

Node 20 or newer and pnpm 10. The audit and CLI tests need Chromium.

## Licence

[MIT](LICENSE) © Abimbola Omoyola and contributors. Not affiliated with any government.
