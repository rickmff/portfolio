import { count, eq } from "drizzle-orm";
import Link from "next/link";
import { db, schema } from "@/db";

export default async function Overview() {
  const [[p], [b], [reading], [po], [drafts]] = await Promise.all([
    db.select({ n: count() }).from(schema.projects),
    db.select({ n: count() }).from(schema.books),
    db.select({ n: count() }).from(schema.books).where(eq(schema.books.status, "reading")),
    db.select({ n: count() }).from(schema.posts).where(eq(schema.posts.published, true)),
    db.select({ n: count() }).from(schema.posts).where(eq(schema.posts.published, false)),
  ]);
  const cards = [
    { label: "Projects", value: p.n, href: "/admin/projects", cta: "New project", ctaHref: "/admin/projects/new" },
    { label: "Books", value: b.n, sub: `${reading.n} reading`, href: "/admin/books", cta: "Add book", ctaHref: "/admin/books/new" },
    { label: "Published posts", value: po.n, sub: `${drafts.n} drafts`, href: "/admin/posts", cta: "Write post", ctaHref: "/admin/posts/new" },
  ];
  return (
    <>
      <header className="adm-head"><h1>Overview</h1></header>
      <div className="adm-cards">
        {cards.map((c) => (
          <div key={c.label} className="adm-card">
            <Link href={c.href} className="adm-card-main">
              <span className="eyebrow">{c.label}</span>
              <strong>{c.value}</strong>
              {c.sub ? <span className="muted">{c.sub}</span> : null}
            </Link>
            <Link href={c.ctaHref} className="adm-btn">{c.cta}</Link>
          </div>
        ))}
      </div>
    </>
  );
}
