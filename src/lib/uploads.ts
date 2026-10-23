import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";

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
};

/** Saves an uploaded image (or short MP4/WebM clip) and returns its public URL, or null when no file was sent. */
export async function saveUpload(file: FormDataEntryValue | null): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  const ext = path.extname(file.name).toLowerCase();
  if (!MIME[ext] || ext === ".svg") throw new Error("Upload a JPG, PNG, WebP, AVIF or GIF image, or an MP4/WebM clip.");
  // Vercel caps function request bodies at 4.5 MB.
  const maxMb = process.env.VERCEL ? 4 : 8;
  if (file.size > maxMb * 1024 * 1024) throw new Error(`Files must be ${maxMb} MB or smaller.`);
  const name = `${randomUUID()}${ext}`;
  // On Vercel the disk is ephemeral, so files go to Vercel Blob when a store is connected.
  if (process.env.BLOB_READ_WRITE_TOKEN) {
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
