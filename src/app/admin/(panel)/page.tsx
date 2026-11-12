import { count, eq } from "drizzle-orm";
import Link from "next/link";
import { Icon, type IconName } from "@/components/admin/Icon";
import { db, schema } from "@/db";

export default async function Overview() {
  const [[p], [b], [reading], [po], [drafts]] = await Promise.all([
    db.select({ n: count() }).from(schema.projects),
    db.select({ n: count() }).from(schema.books),
    db.select({ n: count() }).from(schema.books).where(eq(schema.books.status, "reading")),
    db.select({ n: count() }).from(schema.posts).where(eq(schema.posts.published, true)),
    db.select({ n: count() }).from(schema.posts).where(eq(schema.posts.published, false)),
  ]);
  const cards: { label: string; value: number; sub?: string; href: string; cta: string; ctaHref: string; icon: IconName }[] = [
    { label: "Projects", value: p.n, href: "/admin/projects", cta: "New project", ctaHref: "/admin/projects/new", icon: "grid" },
    { label: "Books", value: b.n, sub: `${reading.n} reading`, href: "/admin/books", cta: "Add book", ctaHref: "/admin/books/new", icon: "book" },
    { label: "Published posts", value: po.n, sub: `${drafts.n} drafts`, href: "/admin/posts", cta: "Write post", ctaHref: "/admin/posts/new", icon: "pen" },
  ];
  return (
    <div className="adm-page adm-page-wide">
      <header className="adm-head"><h1 className="adm-title adm-title-static">Overview</h1></header>
      <div className="adm-cards">
        {cards.map((c) => (
          <div key={c.label} className="adm-card">
            <Link href={c.href} className="adm-card-main">
              <span className="adm-card-label"><Icon name={c.icon} /> {c.label}</span>
              <strong>{c.value}</strong>
              {c.sub ? <span className="muted">{c.sub}</span> : null}
            </Link>
            <Link href={c.ctaHref} className="adm-ghost"><Icon name="plus" size={14} /> {c.cta}</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
