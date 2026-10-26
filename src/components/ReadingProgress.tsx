"use client";

import Link from "@/components/LocaleLink";
import { useEffect, useState } from "react";
import { Arrow } from "./Arrow";
import { useDict } from "@/lib/i18n/client";

type Saved = { edition: number; page: number };
const key = (slug: string) => `reading:${slug}`;

function read(slug: string): Saved | null {
  try {
    const v = JSON.parse(localStorage.getItem(key(slug)) ?? "null");
    return v && Number.isInteger(v.page) && Number.isInteger(v.edition) ? v : null;
  } catch {
    return null;
  }
}

/** Remembers where the visitor stopped, so the book page can offer to pick up from there. */
export function SaveProgress({ slug, edition, page }: { slug: string; edition: number; page: number }) {
  useEffect(() => {
    try {
      localStorage.setItem(key(slug), JSON.stringify({ edition, page }));
    } catch {}
  }, [slug, edition, page]);
  return null;
}

/** "Read online", or "Keep reading · p. 4" once the visitor has started. */
export function ReadLink({ slug }: { slug: string }) {
  const t = useDict();
  const [saved, setSaved] = useState<Saved | null>(null);
  useEffect(() => setSaved(read(slug)), [slug]);
  const resume = saved && saved.page > 1;
  const href = resume ? `/books/${slug}/read?e=${saved.edition}&p=${saved.page}` : `/books/${slug}/read`;
  return (
    <Link href={href} className="book-read book-read-main with-arrow">
      {resume ? t.books.keepReading(saved.page) : t.books.readOnline} <Arrow />
    </Link>
  );
}
