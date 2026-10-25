import type { Metadata } from "next";
import Link from "@/components/LocaleLink";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { getPublishedProjects, getSettings } from "@/lib/data";
import { getDict, getLocale } from "@/lib/i18n/server";
import { renderMarkdown } from "@/lib/markdown";
import { breadcrumbs, localeUrl, metaFor, PERSON_ID, PROFILE_IMAGE } from "@/lib/seo";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  return metaFor({ title: (await getDict()).about.eyebrow, path: "/about", type: "profile", image: PROFILE_IMAGE });
}

export default async function AboutPage() {
  const [settings, t, projects, locale] = await Promise.all([getSettings(), getDict(), getPublishedProjects(), getLocale()]);
  if (!settings.about) notFound();
  // Projects sit between Experience and Awards, listed like the awards: a quiet link that shows
  // the project's frame on hover.
  const [before, after = ""] = settings.about.split(/^(?=## Awards\b)/m);
  const list = projects.length ? (
    <>
      <h2>{t.about.projects}</h2>
      <ul>
        {projects.map((p) => {
          const preview = p.showcasePosterUrl || p.coverUrl;
          return (
            <li key={p.slug}>
              <strong>
                <Link href={`/work/${p.slug}`} className="has-preview">
                  {p.title}
                  {preview && (
                    <span className="link-preview" aria-hidden="true">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview} alt="" loading="lazy" />
                    </span>
                  )}
                </Link>
              </strong>{" "}
              ({p.year}){p.summary && <> — {p.summary}</>}
            </li>
          );
        })}
      </ul>
    </>
  ) : null;
  return (
    <article className="section">
      <JsonLd
        graph={[
          {
            "@type": "ProfilePage",
            "@id": localeUrl(locale, "/about"),
            url: localeUrl(locale, "/about"),
            inLanguage: locale === "pt" ? "pt-BR" : "en",
            name: `${t.about.eyebrow} — ${settings.name}`,
            mainEntity: { "@id": PERSON_ID },
            about: { "@id": PERSON_ID },
          },
          breadcrumbs(locale, [{ name: settings.name, path: "/" }, { name: t.about.eyebrow, path: "/about" }]),
        ]}
      />
      <header className="wrap page-title reveal">
        <p className="eyebrow" style={{ margin: 0 }}>{t.about.eyebrow}</p>
        <h1>{settings.name}</h1>
        {settings.cv && (
          <a className="cv-button" href={settings.cv} download={`${settings.name.replace(/\s+/g, "-")}-CV.pdf`}>
            {t.about.cv}
            <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
              <path d="M8 2v9m0 0L4.5 7.5M8 11l3.5-3.5M3 14h10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        )}
      </header>
      <div className="wrap">
        <div className="prose about">
          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(before) }} />
          {list}
          {after && <div dangerouslySetInnerHTML={{ __html: renderMarkdown(after) }} />}
        </div>
      </div>
    </article>
  );
}
