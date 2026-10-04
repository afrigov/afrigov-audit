import { createServer, type Server } from "node:http";
import { deflateSync } from "node:zlib";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { audit } from "../src/audit.js";
import { textReport } from "../src/report.js";
import { formatBytes } from "../src/weight.js";

/** A PNG of random pixels, which cannot be compressed, so its size is predictable. */
function noisePng(width: number, height: number): Buffer {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf: Buffer) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff]! ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const body = Buffer.concat([Buffer.from(type), data]);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const sum = Buffer.alloc(4);
    sum.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, sum]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let i = 0; i < raw.length; i++)
    raw[i] = i % (width * 3 + 1) === 0 ? 0 : Math.floor(Math.random() * 256);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const big = noisePng(1200, 800);
const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Weight</title></head>
<body><a href="#main" style="position:absolute;left:-999em">Skip to main content</a><main id="main"><h1>Weight</h1>
<img src="/big.png" alt="A large photograph" width="120" height="80" style="width:120px;height:80px">
<img src="/big.png?hidden" alt="" style="display:none"></main></body></html>`;

let server: Server;
let url = "";

beforeAll(async () => {
  server = createServer((req, res) => {
    if (req.url?.startsWith("/big.png")) {
      res.writeHead(200, { "content-type": "image/png" });
      res.end(big);
      return;
    }
    res.writeHead(200, { "content-type": "text/html" });
    res.end(page);
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const address = server.address();
  url = `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}/`;
});

afterAll(() => {
  server.close();
});

describe("page weight (needs Chromium)", () => {
  it("measures the page and names images heavier than the screen needs", async () => {
    const result = await audit(url, { viewports: ["phone"] });
    const weight = result.viewports[0]?.facts.weight;
    expect(weight).toBeTruthy();
    expect(weight!.images).toBe(2);
    expect(weight!.imageBytes).toBeGreaterThan(2 * 1024 * 1024);
    expect(result.viewports[0]?.facts.bytes).toBe(weight!.totalBytes);
    const reasons = weight!.heavyImages.map((h) => h.reason).sort();
    expect(reasons).toEqual(["not-shown", "too-large"]);
    const shown = weight!.heavyImages.find((h) => h.reason === "too-large")!;
    expect(shown.width).toBe(1200);
    expect(shown.shownWidth).toBe(120);
    expect(shown.estimateBytes).toBeLessThan(shown.bytes / 10);
    expect(weight!.possibleSaving).toBeGreaterThan(2 * 1024 * 1024);
  }, 90_000);

  it("reports the weight without changing the score", async () => {
    const result = await audit(url, { viewports: ["phone"] });
    expect(result.score).toBe(100);
    const text = textReport(result);
    expect(text).toContain("Page weight on a phone");
    expect(text).toContain("2 images are heavier than they need to be");
    expect(text).toContain("It does not change the score.");
  }, 90_000);

  it("formats sizes for people", () => {
    expect(formatBytes(900)).toBe("900 bytes");
    expect(formatBytes(640 * 1024)).toBe("640 KB");
    expect(formatBytes(3.2 * 1024 * 1024)).toBe("3.2 MB");
  });
});
