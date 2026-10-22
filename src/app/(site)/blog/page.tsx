import type { Metadata } from "next";
import { WritingList } from "@/components/WritingList";
import { getPublishedPosts } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Writing" };

export default async function BlogPage() {
  const posts = await getPublishedPosts();
  return (
    <>
      <section className="wrap page-title reveal">
        <p className="eyebrow" style={{ margin: 0 }}>Writing</p>
        <h1>Notes on software, products and self‑hosting.</h1>
      </section>
      <section className="wrap section" style={{ maxWidth: 720 }}>
        <WritingList posts={posts} />
      </section>
    </>
  );
}
