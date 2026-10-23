import Link from "next/link";
import { BookShelf } from "@/components/BookShelf";
import { HeroLines } from "@/components/HeroLines";
import { WorkStrip } from "@/components/WorkStrip";
import { WritingList } from "@/components/WritingList";
import { latestRead, toShelfBook } from "@/lib/books";
import { getBooks, getPublishedPosts, getPublishedProjects, getSettings } from "@/lib/data";
import { getDict } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [settings, projects, books, posts, t] = await Promise.all([
    getSettings(),
    getPublishedProjects(),
    getBooks(),
    getPublishedPosts(6),
    getDict(),
  ]);

  const shelf = latestRead(books);

  return (
    <>
      <section className="wrap hero">
        <p className="eyebrow hero-in" style={{ margin: 0 }}>{settings.role}</p>
        <HeroLines text={settings.hero} />
        {settings.now ? (
          <p className="muted hero-after" style={{ margin: "48px auto 0", maxWidth: 420, fontSize: 13 }}>
            {t.home.now} — {settings.now}
          </p>
        ) : null}
        {projects.length ? (
          <a href="#work" className="scroll-cue hero-after" aria-label={t.home.latestWork}>
            <svg width="14" height="22" viewBox="0 0 14 22" fill="none" aria-hidden="true">
              <path d="M7 1v19M1 14l6 6 6-6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        ) : null}
      </section>

      <section id="work" className="section">
        <div className="wrap section-head center">
          <h2>{t.home.latestWork}</h2>
        </div>
        <WorkStrip projects={projects} />
      </section>

      {shelf.length ? (
        <section id="books" className="wrap section">
          <div className="section-head center">
            <h2>{t.home.recentlyRead}</h2>
          </div>
          <BookShelf
            shelves={[{ books: shelf.map(toShelfBook) }]}
            initialOpen={shelf[0].id}
            centered
          />
          <p style={{ textAlign: "center", margin: "32px 0 0", fontSize: 13 }}>
            <Link href="/books" className="link-muted">{t.home.allBooks}</Link>
          </p>
        </section>
      ) : null}

      <section id="writing" className="wrap section" style={{ maxWidth: 720 }}>
        <div className="section-head center">
          <h2>{t.home.writing}</h2>
        </div>
        <WritingList posts={posts} t={t} />
        <p style={{ textAlign: "center", margin: "32px 0 0", fontSize: 13 }}>
          <Link href="/blog" className="link-muted">{t.home.allWriting}</Link>
        </p>
      </section>
    </>
  );
}
