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
        <span className="hero-after">
          <span className="dot" aria-hidden="true" />
        </span>
        {settings.now ? (
          <p className="muted hero-after" style={{ margin: "40px auto 0", maxWidth: 420, fontSize: 13 }}>
            {t.home.now} — {settings.now}
          </p>
        ) : null}
      </section>

      <section id="work" className="section">
        <div className="wrap section-head">
          <h2>{t.home.selectedWork}</h2>
          {projects.length > 2 ? <span className="mono" style={{ color: "var(--muted)" }}>{t.home.scroll}</span> : null}
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
