/**
 * Markdown <-> block editor document.
 *
 * Posts stay stored as Markdown, so the public renderer (src/lib/markdown.ts), the content API and
 * the .md files in content/blog keep working untouched. The editor only changes how that Markdown
 * is written. Anything the blocks can't express (raw HTML, footnote notes, link definitions) is kept
 * verbatim in a "Markdown" block, so opening and saving a post never loses content.
 */
import type { JSONContent } from "@tiptap/core";
import { Marked, type Token, type Tokens } from "marked";
import markedFootnote from "marked-footnote";

export const CALLOUTS = ["note", "tip", "important", "warning", "caution"] as const;
export type CalloutType = (typeof CALLOUTS)[number];

// Same GFM flavour and footnote syntax as the public renderer, without the HTML side. marked-footnote
// resets its state in a parse hook that lexer() skips, so each conversion gets a fresh instance.
const lex = (src: string) => new Marked({ gfm: true, breaks: false }, markedFootnote({ refMarkers: true })).lexer(src);

type Mark = NonNullable<JSONContent["marks"]>[number];

/* ------------------------------------------------------------------ */
/* Markdown -> document                                                */
/* ------------------------------------------------------------------ */

export function markdownToDoc(src: string): JSONContent {
  const tokens = lex(src.replace(/\r\n?/g, "\n"));
  // marked-footnote hoists all notes into one token at the front; the site always prints them last.
  const notes = tokens.filter((t) => t.type === "footnotes");
  const content = blocks(tokens.filter((t) => t.type !== "footnotes"));
  for (const n of notes) {
    const raw = ((n as unknown as { rawItems: { raw: string }[] }).rawItems ?? [])
      .map((i) => i.raw.trim())
      .join("\n\n");
    if (raw) content.push(rawBlock(raw));
  }
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}

const rawBlock = (text: string): JSONContent => ({ type: "rawMarkdown", attrs: { text: text.replace(/\n+$/, "") } });

function blocks(tokens: Token[]): JSONContent[] {
  const out: JSONContent[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === "html" && /^<details[\s>]/i.test(t.raw.trim())) {
      const consumed = details(tokens, i, out);
      if (consumed > 0) {
        i += consumed - 1;
        continue;
      }
    }
    out.push(...block(t));
  }
  return out;
}

/** Groups `<details><summary>…</summary>` … `</details>` into a toggle block. Returns tokens used, 0 if not clean. */
function details(tokens: Token[], start: number, out: JSONContent[]) {
  const open = tokens[start].raw.trim();
  const m = open.match(/^<details(\s[^>]*)?>\s*(?:<summary>([\s\S]*?)<\/summary>)?\s*$/i);
  if (!m) return 0;
  let depth = 1;
  let end = -1;
  for (let j = start + 1; j < tokens.length; j++) {
    const t = tokens[j];
    if (t.type !== "html") continue;
    const raw = t.raw.trim();
    if (/^<details[\s>]/i.test(raw)) depth++;
    else if (/^<\/details>$/i.test(raw) && --depth === 0) {
      end = j;
      break;
    }
  }
  if (end < 0) return 0;
  const inner = blocks(tokens.slice(start + 1, end));
  const summary = decodeEntities((m[2] ?? "").trim());
  out.push({
    type: "details",
    // Toggles open closed in the editor, like on the site; the editor's own open state is never saved.
    attrs: { open: false },
    content: [
      { type: "detailsSummary", content: summary ? [{ type: "text", text: summary }] : undefined },
      { type: "detailsContent", content: inner.length ? inner : [{ type: "paragraph" }] },
    ],
  });
  return end - start + 1;
}

function block(t: Token): JSONContent[] {
  switch (t.type) {
    case "space":
    case "footnote":
      // Footnote notes are collected from the footnotes token and written at the end.
      return [];
    case "paragraph": {
      const p = t as Tokens.Paragraph;
      const tks = p.tokens ?? [];
      // A paragraph that is only images (Notion-style image blocks).
      const imgs = tks.filter((x) => x.type === "image") as Tokens.Image[];
      if (imgs.length && tks.every((x) => x.type === "image" || (x.type === "text" && !x.raw.trim()) || x.type === "br")) {
        return imgs.map((img) => ({ type: "image", attrs: { src: img.href, alt: img.text || null, title: img.title || null } }));
      }
      // Inline images mixed with text have no block form: keep the paragraph as written.
      if (imgs.length) return [rawBlock(p.raw)];
      const content = inline(tks, []);
      return [{ type: "paragraph", content: content.length ? content : undefined }];
    }
    case "text": {
      // Block-level text: the body of a tight list item.
      const x = t as Tokens.Text;
      const content = inline(x.tokens ?? [{ type: "text", raw: x.text, text: x.text } as Tokens.Text], []);
      return [{ type: "paragraph", content: content.length ? content : undefined }];
    }
    case "heading": {
      const h = t as Tokens.Heading;
      // A multi-line setext heading has no single-line form.
      if (h.text.includes("\n")) return [rawBlock(h.raw)];
      const content = inline(h.tokens, []);
      return [{ type: "heading", attrs: { level: h.depth }, content: content.length ? content : undefined }];
    }
    case "hr":
      return [{ type: "horizontalRule" }];
    case "code": {
      const c = t as Tokens.Code;
      const language = (c.lang ?? "").trim() || null;
      return [{ type: "codeBlock", attrs: { language }, content: c.text ? [{ type: "text", text: c.text }] : undefined }];
    }
    case "blockquote": {
      const q = t as Tokens.Blockquote;
      const m = q.text.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*(?:\n|$)/i);
      if (m) {
        const inner = blocks(stripCalloutMarker(q.tokens));
        return [
          {
            type: "callout",
            attrs: { type: m[1].toLowerCase() },
            content: inner.length ? inner : [{ type: "paragraph" }],
          },
        ];
      }
      const inner = blocks(q.tokens);
      return [{ type: "blockquote", content: inner.length ? inner : [{ type: "paragraph" }] }];
    }
    case "list":
      return [list(t as Tokens.List)];
    case "table":
      return [table(t as Tokens.Table)];
    default:
      // html, def, and anything else: kept as written.
      return t.raw.trim() ? [rawBlock(t.raw)] : [];
  }
}

/** Drops the `[!NOTE]` line from the first paragraph of a callout quote. */
function stripCalloutMarker(tokens: Token[]): Token[] {
  const [first, ...rest] = tokens;
  if (first?.type !== "paragraph") return tokens;
  const p = first as Tokens.Paragraph;
  const marker = /^\[!\w+\][ \t]*\n?/;
  const [head, ...tail] = p.tokens ?? [];
  if (head?.type !== "text") return tokens;
  const text = (head as Tokens.Text).text.replace(marker, "");
  const inline = text ? [{ ...head, text, raw: text, tokens: undefined } as Tokens.Text, ...tail] : tail;
  // A soft line break right after the marker is part of the marker line.
  if (!text && inline[0]?.type === "br") inline.shift();
  const body = p.raw.replace(marker, "");
  return inline.length ? [{ ...p, raw: body, text: body, tokens: inline }, ...rest] : rest;
}

function list(l: Tokens.List): JSONContent {
  // Tiptap keeps to-dos and bullets in different lists, so a list mixing both stays as written.
  if (l.items.some((i) => i.task) && !l.items.every((i) => i.task)) return rawBlock(l.raw);
  const task = l.items.length > 0 && l.items.every((i) => i.task);
  const items = l.items.map((item) => {
    const body = blocks(item.tokens.filter((x) => x.type !== "checkbox"));
    if (!body.length || body[0].type !== "paragraph") body.unshift({ type: "paragraph" });
    return task
      ? { type: "taskItem", attrs: { checked: !!item.checked }, content: body }
      : { type: "listItem", content: body };
  });
  if (task) return { type: "taskList", attrs: { tight: !l.loose }, content: items };
  if (l.ordered) {
    const start = typeof l.start === "number" ? l.start : 1;
    return { type: "orderedList", attrs: { start, tight: !l.loose }, content: items };
  }
  return { type: "bulletList", attrs: { tight: !l.loose }, content: items };
}

function table(t: Tokens.Table): JSONContent {
  const cell = (type: string, c: Tokens.TableCell, align: string | null) => {
    const content = inline(c.tokens, []);
    return {
      type,
      attrs: { align: align ?? null },
      content: [{ type: "paragraph", content: content.length ? content : undefined }],
    };
  };
  return {
    type: "table",
    content: [
      { type: "tableRow", content: t.header.map((c, i) => cell("tableHeader", c, t.align[i])) },
      ...t.rows.map((r) => ({ type: "tableRow", content: r.map((c, i) => cell("tableCell", c, t.align[i])) })),
    ],
  };
}

function inline(tokens: Token[], marks: Mark[]): JSONContent[] {
  const out: JSONContent[] = [];
  const text = (s: string, m: Mark[] = marks) => {
    if (s) out.push({ type: "text", text: s, ...(m.length ? { marks: m } : {}) });
  };
  for (const t of tokens) {
    switch (t.type) {
      case "text":
      case "escape": {
        const x = t as Tokens.Text;
        if (x.tokens?.length) out.push(...inline(x.tokens, marks));
        else text(decodeEntities(x.text));
        break;
      }
      case "strong":
        out.push(...inline((t as Tokens.Strong).tokens, [...marks, { type: "bold" }]));
        break;
      case "em":
        out.push(...inline((t as Tokens.Em).tokens, [...marks, { type: "italic" }]));
        break;
      case "del":
        out.push(...inline((t as Tokens.Del).tokens, [...marks, { type: "strike" }]));
        break;
      case "codespan":
        text(decodeEntities((t as Tokens.Codespan).text), [...marks, { type: "code" }]);
        break;
      case "link": {
        const l = t as Tokens.Link;
        out.push(...inline(l.tokens, [...marks, { type: "link", attrs: { href: l.href, title: l.title || null } }]));
        break;
      }
      case "br":
        out.push({ type: "hardBreak" });
        break;
      case "footnoteRef":
        out.push({ type: "footnoteRef", attrs: { label: (t as unknown as { label: string }).label } });
        break;
      case "image": {
        // Only reached for images inside links/tables; keep the syntax so nothing is lost.
        text(t.raw, [...marks, { type: "rawInline" }]);
        break;
      }
      default:
        // Inline HTML like <kbd>, <sup>, <br>: written as is.
        text(t.raw, [...marks, { type: "rawInline" }]);
    }
  }
  return out;
}

function decodeEntities(s: string) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|#39|apos|nbsp);/gi, (all, e: string) => {
    const k = e.toLowerCase();
    if (k === "amp") return "&";
    if (k === "lt") return "<";
    if (k === "gt") return ">";
    if (k === "quot") return '"';
    if (k === "#39" || k === "apos") return "'";
    if (k === "nbsp") return " ";
    if (k.startsWith("#x")) return String.fromCodePoint(parseInt(k.slice(2), 16));
    if (k.startsWith("#")) return String.fromCodePoint(parseInt(k.slice(1), 10));
    return all;
  });
}

/* ------------------------------------------------------------------ */
/* Document -> Markdown                                                */
/* ------------------------------------------------------------------ */

export function docToMarkdown(doc: JSONContent): string {
  const out = serializeBlocks(doc.content ?? [], "\n\n");
  return out ? `${out}\n` : "";
}

const BULLETS = ["bulletList", "taskList"];

function serializeBlocks(nodes: JSONContent[], sep: string) {
  const out: string[] = [];
  let alt = false;
  nodes.forEach((n, i) => {
    const prev = nodes[i - 1]?.type ?? "";
    // Two lists in a row would merge into one when parsed again, so the second switches marker.
    const touching =
      (BULLETS.includes(n.type ?? "") && BULLETS.includes(prev)) || (n.type === "orderedList" && prev === "orderedList");
    alt = touching ? !alt : false;
    const s = serializeBlock(n, alt);
    if (s !== null) out.push(s);
  });
  return out.join(sep);
}

const prefix = (s: string, first: string, rest: string) =>
  s
    .split("\n")
    .map((line, i) => (i === 0 ? first : line ? rest : rest.trimEnd()) + line)
    .join("\n");

function serializeBlock(n: JSONContent, alt = false): string | null {
  const attrs = n.attrs ?? {};
  switch (n.type) {
    case "paragraph": {
      const s = serializeInline(n.content ?? []);
      return s.trim() ? escapeLineStart(s) : null;
    }
    case "heading": {
      const s = serializeInline(n.content ?? []).replace(/\n/g, " ");
      return s.trim() ? `${"#".repeat(Math.min(6, Math.max(1, attrs.level ?? 1)))} ${s}` : null;
    }
    case "horizontalRule":
      return "---";
    case "codeBlock": {
      const code = textOf(n);
      const longest = Math.max(0, ...(code.match(/`+/g) ?? []).map((r) => r.length));
      const fence = "`".repeat(Math.max(3, longest + 1));
      return `${fence}${attrs.language ?? ""}\n${code}\n${fence}`;
    }
    case "blockquote": {
      const inner = serializeBlocks(n.content ?? [], "\n\n");
      return inner ? prefix(inner, "> ", "> ") : null;
    }
    case "callout": {
      const inner = serializeBlocks(n.content ?? [], "\n\n");
      const head = `> [!${String(attrs.type ?? "note").toUpperCase()}]`;
      return inner ? `${head}\n${prefix(inner, "> ", "> ")}` : head;
    }
    case "bulletList":
    case "orderedList":
    case "taskList": {
      const items = n.content ?? [];
      if (!items.length) return null;
      const tight = attrs.tight !== false && items.every((i) => (i.content ?? []).filter(isParagraphish).length <= 1);
      const start = Number(attrs.start ?? 1);
      return items
        .map((item, i) => {
          const marker =
            n.type === "orderedList"
              ? `${start + i}${alt ? ")" : "."} `
              : n.type === "taskList"
                ? `${alt ? "*" : "-"} [${item.attrs?.checked ? "x" : " "}] `
                : alt ? "* " : "- ";
          const indent = n.type === "orderedList" ? " ".repeat(marker.length) : "  ";
          const body = serializeBlocks(item.content ?? [], tight ? "\n" : "\n\n") || "";
          return prefix(body, marker, indent).replace(/[ \t]+$/, "");
        })
        .join(tight ? "\n" : "\n\n");
    }
    case "image": {
      if (!attrs.src) return null;
      const title = attrs.title ? ` "${String(attrs.title).replace(/"/g, '\\"')}"` : "";
      return `![${escapeText(attrs.alt ?? "")}](${linkDest(attrs.src)}${title})`;
    }
    case "table":
      return serializeTable(n);
    case "details": {
      const [summary, content] = n.content ?? [];
      const title = escapeHtml(textOf(summary ?? {}));
      const inner = serializeBlocks(content?.content ?? [], "\n\n");
      return `<details>\n<summary>${title}</summary>\n\n${inner}${inner ? "\n\n" : ""}</details>`;
    }
    case "rawMarkdown":
      return attrs.text ? String(attrs.text) : null;
    default:
      return n.content ? serializeBlocks(n.content, "\n\n") : null;
  }
}

const isParagraphish = (n: JSONContent) => !["bulletList", "orderedList", "taskList"].includes(n.type ?? "");

function serializeTable(n: JSONContent) {
  const rows = (n.content ?? []).map((r) =>
    (r.content ?? []).map((c) => ({
      text: serializeInline((c.content ?? []).flatMap((p) => p.content ?? []), true).replace(/\|/g, "\\|"),
      align: (c.attrs?.align ?? null) as string | null,
    })),
  );
  if (!rows.length) return null;
  const width = Math.max(...rows.map((r) => r.length));
  const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
  const pad = (r: { text: string }[]) => Array.from({ length: width }, (_, i) => r[i]?.text ?? "");
  const align = Array.from({ length: width }, (_, i) => {
    const a = rows[0][i]?.align;
    return a === "left" ? ":---" : a === "right" ? "---:" : a === "center" ? ":---:" : "---";
  });
  return [line(pad(rows[0])), line(align), ...rows.slice(1).map((r) => line(pad(r)))].join("\n");
}

function textOf(n: JSONContent): string {
  if (n.type === "text") return n.text ?? "";
  return (n.content ?? []).map(textOf).join("");
}

const MARK_ORDER = ["link", "bold", "italic", "strike", "code", "rawInline"];

function markKey(m: Mark) {
  return m.type === "link" ? `link:${m.attrs?.href}:${m.attrs?.title ?? ""}` : m.type;
}

/** Inline nodes to Markdown. Runs sharing a mark are wrapped once, so `**a *b* c**` stays one bold run. */
function serializeInline(nodes: JSONContent[], inTable = false, active: string[] = []): string {
  let out = "";
  let i = 0;
  while (i < nodes.length) {
    const node = nodes[i];
    const marks = (node.marks ?? []).filter((m) => !active.includes(markKey(m)));
    const next = marks.sort((a, b) => MARK_ORDER.indexOf(a.type) - MARK_ORDER.indexOf(b.type))[0];
    if (!next) {
      out += leaf(node, inTable, active);
      i++;
      continue;
    }
    const key = markKey(next);
    let j = i;
    while (j < nodes.length && (nodes[j].marks ?? []).some((m) => markKey(m) === key)) j++;
    const run = nodes.slice(i, j);
    out += wrap(next, run, inTable, [...active, key]);
    i = j;
  }
  return out;
}

function wrap(m: Mark, run: JSONContent[], inTable: boolean, active: string[]) {
  if (m.type === "code") {
    const code = run.map((r) => r.text ?? "").join("");
    const ticks = Math.max(0, ...(code.match(/`+/g) ?? []).map((r) => r.length)) + 1;
    const fence = "`".repeat(ticks);
    const pad = code.startsWith("`") || code.endsWith("`") || (ticks > 1 && /^ | $/.test(code)) ? " " : "";
    return `${fence}${pad}${code}${pad}${fence}`;
  }
  if (m.type === "rawInline") return run.map((r) => r.text ?? "").join("");
  const inner = serializeInline(run, inTable, active);
  if (m.type === "link") {
    const title = m.attrs?.title ? ` "${String(m.attrs.title).replace(/"/g, '\\"')}"` : "";
    return `[${inner}](${linkDest(m.attrs?.href ?? "")}${title})`;
  }
  const d = m.type === "bold" ? "**" : m.type === "italic" ? "*" : "~~";
  // Delimiters can't sit next to whitespace, so spaces move outside the markers.
  const lead = inner.match(/^\s*/)?.[0] ?? "";
  const trail = inner.slice(lead.length).match(/\s*$/)?.[0] ?? "";
  const core = inner.slice(lead.length, inner.length - trail.length);
  return core ? `${lead}${d}${core}${d}${trail}` : inner;
}

function leaf(n: JSONContent, inTable: boolean, active: string[]) {
  switch (n.type) {
    case "text":
      return escapeText(n.text ?? "", active.includes("code"));
    case "hardBreak":
      return inTable ? "<br>" : "\\\n";
    case "footnoteRef":
      return `[^${n.attrs?.label ?? ""}]`;
    case "image":
      return `![${escapeText(n.attrs?.alt ?? "")}](${linkDest(n.attrs?.src ?? "")})`;
    default:
      return textOf(n);
  }
}

function linkDest(href: string) {
  return /[\s()<>]/.test(href) ? `<${href.replace(/[<>]/g, encodeURIComponent)}>` : href;
}

/** Escapes characters that would otherwise turn plain text into Markdown syntax. */
export function escapeText(s: string, code = false) {
  if (code) return s;
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    const next = s[i + 1] ?? "";
    if ("\\`*~[]".includes(c)) out += `\\${c}`;
    // Underscores inside words (snake_case) are literal in GFM; only the ones at a word edge need escaping.
    else if (c === "_") out += /[\p{L}\p{N}]/u.test(s[i - 1] ?? "") && /[\p{L}\p{N}]/u.test(next) ? c : "\\_";
    else if (c === "<" && /[a-z/!?]/i.test(next)) out += "\\<";
    else if (c === "&" && /^&#?\w+;/.test(s.slice(i))) out += "&amp;";
    else if (c === " ") out += "&nbsp;";
    else out += c;
  }
  return out;
}

/** A paragraph that starts like a heading, list, quote or rule would change type when parsed again. */
function escapeLineStart(s: string) {
  return s
    .split("\n")
    .map((line) =>
      line
        .replace(/^(\s*)(#{1,6}(?:\s|$)|>|[-+](?=\s)|(?:-\s*){3,}$|=+\s*$)/, "$1\\$2")
        .replace(/^(\s*)(\d+)([.)])(?=\s)/, "$1$2\\$3"),
    )
    .join("\n");
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
