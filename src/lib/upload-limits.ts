/**
 * Upload size limits, shared by the admin's browser checks and the server.
 *
 * A save sends every picked file in one request. On Vercel a function refuses any request body
 * above 4.5 MB with a bare 413, and the page only sees "An unexpected response was received
 * from the server", so the browser checks the sizes first and says what is too big. Off Vercel
 * (the VPS) the cap is the server action body limit in next.config.ts (42 MB).
 */
export const ON_VERCEL = process.env.NEXT_PUBLIC_ON_VERCEL === "1";

const MB = 1024 * 1024;

/** The most one save (or one inline image upload) may send in files. */
export const REQUEST_MAX_MB = ON_VERCEL ? 4 : 40;

const CLIP = /\.(mp4|webm)$/i;

/** The most a single file may weigh: clips run larger than images off Vercel. */
export function fileMaxMb(file: { name: string; type?: string }) {
  if (ON_VERCEL) return REQUEST_MAX_MB;
  return file.type?.startsWith("video/") || CLIP.test(file.name) ? 40 : 8;
}

export function formatMb(bytes: number) {
  return `${(bytes / MB).toFixed(1)} MB`;
}

/** Why this file cannot be uploaded, or null when it fits. */
export function fileSizeError(file: File): string | null {
  const max = fileMaxMb(file);
  if (file.size <= max * MB) return null;
  return `${file.name} is ${formatMb(file.size)}; files must be ${max} MB or smaller.`;
}

/** Why the files picked in this form cannot be saved together, or null when they fit. */
export function formSizeError(form: HTMLFormElement): string | null {
  const files = [...form.querySelectorAll<HTMLInputElement>('input[type="file"]')].flatMap((i) => [...(i.files ?? [])]);
  for (const f of files) {
    const err = fileSizeError(f);
    if (err) return err;
  }
  const total = files.reduce((sum, f) => sum + f.size, 0);
  if (total <= REQUEST_MAX_MB * MB) return null;
  return `Files add up to ${formatMb(total)}; a save takes ${REQUEST_MAX_MB} MB. Save them one at a time.`;
}
