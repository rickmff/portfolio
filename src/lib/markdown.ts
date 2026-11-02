import hljs from "highlight.js/lib/common";
import { Marked, Renderer } from "marked";
import markedAlert from "marked-alert";
import markedFootnote from "marked-footnote";
import { gfmHeadingId } from "marked-gfm-heading-id";
import { markedHighlight } from "marked-highlight";

// Kept in its own module so client components can slugify without pulling in marked and highlight.js.
export { slugify } from "./slug";

export type ImageDims = Record<string, { width: number; height: number }>;

/** Public Vercel Blob URLs, where uploads live when the site runs on Vercel. */
export const BLOB_HOST = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i;

// Widths Next's image optimiser serves by default (deviceSizes + the larger imageSizes).
const WIDTHS = [384, 640, 828, 1080, 1200, 1920];

/**
 * A local (or Blob) image with a known size gets width/height and a srcset through Next's optimiser, so
 * it arrives as WebP/AVIF at the width the column needs and never shifts the text below it.
 * It still shows at its own size, capped by the column, exactly like the plain tag.
 */
function imgTag(href: string, alt: string, dims?: ImageDims) {
  const d = dims?.[href];
  if (!d || !(href.startsWith("/") || BLOB_HOST.test(href)) || /\.(gif|svg)(\?|$)/i.test(href)) {
    return `<img src="${href}" alt="${alt}" loading="lazy" decoding="async" />`;
  }
  const url = (w: number) => `/_next/image?url=${encodeURIComponent(href)}&w=${w}&q=80`;
  const widths = WIDTHS.filter((w) => w < d.width);
  const full = WIDTHS.find((w) => w >= d.width);
  const srcset = widths.map((w) => `${url(w)} ${w}w`);
  if (full) srcset.push(`${url(full)} ${d.width}w`);
  return `<img src="${href}" srcset="${srcset.join(", ")}" sizes="(max-width: 700px) 100vw, ${Math.min(d.width, 640)}px" width="${d.width}" height="${d.height}" alt="${alt}" loading="lazy" decoding="async" />`;
}

let currentDims: ImageDims | undefined;

/**
 * Full GitHub-flavoured Markdown: tables, task lists, strikethrough, footnotes, heading ids,
 * `> [!NOTE]` callouts and highlighted code blocks. The single renderer for every page,
 * so any local preview matches what gets published.
 */
const md = new Marked(
  { gfm: true, breaks: false },
  markedHighlight({
    emptyLangClass: "hljs",
    langPrefix: "hljs language-",
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  }),
  gfmHeadingId(),
  markedFootnote({ description: "Notes", refMarkers: true }),
  markedAlert(),
  {
    renderer: {
      // Fenced code gets a small language label, like the mono eyebrows elsewhere on the site.
      code({ text, lang }) {
        const label = (lang ?? "").split(/\s/)[0];
        const cls = label ? `hljs language-${label}` : "hljs";
        return `<figure class="code">${label ? `<figcaption>${label}</figcaption>` : ""}<pre><code class="${cls}">${text}</code></pre></figure>\n`;
      },
      // Wide tables scroll on their own instead of pushing the page sideways.
      table(token) {
        return `<div class="table-wrap">${Renderer.prototype.table.call(this, token)}</div>`;
      },
      // A link titled "preview:<image url>" shows that image on hover, like the award posts on About.
      link(token) {
        const preview = token.title?.match(/^preview:(\S+)$/)?.[1];
        if (!preview) return Renderer.prototype.link.call(this, token);
        const text = this.parser.parseInline(token.tokens);
        return `<a href="${token.href}" class="has-preview" target="_blank" rel="noopener noreferrer">${text}<span class="link-preview" aria-hidden="true"><img src="${preview}" alt="" loading="lazy" /></span></a>`;
      },
      // An image with a title ![alt](src "caption") gets a caption. Spans, because images sit inside <p>.
      image({ href, title, text }) {
        const img = imgTag(href, text, currentDims);
        return title ? `<span class="figure">${img}<span class="caption">${title}</span></span>` : img;
      },
    },
  },
);

/** Content is authored only by the site owner in the backoffice, so raw HTML is allowed. */
export function renderMarkdown(src: string, dims?: ImageDims) {
  currentDims = dims;
  try {
    return md.parse(src, { async: false });
  } finally {
    currentDims = undefined;
  }
}


export function readingMinutes(src: string) {
  return Math.max(1, Math.round(src.split(/\s+/).length / 220));
}
