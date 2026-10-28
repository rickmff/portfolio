import { Arrow } from "@/components/Arrow";
import type { Metadata } from "next";
import Link from "@/components/LocaleLink";
import { BookShelf } from "@/components/BookShelf";
import { HeroLines } from "@/components/HeroLines";
import { WorkStrip } from "@/components/WorkStrip";
import { ScrollCue } from "@/components/ScrollCue";
import { HideAtTop } from "@/components/HideAtTop";
import { WritingList } from "@/components/WritingList";
import { GitHubActivity } from "@/components/GitHubActivity";
import { Suspense } from "react";
import { fillShelf, readAndReading, toShelfBook } from "@/lib/books";
import { getBooks, getPublishedPosts, getPublishedProjects, getSettings } from "@/lib/data";
import { getDict } from "@/lib/i18n/server";
import { metaFor } from "@/lib/seo";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const [meta, s] = await Promise.all([metaFor({ path: "/", type: "profile" }), getSettings()]);
  // Absolute, or the layout's template would append the name a second time.
  return { ...meta, title: { absolute: `${s.name} — ${s.role}` } };
}

export default async function Home() {
  const [settings, projects, books, posts, t] = await Promise.all([
    getSettings(),
    getPublishedProjects(),
    getBooks(),
    getPublishedPosts(6),
    getDict(),
  ]);

  // The latest books, as many as fill one shelf: the current book first, then the most recently read.
  const shelf = fillShelf(readAndReading(books));

  return (
    <>
      <section className="wrap hero">
        <p className="eyebrow hero-in" style={{ margin: 0 }}>{settings.role}</p>
        <HeroLines text={settings.hero} />
        {settings.heroBy ? (
          <p className="hero-by hero-after">
            —{" "}
            {settings.heroByUrl ? (
              <a href={settings.heroByUrl} target="_blank" rel="noopener noreferrer" className="link-muted">
                {settings.heroBy}
              </a>
            ) : (
              settings.heroBy
            )}
          </p>
        ) : null}
        {settings.now ? (
          <p className="muted hero-after" style={{ margin: "48px auto 0", maxWidth: 420, fontSize: 13 }}>
            {t.home.now} — {settings.now}
          </p>
        ) : null}
        {projects.length ? <ScrollCue href="#work-strip" label={t.home.latestWork} /> : null}
      </section>

      <section id="work" className="section">
        <div className="wrap section-head center">
          <HideAtTop>{t.home.latestWork}</HideAtTop>
        </div>
        <div id="work-strip">
          <WorkStrip projects={projects} hideAtTop />
        </div>
      </section>

      {shelf.length ? (
        <section id="books" className="wrap section" data-sr-delay="120">
          <div className="section-head center">
            <h2>{t.home.recentlyRead}</h2>
          </div>
          <BookShelf
            shelves={[{ books: shelf.map(toShelfBook) }]}
            initialOpen={shelf[0].id}
            centered
          />
          <p className="section-more">
            <Link href="/books" className="link-muted with-arrow">{t.home.allBooks} <Arrow /></Link>
          </p>
        </section>
      ) : null}

      <section id="writing" className="wrap section" style={{ maxWidth: 720 }} data-sr-delay="280">
        <div className="section-head center">
          <h2>{t.home.writing}</h2>
        </div>
        <WritingList posts={posts} t={t} />
        <p className="section-more">
          <Link href="/blog" className="link-muted with-arrow">{t.home.allWriting} <Arrow /></Link>
        </p>
      </section>

      {settings.github ? (
        <Suspense fallback={null}>
          <GitHubActivity url={settings.github} t={t} />
        </Suspense>
      ) : null}
    </>
  );
}
