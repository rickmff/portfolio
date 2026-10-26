import type { Metadata } from "next";
import Link from "@/components/LocaleLink";
import { notFound } from "next/navigation";
import { Arrow } from "@/components/Arrow";
import { SaveProgress } from "@/components/ReadingProgress";
import { getBookBySlug } from "@/lib/data";
import { readableEditions } from "@/lib/editions";
import { getGutenbergBook, type ReaderBook } from "@/lib/gutenberg";
import { getDict } from "@/lib/i18n/server";
import { highlightQuote } from "@/lib/quote-highlight";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ p?: string; e?: string }>;
};

const int = (v: string | undefined, fallback: number) => {
  const n = Number.parseInt(v ?? "", 10);
  return Number.isFinite(n) ? n : fallback;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const b = await getBookBySlug((await params).slug);
  return b ? { title: `${b.title} · ${b.author}`, robots: { index: false } } : {};
}

export default async function ReadPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const q = await searchParams;
  const b = await getBookBySlug(slug);
  const editions = b ? readableEditions(b) : [];
  if (!b || !editions.length) notFound();
  const t = await getDict();

  const e = Math.min(Math.max(int(q.e, 0), 0), editions.length - 1);
  const edition = editions[e];
  let book: ReaderBook | null = null;
  try {
    book = await getGutenbergBook(edition.id);
  } catch {
    book = null;
  }
  const total = book?.pages.length ?? 1;
  const p = Math.min(Math.max(int(q.p, 1), 1), total);
  const href = (page: number, ed = e) => `/books/${slug}/read?${ed ? `e=${ed}&` : ""}p=${page}`;
  const source = `https://www.gutenberg.org/ebooks/${edition.id}`;
  // The book's quote is highlighted wherever it falls, in whichever language the edition is.
  const quotes = [b.quote, b.translations.en?.quote, b.translations.pt?.quote];
  const text = book ? highlightQuote(book.pages[p - 1].html, quotes).html : "";

  return (
    <article className="section reader">
      <div className="reader-progress" aria-hidden="true" />
      <header className="wrap reader-head">
        <Link href={`/books/${slug}`} className="link-muted with-arrow reader-back">
          <Arrow dir="left" /> {t.books.backToBook}
        </Link>
        <h1>{b.title}</h1>
        <p className="muted">{b.author}</p>
        <p className="mono reader-meta">
          {t.books.edition(edition.lang, edition.translator)}
          {book ? ` · ${t.books.page(p, total)}` : ""}
        </p>
        {editions.length > 1 ? (
          <nav className="reader-editions" aria-label={t.language}>
            {editions.map((ed, i) => (
              <Link key={ed.id} href={href(1, i)} aria-current={i === e ? "true" : undefined}>
                {t.books.langs[ed.lang] ?? ed.lang}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>

      <div className="wrap">
        {book ? (
          <>
            <SaveProgress slug={slug} edition={e} page={p} />
            {book.toc.length > 1 ? (
              <details className="reader-toc prose">
                <summary className="mono">{t.books.contents}</summary>
                <ol>
                  {book.toc.map((c, i) => (
                    <li key={i}>
                      <Link href={href(c.page)} aria-current={c.page === p ? "page" : undefined}>
                        {c.label}
                      </Link>
                    </li>
                  ))}
                </ol>
              </details>
            ) : null}
            <div className="prose reader-text" lang={edition.lang} dangerouslySetInnerHTML={{ __html: text }} />
            <nav className="reader-pager mono">
              {p > 1 ? (
                <Link href={href(p - 1)} className="with-arrow" rel="prev">
                  <Arrow dir="left" /> {t.books.prev}
                </Link>
              ) : (
                <span />
              )}
              <span className="muted">{t.books.page(p, total)}</span>
              {p < total ? (
                <Link href={href(p + 1)} className="with-arrow" rel="next">
                  {t.books.next} <Arrow />
                </Link>
              ) : (
                <span />
              )}
            </nav>
          </>
        ) : (
          <p className="prose muted">{t.books.readerError}</p>
        )}
        <p className="prose reader-source mono">
          <a href={source} target="_blank" rel="noopener noreferrer" className="with-arrow">
            {t.books.source} <Arrow dir="out" />
          </a>
        </p>
      </div>
    </article>
  );
}
