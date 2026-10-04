import type { CDPSession, Page } from "playwright";

import type { HeavyImage, PageWeight } from "./types.js";

/** Bytes a well-compressed photograph needs per displayed pixel, as WebP at good quality. */
const BYTES_PER_PIXEL = 0.25;
/** An image smaller than this is never reported, whatever its size on screen. */
const FLOOR = 50 * 1024;
/** An image this large is reported even when it is shown at its full size. */
const CEILING = 300 * 1024;

export const IMAGES_DOC = "https://omoyolab.github.io/afrigov/styles/images.html";

interface Seen {
  url: string;
  type: string;
  bytes: number;
}

/**
 * Starts counting what the page downloads. Call before navigating; call the
 * returned function after the page has settled.
 */
export async function watchWeight(page: Page): Promise<() => Promise<PageWeight | null>> {
  const seen = new Map<string, Seen>();
  try {
    const session: CDPSession = await page.context().newCDPSession(page);
    await session.send("Network.enable");
    session.on("Network.responseReceived", (e) => {
      seen.set(e.requestId, { url: e.response.url, type: e.type, bytes: 0 });
    });
    session.on("Network.loadingFinished", (e) => {
      const s = seen.get(e.requestId);
      if (s) s.bytes = e.encodedDataLength;
    });
  } catch {
    return async () => null;
  }

  return async () => {
    const all = [...seen.values()].filter((s) => /^https?:/.test(s.url));
    if (all.length === 0) return null;
    const images = all.filter((s) => s.type === "Image");
    const shown = await page.evaluate(() => {
      const dpr = window.devicePixelRatio || 1;
      return Array.from(document.images).map((img) => {
        const r = img.getBoundingClientRect();
        return {
          url: img.currentSrc || img.src,
          width: img.naturalWidth,
          height: img.naturalHeight,
          shownWidth: Math.round(r.width),
          shownHeight: Math.round(r.height),
          dpr,
        };
      });
    });

    const heavy: HeavyImage[] = [];
    for (const img of images) {
      if (img.bytes < FLOOR) continue;
      const onPage = shown.find((s) => s.url === img.url);
      const shownWidth = onPage?.shownWidth ?? 0;
      const dpr = onPage?.dpr ?? 2;
      const needed =
        onPage && shownWidth > 0
          ? Math.max(
              10 * 1024,
              Math.round(shownWidth * dpr * onPage.shownHeight * dpr * BYTES_PER_PIXEL),
            )
          : 0;
      const tooWide = onPage ? onPage.width > shownWidth * dpr * 1.5 : false;
      const reason: HeavyImage["reason"] =
        !onPage || shownWidth === 0
          ? "not-shown"
          : tooWide && img.bytes > needed * 2
            ? "too-large"
            : img.bytes > CEILING
              ? "heavy"
              : null!;
      if (!reason) continue;
      heavy.push({
        url: img.url,
        bytes: img.bytes,
        width: onPage?.width ?? null,
        height: onPage?.height ?? null,
        shownWidth: onPage ? shownWidth : null,
        estimateBytes: reason === "not-shown" ? 0 : Math.min(needed, img.bytes),
        reason,
      });
    }
    heavy.sort((a, b) => b.bytes - a.bytes);
    const saving = heavy.reduce((sum, h) => sum + (h.bytes - h.estimateBytes), 0);

    return {
      totalBytes: all.reduce((sum, s) => sum + s.bytes, 0),
      imageBytes: images.reduce((sum, s) => sum + s.bytes, 0),
      requests: all.length,
      images: images.length,
      heavyImages: heavy.slice(0, 10),
      heavyCount: heavy.length,
      possibleSaving: saving,
    };
  };
}

/** 3.2 MB, 640 KB, 900 bytes. */
export function formatBytes(n: number): string {
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} bytes`;
}
