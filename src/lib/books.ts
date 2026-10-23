import type { Book } from "@/db/schema";
import type { ShelfBook } from "@/components/BookShelf";
import { DICTS, type Dict } from "./i18n/dict";
import { slugify } from "./markdown";

export function toShelfBook(b: Book): ShelfBook {
  return {
    id: b.id,
    slug: slugify(b.title),
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
  };
}

export const STATUS_LABEL: Record<Book["status"], string> = {
  reading: "Reading",
  read: "Read",
  next: "Up next",
  wishlist: "Wishlist",
  abandoned: "Put down",
};

/** Books that go on the 3D stage: the ones actually read or being read. */
export const onShelf = (b: Pick<Book, "status">) => b.status === "reading" || b.status === "read";

export function statusLabel(b: Pick<Book, "status" | "finishedYear">, t: Dict = DICTS.en) {
  if (b.status === "reading") return t.books.readingNow;
  if (b.status === "read") return b.finishedYear ? t.books.readIn(b.finishedYear) : t.books.status.read;
  return t.books.status[b.status];
}

/** How many books the home page shelf shows. */
export const HOME_SHELF_SIZE = 8;

/** The first read books in the shelf order set in the backoffice (Books → drag to reorder). */
export function latestRead(books: Book[], limit = HOME_SHELF_SIZE) {
  return books
    .filter((b) => b.status === "read")
    .sort((a, b) => a.sort - b.sort || a.id - b.id)
    .slice(0, limit);
}

export const bookHref = (b: Pick<Book, "title">) => `/books/${slugify(b.title)}`;
