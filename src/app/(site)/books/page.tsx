import type { Metadata } from "next";
import Link from "@/components/LocaleLink";
import { Arrow } from "@/components/Arrow";
import { BookShelf } from "@/components/BookShelf";
import { readAndReading, toShelfBook } from "@/lib/books";
import { getBooks } from "@/lib/data";
import { getDict } from "@/lib/i18n/server";
import { metaFor } from "@/lib/seo";
import { BOOK_STATUSES } from "@/db/schema";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const t = await getDict();
  return metaFor({ title: t.nav.books, description: t.books.title, path: "/books" });
}

export default async function BooksPage() {
  const [books, t] = await Promise.all([getBooks(), getDict()]);
  const byStatus = (status: (typeof BOOK_STATUSES)[number]) =>
    books.filter((b) => b.status === status).map(toShelfBook);
  // Reading and read share the first shelf, the current book leading.
  const shelves = [
    { label: t.books.readAndReading, books: readAndReading(books).map(toShelfBook) },
    // "next" was folded into the waitlist, and abandoned books ("Put down") are not shown.
    ...BOOK_STATUSES.filter((s) => !["reading", "read", "next", "abandoned"].includes(s)).map((s) => ({
      label: t.books.status[s],
      books: byStatus(s),
    })),
  ];
  return (
    <>
      <section className="wrap page-title reveal">
        <p className="eyebrow" style={{ margin: 0 }}>{t.books.eyebrow}</p>
        <h1>{t.books.title}</h1>
        <p style={{ margin: "28px 0 0", fontSize: 13 }}>
          <Link href="/quotes" className="link-muted with-arrow">
            {t.quotes.link} <Arrow />
          </Link>
        </p>
      </section>
      <section className="wrap section">
        <BookShelf shelves={shelves} initialOpen={books.find((b) => b.status === "reading")?.id} priority />
      </section>
    </>
  );
}
