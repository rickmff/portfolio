import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { WritingList } from "@/components/WritingList";
import { getPublishedPosts } from "@/lib/data";
import { getDict } from "@/lib/i18n/server";
import { absoluteUrl, metaFor, PERSON_ID, SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const t = await getDict();
  return metaFor({ title: t.blog.eyebrow, description: t.blog.title, path: "/blog" });
}

export default async function BlogPage() {
  const [posts, t] = await Promise.all([getPublishedPosts(), getDict()]);
  return (
    <>
      <JsonLd
        graph={[
          {
            "@type": "Blog",
            "@id": `${SITE_URL}/blog`,
            url: `${SITE_URL}/blog`,
            name: t.blog.eyebrow,
            description: t.blog.title,
            author: { "@id": PERSON_ID },
            blogPost: posts.map((p) => ({
              "@type": "BlogPosting",
              headline: p.title,
              url: absoluteUrl(`/blog/${p.slug}`),
              datePublished: p.publishedAt?.toISOString(),
              author: { "@id": PERSON_ID },
            })),
          },
        ]}
      />
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
