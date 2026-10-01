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
  bytes: number | null;
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
