import type { Metadata } from "next";
import { WritingList } from "@/components/WritingList";
import { getPublishedPosts } from "@/lib/data";
import { getDict } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).blog.eyebrow };
}

export default async function BlogPage() {
  const [posts, t] = await Promise.all([getPublishedPosts(), getDict()]);
  return (
    <>
      <section className="wrap page-title reveal">
        <p className="eyebrow" style={{ margin: 0 }}>{t.blog.eyebrow}</p>
        <h1>{t.blog.title}</h1>
      </section>
      <section className="wrap section" style={{ maxWidth: 720 }}>
        <WritingList posts={posts} t={t} />
      </section>
    </>
  );
}
