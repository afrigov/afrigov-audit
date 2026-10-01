export { audit, AuditError, mergeFindings, VIEWPORTS } from "./audit.js";
export { FIXES, fixFor, wcagFromTags } from "./fixes.js";
export { jsonReport, textReport, gradeSentence } from "./report.js";
export { grade, penalty, score, sortFindings, summarise, WEIGHTS, NODE_CAP } from "./score.js";
export type * from "./types.js";
export { version } from "./version.js";
