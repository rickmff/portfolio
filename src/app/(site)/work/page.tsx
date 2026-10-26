import type { Metadata } from "next";
import { ProjectGallery } from "@/components/ProjectGallery";
import { getPublishedProjects } from "@/lib/data";
import { getDict } from "@/lib/i18n/server";
import { metaFor } from "@/lib/seo";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const t = await getDict();
  return metaFor({ title: t.work.eyebrow, description: t.work.title, path: "/work" });
}

export default async function WorkPage() {
  const [projects, t] = await Promise.all([getPublishedProjects(), getDict()]);
  return (
    <>
      <section className="wrap page-title reveal">
        <p className="eyebrow" style={{ margin: 0 }}>{t.work.eyebrow}</p>
        <h1>{t.work.title}</h1>
      </section>
      <section className="wrap section">
        {projects.length ? (
          <ProjectGallery
            projects={projects.map((p) => ({
              slug: p.slug,
              title: p.title,
              year: p.year,
              summary: p.summary,
              image: p.showcasePosterUrl || p.coverUrl,
              video: p.showcaseUrl || p.previewUrl,
              tint: p.tint,
            }))}
          />
        ) : (
          <p className="muted">{t.home.noProjects}</p>
        )}
      </section>
    </>
  );
}
