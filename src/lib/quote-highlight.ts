/**
 * Finds a book's quote inside the reader's HTML and wraps it in <mark>, ignoring case, accents,
 * punctuation and line breaks, so "To be, or not to be, that is the question:" still matches a
 * line split across <br> tags. Translations of the same quote are tried too, so whichever
 * edition is open gets its own wording highlighted.
 */

/** Letters and digits only, lowercased and without accents. */
const fold = (c: string) =>
  c
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/** Quotes shorter than this (once folded) could match by accident. */
const MIN_LEN = 12;

type Index = { text: string; at: number[]; len: number[] };

/** The folded text of the markup, with where each folded character sits in the markup. */
function indexText(html: string): Index {
  let text = "";
  const at: number[] = [];
  const len: number[] = [];
  for (let i = 0; i < html.length; ) {
    const ch = html[i];
    if (ch === "<") {
      const end = html.indexOf(">", i);
      i = end < 0 ? html.length : end + 1;
      continue;
    }
    if (ch === "&") {
      // An entity reads as one non-letter character.
      const end = html.indexOf(";", i);
      if (end > i && end - i < 12) {
        i = end + 1;
        continue;
      }
    }
    for (const f of fold(ch)) {
      text += f;
      at.push(i);
      len.push(1);
    }
    i++;
  }
  return { text, at, len };
}

function find(idx: Index, quotes: (string | null | undefined)[]) {
  for (const q of quotes) {
    const needle = fold(q ?? "");
    if (needle.length < MIN_LEN) continue;
    const pos = idx.text.indexOf(needle);
    if (pos >= 0) {
      const last = pos + needle.length - 1;
      return { start: idx.at[pos], end: idx.at[last] + idx.len[last] };
    }
  }
  return null;
}

/** True when any version of the quote is in this markup. */
export function containsQuote(html: string, quotes: (string | null | undefined)[]) {
  return find(indexText(html), quotes) !== null;
}

/**
 * Wraps the quote's text in <mark class="reader-quote">, one mark per run of text so tags in
 * between stay balanced. The first mark carries id="quote" for the "Find it in the book" link.
 */
export function highlightQuote(html: string, quotes: (string | null | undefined)[]) {
  const hit = find(indexText(html), quotes);
  if (!hit) return { html, found: false };
  let out = html.slice(0, hit.start);
  let first = true;
  const open = () => {
    const tag = first ? '<mark class="reader-quote" id="quote">' : '<mark class="reader-quote">';
    first = false;
    return tag;
  };
  for (let i = hit.start; i < hit.end; ) {
    if (html[i] === "<") {
      const end = Math.min(html.indexOf(">", i) + 1 || hit.end, hit.end);
      out += html.slice(i, end);
      i = end;
      continue;
    }
    let j = html.indexOf("<", i);
    if (j < 0 || j > hit.end) j = hit.end;
    out += `${open()}${html.slice(i, j)}</mark>`;
    i = j;
  }
  return { html: out + html.slice(hit.end), found: true };
}
