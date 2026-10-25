/**
 * Loads the reading list exported from Notion (scripts/data/books.json) into the books table.
 * Books whose title already exists are left alone, so it is safe to re-run.
 *
 *   pnpm import:books
 */
import { and, eq, isNull } from "drizzle-orm";
import { db, schema } from "../src/db";
import type { Translations } from "../src/db/schema";
import { bookPages } from "./data/book-pages";
import { bookQuotes } from "./data/quotes";
import { bookTranslations } from "./data/translations";
import books from "./data/books.json";

export async function importBooks() {
  const existing = new Set((await db.select({ title: schema.books.title }).from(schema.books)).map((b) => b.title));
  const fresh = (books as (typeof schema.books.$inferInsert)[]).filter((b) => !existing.has(b.title));
  if (fresh.length) await db.insert(schema.books).values(fresh);
  return fresh.length;
}

/**
 * Gives books that still have no cover the cover (and cover-derived spine colours) from the
 * export. Covers set by hand in the backoffice are never overwritten.
 */
export async function syncBookCovers() {
  let n = 0;
  for (const b of books as (typeof schema.books.$inferInsert)[]) {
    if (!b.coverUrl) continue;
    const rows = await db
      .update(schema.books)
      .set({ coverUrl: b.coverUrl, color: b.color, ink: b.ink })
      .where(and(eq(schema.books.title, b.title), isNull(schema.books.coverUrl)))
      .returning({ id: schema.books.id });
    n += rows.length;
  }
  return n;
}

/**
 * Fills in each book page's synopsis, notes and free edition link from scripts/data/book-pages.ts.
 * Each field is only written while it is still empty, so edits made in the backoffice stick.
 */
export async function syncBookPages() {
  const { books: t } = schema;
  let n = 0;
  for (const p of bookPages) {
    const steps = [
      p.synopsis && db.update(t).set({ synopsis: p.synopsis }).where(and(eq(t.title, p.title), eq(t.synopsis, ""))),
      p.notes &&
        db
          .update(t)
          .set({ notes: p.notes, notesGenerated: !!p.notesGenerated })
          .where(and(eq(t.title, p.title), eq(t.notes, ""))),
      p.readUrl && db.update(t).set({ readUrl: p.readUrl }).where(and(eq(t.title, p.title), isNull(t.readUrl))),
    ];
    for (const q of steps) if (q) n += (await q.returning({ id: t.id })).length;
  }
  return n;
}

/** Adds the translations in data/translations.ts, field by field, only where none exists yet. */
export async function syncTranslations() {
  const { books: t } = schema;
  const rows = await db.select({ id: t.id, title: t.title, translations: t.translations }).from(t);
  let n = 0;
  for (const tr of bookTranslations) {
    const row = rows.find((r) => r.title === tr.title);
    if (!row) continue;
    const merged: Translations = { ...row.translations };
    let changed = false;
    for (const lang of ["en", "pt"] as const) {
      for (const [field, value] of Object.entries(tr[lang] ?? {})) {
        if (!value || merged[lang]?.[field]) continue;
        merged[lang] = { ...merged[lang], [field]: value };
        changed = true;
      }
    }
    if (changed) {
      await db.update(t).set({ translations: merged }).where(eq(t.id, row.id));
      n++;
    }
  }
  return n;
}

/**
 * Gives each read book its best-known line from data/quotes.ts, with the English version in its
 * translations. Only books whose quote is still empty are touched, so backoffice edits stick.
 */
export async function syncQuotes() {
  const { books: t } = schema;
  const rows = await db
    .select({ id: t.id, title: t.title, translations: t.translations })
    .from(t)
    .where(eq(t.quote, ""));
  let n = 0;
  for (const q of bookQuotes) {
    const row = rows.find((r) => r.title === q.title);
    if (!row) continue;
    const translations: Translations = { ...row.translations, en: { ...q.en, ...row.translations.en } };
    await db.update(t).set({ quote: q.quote, quoteSource: q.source, translations }).where(eq(t.id, row.id));
    n++;
  }
  return n;
}

if (process.argv[1]?.endsWith("import-books.ts")) {
  importBooks()
    .then((n) => {
      console.log(`imported ${n} books`);
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
