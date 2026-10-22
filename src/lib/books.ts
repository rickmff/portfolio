import type { Book } from "@/db/schema";
import type { ShelfBook } from "@/components/BookShelf";

export function toShelfBook(b: Book): ShelfBook {
  return {
    id: b.id,
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

export function statusLabel(b: Pick<Book, "status" | "finishedYear">) {
  if (b.status === "reading") return "Reading now";
  if (b.status === "read") return b.finishedYear ? `Read in ${b.finishedYear}` : "Read";
  return STATUS_LABEL[b.status];
}
