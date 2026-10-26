"use client";

import { useEffect, useState } from "react";
import { googleBooksUrl, pickVolume } from "@/lib/google-books";
import { useDict } from "@/lib/i18n/client";

/**
 * Google Books' embedded viewer, only loaded once asked for: the pages the publisher lets
 * anyone read, inside the book page instead of a new tab. Without a volume from the server,
 * the visitor's browser looks one up and the button only appears if a preview exists.
 */
export function BookPreview({ id: known, title, author }: { id?: string; title: string; author: string }) {
  const [id, setId] = useState(known ?? null);
  const [open, setOpen] = useState(false);
  const t = useDict();

  useEffect(() => {
    if (known) return;
    const ctrl = new AbortController();
    fetch(googleBooksUrl(title, author), { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const hit = data && pickVolume(data, title, author);
        if (hit) setId(hit.preview.id);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [known, title, author]);

  if (!id) return null;
  return (
    <>
      <button type="button" className="book-read" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? t.books.closePreview : t.books.preview}
      </button>
      {open ? (
        <figure className="book-preview">
          <iframe
            src={`https://books.google.com/books?id=${encodeURIComponent(id)}&pg=PP1&output=embed`}
            title={t.books.previewOf(title)}
            loading="lazy"
            allowFullScreen
          />
          <figcaption className="mono">{t.books.previewNote}</figcaption>
        </figure>
      ) : null}
    </>
  );
}
