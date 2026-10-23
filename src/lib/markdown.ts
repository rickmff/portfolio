import hljs from "highlight.js/lib/common";
import { Marked, Renderer } from "marked";
import markedAlert from "marked-alert";
import markedFootnote from "marked-footnote";
import { gfmHeadingId } from "marked-gfm-heading-id";
import { markedHighlight } from "marked-highlight";

/**
 * Full GitHub-flavoured Markdown: tables, task lists, strikethrough, footnotes, heading ids,
 * `> [!NOTE]` callouts and highlighted code blocks. Shared by the site and the admin preview,
 * so what you see in the editor is what gets published.
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
      // An image with a title ![alt](src "caption") gets a caption. Spans, because images sit inside <p>.
      image({ href, title, text }) {
        const img = `<img src="${href}" alt="${text}" loading="lazy" />`;
        return title ? `<span class="figure">${img}<span class="caption">${title}</span></span>` : img;
      },
    },
  },
);

/** Content is authored only by the site owner in the backoffice, so raw HTML is allowed. */
export function renderMarkdown(src: string) {
  return md.parse(src, { async: false });
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
