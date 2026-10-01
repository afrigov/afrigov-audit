import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

const cli = join(import.meta.dirname, "..", "dist", "cli.js");
const run = (...args: string[]) =>
  spawnSync(process.execPath, [cli, ...args], {
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
  });
const fixture = (name: string) => pathToFileURL(join(import.meta.dirname, "fixtures", name)).href;

describe("cli (needs a build and Chromium)", () => {
  it("prints help and version", () => {
    expect(run("--help").stdout).toContain("Usage");
    expect(run("--version").stdout.trim()).toMatch(/^\d+\.\d+\.\d+/);
    expect(run("--version", "--no-color", "--no-wcag22").status).toBe(0);
  });

  it("exits 2 without a url", () => {
    const r = run();
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("Give the address");
  });

  it("audits a page and honours --fail-under", () => {
    const ok = run(fixture("good.html"), "--phone");
    expect(ok.status).toBe(0);
    expect(ok.stdout).toContain("100 / 100");

    const bad = run(fixture("bad.html"), "--phone", "--fail-under", "80");
    expect(bad.status).toBe(1);
    expect(bad.stderr).toContain("is below 80");

    const json = run(fixture("bad.html"), "--phone", "--json");
    expect(json.status).toBe(0);
    expect(JSON.parse(json.stdout).tool.name).toBe("afrigov-audit");
  }, 120_000);

  it("exits 3 when the page cannot be loaded", () => {
    const r = run("http://127.0.0.1:9/nothing", "--phone", "--timeout", "3000");
    expect(r.status).toBe(3);
  }, 30_000);
});
