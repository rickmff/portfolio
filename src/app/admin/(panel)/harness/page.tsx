import { asc } from "drizzle-orm";
import Link from "next/link";
import { Icon } from "@/components/admin/Icon";
import { db, schema } from "@/db";

export default async function HarnessAdmin() {
  const rows = await db.select().from(schema.harness).orderBy(asc(schema.harness.sort), asc(schema.harness.id));
  return (
    <div className="adm-page adm-page-wide">
      <header className="adm-head">
        <h1 className="adm-title adm-title-static">Harness</h1>
        <div className="adm-head-actions">
          <Link href="/harness" target="_blank" className="adm-ghost"><Icon name="external" size={14} /> View</Link>
          <Link href="/admin/harness/new" className="adm-btn primary sm"><Icon name="plus" size={14} /> Add link</Link>
        </div>
      </header>
      <table className="adm-table">
        <thead><tr><th><Icon name="title" size={14} /> Name</th><th><Icon name="tag" size={14} /> Category</th><th><Icon name="link" size={14} /> Link</th><th><Icon name="list" size={14} /> Order</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td><Link href={`/admin/harness/${r.id}`} className="adm-row-link">{r.name}</Link></td>
              <td>{r.category ? <span className="adm-tag">{r.category}</span> : <span className="muted">—</span>}</td>
              <td className="mono muted">{r.url.replace(/^https?:\/\/(www\.)?/, "").slice(0, 40)}</td>
              <td className="mono muted">{r.sort}</td>
            </tr>
          ))}
          {rows.length === 0 ? <tr><td colSpan={4} className="muted">No links yet. The Harness page and menu link appear once you add one.</td></tr> : null}
        </tbody>
      </table>
      <Link href="/admin/harness/new" className="adm-table-new"><Icon name="plus" size={14} /> New</Link>
    </div>
  );
}
