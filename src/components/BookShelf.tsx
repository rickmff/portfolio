"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { navigateWithTransition, prefetchFull } from "@/components/PageTransition";
import type { BookStatus } from "@/db/schema";
import { statusLabel } from "@/lib/books";
import { useDict } from "@/lib/i18n/client";

export type ShelfBook = {
  id: number;
  slug: string;
  title: string;
  author: string;
  status: BookStatus;
  finishedYear: number | null;
  rating: number | null;
  color: string;
  ink: string;
  coverUrl: string | null;
  thickness: number;
  note: string;
};

export type Shelf = { label?: string; books: ShelfBook[] };

const COVER_W = 150;
const PER_SHELF = 22;

/** Stable, slightly varied book height so the row doesn't look machine-cut. */
// Books with a real cover keep its ~2:3 proportions; the rest vary a little for a lived-in shelf.
const heightOf = (b: ShelfBook) =>
  b.coverUrl ? 220 + ((b.id * 37) % 9) : 196 + ((b.id * 37 + b.title.length * 7) % 48);
const depthOf = (b: ShelfBook) => Math.min(56, Math.max(18, b.thickness));

function chunk<T>(list: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

export function BookShelf({
  shelves,
  initialOpen,
  centered = false,
}: {
  shelves: Shelf[];
  initialOpen?: number | null;
  /** Centre short shelves (the home page shows only a handful of books). */
  centered?: boolean;
}) {
  const all = shelves.flatMap((s) => s.books);
  const [open, setOpen] = useState<number | null>(initialOpen ?? null);
  const selected = all.find((b) => b.id === open) ?? null;
  const router = useRouter();
  const t = useDict();

  // The open book is one click from its page, so load that page in the background.
  useEffect(() => {
    if (selected) prefetchFull(router, `/books/${selected.slug}`);
  }, [router, selected]);

  const move = (dir: 1 | -1) => {
    const i = all.findIndex((b) => b.id === open);
    const next = all[(i + dir + all.length) % all.length];
    if (next) {
      setOpen(next.id);
      document.getElementById(`book-${next.id}`)?.focus();
    }
  };

  return (
    <div
      className="shelves"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") move(1);
        if (e.key === "ArrowLeft") move(-1);
        if (e.key === "Escape") setOpen(null);
      }}
    >
      {shelves.map((shelf, si) =>
        shelf.books.length === 0 ? null : (
          <section key={si} className="shelf-group" aria-label={shelf.label ?? "Bookshelf"}>
            {shelf.label ? (
              <h3 className="shelf-label">
                {shelf.label} <span>{shelf.books.length}</span>
              </h3>
            ) : null}
            {chunk(shelf.books, PER_SHELF).map((row, ri) => (
              <div key={ri} className="shelf">
                <div className={`shelf-row${centered ? " centered" : ""}`}>
                  {row.map((b) => {
                    const isOpen = b.id === open;
                    const h = heightOf(b);
                    const d = depthOf(b);
                    return (
                      <button
                        key={b.id}
                        id={`book-${b.id}`}
                        type="button"
                        className={`sb-slot${isOpen ? " is-open" : ""}`}
                        aria-pressed={isOpen}
                        aria-label={isOpen ? t.books.openPageFor(b.title) : t.books.by(b.title, b.author)}
                        title={isOpen ? t.books.clickAgain : undefined}
                        onClick={() => (isOpen ? navigateWithTransition(router, `/books/${b.slug}`) : setOpen(b.id))}
                        style={
                          {
                            "--w": `${COVER_W}px`,
                            "--h": `${h}px`,
                            "--d": `${d}px`,
                            width: isOpen ? COVER_W + 56 : d + 2,
                            height: h,
                          } as React.CSSProperties
                        }
                      >
                        <span className="sb-book">
                          <span
                            className={`sb-front${b.coverUrl ? " has-cover" : ""}`}
                            style={{
                              backgroundColor: b.color,
                              color: b.ink,
                              backgroundImage: b.coverUrl ? `url(${b.coverUrl})` : undefined,
                            }}
                          >
                            <span className="sb-front-author">{b.author}</span>
                            <span className="sb-front-title">{b.title}</span>
                          </span>
                          <span className="sb-spine" style={{ background: b.color, color: b.ink }}>
                            <span className="sb-band" style={{ background: b.ink }} />
                            <span className="sb-spine-title">{b.title}</span>
                            <span className="sb-spine-dot" style={{ background: b.ink }} />
                          </span>
                          <span className="sb-pages" />
                          <span className="sb-top" />
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="shelf-board" aria-hidden="true" />
                <DetailSlot book={selected && row.includes(selected) ? selected : null} />
              </div>
            ))}
          </section>
        ),
      )}

      <Collapse open={!selected}>
        <p className="mono shelf-detail" style={{ margin: 0, color: "var(--faint)" }}>
          {t.books.hint}
        </p>
      </Collapse>
    </div>
  );
}

/** Opens and closes by animating its height and opacity, so content below glides instead of jumping. */
function Collapse({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div className={`collapse${open ? " is-open" : ""}`} aria-hidden={!open}>
      <div className="collapse-inner">{children}</div>
    </div>
  );
}

/** Keeps the last book on screen while its panel closes, so it fades out rather than vanishing. */
function DetailSlot({ book }: { book: ShelfBook | null }) {
  const [shown, setShown] = useState(book);
  if (book && book !== shown) setShown(book);
  return <Collapse open={!!book}>{shown ? <Detail key={shown.id} book={shown} /> : null}</Collapse>;
}

function Detail({ book }: { book: ShelfBook }) {
  const t = useDict();
  return (
    <div className="shelf-detail reveal" aria-live="polite">
      <p className="shelf-detail-title">{book.title}</p>
      <p className="muted" style={{ margin: 0, fontSize: 13 }}>
        {book.author} · {statusLabel(book, t)}
        {book.rating ? ` · ${"●".repeat(book.rating)}${"○".repeat(5 - book.rating)}` : ""}
      </p>
      {book.note ? <p className="shelf-detail-note">{book.note}</p> : null}
      <p style={{ margin: "16px 0 0", fontSize: 13 }}>
        <Link href={`/books/${book.slug}`} className="link-muted">
          {t.books.openBook}
        </Link>
      </p>
    </div>
  );
}
