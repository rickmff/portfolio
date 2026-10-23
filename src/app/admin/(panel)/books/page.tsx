import { asc } from "drizzle-orm";
import Link from "next/link";
import { BookOrder } from "@/components/admin/BookOrder";
import { db, schema } from "@/db";

export default async function BooksAdmin() {
  const { books } = schema;
  const rows = await db
    .select({ id: books.id, title: books.title, author: books.author, status: books.status, color: books.color, coverUrl: books.coverUrl, notesGenerated: books.notesGenerated })
    .from(books)
    .orderBy(asc(books.sort), asc(books.id));
  return (
    <>
      <header className="adm-head">
        <h1>Books</h1>
        <Link href="/admin/books/new" className="adm-btn primary">Add book</Link>
      </header>
      <BookOrder books={rows} />
    </>
  );
}
