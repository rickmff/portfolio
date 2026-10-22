import { asc, desc } from "drizzle-orm";
import Link from "next/link";
import { db, schema } from "@/db";

import { STATUS_LABEL as LABEL } from "@/lib/books";

export default async function BooksAdmin() {
  const rows = await db.select().from(schema.books).orderBy(asc(schema.books.sort), desc(schema.books.finishedYear));
  return (
    <>
      <header className="adm-head">
        <h1>Books</h1>
        <Link href="/admin/books/new" className="adm-btn primary">Add book</Link>
      </header>
      <table className="adm-table">
        <thead><tr><th>Order</th><th>Title</th><th>Author</th><th>Status</th><th>Rating</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="mono">{r.sort}</td>
              <td><Link href={`/admin/books/${r.id}`}><span className="adm-swatch" style={{ background: r.color }} />{r.title}</Link></td>
              <td>{r.author}</td>
              <td>{LABEL[r.status]}{r.finishedYear ? ` · ${r.finishedYear}` : ""}</td>
              <td className="mono">{r.rating ? "●".repeat(r.rating) : "—"}</td>
            </tr>
          ))}
          {rows.length === 0 ? <tr><td colSpan={5} className="muted">No books yet.</td></tr> : null}
        </tbody>
      </table>
    </>
  );
}
