import "server-only";
import type { Book } from "@/db/schema";

/**
 * Free, legal ways to read a book: public-domain texts (Project Gutenberg, Standard Ebooks) and
 * publisher-allowed previews (Google Books). Nothing here ever points at a copy the rights
 * holder did not put out for free.
 *
 * Copyright differs by country. Everything curated below is public domain in the US and in
 * Brazil. Books that are only public domain in some countries (Orwell, Saint-Exupéry) are left
 * out on purpose.
 */

export type GutenbergEdition = { id: number; lang: "pt" | "en"; translator?: string };

type Curated = {
  /** Readable on the site, first one is the default. Portuguese editions go first. */
  gutenberg?: GutenbergEdition[];
  /** Path on standardebooks.org, e.g. "william-shakespeare/hamlet" (download link only). */
  standardEbooks?: string;
};

/** Keyed by book slug (from the base title, so it is the same in every language). */
const CURATED: Record<string, Curated> = {
  "contos": {
    gutenberg: [{ id: 2147, lang: "en" }],
    standardEbooks: "edgar-allan-poe/short-fiction",
  },
  "a-arte-da-guerra": {
    gutenberg: [{ id: 132, lang: "en", translator: "Lionel Giles" }],
    standardEbooks: "sun-tzu/the-art-of-war/lionel-giles",
  },
  "hamlet": {
    gutenberg: [
      { id: 25667, lang: "pt", translator: "D. Luís I" },
      { id: 1524, lang: "en" },
    ],
    standardEbooks: "william-shakespeare/hamlet",
  },
  "crime-e-castigo": {
    gutenberg: [{ id: 2554, lang: "en", translator: "Constance Garnett" }],
    standardEbooks: "fyodor-dostoevsky/crime-and-punishment/constance-garnett",
  },
  "a-metamorfose": {
    gutenberg: [{ id: 5200, lang: "en", translator: "David Wyllie" }],
  },
  "o-principe": {
    gutenberg: [{ id: 1232, lang: "en", translator: "W. K. Marriott" }],
    standardEbooks: "niccolo-machiavelli/the-prince/w-k-marriott",
  },
  "meditacoes": {
    gutenberg: [{ id: 2680, lang: "en", translator: "Meric Casaubon" }],
    standardEbooks: "marcus-aurelius/meditations/george-long",
  },
  "sobre-a-brevidade-da-vida": {
    gutenberg: [{ id: 64576, lang: "en", translator: "Aubrey Stewart" }],
    standardEbooks: "seneca/dialogues/aubrey-stewart",
  },
  "guerra-e-paz": {
    gutenberg: [{ id: 2600, lang: "en", translator: "Louise & Aylmer Maude" }],
    standardEbooks: "leo-tolstoy/war-and-peace/louise-maude_aylmer-maude",
  },
  "o-capital": {
    standardEbooks: "karl-marx/the-capital/samuel-moore_edward-aveling",
  },
};

export type Download = { label: string; href: string; source: string };
export type Preview = { id: string; full: boolean };

export type Editions = {
  /** Editions the on-site reader can show. */
  read: GutenbergEdition[];
  downloads: Download[];
  /** Google Books embeddable preview (a few pages, or the whole book when public domain). */
  preview: Preview | null;
  /** A readUrl on some other free source, shown as a plain outbound link. */
  external: string | null;
};

const GUTENBERG = "https://www.gutenberg.org";

function gutenbergIdFrom(url: string | null) {
  const m = url?.match(/gutenberg\.org\/(?:ebooks|cache\/epub|files)\/(\d+)/);
  return m ? Number(m[1]) : null;
}

function standardEbooksPathFrom(url: string | null) {
  const m = url?.match(/standardebooks\.org\/ebooks\/([a-z0-9_/-]+?)\/?(?:[?#]|$)/);
  return m ? m[1] : null;
}

/** standardebooks.org names its files after the path, with "_" between parts and "-" inside them. */
function standardEbooksFile(path: string) {
  return path
    .split("/")
    .map((p) => p.replace(/_/g, "-"))
    .join("_");
}

type BookRef = Pick<Book, "readUrl"> & { slug: string };

/**
 * The book's own readUrl (set through the content API) comes first; the curated list above
 * fills in what it does not cover.
 */
export function readableEditions(b: BookRef): GutenbergEdition[] {
  const curated = CURATED[b.slug]?.gutenberg ?? [];
  const id = gutenbergIdFrom(b.readUrl);
  if (!id) return curated;
  const own = curated.find((e) => e.id === id) ?? { id, lang: "en" as const };
  return [own, ...curated.filter((e) => e.id !== id)];
}

export async function getEditions(b: BookRef & Pick<Book, "title" | "author">): Promise<Editions> {
  const read = readableEditions(b);
  const downloads: Download[] = [];
  for (const e of read) {
    const lang = read.length > 1 ? ` · ${e.lang.toUpperCase()}` : "";
    downloads.push({ label: `EPUB${lang}`, href: `${GUTENBERG}/ebooks/${e.id}.epub3.images`, source: "Project Gutenberg" });
  }
  const se = standardEbooksPathFrom(b.readUrl) ?? CURATED[b.slug]?.standardEbooks;
  if (se) {
    downloads.push({
      label: read.length ? "EPUB · Standard Ebooks" : "EPUB",
      href: `https://standardebooks.org/ebooks/${se}/downloads/${standardEbooksFile(se)}.epub`,
      source: "Standard Ebooks",
    });
  }
  const google = await googleBooks(b.title, b.author);
  if (google?.pdf) downloads.push({ label: "PDF", href: google.pdf, source: "Google Books" });
  const own = gutenbergIdFrom(b.readUrl) || standardEbooksPathFrom(b.readUrl);
  return { read, downloads, preview: google?.preview ?? null, external: own ? null : b.readUrl };
}

/* ---------- Google Books ---------- */

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

async function googleBooks(title: string, author: string) {
  const t = searchTitle(title);
  const surname = author.split(/\s+/).pop() ?? author;
  const params = new URLSearchParams({
    q: `intitle:${t} inauthor:${surname}`,
    maxResults: "20",
    printType: "books",
  });
  if (process.env.GOOGLE_BOOKS_API_KEY) params.set("key", process.env.GOOGLE_BOOKS_API_KEY);
  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?${params}`, {
      signal: AbortSignal.timeout(5000),
      // Previews rarely change; a day keeps us far below the keyless quota.
      next: { revalidate: 86_400 },
    });
    if (!res.ok) return null;
    const { items = [] } = (await res.json()) as { items?: Volume[] };
    const want = norm(t);
    const viewable = items.filter(
      (v) =>
        v.accessInfo.embeddable &&
        (v.accessInfo.viewability === "PARTIAL" || v.accessInfo.viewability === "ALL_PAGES") &&
        norm(v.volumeInfo.title ?? "").startsWith(want) &&
        (v.volumeInfo.authors ?? []).some((a) => norm(a).includes(norm(surname))),
    );
    const score = (v: Volume) =>
      (v.volumeInfo.language === "pt" ? 2 : 0) + (v.accessInfo.viewability === "ALL_PAGES" ? 1 : 0);
    const best = viewable.sort((a, z) => score(z) - score(a))[0];
    if (!best) return null;
    const pdf = best.accessInfo.publicDomain && best.accessInfo.pdf?.isAvailable ? best.accessInfo.pdf.downloadLink : undefined;
    return { preview: { id: best.id, full: best.accessInfo.viewability === "ALL_PAGES" }, pdf };
  } catch {
    return null;
  }
}
