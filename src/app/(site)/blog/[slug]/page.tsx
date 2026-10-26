import { Arrow } from "@/components/Arrow";
import type { Metadata } from "next";
import Image from "next/image";
import { JsonLd } from "@/components/JsonLd";
import Link from "@/components/LocaleLink";
import { notFound } from "next/navigation";
import { getPost, getSettings } from "@/lib/data";
import { getDict, getLocale } from "@/lib/i18n/server";
import { readingMinutes, renderMarkdown } from "@/lib/markdown";
import { absoluteUrl, breadcrumbs, localeUrl, metaFor, PERSON_ID, WEBSITE_ID } from "@/lib/seo";

const tagList = (tags: string) =>
  tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) return {};
  return metaFor({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    image: post.bannerUrl,
    type: "article",
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
    tags: tagList(post.tags),
  });
}

export default async function PostPage({ params }: Props) {
  const post = await getPost((await params).slug);
  if (!post) notFound();
  const [t, settings, locale] = await Promise.all([getDict(), getSettings(), getLocale()]);
  const url = localeUrl(locale, `/blog/${post.slug}`);
  const minutes = readingMinutes(post.body);
  const date = new Intl.DateTimeFormat(t.intl, { day: "numeric", month: "long", year: "numeric" });
  return (
    <article className="section">
      <JsonLd
        graph={[
          {
            "@type": "BlogPosting",
            "@id": `${url}#article`,
            url,
            mainEntityOfPage: url,
            headline: post.title,
            description: post.excerpt,
            ...(post.bannerUrl && { image: absoluteUrl(post.bannerUrl) }),
            datePublished: post.publishedAt?.toISOString(),
            dateModified: post.updatedAt.toISOString(),
            inLanguage: locale === "pt" ? "pt-BR" : "en",
            keywords: tagList(post.tags),
            wordCount: post.body.split(/\s+/).filter(Boolean).length,
            timeRequired: `PT${minutes}M`,
            author: { "@id": PERSON_ID },
            publisher: { "@id": PERSON_ID },
            isPartOf: [{ "@id": localeUrl(locale, "/blog") }, { "@id": WEBSITE_ID }],
          },
          breadcrumbs(locale, [
            { name: settings.name, path: "/" },
            { name: t.blog.eyebrow, path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        ]}
      />
      <header className="wrap page-title reveal">
        <p className="eyebrow" style={{ margin: 0 }}>
          {date.format(post.publishedAt!)} · {t.blog.minRead(minutes)}
        </p>
        <h1>{post.title}</h1>
      </header>
      {post.bannerUrl ? (
        <div className="wrap post-banner reveal">
          <div className="post-banner-frame">
            <Image src={post.bannerUrl} alt="" fill sizes="(max-width: 1080px) 100vw, 1000px" priority />
          </div>
        </div>
      ) : null}
      <div className="wrap">
        <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }} />
        <p className="prose" style={{ marginTop: 80, fontSize: 13 }}>
          <Link href="/blog" className="link-muted with-arrow"><Arrow dir="left" /> {t.blog.all}</Link>
        </p>
      </div>
    </article>
  );
}
