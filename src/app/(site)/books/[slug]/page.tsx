import { Arrow } from "@/components/Arrow";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Book3D } from "@/components/Book3D";
import { BookPreview } from "@/components/BookPreview";
import { NotesReveal } from "@/components/NotesReveal";
import { ReadLink } from "@/components/ReadingProgress";
import { statusLabel } from "@/lib/books";
import { getBookBySlug } from "@/lib/data";
import { getEditions } from "@/lib/editions";
import { getDict } from "@/lib/i18n/server";
import { renderMarkdown } from "@/lib/markdown";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const b = await getBookBySlug((await params).slug);
  return b ? { title: `${b.title} · ${b.author}`, description: b.synopsis || undefined } : {};
}

export default async function BookPage({ params }: Props) {
  const { slug } = await params;
  const b = await getBookBySlug(slug);
  if (!b) notFound();
  const [t, ed] = await Promise.all([getDict(), getEditions(b)]);
  return (
    <article className="section">
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
        {ed.read.length || ed.downloads.length || ed.preview ? (
          <div className="book-actions">
            {ed.read.length ? <ReadLink slug={slug} /> : null}
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
        ) : b.readUrl ? (
          <p style={{ margin: "28px 0 0", fontSize: 13 }}>
            <a href={b.readUrl} className="book-read with-arrow" target="_blank" rel="noopener noreferrer">
              {t.books.readFree} <Arrow dir="out" />
            </a>
          </p>
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

        <p className="prose" style={{ marginTop: 80, fontSize: 13 }}>
          <Link href="/books" className="link-muted with-arrow"><Arrow dir="left" /> {t.books.all}</Link>
        </p>
      </div>
    </article>
  );
}
