/** Google Books lookup shared by the server (with an API key) and the browser (without one). */

export type Preview = { id: string; full: boolean };

type Volume = {
  id: string;
  volumeInfo: { title?: string; authors?: string[]; language?: string };
  accessInfo: {
    embeddable?: boolean;
    publicDomain?: boolean;
    viewability?: "NO_PAGES" | "PARTIAL" | "ALL_PAGES" | "UNKNOWN";
    pdf?: { isAvailable?: boolean; downloadLink?: string };
  };
};

const norm = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** "Percy Jackson (coleção)" → "Percy Jackson": what a catalogue would call it. */
const searchTitle = (t: string) => t.replace(/\(.*?\)/g, "").trim();
const surnameOf = (author: string) => author.split(/\s+/).pop() ?? author;

export function googleBooksUrl(title: string, author: string, key?: string) {
  const params = new URLSearchParams({
    q: `intitle:${searchTitle(title)} inauthor:${surnameOf(author)}`,
    maxResults: "20",
    printType: "books",
  });
  if (key) params.set("key", key);
  return `https://www.googleapis.com/books/v1/volumes?${params}`;
}

/** The best embeddable edition of this book: Portuguese first, then the one showing the most. */
export function pickVolume(data: { items?: Volume[] }, title: string, author: string) {
  const want = norm(searchTitle(title));
  const surname = norm(surnameOf(author));
  const viewable = (data.items ?? []).filter(
    (v) =>
      v.accessInfo.embeddable &&
      (v.accessInfo.viewability === "PARTIAL" || v.accessInfo.viewability === "ALL_PAGES") &&
      norm(v.volumeInfo.title ?? "").startsWith(want) &&
      (v.volumeInfo.authors ?? []).some((a) => norm(a).includes(surname)),
  );
  const score = (v: Volume) =>
    (v.volumeInfo.language === "pt" ? 2 : 0) + (v.accessInfo.viewability === "ALL_PAGES" ? 1 : 0);
  const best = viewable.sort((a, z) => score(z) - score(a))[0];
  if (!best) return null;
  const pdf = best.accessInfo.publicDomain && best.accessInfo.pdf?.isAvailable ? best.accessInfo.pdf.downloadLink : undefined;
  return { preview: { id: best.id, full: best.accessInfo.viewability === "ALL_PAGES" } as Preview, pdf };
}
