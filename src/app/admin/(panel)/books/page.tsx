import { asc } from "drizzle-orm";
import Link from "next/link";
import { BookOrder } from "@/components/admin/BookOrder";
import { Icon } from "@/components/admin/Icon";
import { db, schema } from "@/db";

export default async function BooksAdmin() {
  const { books } = schema;
  const rows = await db
    .select({ id: books.id, title: books.title, author: books.author, status: books.status, color: books.color, coverUrl: books.coverUrl, notesGenerated: books.notesGenerated })
    .from(books)
    .orderBy(asc(books.sort), asc(books.id));
  return (
    <div className="adm-page adm-page-wide">
      <header className="adm-head">
        <h1 className="adm-title adm-title-static">Books</h1>
        <Link href="/admin/books/new" className="adm-btn primary sm"><Icon name="plus" size={14} /> Add book</Link>
      </header>
      <BookOrder books={rows} />
    </div>
  );
}
