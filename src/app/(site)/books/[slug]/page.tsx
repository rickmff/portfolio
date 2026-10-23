import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NotesReveal } from "@/components/NotesReveal";
import { statusLabel } from "@/lib/books";
import { getBookBySlug } from "@/lib/data";
import { renderMarkdown } from "@/lib/markdown";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const b = await getBookBySlug((await params).slug);
  return b ? { title: `${b.title} · ${b.author}`, description: b.synopsis || undefined } : {};
}

export default async function BookPage({ params }: Props) {
  const b = await getBookBySlug((await params).slug);
  if (!b) notFound();
  return (
    <article className="section">
      <header className="wrap book-head reveal">
        <div className="book-cover" style={{ backgroundColor: b.color, color: b.ink }}>
          {b.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.coverUrl} alt={`Cover of ${b.title}`} />
          ) : (
            <span className="book-cover-title">{b.title}</span>
          )}
        </div>
        <p className="eyebrow" style={{ margin: "40px 0 0" }}>
          {statusLabel(b)}
          {b.rating ? ` · ${"●".repeat(b.rating)}${"○".repeat(5 - b.rating)}` : ""}
        </p>
        <h1>{b.title}</h1>
        <p className="muted" style={{ margin: "12px 0 0" }}>{b.author}</p>
        {b.readUrl ? (
          <p style={{ margin: "28px 0 0", fontSize: 13 }}>
            <a href={b.readUrl} className="book-read" target="_blank" rel="noopener noreferrer">
              Read it free · public domain ↗
            </a>
          </p>
        ) : null}
      </header>

      <div className="wrap">
        {b.synopsis ? (
          <section className="prose book-section">
            <h2 className="eyebrow">Synopsis</h2>
            <p>{b.synopsis}</p>
          </section>
        ) : null}

        {b.notes ? (
          <section className="prose book-section">
            <h2 className="eyebrow">My notes</h2>
            <NotesReveal html={renderMarkdown(b.notes)} />
          </section>
        ) : null}

        <p className="prose" style={{ marginTop: 80, fontSize: 13 }}>
          <Link href="/books" className="link-muted">← All books</Link>
        </p>
      </div>
    </article>
  );
}
