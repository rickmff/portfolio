import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { getSettings } from "@/lib/data";
import { getDict } from "@/lib/i18n/server";
import { renderMarkdown } from "@/lib/markdown";
import { breadcrumbs, metaFor, PERSON_ID, PROFILE_IMAGE, SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  return metaFor({ title: (await getDict()).about.eyebrow, path: "/about", type: "profile", image: PROFILE_IMAGE });
}

export default async function AboutPage() {
  const [settings, t] = await Promise.all([getSettings(), getDict()]);
  if (!settings.about) notFound();
  return (
    <article className="section">
      <JsonLd
        graph={[
          {
            "@type": "ProfilePage",
            "@id": `${SITE_URL}/about`,
            url: `${SITE_URL}/about`,
            name: `${t.about.eyebrow} — ${settings.name}`,
            mainEntity: { "@id": PERSON_ID },
            about: { "@id": PERSON_ID },
          },
          breadcrumbs([{ name: settings.name, path: "/" }, { name: t.about.eyebrow, path: "/about" }]),
        ]}
      />
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
