import { FilterXSS, escapeAttrValue, safeAttrValue } from "xss";

/**
 * The allow-list for rendered Markdown. Posts may carry raw HTML (callouts, <details>, <kbd>…),
 * and whoever holds the content API token can write them, so the output is filtered before it
 * reaches a page: no scripts, no event handlers, no frames, no `javascript:` links.
 * Everything the renderer in markdown.ts emits is listed here; add a tag when the renderer learns one.
 */
const GLOBAL = ["class", "id", "title", "lang", "dir", "role"];

const TAGS: Record<string, string[]> = {
  a: ["href", "target", "rel", "name"],
  img: ["src", "srcset", "sizes", "alt", "width", "height", "loading", "decoding"],
  video: ["src", "poster", "controls", "muted", "loop", "autoplay", "playsinline", "preload", "width", "height"],
  audio: ["src", "controls", "loop", "preload"],
  source: ["src", "srcset", "sizes", "type", "media"],
  picture: [],
  input: ["type", "checked", "disabled"],
  ol: ["start", "reversed", "type"],
  li: ["value"],
  td: ["align", "colspan", "rowspan"],
  th: ["align", "colspan", "rowspan", "scope"],
  col: ["span", "width"],
  details: ["open"],
  time: ["datetime"],
  abbr: [],
  // The callout icons from marked-alert.
  svg: ["viewbox", "width", "height", "fill", "xmlns", "version", "focusable"],
  path: ["d", "fill", "fill-rule", "clip-rule"],
};

for (const tag of [
  "p", "br", "hr", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "code", "kbd", "samp", "var",
  "em", "i", "strong", "b", "u", "s", "del", "ins", "mark", "small", "sub", "sup", "q", "cite", "dfn",
  "ul", "dl", "dt", "dd", "table", "thead", "tbody", "tfoot", "tr", "caption", "colgroup",
  "div", "span", "section", "figure", "figcaption", "summary", "wbr", "ruby", "rt", "rp",
]) {
  TAGS[tag] ??= [];
}

const allowList = Object.fromEntries(Object.entries(TAGS).map(([tag, attrs]) => [tag, [...GLOBAL, ...attrs]]));

/** Task-list checkboxes are the only inputs Markdown produces. */
const INPUT_TYPES = new Set(["checkbox"]);

const filter = new FilterXSS({
  allowList,
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style", "iframe", "object", "embed", "noscript", "template", "form", "textarea", "select", "button"],
  css: false,
  onTagAttr(tag, name, value) {
    if (tag === "input" && name === "type" && !INPUT_TYPES.has(value.toLowerCase())) return "";
    if (tag === "video" && name === "poster") return `poster="${safeAttrValue("img", "src", value, undefined as never)}"`;
  },
  // data-* (footnotes) and aria-* carry no behaviour; every other unlisted attribute is dropped.
  onIgnoreTagAttr(tag, name, value) {
    if (tag in allowList && /^(data|aria)-[a-z0-9-]+$/.test(name)) return `${name}="${escapeAttrValue(value)}"`;
  },
});

export function sanitizeHtml(html: string) {
  return filter.process(html);
}
