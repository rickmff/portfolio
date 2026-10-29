import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { WritingList } from "@/components/WritingList";
import { getPublishedPosts } from "@/lib/data";
import { getDict, getLocale } from "@/lib/i18n/server";
import { localeUrl, metaFor, PERSON_ID } from "@/lib/seo";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const t = await getDict();
  return metaFor({ title: t.blog.eyebrow, description: t.blog.title, path: "/blog" });
}

export default async function BlogPage() {
  const [posts, t, locale] = await Promise.all([getPublishedPosts(), getDict(), getLocale()]);
  return (
    <>
      <JsonLd
        graph={[
          {
            "@type": "Blog",
            "@id": localeUrl(locale, "/blog"),
            url: localeUrl(locale, "/blog"),
            inLanguage: locale === "pt" ? "pt-BR" : "en",
            name: t.blog.eyebrow,
            description: t.blog.title,
            author: { "@id": PERSON_ID },
            blogPost: posts.map((p) => ({
              "@type": "BlogPosting",
              headline: p.title,
              url: localeUrl(locale, `/blog/${p.slug}`),
              datePublished: p.publishedAt?.toISOString(),
              author: { "@id": PERSON_ID },
            })),
          },
        ]}
      />
      <section className="wrap page-title reveal">
        <p className="eyebrow" style={{ margin: 0 }} aria-hidden="true">{t.blog.eyebrow}</p>
        <h1 className="sr-only">{t.blog.eyebrow}</h1>
      </section>
      <section className="wrap section" style={{ maxWidth: 720 }}>
        <WritingList posts={posts} t={t} />
      </section>
    </>
  );
}
