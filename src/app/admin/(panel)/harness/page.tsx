import { asc } from "drizzle-orm";
import Link from "next/link";
import { db, schema } from "@/db";

export default async function HarnessAdmin() {
  const rows = await db.select().from(schema.harness).orderBy(asc(schema.harness.sort), asc(schema.harness.id));
  return (
    <>
      <header className="adm-head">
        <h1>Harness</h1>
        <div className="adm-head-actions">
          <Link href="/harness" target="_blank" className="adm-btn">View ↗</Link>
          <Link href="/admin/harness/new" className="adm-btn primary">Add link</Link>
        </div>
      </header>
      <table className="adm-table">
        <thead><tr><th>Name</th><th>Category</th><th>Link</th><th>Order</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td><Link href={`/admin/harness/${r.id}`}>{r.name}</Link></td>
              <td>{r.category || <span className="muted">—</span>}</td>
              <td className="mono muted">{r.url.replace(/^https?:\/\/(www\.)?/, "").slice(0, 40)}</td>
              <td className="mono">{r.sort}</td>
            </tr>
          ))}
          {rows.length === 0 ? <tr><td colSpan={4} className="muted">No links yet. The Harness page and menu link appear once you add one.</td></tr> : null}
        </tbody>
      </table>
    </>
  );
}
