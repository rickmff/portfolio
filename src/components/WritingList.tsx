import type { CSSProperties } from "react";
import type { Post } from "@/db/schema";
import type { Dict } from "@/lib/i18n/dict";
import { readingMinutes } from "@/lib/markdown";
import { PostLink } from "./PostLink";

export function WritingList({ posts, t }: { posts: Post[]; t: Dict }) {
  const month = new Intl.DateTimeFormat(t.intl, { month: "short" });
  const day = new Intl.DateTimeFormat(t.intl, { day: "numeric", month: "short", year: "numeric" });
  const byYear = new Map<number, Post[]>();
  for (const p of posts) {
    const y = p.publishedAt!.getFullYear();
    byYear.set(y, [...(byYear.get(y) ?? []), p]);
  }
  // Running position across the year rows, so the posts cascade in one after another.
  let n = 0;
  if (posts.length === 0) return <p className="muted" style={{ textAlign: "center" }}>{t.blog.empty}</p>;
  return (
    <div>
      {[...byYear.entries()].map(([year, list]) => (
        <div key={year} className="year-row">
          <span className="mono" style={{ color: "var(--faint)", paddingTop: 4 }}>{year}</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {list.map((p) => (
              <div key={p.id} className="post-row" style={{ "--i": Math.min(n++, 12) } as CSSProperties}>
              <PostLink
                href={`/blog/${p.slug}`}
                title={p.title}
                month={month.format(p.publishedAt!)}
                banner={p.bannerUrl}
                meta={`${t.blog.minRead(readingMinutes(p.body))} · ${day.format(p.publishedAt!)}`}
                excerpt={p.excerpt}
              />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
