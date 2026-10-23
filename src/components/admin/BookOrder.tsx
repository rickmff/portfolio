"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { reorderBooks } from "@/app/admin/actions";
import type { Book } from "@/db/schema";
import { STATUS_LABEL } from "@/lib/books";

type Row = Pick<Book, "id" | "title" | "author" | "status" | "color" | "coverUrl" | "notesGenerated">;
type Filter = Book["status"] | "all";

const FILTERS: Filter[] = ["all", "read", "reading", "wishlist", "abandoned"];

/**
 * Drag (or use the arrows) to set the order books appear on the shelves. With a status filter on,
 * books only swap places with each other, so the rest of the list keeps its positions.
 */
export function BookOrder({ books }: { books: Row[] }) {
  const [rows, setRows] = useState(books);
  const [filter, setFilter] = useState<Filter>("all");
  const [dragId, setDragId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);
  const [saved, setSaved] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const visible = useMemo(() => rows.filter((r) => filter === "all" || r.status === filter), [rows, filter]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);

  function move(id: number, to: number) {
    const from = visible.findIndex((r) => r.id === id);
    if (from < 0 || to < 0 || to >= visible.length || from === to) return;
    const reordered = [...visible];
    const [item] = reordered.splice(from, 1);
    reordered.splice(to, 0, item);
    // Put the reordered subset back into the slots the subset occupied.
    const slots = rows.flatMap((r, i) => (visible.some((v) => v.id === r.id) ? [i] : []));
    const next = [...rows];
    slots.forEach((slot, i) => (next[slot] = reordered[i]));
    setRows(next);
    setSaved(false);
  }

  function save() {
    setError(null);
    start(async () => {
      const res = await reorderBooks(rows.map((r) => r.id));
      if (res?.error) setError(res.error);
      else setSaved(true);
    });
  }

  return (
    <div className="adm-order">
      <div className="adm-order-bar">
        <div className="adm-tabs" role="tablist" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              className={filter === f ? "on" : ""}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : STATUS_LABEL[f]} <span>{counts[f] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="adm-head-actions">
          {error ? <span className="adm-error">{error}</span> : null}
          {!saved ? (
            <button type="button" className="adm-btn" onClick={() => { setRows(books); setSaved(true); }} disabled={pending}>
              Reset
            </button>
          ) : null}
          <button type="button" className="adm-btn primary" onClick={save} disabled={saved || pending}>
            {pending ? "Saving…" : saved ? "Order saved" : "Save order"}
          </button>
        </div>
      </div>
      <p className="muted adm-order-hint">
        Drag books to set the order they sit on the shelves. The home page shows the first 8 read books.
      </p>
      <ol className="adm-order-list">
        {visible.map((r, i) => (
          <li
            key={r.id}
            draggable
            className={`${dragId === r.id ? "dragging" : ""}${overId === r.id && dragId !== r.id ? " over" : ""}`}
            onDragStart={(e) => {
              setDragId(r.id);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setOverId(r.id);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragId != null) move(dragId, i);
              setDragId(null);
              setOverId(null);
            }}
            onDragEnd={() => {
              setDragId(null);
              setOverId(null);
            }}
          >
            <span className="adm-grip" aria-hidden="true">⋮⋮</span>
            <span className="mono adm-order-n">{i + 1}</span>
            {r.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="adm-order-cover" src={r.coverUrl} alt="" />
            ) : (
              <span className="adm-order-cover" style={{ background: r.color }} />
            )}
            <span className="adm-order-title">
              <Link href={`/admin/books/${r.id}`}>{r.title}</Link>
              {r.notesGenerated ? <span className="adm-draft" title="Notes drafted for you, not written by you">draft notes</span> : null}
              <small className="muted">{r.author}</small>
            </span>
            <span className="muted adm-order-status">{STATUS_LABEL[r.status]}</span>
            <span className="adm-order-arrows">
              <button type="button" aria-label={`Move ${r.title} up`} onClick={() => move(r.id, i - 1)} disabled={i === 0}>↑</button>
              <button type="button" aria-label={`Move ${r.title} down`} onClick={() => move(r.id, i + 1)} disabled={i === visible.length - 1}>↓</button>
            </span>
          </li>
        ))}
        {visible.length === 0 ? <li className="muted">No books here.</li> : null}
      </ol>
    </div>
  );
}
