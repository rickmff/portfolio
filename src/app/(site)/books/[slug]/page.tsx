import { Arrow } from "@/components/Arrow";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Book3D } from "@/components/Book3D";
import { NotesReveal } from "@/components/NotesReveal";
import { statusLabel } from "@/lib/books";
import { getBookBySlug } from "@/lib/data";
import { getDict } from "@/lib/i18n/server";
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
  const t = await getDict();
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
        {b.readUrl ? (
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
