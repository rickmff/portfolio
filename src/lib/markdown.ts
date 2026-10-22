import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: false });

/** Content is authored only by the site owner in the backoffice, so raw HTML is allowed. */
export function renderMarkdown(src: string) {
  return marked.parse(src, { async: false });
}

export function slugify(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function readingMinutes(src: string) {
  return Math.max(1, Math.round(src.split(/\s+/).length / 220));
}
