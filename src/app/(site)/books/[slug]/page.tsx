import { Arrow } from "@/components/Arrow";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Book3D } from "@/components/Book3D";
import { JsonLd } from "@/components/JsonLd";
import { BookPreview } from "@/components/BookPreview";
import { BookShelf } from "@/components/BookShelf";
import { BookQuote } from "@/components/BookQuote";
import { NotesReveal } from "@/components/NotesReveal";
import { ReadLink } from "@/components/ReadingProgress";
import { readAndReading, statusLabel, toShelfBook } from "@/lib/books";
import { getBookBySlug, getBooks } from "@/lib/data";
import { getEditions, type GutenbergEdition } from "@/lib/editions";
import { getGutenbergBook } from "@/lib/gutenberg";
import { getDict } from "@/lib/i18n/server";
import { renderMarkdown } from "@/lib/markdown";
import { containsQuote } from "@/lib/quote-highlight";
import { absoluteUrl, metaFor, PERSON_ID } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const b = await getBookBySlug((await params).slug);
  if (!b) return {};
  return metaFor({ title: `${b.title} · ${b.author}`, description: b.synopsis || undefined, path: `/books/${b.slug}` });
}

export default async function BookPage({ params }: Props) {
  const { slug } = await params;
  const b = await getBookBySlug(slug);
  if (!b) notFound();
  const [t, ed, all] = await Promise.all([getDict(), getEditions(b), getBooks()]);
  // The "Read & reading" shelf, without the book on this page.
  const others = readAndReading(all).filter((o) => o.id !== b.id).map(toShelfBook);
  return (
    <article className="section">
      <JsonLd
        graph={[
          {
            "@type": "Book",
            name: b.title,
            author: { "@type": "Person", name: b.author },
            ...(b.coverUrl && { image: absoluteUrl(b.coverUrl) }),
            ...(b.synopsis && { description: b.synopsis }),
            ...(b.rating && {
              review: {
                "@type": "Review",
                author: { "@id": PERSON_ID },
                reviewRating: { "@type": "Rating", ratingValue: b.rating, bestRating: 5, worstRating: 1 },
                ...(b.note && { reviewBody: b.note }),
              },
            }),
          },
        ]}
      />
      <header className="wrap book-head reveal">
        <Book3D
          title={b.title}
          author={b.author}
          color={b.color}
          ink={b.ink}
          coverUrl={b.coverUrl}
          thickness={b.thickness}
        />
        <p className="eyebrow" style={{ margin: "28px 0 0" }}>
          {statusLabel(b, t)}
          {b.rating ? ` · ${"●".repeat(b.rating)}${"○".repeat(5 - b.rating)}` : ""}
        </p>
        <h1>{b.title}</h1>
        <p className="muted" style={{ margin: "12px 0 0" }}>{b.author}</p>
        {ed.read.length || ed.downloads.length || ed.preview || ed.external ? (
          <div className="book-actions">
            {ed.read.length ? <ReadLink slug={slug} /> : null}
            {ed.external ? (
              <a href={ed.external} className="book-read with-arrow" target="_blank" rel="noopener noreferrer">
                {t.books.readFree} <Arrow dir="out" />
              </a>
            ) : null}
            {ed.downloads.map((d) => (
              <a
                key={d.href}
                href={d.href}
                className="book-read with-arrow"
                title={`${t.books.download} · ${d.source}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {d.label} <Arrow dir="down" />
              </a>
            ))}
            {ed.preview ? <BookPreview id={ed.preview.id} title={b.title} /> : null}
          </div>
        ) : null}
        {b.quote ? (
          <BookQuote quote={b.quote} source={b.quoteSource} className="book-quote">
            {ed.read.length ? (
              <Suspense fallback={null}>
                <FindInBook slug={slug} editions={ed.read} quotes={[b.quote, b.translations.en?.quote, b.translations.pt?.quote]} label={t.quotes.findInBook} />
              </Suspense>
            ) : null}
          </BookQuote>
        ) : null}
      </header>

      <div className="wrap">
        {b.synopsis ? (
          <section className="prose book-section">
            <h2 className="eyebrow">{t.books.synopsis}</h2>
            <p>{b.synopsis}</p>
          </section>
        ) : null}

        {b.notes ? (
          <section className="prose book-section">
            <h2 className="eyebrow">{t.books.notes}</h2>
            <NotesReveal html={renderMarkdown(b.notes)} />
          </section>
        ) : null}
      </div>

      {others.length ? (
        <section id="more-books" className="wrap" style={{ marginTop: 160 }}>
          <div className="section-head center">
            <h2>{t.books.more}</h2>
          </div>
          <BookShelf shelves={[{ books: others }]} initialOpen={others[0].id} centered />
        </section>
      ) : null}
    </article>
  );
}

/**
 * Links straight to the reader page that holds the quote, highlighted. Streams in after the page,
 * since it needs the full text; when the quote is not in any free edition, nothing shows.
 */
async function FindInBook({
  slug,
  editions,
  quotes,
  label,
}: {
  slug: string;
  editions: GutenbergEdition[];
  quotes: (string | undefined)[];
  label: string;
}) {
  for (const [e, edition] of editions.entries()) {
    const book = await getGutenbergBook(edition.id).catch(() => null);
    const i = book?.pages.findIndex((page) => containsQuote(page.html, quotes)) ?? -1;
    if (i >= 0) {
      return (
        <Link href={`/books/${slug}/read?${e ? `e=${e}&` : ""}p=${i + 1}#quote`} className="link-muted with-arrow">
          {label} <Arrow />
        </Link>
      );
    }
  }
  return null;
}
