import type { Metadata } from "next";
import Link from "next/link";
import { BookQuote } from "@/components/BookQuote";
import { bookHref, onShelf } from "@/lib/books";
import { getBooks } from "@/lib/data";
import { getDict } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const t = await getDict();
  return { title: t.quotes.eyebrow, description: t.quotes.title };
}

export default async function QuotesPage() {
  const [books, t] = await Promise.all([getBooks(), getDict()]);
  // Same order as the shelf, the current book first.
  const quoted = books
    .filter((b) => onShelf(b) && b.quote.trim())
    .sort((a, b) => Number(b.status === "reading") - Number(a.status === "reading"));
  return (
    <>
      <section className="wrap page-title reveal">
        <p className="eyebrow" style={{ margin: 0 }}>{t.quotes.eyebrow}</p>
        <h1>{t.quotes.title}</h1>
      </section>
      <section className="wrap section">
        {quoted.length ? (
          <ol className="quote-list">
            {quoted.map((b) => (
              <li key={b.id} id={b.slug} className="quote-item" data-reveal>
                <Link href={bookHref(b)} aria-label={t.books.openPageFor(b.title)} tabIndex={-1}>
                  <span
                    className="quote-cover"
                    style={{ backgroundColor: b.color, color: b.ink, backgroundImage: b.coverUrl ? `url(${b.coverUrl})` : undefined }}
                  >
                    {b.coverUrl ? null : <span className="quote-cover-title">{b.title}</span>}
                  </span>
                </Link>
                <BookQuote quote={b.quote} source={b.quoteSource}>
                  <Link href={bookHref(b)} className="quote-book">
                    {b.title} · {b.author}
                  </Link>
                </BookQuote>
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted" style={{ textAlign: "center" }}>{t.quotes.empty}</p>
        )}
      </section>
    </>
  );
}
