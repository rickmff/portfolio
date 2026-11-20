import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { blobConfigured } from "./blob.mjs";
import { REQUEST_MAX_MB } from "./upload-limits";

export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");

export const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf",
};

const ascii = (b: Uint8Array, from: number, to: number) => String.fromCharCode(...b.subarray(from, to));

/** The extension alone is the uploader's word; the first bytes say what the file really is. */
function matchesType(ext: string, b: Uint8Array) {
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    case ".png":
      return ascii(b, 1, 4) === "PNG" && b[0] === 0x89;
    case ".gif":
      return ascii(b, 0, 4) === "GIF8";
    case ".webp":
      return ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP";
    case ".avif":
    case ".mp4":
      return ascii(b, 4, 8) === "ftyp";
    case ".webm":
      return b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3;
    case ".pdf":
      return ascii(b, 0, 5) === "%PDF-";
    default:
      return false;
  }
}

/** Saves an uploaded image (or short MP4/WebM clip, or a PDF when `pdf` is set) and returns its public URL, or null when no file was sent. */
export async function saveUpload(
  file: FormDataEntryValue | null,
  opts: { maxMb?: number; pdf?: boolean } = {},
): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  const ext = path.extname(file.name).toLowerCase();
  if (ext === ".pdf" ? !opts.pdf : !MIME[ext] || ext === ".svg")
    throw new Error(opts.pdf ? "Upload a PDF." : "Upload a JPG, PNG, WebP, AVIF or GIF image, or an MP4/WebM clip.");
  // Vercel caps function request bodies at 4.5 MB (the browser checks this first, see upload-limits.ts).
  const maxMb = process.env.VERCEL ? REQUEST_MAX_MB : (opts.maxMb ?? 8);
  if (file.size > maxMb * 1024 * 1024) throw new Error(`Files must be ${maxMb} MB or smaller.`);
  if (!matchesType(ext, new Uint8Array(await file.slice(0, 16).arrayBuffer())))
    throw new Error("That file's contents do not match its extension.");
  const name = `${randomUUID()}${ext}`;
  // On Vercel the disk is ephemeral, so files go to Vercel Blob when a store is connected.
  if (blobConfigured()) {
    const blob = await put(`media/${name}`, file, { access: "public", contentType: MIME[ext] });
    return blob.url;
  }
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return `/media/${name}`;
}

/** Downloads a cover picked in the book lookup and stores it like an upload. Only Open Library covers. */
export async function saveRemoteImage(url: string): Promise<string | null> {
  const u = new URL(url);
  if (u.protocol !== "https:" || u.hostname !== "covers.openlibrary.org") throw new Error("Covers can only come from Open Library.");
  const res = await fetch(u, { signal: AbortSignal.timeout(15000) });
  const type = res.headers.get("content-type") ?? "";
  if (!res.ok || !type.startsWith("image/")) throw new Error("Could not download the cover.");
  const buf = await res.arrayBuffer();
  // Open Library returns a 1×1 placeholder when it has no cover.
  if (buf.byteLength < 1000) return null;
  return saveUpload(new File([buf], "cover.jpg", { type: "image/jpeg" }));
}
