# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Fixed

- **A visually hidden skip link is no longer a "too small" touch target.** A link clipped to nothing or shrunk to 1px (the usual `.sr-only` or `.visually-hidden` recipe) only shows when focused, so it is not measured while hidden.
- **The skip link check finds more real skip links.** It used to look only at the first link, and only if it pointed at an id on the page. Now any control before `main` whose text says it skips to the content counts, in English, French, Spanish, Portuguese, German, Arabic or Swahili. This covers a skip link that moves focus with a click handler, and one that comes after a cookie banner, as on GOV.UK. A link to an id on the page still counts when it is one of the first three controls.

## [0.3.1] - 2026-10-06

### Changed

- The fix for each problem links to afrigov's docs at [afrigov.dev](https://afrigov.dev). The code is now in the [afrigov organisation](https://github.com/afrigov) on GitHub.

## [0.3.0] - 2026-10-03

### Added

- **Page weight on a phone.** The report says what the page downloads at phone width, how much is images, and which images are heavier than they need to be, with the size the screen needs and the total that fixing them would save. It links to afrigov's guidance on images. Page weight does not change the score. In JSON it is `facts.weight`, and `facts.bytes` is now filled in.
- `formatBytes` is exported.

## [0.2.0] - 2026-10-02

### Added

- `--badge <file>` writes the grade and score as a badge: a self-contained `.svg`, or a `.json` shields.io endpoint document. `--label <text>` sets the text on the left. `badgeSvg`, `badgeJson`, `badgeMessage` and `BADGE_COLORS` are exported from the library.

## [0.1.2] - 2026-10-02

### Fixed

- Links inside table header cells and description-list terms are inline text, so the tap-target check exempts them as it already did for body cells.

## [0.1.1] - 2026-10-02

### Added

- Fix mappings for 25 more axe rules that the first scoreboard run surfaced without one, including role="img" and SVG alt text, invalid ARIA attributes and values, image buttons, definition lists and meta refresh.

## [0.1.0] - 2026-10-02

First release.

### Added

- `afrigov-audit <url>`: axe-core at phone and desktop widths with the WCAG 2.0, 2.1 and 2.2 AA rule sets.
- afrigov checks: language declared, zoom allowed, skip link present, page titled, touch targets at phone width.
- A public scoring formula with impact weights and a per-rule node cap, and letter grades.
- Each finding mapped to the afrigov component or style page that fixes it.
- `--json`, `--all`, `--phone`, `--desktop`, `--fail-under`, `--timeout`, `--no-wcag22`, `--no-color`.
- Library export: `audit()`, `textReport()`, `jsonReport()` with types.

[Unreleased]: https://github.com/afrigov/afrigov-audit/compare/v0.3.1...HEAD
[0.3.1]: https://github.com/afrigov/afrigov-audit/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/afrigov/afrigov-audit/compare/v0.2.0...v0.3.0
[0.1.2]: https://github.com/afrigov/afrigov-audit/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/afrigov/afrigov-audit/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/afrigov/afrigov-audit/releases/tag/v0.1.0
