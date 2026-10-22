import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");

export const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

/** Saves an uploaded image and returns its public URL, or null when no file was sent. */
export async function saveUpload(file: FormDataEntryValue | null): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  const ext = path.extname(file.name).toLowerCase();
  if (!MIME[ext] || ext === ".svg") throw new Error("Upload a JPG, PNG, WebP, AVIF or GIF image.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Images must be 8 MB or smaller.");
  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${randomUUID()}${ext}`;
  await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return `/media/${name}`;
}
