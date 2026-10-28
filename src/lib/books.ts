import type { Book } from "@/db/schema";
import type { ShelfBook } from "@/components/BookShelf";
import { DICTS, type Dict } from "./i18n/dict";
import { slugify } from "./slug";

export function toShelfBook(b: Book & { slug?: string }): ShelfBook {
  return {
    id: b.id,
    slug: b.slug ?? slugify(b.title),
    title: b.title,
    author: b.author,
    status: b.status,
    finishedYear: b.finishedYear,
    rating: b.rating,
    color: b.color,
    ink: b.ink,
    coverUrl: b.coverUrl,
    thickness: b.thickness,
    note: b.note,
    quote: b.quote,
    quoteSource: b.quoteSource,
  };
}

export const STATUS_LABEL: Record<Book["status"], string> = {
  reading: "Reading",
  read: "Read",
  next: "Waitlist",
  wishlist: "Waitlist",
  abandoned: "Put down",
};

/** Books that go on the 3D stage: the ones actually read or being read. */
export const onShelf = (b: Pick<Book, "status">) => b.status === "reading" || b.status === "read";

export function statusLabel(b: Pick<Book, "status" | "finishedYear">, t: Dict = DICTS.en) {
  if (b.status === "reading") return t.books.readingNow;
  if (b.status === "read") return b.finishedYear ? t.books.readIn(b.finishedYear) : t.books.status.read;
  return t.books.status[b.status];
}

/** The "Read & reading" shelf: the current books first, then the read ones, in the shelf order set in the backoffice (Books → drag to reorder). */
export function readAndReading<T extends Pick<Book, "status" | "sort" | "id">>(books: T[]) {
  const ordered = [...books].sort((a, b) => a.sort - b.sort || a.id - b.id);
  return [...ordered.filter((b) => b.status === "reading"), ...ordered.filter((b) => b.status === "read")];
}

/** How deep a book's spine is drawn on the shelf, from its page count. */
export const spineDepth = (b: Pick<Book, "thickness">) => Math.min(56, Math.max(18, b.thickness));

// The home shelf's inner width at full size: --measure (1080) less .wrap's and .shelf-row's padding.
const HOME_SHELF_WIDTH = 1080 - 2 * 40 - 2 * 24;

/**
 * The home shelf: the latest books, only as many as fill one shelf edge to edge on a desktop
 * screen with the first book standing open (BookShelf draws it COVER_W + 56 wide, the others
 * spine-on at depth + 2, 3px apart). Smaller screens scroll the row sideways.
 */
export function fillShelf<T extends Pick<Book, "thickness">>(books: T[]) {
  let used = 150 + 56;
  const out = books.slice(0, 1);
  for (const b of books.slice(1)) {
    used += 3 + spineDepth(b) + 2;
    if (used > HOME_SHELF_WIDTH) break;
    out.push(b);
  }
  return out;
}

export const bookHref = (b: Pick<Book, "title"> & { slug?: string }) => `/books/${b.slug ?? slugify(b.title)}`;
