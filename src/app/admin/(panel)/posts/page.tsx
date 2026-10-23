import { desc, sql } from "drizzle-orm";
import Link from "next/link";
import { db, schema } from "@/db";

const fmt = new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" });

export default async function PostsAdmin() {
  const rows = await db
    .select()
    .from(schema.posts)
    .orderBy(desc(sql`coalesce(${schema.posts.publishedAt}, ${schema.posts.updatedAt})`));
  return (
    <>
      <header className="adm-head">
        <h1>Posts</h1>
        <Link href="/admin/posts/new" className="adm-btn primary">Write post</Link>
      </header>
      <table className="adm-table">
        <thead><tr><th>Title</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td><Link href={`/admin/posts/${r.id}`}>{r.title}</Link></td>
              <td>{r.published ? (r.publishedAt && r.publishedAt > new Date() ? "Scheduled" : "Published") : <span className="muted">Draft</span>}</td>
              <td className="mono">{fmt.format(r.publishedAt ?? r.updatedAt)}</td>
            </tr>
          ))}
          {rows.length === 0 ? <tr><td colSpan={3} className="muted">No posts yet.</td></tr> : null}
        </tbody>
      </table>
    </>
  );
}
