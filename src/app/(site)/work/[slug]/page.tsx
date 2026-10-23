import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject } from "@/lib/data";
import { getDict } from "@/lib/i18n/server";
import { renderMarkdown } from "@/lib/markdown";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProject((await params).slug);
  return p ? { title: p.title, description: p.summary } : {};
}

export default async function ProjectPage({ params }: Props) {
  const p = await getProject((await params).slug);
  if (!p) notFound();
  const t = await getDict();
  return (
    <article className="section">
      <header className="wrap page-title reveal">
        <p className="eyebrow" style={{ margin: 0 }}>{p.year}{p.stack ? ` · ${p.stack}` : ""}</p>
        <h1>{p.title}</h1>
        {p.summary ? <p className="muted" style={{ maxWidth: 520, margin: "24px auto 0" }}>{p.summary}</p> : null}
        <p style={{ display: "flex", gap: 24, justifyContent: "center", margin: "28px 0 0", fontSize: 13 }}>
          {p.liveUrl ? <a href={p.liveUrl} className="link-muted">{t.work.visit}</a> : null}
          {p.repoUrl ? <a href={p.repoUrl} className="link-muted">{t.work.source}</a> : null}
        </p>
      </header>
      <div className="wrap">
        <div className="frame" style={{ aspectRatio: "16 / 9", background: p.tint, marginBottom: 80 }}>
          {p.coverUrl ? <Image src={p.coverUrl} alt={p.title} fill sizes="(max-width: 1100px) 100vw, 1000px" priority /> : null}
        </div>
        <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(p.body) }} />
        <p className="prose" style={{ marginTop: 80, fontSize: 13 }}>
          <Link href="/#work" className="link-muted">{t.work.all}</Link>
        </p>
      </div>
    </article>
  );
}
