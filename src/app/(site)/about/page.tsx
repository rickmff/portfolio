import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSettings } from "@/lib/data";
import { renderMarkdown } from "@/lib/markdown";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "About" };

export default async function AboutPage() {
  const settings = await getSettings();
  if (!settings.about) notFound();
  return (
    <article className="section">
      <header className="wrap page-title reveal">
        <p className="eyebrow" style={{ margin: 0 }}>About</p>
        <h1>{settings.name}</h1>
      </header>
      <div className="wrap">
        <div className="prose about" dangerouslySetInnerHTML={{ __html: renderMarkdown(settings.about) }} />
      </div>
    </article>
  );
}
