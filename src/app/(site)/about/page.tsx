import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSettings } from "@/lib/data";
import { getDict } from "@/lib/i18n/server";
import { renderMarkdown } from "@/lib/markdown";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).about.eyebrow };
}

export default async function AboutPage() {
  const [settings, t] = await Promise.all([getSettings(), getDict()]);
  if (!settings.about) notFound();
  return (
    <article className="section">
      <header className="wrap page-title reveal">
        <p className="eyebrow" style={{ margin: 0 }}>{t.about.eyebrow}</p>
        <h1>{settings.name}</h1>
      </header>
      <div className="wrap">
        <div className="prose about" dangerouslySetInnerHTML={{ __html: renderMarkdown(settings.about) }} />
      </div>
    </article>
  );
}
