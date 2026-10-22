import type { Metadata } from "next";
import { BookStage } from "@/components/BookStage";
import { onShelf, toStageBook } from "@/lib/books";
import { getBooks } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Books" };

const GROUPS = [
  { key: "reading", label: "Reading" },
  { key: "read", label: "Read" },
  { key: "next", label: "Up next" },
  { key: "wishlist", label: "Wishlist" },
  { key: "abandoned", label: "Put down" },
] as const;

export default async function BooksPage() {
  const books = await getBooks();
  return (
    <>
      <section className="wrap page-title reveal">
        <p className="eyebrow" style={{ margin: 0 }}>Library</p>
        <h1>Books that changed how I build things.</h1>
      </section>
      <section className="wrap section">
        <BookStage books={books.filter(onShelf).map(toStageBook)} showNote />
      </section>
      <section className="wrap section" style={{ maxWidth: 720 }}>
        {GROUPS.map((g) => {
          const list = books.filter((b) => b.status === g.key);
          if (list.length === 0) return null;
          return (
            <div key={g.key} className="year-row">
              <span className="mono" style={{ color: "var(--faint)", paddingTop: 4 }}>{g.label}</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {list.map((b) => (
                  <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 17 }}>
                    <span style={{ width: 8, height: 12, background: b.color, flex: "none" }} aria-hidden="true" />
                    <span style={{ flex: 1 }}>
                      {b.title} <span className="muted" style={{ fontSize: 13 }}>— {b.author}</span>
                    </span>
                    <span className="mono" style={{ color: "var(--faint)" }}>
                      {b.rating ? "●".repeat(b.rating) : b.finishedYear ?? ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
