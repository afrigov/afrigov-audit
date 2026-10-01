# Contributing to afrigov-audit

## Setup

```sh
git clone https://github.com/omoyolab/afrigov-audit
cd afrigov-audit
pnpm install
pnpm exec playwright install chromium
pnpm check
```

Node 20 or newer and pnpm 10.

## What we are looking for

**A page that proves the score is wrong.** The weights in `src/score.ts` are public so they can be argued with. If a page scores well but is unusable, or scores badly for trivia, open an issue with the URL and what a person actually experiences.

**Fix mappings.** `src/fixes.ts` maps axe rule ids to the afrigov page that fixes them. Missing or wrong mappings are quick pull requests.

**New checks.** Add a fact to `collectFacts` in `src/checks.ts` and a finding in `factsToFindings`, with an `ag-` id, a WCAG criterion, and a fixture in `test/fixtures/` that fails it. Keep checks to things that decide whether a page works on a cheap phone; axe already covers the rest.

**Not yet:** crawling, logins, reports in other formats. Open an issue first.

## Pull request checklist

- `pnpm check` passes. The audit and CLI tests need Chromium.
- New behaviour has a test. Bug fixes have a test that fails without the fix.
- `CHANGELOG.md` has a line under **Unreleased**.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org).

## Releasing (maintainers)

1. Move **Unreleased** in `CHANGELOG.md` under a new version heading with today's date.
2. `pnpm version <patch|minor|major>` and `git push --follow-tags`.
3. The release workflow publishes to npm with provenance and creates the GitHub release.

## Code of conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Be kind.
