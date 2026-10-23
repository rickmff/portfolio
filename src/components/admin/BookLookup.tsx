"use client";

import { useRef, useState, useTransition } from "react";
import { lookupBookDetails, lookupBooks } from "@/app/admin/actions";
import type { BookHit } from "@/lib/book-lookup";

const cover = (id: number) => `https://covers.openlibrary.org/b/id/${id}-S.jpg`;

/**
 * Search Open Library by title, author or ISBN and fill the book form from the pick: title,
 * author, spine thickness from the page count, synopsis, cover colours and the cover itself
 * (downloaded when the form is saved). Every field stays editable afterwards.
 */
export function BookLookup() {
  const root = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<BookHit[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [picked, setPicked] = useState<{ title: string; coverUrl: string | null } | null>(null);
  const [pending, start] = useTransition();

  const set = (name: string, value: string | number | null | undefined, onlyIfEmpty = false) => {
    if (value === null || value === undefined || value === "") return;
    const form = root.current?.closest("form");
    const el = form?.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null;
    if (!el || (onlyIfEmpty && el.value.trim())) return;
    // Go through the native setter so React-controlled fields (the Markdown editor) notice too.
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, String(value));
    el.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const search = () =>
    start(async () => {
      setMsg(null);
      const res = await lookupBooks(q);
      if (res.error) setMsg(res.error);
      setHits(res.hits ?? []);
      if (res.hits?.length === 0) setMsg("Nothing found. Try the original title or the ISBN.");
    });

  const pick = (h: BookHit) =>
    start(async () => {
      set("title", h.title);
      set("author", h.author);
      if (h.pages) set("thickness", Math.min(80, Math.max(14, Math.round(h.pages / 10))));
      const d = await lookupBookDetails(h.key, h.coverId);
      if ("error" in d) {
        setMsg(d.error);
      } else {
        set("synopsis", d.synopsis, true);
        set("color", d.color);
        set("ink", d.ink);
        set("coverRemote", d.coverUrl ?? "");
        setPicked({ title: h.title, coverUrl: d.coverUrl });
      }
      setHits(null);
    });

  return (
    <div ref={root} className="adm-lookup">
      <span className="adm-lookup-label">Find the book</span>
      <div className="adm-lookup-bar">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (q.trim().length > 1) search();
            }
          }}
          placeholder="Title, author or ISBN"
          aria-label="Search Open Library"
        />
        <button type="button" className="adm-btn" onClick={search} disabled={pending || q.trim().length < 2}>
          {pending ? "Searching…" : "Search"}
        </button>
      </div>
      <input type="hidden" name="coverRemote" defaultValue="" />
      {msg ? <p className="adm-lookup-msg">{msg}</p> : null}
      {hits?.length ? (
        <ul className="adm-lookup-hits">
          {hits.map((h) => (
            <li key={h.key}>
              <button type="button" onClick={() => pick(h)} disabled={pending}>
                {h.coverId ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cover(h.coverId)} alt="" loading="lazy" />
                ) : (
                  <span className="adm-lookup-nocover" />
                )}
                <span>
                  <strong>{h.title}</strong>
                  <small>
                    {[h.author, h.year, h.pages ? `${h.pages} pages` : null].filter(Boolean).join(" · ")}
                  </small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {picked ? (
        <p className="adm-lookup-msg">
          Filled from Open Library: <strong>{picked.title}</strong>.{" "}
          {picked.coverUrl ? "The cover is downloaded when you save (unless you upload your own)." : "No cover found, upload one below."}
        </p>
      ) : (
        <p className="adm-lookup-msg">Fills title, author, thickness, synopsis, colours and cover. You can edit everything after.</p>
      )}
    </div>
  );
}
