import "server-only";

/**
 * Fetches a Project Gutenberg HTML edition and turns it into clean, paged HTML for the on-site
 * reader. Only structural tags survive (no attributes, scripts, styles or images), so the
 * result is safe to render as-is. The Gutenberg header and licence are dropped; the reader
 * credits the source and links back instead.
 */

export type ReaderPage = { html: string };
export type TocEntry = { label: string; page: number };
export type ReaderBook = { pages: ReaderPage[]; toc: TocEntry[] };

const KEEP = new Set([
  "p", "h1", "h2", "h3", "h4", "h5", "h6", "em", "i", "strong", "b", "blockquote", "br", "hr",
  "ul", "ol", "li", "sup", "sub", "small", "pre", "table", "tbody", "tr", "td", "th", "cite",
]);
const VOID = new Set(["br", "hr"]);
/** Roughly a long chapter of markup per page. */
const PAGE_CHARS = 60_000;

const escapeText = (s: string) => s.replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Rebuilds the markup from an allow-list: every kept tag is re-emitted bare, text is escaped. */
function sanitize(html: string) {
  const cleaned = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|head|svg|math|noscript|template|iframe|object)\b[\s\S]*?<\/\1\s*>/gi, "")
    // Printed page numbers ("[12]") in the margin of the source scans.
    .replace(/<span[^>]*class="[^"]*pagenum[^"]*"[^>]*>[\s\S]*?<\/span>/gi, "");
  let out = "";
  let last = 0;
  const tag = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
  for (let m; (m = tag.exec(cleaned)); ) {
    out += escapeText(cleaned.slice(last, m.index));
    last = tag.lastIndex;
    const name = m[2].toLowerCase();
    if (!KEEP.has(name)) {
      // Block wrappers still need to break the text.
      if (!m[1] && /^(div|section|article)$/.test(name)) out += "\n";
      continue;
    }
    if (VOID.has(name)) out += m[1] ? "" : `<${name}>`;
    else out += `<${m[1]}${name}>`;
  }
  out += escapeText(cleaned.slice(last));
  // Gutenberg wraps chapters in empty paragraphs and pagenum spans; tidy what that leaves.
  return out
    .replace(/<(p|h[1-6]|li)>\s*<\/\1>/g, "")
    .replace(/\n{3,}/g, "\n\n");
}

/** The book itself, without the Project Gutenberg header, licence and footer. */
function body(html: string) {
  const header = html.search(/id="pg-header"/i);
  const close = header >= 0 ? html.indexOf("</section>", header) : -1;
  const start = close >= 0 ? close + "</section>".length : -1;
  const end = html.search(/<section[^>]*id="pg-footer"/i);
  if (start > 0 && end > start) return html.slice(start, end);
  // Older files: the book sits between the *** START / *** END markers.
  const a = html.search(/\*\*\*\s*START OF (THE|THIS) PROJECT GUTENBERG/i);
  const z = html.search(/\*\*\*\s*END OF (THE|THIS) PROJECT GUTENBERG/i);
  const from = a >= 0 ? html.indexOf("***", a + 3) + 3 : html.search(/<body[^>]*>/i);
  return html.slice(Math.max(from, 0), z > from ? z : undefined);
}

const textOf = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#?\w+;/g, "")
    .replace(/\s+/g, " ")
    .trim();

function paginate(html: string): ReaderBook {
  // Split before each chapter heading: the highest heading level that repeats.
  const level = ["h2", "h3", "h4"].find((h) => (html.match(new RegExp(`<${h}>`, "g")) ?? []).length > 1);
  const parts = level ? html.split(new RegExp(`(?=<${level}>)`)) : [html];
  const pages: ReaderPage[] = [];
  const toc: TocEntry[] = [];
  let current = "";
  for (const part of parts) {
    if (current && current.length + part.length > PAGE_CHARS) {
      pages.push({ html: current });
      current = "";
    }
    const heading = level && part.startsWith(`<${level}>`) ? textOf(part.slice(0, part.indexOf(`</${level}>`))) : "";
    if (heading) toc.push({ label: heading.length > 80 ? `${heading.slice(0, 78)}…` : heading, page: pages.length + 1 });
    current += part;
  }
  if (current.trim()) pages.push({ html: current });
  return { pages: pages.length ? pages : [{ html: "" }], toc };
}

const cache = new Map<number, Promise<ReaderBook>>();
const CACHE_SIZE = 12;

async function load(id: number): Promise<ReaderBook> {
  const res = await fetch(`http://127.0.0.1:8099/cache/epub/${id}/pg${id}-images.html`, {
    headers: { "User-Agent": "rickmff-portfolio (book reader)" },
    signal: AbortSignal.timeout(20_000),
    // Whole books go past the fetch cache's size limit; the in-memory cache below keeps them.
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Project Gutenberg answered ${res.status}`);
  return paginate(sanitize(body(await res.text())));
}

/** A parsed book, kept in memory so paging through it never refetches. */
export function getGutenbergBook(id: number) {
  let hit = cache.get(id);
  if (!hit) {
    hit = load(id);
    hit.catch(() => cache.delete(id));
    cache.set(id, hit);
    if (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value!);
  } else {
    // Most recently read goes to the back of the queue.
    cache.delete(id);
    cache.set(id, hit);
  }
  return hit;
}
