import { asc, desc } from "drizzle-orm";
import Link from "next/link";
import { db, schema } from "@/db";

export default async function ProjectsAdmin() {
  const rows = await db.select().from(schema.projects).orderBy(asc(schema.projects.sort), desc(schema.projects.year));
  return (
    <>
      <header className="adm-head">
        <h1>Projects</h1>
        <Link href="/admin/projects/new" className="adm-btn primary">New project</Link>
      </header>
      <table className="adm-table">
        <thead><tr><th>Order</th><th>Title</th><th>Year</th><th>Status</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="mono">{r.sort}</td>
              <td><Link href={`/admin/projects/${r.id}`}><span className="adm-swatch" style={{ background: r.tint }} />{r.title}</Link></td>
              <td>{r.year}</td>
              <td>{r.published ? "Published" : <span className="muted">Hidden</span>}</td>
            </tr>
          ))}
          {rows.length === 0 ? <tr><td colSpan={4} className="muted">No projects yet.</td></tr> : null}
        </tbody>
      </table>
    </>
  );
}
