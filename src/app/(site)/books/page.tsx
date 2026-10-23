import type { Metadata } from "next";
import { BookShelf } from "@/components/BookShelf";
import { toShelfBook } from "@/lib/books";
import { getBooks } from "@/lib/data";
import { getDict } from "@/lib/i18n/server";
import { BOOK_STATUSES } from "@/db/schema";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).nav.books };
}

export default async function BooksPage() {
  const [books, t] = await Promise.all([getBooks(), getDict()]);
  const byStatus = (status: (typeof BOOK_STATUSES)[number]) =>
    books.filter((b) => b.status === status).map(toShelfBook);
  // Reading and read share the first shelf, the current book leading.
  const shelves = [
    { label: t.books.readAndReading, books: [...byStatus("reading"), ...byStatus("read")] },
    // "next" was folded into the waitlist and is no longer a shelf.
    ...BOOK_STATUSES.filter((s) => s !== "reading" && s !== "read" && s !== "next").map((s) => ({
      label: t.books.status[s],
      books: byStatus(s),
    })),
  ];
  return (
    <>
      <section className="wrap page-title reveal">
        <p className="eyebrow" style={{ margin: 0 }}>{t.books.eyebrow}</p>
        <h1>{t.books.title}</h1>
      </section>
      <section className="wrap section">
        <BookShelf shelves={shelves} initialOpen={books.find((b) => b.status === "reading")?.id} />
      </section>
    </>
  );
}
