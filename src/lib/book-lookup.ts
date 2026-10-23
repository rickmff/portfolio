import "server-only";
import sharp from "sharp";

/** Open Library: free, no key, good coverage of Portuguese editions too. */
const OL = "https://openlibrary.org";
export const COVER_HOST = "covers.openlibrary.org";

export type BookHit = {
  key: string;
  title: string;
  author: string;
  year: number | null;
  pages: number | null;
  coverId: number | null;
};

export type BookDetails = {
  synopsis: string;
  coverUrl: string | null;
  color: string | null;
  ink: string | null;
};

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": "rickmff-portfolio (book lookup)" },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Open Library answered ${res.status}`);
  return res.json() as Promise<T>;
}

export async function searchBooks(q: string): Promise<BookHit[]> {
  const isbn = q.replace(/[-\s]/g, "");
  const query = /^\d{10}(\d{3})?$/.test(isbn) ? `isbn=${isbn}` : `q=${encodeURIComponent(q)}`;
  const fields = "key,title,author_name,first_publish_year,number_of_pages_median,cover_i";
  const data = await getJson<{
    docs: {
      key: string;
      title: string;
      author_name?: string[];
      first_publish_year?: number;
      number_of_pages_median?: number;
      cover_i?: number;
    }[];
  }>(`${OL}/search.json?${query}&limit=8&fields=${fields}`);
  return data.docs.map((d) => ({
    key: d.key,
    title: d.title,
    author: d.author_name?.[0] ?? "",
    year: d.first_publish_year ?? null,
    pages: d.number_of_pages_median ?? null,
    coverId: d.cover_i ?? null,
  }));
}

export const coverUrlFor = (id: number, size: "M" | "L" = "L") => `https://${COVER_HOST}/b/id/${id}-${size}.jpg`;

/** Synopsis from the work record, plus cover colours picked from the cover's dominant tone. */
export async function bookDetails(key: string, coverId: number | null): Promise<BookDetails> {
  if (!/^\/works\/OL\d+W$/.test(key)) throw new Error("Unknown book");
  const work = await getJson<{ description?: string | { value: string } }>(`${OL}${key}.json`).catch(() => ({}) as never);
  const raw = typeof work?.description === "string" ? work.description : (work?.description?.value ?? "");
  // Strip Open Library's trailing source notes and markdown links.
  const synopsis = raw
    .split(/\n-{3,}|\n\(\[source\]|\n\[source\]|\nSource:/i)[0]
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();

  let color: string | null = null;
  let ink: string | null = null;
  const coverUrl = coverId ? coverUrlFor(coverId) : null;
  if (coverUrl) {
    try {
      const res = await fetch(coverUrlFor(coverId!, "M"), { signal: AbortSignal.timeout(8000) });
      const { dominant } = await sharp(Buffer.from(await res.arrayBuffer())).stats();
      color = "#" + [dominant.r, dominant.g, dominant.b].map((v) => v.toString(16).padStart(2, "0")).join("");
      const lum = (0.2126 * dominant.r + 0.7152 * dominant.g + 0.0722 * dominant.b) / 255;
      ink = lum > 0.55 ? "#111111" : "#FFFFFF";
    } catch {
      // Colours are a nicety; the form keeps its current ones.
    }
  }
  return { synopsis, coverUrl, color, ink };
}
