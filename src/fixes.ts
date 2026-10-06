import type { Fix } from "./types.js";

const DOCS = "https://afrigov.dev";

const fix = (component: string, path: string, advice: string): Fix => ({
  component,
  url: `${DOCS}/${path}`,
  advice,
});

/**
 * Which afrigov page fixes which axe rule. Only rules with a genuine match are
 * listed; everything else is reported with axe's own help link.
 */
export const FIXES: Record<string, Fix> = {
  "color-contrast": fix(
    "Colour",
    "styles/colour.html",
    "Use the pack's derived primary and the status tokens; every pair passes 4.5:1.",
  ),
  "color-contrast-enhanced": fix(
    "Colour",
    "styles/colour.html",
    "Use the ink and paper tokens for body text.",
  ),
  "link-in-text-block": fix(
    "Styles",
    "styles/index.html",
    "Links are always underlined in afrigov, so colour is never the only signal.",
  ),
  label: fix(
    "Text input",
    "components/text-input.html",
    "Every control gets a visible label tied by for/id.",
  ),
  "label-title-only": fix(
    "Text input",
    "components/text-input.html",
    "Use a visible label, not a title attribute.",
  ),
  "select-name": fix("Select", "components/select.html", "Give the select a visible label."),
  "form-field-multiple-labels": fix(
    "Text input",
    "components/text-input.html",
    "One label per control; hints and errors use aria-describedby.",
  ),
  "autocomplete-valid": fix(
    "Text input",
    "components/text-input.html",
    "Use the autocomplete values from the examples.",
  ),
  "aria-input-field-name": fix(
    "Radios",
    "components/radios.html",
    "Use native radios and checkboxes in a fieldset with a legend.",
  ),
  "button-name": fix(
    "Button",
    "components/button.html",
    "Label buttons with a verb. Icon-only buttons need visually hidden text.",
  ),
  "link-name": fix(
    "Button",
    "components/button.html",
    "Links and buttons need text that says where they go or what they do.",
  ),
  "image-alt": fix(
    "Header",
    "components/header.html",
    'Decorative images get alt=""; informative ones describe the content.',
  ),
  "html-has-lang": fix(
    "Language and script",
    "styles/language.html",
    "Set lang on the html element.",
  ),
  "html-lang-valid": fix(
    "Language and script",
    "styles/language.html",
    "Use a valid BCP 47 code, like en or ha.",
  ),
  "valid-lang": fix(
    "Language and script",
    "styles/language.html",
    "Use valid language codes on passages in another language.",
  ),
  "document-title": fix(
    "Get started",
    "get-started.html",
    "Every page has a title that says what it is and whose it is.",
  ),
  "heading-order": fix(
    "Typography",
    "styles/typography.html",
    "One h1, then h2, then h3, without skipping.",
  ),
  "empty-heading": fix(
    "Typography",
    "styles/typography.html",
    "Headings need visible text; remove empty ones.",
  ),
  "page-has-heading-one": fix(
    "Typography",
    "styles/typography.html",
    "Every page has exactly one h1.",
  ),
  region: fix(
    "Get started",
    "get-started.html",
    "Put all content inside header, nav, main and footer landmarks.",
  ),
  "landmark-one-main": fix(
    "Get started",
    "get-started.html",
    "One main element per page, with the skip link pointing at it.",
  ),
  "landmark-unique": fix(
    "Header",
    "components/header.html",
    "Give each nav an aria-label that says what it is for.",
  ),
  bypass: fix(
    "Skip link",
    "components/skip-link.html",
    "Add a skip link as the first focusable element.",
  ),
  "skip-link": fix(
    "Skip link",
    "components/skip-link.html",
    "The skip link must point at a real id on the page.",
  ),
  "focus-order-semantics": fix(
    "Button",
    "components/button.html",
    "Use real buttons and links, not divs with click handlers.",
  ),
  "scrollable-region-focusable": fix(
    "Table",
    "components/table.html",
    "Wrap wide tables in a focusable, labelled region.",
  ),
  "th-has-data-cells": fix(
    "Table",
    "components/table.html",
    "Use th with scope for every header cell.",
  ),
  "td-headers-attr": fix(
    "Table",
    "components/table.html",
    "Use scope on th cells instead of headers attributes.",
  ),
  "table-duplicate-name": fix(
    "Table",
    "components/table.html",
    "The caption and the summary must not repeat each other.",
  ),
  list: fix(
    "Spacing and layout",
    "styles/spacing-and-layout.html",
    "Lists contain only li elements.",
  ),
  listitem: fix(
    "Spacing and layout",
    "styles/spacing-and-layout.html",
    "li elements live inside ul or ol.",
  ),
  "meta-viewport": fix(
    "Get started",
    "get-started.html",
    "Never disable zoom. Use width=device-width, initial-scale=1.",
  ),
  "meta-viewport-large": fix("Get started", "get-started.html", "Allow at least 5x zoom."),
  "target-size": fix(
    "Spacing and layout",
    "styles/spacing-and-layout.html",
    "Interactive elements are at least 48px tall in afrigov.",
  ),
  "aria-allowed-attr": fix(
    "Button",
    "components/button.html",
    "Prefer native elements; they need no ARIA.",
  ),
  "aria-required-children": fix(
    "Accordion",
    "components/accordion.html",
    "Use native details and summary instead of ARIA widgets.",
  ),
  "aria-hidden-focus": fix(
    "Details",
    "components/details.html",
    "Do not hide focusable content with aria-hidden.",
  ),
  "nested-interactive": fix(
    "Service card",
    "components/service-card.html",
    "One link per card, stretched with CSS, not nested controls.",
  ),
  "duplicate-id-active": fix(
    "Text input",
    "components/text-input.html",
    "Every control id is unique on the page.",
  ),
  "duplicate-id-aria": fix(
    "Text input",
    "components/text-input.html",
    "Every id referenced by ARIA is unique.",
  ),
  "frame-title": fix("Get started", "get-started.html", "Give iframes a title."),
  "role-img-alt": fix(
    "Header",
    "components/header.html",
    'Elements with role="img" need an aria-label that describes the image, or aria-hidden if decorative.',
  ),
  "svg-img-alt": fix(
    "Header",
    "components/header.html",
    'Inline SVGs with role="img" need a title or aria-label; decorative ones get aria-hidden.',
  ),
  "input-image-alt": fix(
    "Button",
    "components/button.html",
    "Image buttons need alt text that says what the button does, or use a real button.",
  ),
  "object-alt": fix(
    "Header",
    "components/header.html",
    "Embedded objects need a text alternative.",
  ),
  "area-alt": fix(
    "Header",
    "components/header.html",
    "Each image-map area needs alt text, or use real links.",
  ),
  "aria-valid-attr": fix(
    "Button",
    "components/button.html",
    "Remove misspelt or invented ARIA attributes. Native elements need none.",
  ),
  "aria-valid-attr-value": fix(
    "Button",
    "components/button.html",
    "ARIA attributes must reference ids that exist and use allowed values.",
  ),
  "aria-roles": fix(
    "Button",
    "components/button.html",
    "Use a valid role, or better, the native element that already has it.",
  ),
  "aria-required-parent": fix(
    "Accordion",
    "components/accordion.html",
    "ARIA widget children need their parent role; prefer native elements.",
  ),
  "aria-command-name": fix(
    "Button",
    "components/button.html",
    'Anything with role="button" or role="link" needs a name. Use a real button or link.',
  ),
  "aria-toggle-field-name": fix(
    "Checkboxes",
    "components/checkboxes.html",
    "Use native checkboxes and radios with visible labels.",
  ),
  "aria-tooltip-name": fix(
    "Text input",
    "components/text-input.html",
    "Put help text in a visible hint tied by aria-describedby instead of a tooltip.",
  ),
  "aria-progressbar-name": fix(
    "Alert",
    "components/alert.html",
    "Give progress indicators a label, or report progress as text.",
  ),
  "aria-meter-name": fix(
    "Alert",
    "components/alert.html",
    "Give meters a label, or report the value as text.",
  ),
  "label-content-name-mismatch": fix(
    "Button",
    "components/button.html",
    "The accessible name must contain the visible text.",
  ),
  "definition-list": fix(
    "Summary list",
    "components/summary-list.html",
    "A dl contains only dt and dd pairs, optionally wrapped in div.",
  ),
  dlitem: fix("Summary list", "components/summary-list.html", "dt and dd belong inside a dl."),
  "meta-refresh": fix(
    "Get started",
    "get-started.html",
    "Do not auto-refresh or redirect with a meta tag.",
  ),
  "html-xml-lang-mismatch": fix(
    "Language and script",
    "styles/language.html",
    "lang and xml:lang must match.",
  ),
  "link-in-text-block-style": fix(
    "Styles",
    "styles/index.html",
    "Underline links in text; afrigov never relies on colour alone.",
  ),
  "image-redundant-alt": fix(
    "Header",
    "components/header.html",
    "Alt text should not repeat the words next to the image.",
  ),
  "landmark-no-duplicate-main": fix(
    "Get started",
    "get-started.html",
    "One main landmark per page.",
  ),
  "landmark-main-is-top-level": fix(
    "Get started",
    "get-started.html",
    "main sits directly in body, not inside another landmark.",
  ),
  tabindex: fix(
    "Button",
    "components/button.html",
    "Never use tabindex greater than 0; order comes from the document.",
  ),
  accesskeys: fix(
    "Button",
    "components/button.html",
    "Access keys must be unique, and are rarely worth having.",
  ),
  "ag-no-lang": fix("Language and script", "styles/language.html", "Set lang on the html element."),
  "ag-zoom-disabled": fix(
    "Get started",
    "get-started.html",
    "Remove user-scalable=no and maximum-scale from the viewport meta.",
  ),
  "ag-no-skip-link": fix(
    "Skip link",
    "components/skip-link.html",
    "Add a skip link as the first focusable element.",
  ),
  "ag-no-title": fix("Get started", "get-started.html", "Give the page a title."),
  "ag-small-targets": fix(
    "Spacing and layout",
    "styles/spacing-and-layout.html",
    "Make links and controls at least 48px tall at phone width.",
  ),
};

export function fixFor(ruleId: string): Fix | undefined {
  return FIXES[ruleId];
}

/** axe tags like "wcag143" or "wcag2411" to "1.4.3" or "2.4.11". */
export function wcagFromTags(tags: string[]): string[] {
  const out: string[] = [];
  for (const tag of tags) {
    const m = /^wcag(\d)(\d)(\d{1,2})$/.exec(tag);
    if (m) out.push(`${m[1]}.${m[2]}.${m[3]}`);
  }
  return [...new Set(out)].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}
