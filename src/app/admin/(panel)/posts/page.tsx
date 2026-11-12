import { desc, sql } from "drizzle-orm";
import Link from "next/link";
import { Icon } from "@/components/admin/Icon";
import { db, schema } from "@/db";

const fmt = new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" });

export default async function PostsAdmin() {
  const rows = await db
    .select()
    .from(schema.posts)
    .orderBy(desc(sql`coalesce(${schema.posts.publishedAt}, ${schema.posts.updatedAt})`));
  return (
    <div className="adm-page adm-page-wide">
      <header className="adm-head">
        <h1 className="adm-title adm-title-static">Posts</h1>
        <Link href="/admin/posts/new" className="adm-btn primary sm"><Icon name="plus" size={14} /> New post</Link>
      </header>
      <table className="adm-table">
        <thead><tr><th><Icon name="title" size={14} /> Title</th><th><Icon name="select" size={14} /> Status</th><th><Icon name="calendar" size={14} /> Date</th></tr></thead>
        <tbody>
          {rows.map((r) => {
            const scheduled = r.published && r.publishedAt && r.publishedAt > new Date();
            return (
              <tr key={r.id}>
                <td><Link href={`/admin/posts/${r.id}`} className="adm-row-link">{r.title || "Untitled"}</Link></td>
                <td>
                  {r.published ? (
                    <span className={`adm-tag ${scheduled ? "yellow" : "green"}`}>{scheduled ? "Scheduled" : "Published"}</span>
                  ) : (
                    <span className="adm-tag">Draft</span>
                  )}
                </td>
                <td className="muted">{fmt.format(r.publishedAt ?? r.updatedAt)}</td>
              </tr>
            );
          })}
          {rows.length === 0 ? <tr><td colSpan={3} className="muted">No posts yet.</td></tr> : null}
        </tbody>
      </table>
      <Link href="/admin/posts/new" className="adm-table-new"><Icon name="plus" size={14} /> New</Link>
    </div>
  );
}
