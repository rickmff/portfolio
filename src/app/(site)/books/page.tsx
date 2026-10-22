import type { Metadata } from "next";
import { BookShelf } from "@/components/BookShelf";
import { STATUS_LABEL, toShelfBook } from "@/lib/books";
import { getBooks } from "@/lib/data";
import { BOOK_STATUSES } from "@/db/schema";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Books" };

export default async function BooksPage() {
  const books = await getBooks();
  const byStatus = (status: (typeof BOOK_STATUSES)[number]) =>
    books.filter((b) => b.status === status).map(toShelfBook);
  // Reading and read share the first shelf, the current book leading.
  const shelves = [
    { label: "Read & reading", books: [...byStatus("reading"), ...byStatus("read")] },
    ...BOOK_STATUSES.filter((s) => s !== "reading" && s !== "read").map((s) => ({
      label: STATUS_LABEL[s],
      books: byStatus(s),
    })),
  ];
  return (
    <>
      <section className="wrap page-title reveal">
        <p className="eyebrow" style={{ margin: 0 }}>Library</p>
        <h1>Books that changed how I build things.</h1>
      </section>
      <section className="wrap section">
        <BookShelf shelves={shelves} initialOpen={books.find((b) => b.status === "reading")?.id} />
      </section>
    </>
  );
}
