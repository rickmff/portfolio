import { Arrow } from "@/components/Arrow";
import { CursorArrow } from "@/components/CursorArrow";
import { ProjectCover } from "@/components/ProjectCover";
import { WorkStrip } from "@/components/WorkStrip";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProject, getPublishedProjects } from "@/lib/data";
import { getDict } from "@/lib/i18n/server";
import { renderMarkdown } from "@/lib/markdown";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProject((await params).slug);
  return p ? { title: p.title, description: p.summary } : {};
}

export default async function ProjectPage({ params }: Props) {
  const [p, all, t] = await Promise.all([getProject((await params).slug), getPublishedProjects(), getDict()]);
  if (!p) notFound();
  // The landing's carousel, without the project on this page.
  const others = all.filter((o) => o.id !== p.id);
  return (
    <article className="section">
      <header className="wrap page-title reveal">
        <p className="eyebrow" style={{ margin: 0 }}>{p.year}</p>
        <h1>{p.title}</h1>
        {p.summary ? <p className="muted" style={{ maxWidth: 520, margin: "24px auto 0" }}>{p.summary}</p> : null}
        <p style={{ display: "flex", gap: 24, justifyContent: "center", margin: "28px 0 0", fontSize: 13 }}>
          {p.liveUrl ? <a href={p.liveUrl} className="link-muted with-arrow">{t.work.visit} <Arrow dir="out" /></a> : null}
          {p.repoUrl ? <a href={p.repoUrl} className="link-muted with-arrow">{t.work.source} <Arrow dir="out" /></a> : null}
        </p>
      </header>
      <div className="wrap">
        <ProjectCover
          poster={p.showcasePosterUrl || p.coverUrl}
          video={p.showcaseUrl || (p.previewUrl && /\.(mp4|webm|mov)(\?|$)/i.test(p.previewUrl) ? p.previewUrl : null)}
          title={p.title}
          tint={p.tint}
        />
        <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(p.body) }} />
      </div>
      {others.length ? (
        <section id="more-work" style={{ marginTop: 160 }}>
          <div className="wrap section-head center">
            <h2>{t.work.more}</h2>
          </div>
          <div id="more-work-strip">
            <WorkStrip projects={others} />
          </div>
          <CursorArrow section="#more-work" strip="#more-work-strip" />
        </section>
      ) : null}
    </article>
  );
}
