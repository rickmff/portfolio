import type { Book } from "@/db/schema";
import type { ShelfBook } from "@/components/BookShelf";
import { DICTS, type Dict } from "./i18n/dict";
import { slugify } from "./markdown";

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

export const bookHref = (b: Pick<Book, "title"> & { slug?: string }) => `/books/${b.slug ?? slugify(b.title)}`;
