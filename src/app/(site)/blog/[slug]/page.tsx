import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost } from "@/lib/data";
import { readingMinutes, renderMarkdown } from "@/lib/markdown";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost((await params).slug);
  return post ? { title: post.title, description: post.excerpt } : {};
}

const date = new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric" });

export default async function PostPage({ params }: Props) {
  const post = await getPost((await params).slug);
  if (!post) notFound();
  return (
    <article className="section">
      <header className="wrap page-title reveal">
        <p className="eyebrow" style={{ margin: 0 }}>
          {date.format(post.publishedAt!)} · {readingMinutes(post.body)} min read
        </p>
        <h1>{post.title}</h1>
      </header>
      <div className="wrap">
        <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }} />
        <p className="prose" style={{ marginTop: 80, fontSize: 13 }}>
          <Link href="/blog" className="link-muted">← All writing</Link>
        </p>
      </div>
    </article>
  );
}
