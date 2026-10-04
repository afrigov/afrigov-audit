export type Impact = "critical" | "serious" | "moderate" | "minor";

export type ViewportName = "phone" | "desktop";

export interface Viewport {
  name: ViewportName;
  width: number;
  height: number;
}

export interface Finding {
  /** axe rule id, or an `ag-` id for afrigov's own checks. */
  id: string;
  impact: Impact;
  /** One-line description of the problem. */
  help: string;
  /** Link to the rule's documentation. */
  helpUrl: string;
  /** WCAG success criteria this maps to, like "1.4.3". */
  wcag: string[];
  /** Number of elements affected, summed across viewports and deduplicated by selector. */
  nodes: number;
  /** A few example selectors. */
  examples: string[];
  /** Which viewports the problem appeared in. */
  viewports: ViewportName[];
  /** The afrigov component or style page that fixes it, if any. */
  fix?: Fix;
}

export interface Fix {
  /** Short name, like "Text input". */
  component: string;
  /** Documentation URL on the afrigov site. */
  url: string;
  /** One sentence on what to do. */
  advice: string;
}

export interface PageFacts {
  title: string;
  lang: string | null;
  hasSkipLink: boolean;
  viewportMeta: string | null;
  allowsZoom: boolean;
  /** Interactive elements under 24px tall or wide, excluding inline text links. */
  smallTargets: string[];
  /** Interactive elements under 44px tall, same exclusion. The afrigov floor. */
  targetsUnder44: number;
  interactiveCount: number;
  /** Everything the page downloaded, compressed, at phone width. Null where it could not be measured. */
  bytes: number | null;
  /** What the page downloads and which images are heavier than they need to be. Phone width only. */
  weight?: PageWeight | null;
}

export interface HeavyImage {
  url: string;
  bytes: number;
  /** The file's size in pixels, when it is on the page. */
  width: number | null;
  height: number | null;
  /** How wide it is shown, in CSS pixels. */
  shownWidth: number | null;
  /** Roughly what it would weigh resized for the screen and saved as WebP. 0 when it is not shown at all. */
  estimateBytes: number;
  /** too-large: far more pixels than the screen shows. heavy: over 300 KB at any size. not-shown: downloaded but not on screen when checked, such as a hidden slide. */
  reason: "too-large" | "heavy" | "not-shown";
}

export interface PageWeight {
  totalBytes: number;
  imageBytes: number;
  requests: number;
  images: number;
  /** The ten heaviest problem images, largest first. */
  heavyImages: HeavyImage[];
  heavyCount: number;
  /** Roughly what fixing the heavy images would save. */
  possibleSaving: number;
}

export interface ViewportResult {
  viewport: Viewport;
  facts: PageFacts;
  findings: Finding[];
  /** Rules that passed, by id. */
  passes: string[];
  /** Elapsed milliseconds for navigation plus analysis. */
  ms: number;
}

export interface AuditResult {
  url: string;
  finalUrl: string;
  checkedAt: string;
  tool: { name: string; version: string; axeVersion: string };
  viewports: ViewportResult[];
  /** Findings merged across viewports, most severe first. */
  findings: Finding[];
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  summary: Record<Impact, number>;
}

export interface AuditOptions {
  /** Which viewports to test. Default both. */
  viewports?: ViewportName[];
  /** Navigation timeout in milliseconds. Default 30000. */
  timeout?: number;
  /** Include WCAG 2.2 AA rules. Default true. */
  wcag22?: boolean;
  /** Extra user agent suffix. The tool always identifies itself. */
  userAgent?: string;
}
