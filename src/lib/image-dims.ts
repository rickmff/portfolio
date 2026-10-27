import "server-only";
import path from "node:path";
import sharp from "sharp";
import type { ImageDims } from "./markdown";
import { UPLOAD_DIR } from "./uploads";

/** Where a local image URL lives on disk: uploads under /media, everything else in public/. */
function fileFor(src: string) {
  const clean = src.split(/[?#]/)[0];
  if (clean.startsWith("/media/")) return path.join(UPLOAD_DIR, path.basename(clean));
  if (clean.startsWith("/") && !clean.includes("..")) return path.join(process.cwd(), "public", clean);
  return null;
}

/**
 * The natural size of every local image a Markdown body shows, so the page can give each one
 * width/height (no reflow) and a responsive srcset. Unreadable files are simply left out.
 */
export async function imageDims(markdown: string): Promise<ImageDims> {
  const srcs = new Set([...markdown.matchAll(/!\[[^\]]*\]\(\s*<?([^\s)>]+)/g)].map((m) => m[1]));
  const out: ImageDims = {};
  await Promise.all(
    [...srcs].map(async (src) => {
      const file = fileFor(src);
      if (!file) return;
      try {
        const { width, height } = await sharp(file).metadata();
        if (width && height) out[src] = { width, height };
      } catch {}
    }),
  );
  return out;
}
