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
