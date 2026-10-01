import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const pkg = require("../package.json") as { version: string };
const axe = require("axe-core/package.json") as { version: string };

export const version: string = pkg.version;
export const axeVersion: string = axe.version;
