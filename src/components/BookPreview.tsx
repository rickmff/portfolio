"use client";

import { useState } from "react";
import { useDict } from "@/lib/i18n/client";

/**
 * Google Books' embedded viewer, only loaded once asked for: the pages the publisher lets
 * anyone read, inside the book page instead of a new tab.
 */
export function BookPreview({ id, title }: { id: string; title: string }) {
  const [open, setOpen] = useState(false);
  const t = useDict();
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
