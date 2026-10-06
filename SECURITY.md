# Security Policy

## Reporting a vulnerability

If you find a security issue in afrigov-audit, please do not open a public issue.

Use GitHub's private reporting form:
https://github.com/afrigov/afrigov-audit/security/advisories/new

Or email **xanderabim@gmail.com** with "afrigov-audit security" in the subject.

You will get an acknowledgement within 72 hours and a fix or a plan within 14 days for
confirmed issues. Credit is given in the release notes unless you prefer otherwise.

## Scope

afrigov-audit loads the page you name in a real browser, once per viewport, and reports what it finds. It sends nothing anywhere else. Things that count as vulnerabilities:

- The tool loading, running or following anything beyond the page you named and what that page itself loads.
- Output that could run code when a report is opened, such as an SVG badge that executes script.
- A crafted page that makes the tool run code on your computer outside the browser.
