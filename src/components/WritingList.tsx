import Link from "next/link";
import type { Post } from "@/db/schema";

const month = new Intl.DateTimeFormat("en", { month: "short" });

export function WritingList({ posts }: { posts: Post[] }) {
  const byYear = new Map<number, Post[]>();
  for (const p of posts) {
    const y = p.publishedAt!.getFullYear();
    byYear.set(y, [...(byYear.get(y) ?? []), p]);
  }
  if (posts.length === 0) return <p className="muted" style={{ textAlign: "center" }}>Nothing published yet.</p>;
  return (
    <div>
      {[...byYear.entries()].map(([year, list]) => (
        <div key={year} className="year-row">
          <span className="mono" style={{ color: "var(--faint)", paddingTop: 4 }}>{year}</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {list.map((p) => (
              <Link key={p.id} href={`/blog/${p.slug}`} className="post-link">
                <span className="dash" />
                <span style={{ flex: 1 }}>{p.title}</span>
                <span className="mono" style={{ color: "var(--faint)" }}>{month.format(p.publishedAt!)}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
