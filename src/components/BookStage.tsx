"use client";

import { useCallback, useRef, useState } from "react";
import type { BookStatus } from "@/db/schema";
import { statusLabel } from "@/lib/books";

export type StageBook = {
  id: number;
  title: string;
  author: string;
  status: BookStatus;
  finishedYear: number | null;
  color: string;
  ink: string;
  coverUrl: string | null;
  thickness: number;
  note: string;
};

const REST = { rx: -6, ry: -28 };

export function BookStage({ books, showNote = false }: { books: StageBook[]; showNote?: boolean }) {
  const initial = Math.max(0, books.findIndex((b) => b.status === "reading"));
  const [index, setIndex] = useState(initial);
  const bookRef = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  const apply = useCallback((rx: number, ry: number, fast: boolean) => {
    const el = bookRef.current;
    if (!el) return;
    el.style.transition = `transform ${fast ? ".12s" : ".9s"} var(--ease)`;
    el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
  }, []);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => apply(Math.round(-y * 24), Math.round(x * 150), true));
  };

  const rest = () => {
    cancelAnimationFrame(frame.current);
    apply(REST.rx, REST.ry, false);
  };

  const choose = (i: number) => {
    setIndex(i);
    rest();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") choose((index + 1) % books.length);
    if (e.key === "ArrowLeft") choose((index - 1 + books.length) % books.length);
  };

  if (books.length === 0) return null;
  const b = books[index];
  const depth = Math.min(64, Math.max(18, b.thickness));

  return (
    <div onKeyDown={onKey}>
      <div className="stage" onPointerMove={onMove} onPointerLeave={rest} onPointerUp={rest}>
        <div className="shadow" aria-hidden="true" />
        <div
          ref={bookRef}
          className="book"
          role="img"
          aria-label={`${b.title} by ${b.author}`}
          style={
            {
              "--d": `${depth}px`,
              transform: `rotateX(${REST.rx}deg) rotateY(${REST.ry}deg)`,
              transition: "transform .9s var(--ease)",
            } as React.CSSProperties
          }
        >
          <div
            className={`book-front${b.coverUrl ? " has-cover" : ""}`}
            style={{
              background: b.color,
              color: b.ink,
              backgroundImage: b.coverUrl ? `url(${b.coverUrl})` : undefined,
            }}
          >
            <span className="eyebrow" style={{ color: "inherit", opacity: 0.7, fontSize: 10 }}>
              {b.author}
            </span>
            <span className="title">{b.title}</span>
          </div>
          <div className="book-back" style={{ background: b.color }} />
          <div className="book-spine" style={{ background: b.color, color: b.ink }}>
            <span>{b.title}</span>
          </div>
          <div className="book-pages" />
          <div className="book-top" />
          <div className="book-bottom" />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 24,
          marginTop: 28,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: 520 }} aria-live="polite">
          <span key={b.id} className="reveal" style={{ fontSize: 18, letterSpacing: "-0.02em" }}>
            {b.title}
          </span>
          <span className="muted" style={{ fontSize: 13 }}>
            {b.author} · {statusLabel(b)}
          </span>
          {showNote && b.note ? (
            <p key={`n${b.id}`} className="reveal" style={{ margin: "12px 0 0", color: "#3a3a3a" }}>
              {b.note}
            </p>
          ) : null}
        </div>
        <div className="picker" role="group" aria-label="Choose a book">
          {books.map((book, i) => (
            <button
              key={book.id}
              type="button"
              onClick={() => choose(i)}
              aria-label={book.title}
              aria-pressed={i === index}
            >
              <span
                style={{
                  background: book.color,
                  height: i === index ? 44 : Math.min(40, Math.max(20, book.thickness * 0.75)),
                }}
              />
            </button>
          ))}
        </div>
      </div>
      <p className="mono" style={{ margin: "16px 0 0", textAlign: "center", color: "var(--faint)" }}>
        Move the cursor over the book to turn it · ← → to browse
      </p>
    </div>
  );
}
