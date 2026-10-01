# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.0] - 2026-10-02

First release.

### Added

- `afrigov-audit <url>`: axe-core at phone and desktop widths with the WCAG 2.0, 2.1 and 2.2 AA rule sets.
- afrigov checks: language declared, zoom allowed, skip link present, page titled, touch targets at phone width.
- A public scoring formula with impact weights and a per-rule node cap, and letter grades.
- Each finding mapped to the afrigov component or style page that fixes it.
- `--json`, `--all`, `--phone`, `--desktop`, `--fail-under`, `--timeout`, `--no-wcag22`, `--no-color`.
- Library export: `audit()`, `textReport()`, `jsonReport()` with types.

[Unreleased]: https://github.com/omoyolab/afrigov-audit/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/omoyolab/afrigov-audit/releases/tag/v0.1.0
