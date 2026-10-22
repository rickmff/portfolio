/**
 * Loads the reading list exported from Notion (scripts/data/books.json) into the books table.
 * Books whose title already exists are left alone, so it is safe to re-run.
 *
 *   pnpm import:books
 */
import { and, eq, isNull } from "drizzle-orm";
import { db, schema } from "../src/db";
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
