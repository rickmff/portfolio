import { asc, desc } from "drizzle-orm";
import Link from "next/link";
import { Icon } from "@/components/admin/Icon";
import { db, schema } from "@/db";

export default async function ProjectsAdmin() {
  const rows = await db.select().from(schema.projects).orderBy(asc(schema.projects.sort), desc(schema.projects.year));
  return (
    <div className="adm-page adm-page-wide">
      <header className="adm-head">
        <h1 className="adm-title adm-title-static">Projects</h1>
        <Link href="/admin/projects/new" className="adm-btn primary sm"><Icon name="plus" size={14} /> New project</Link>
      </header>
      <table className="adm-table">
        <thead><tr><th><Icon name="title" size={14} /> Title</th><th><Icon name="calendar" size={14} /> Year</th><th><Icon name="select" size={14} /> Status</th><th><Icon name="list" size={14} /> Order</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td><Link href={`/admin/projects/${r.id}`} className="adm-row-link"><span className="adm-swatch" style={{ background: r.tint }} />{r.title}</Link></td>
              <td className="mono">{r.year}</td>
              <td>{r.published ? <span className="adm-tag green">Published</span> : <span className="adm-tag">Hidden</span>}</td>
              <td className="mono muted">{r.sort}</td>
            </tr>
          ))}
          {rows.length === 0 ? <tr><td colSpan={4} className="muted">No projects yet.</td></tr> : null}
        </tbody>
      </table>
      <Link href="/admin/projects/new" className="adm-table-new"><Icon name="plus" size={14} /> New</Link>
    </div>
  );
}
