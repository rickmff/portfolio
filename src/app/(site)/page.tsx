import Link from "next/link";
import { BookStage } from "@/components/BookStage";
import { Emphasis } from "@/components/SiteChrome";
import { WorkStrip } from "@/components/WorkStrip";
import { WritingList } from "@/components/WritingList";
import { onShelf, toStageBook } from "@/lib/books";
import { getBooks, getPublishedPosts, getPublishedProjects, getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [settings, projects, books, posts] = await Promise.all([
    getSettings(),
    getPublishedProjects(),
    getBooks(),
    getPublishedPosts(6),
  ]);

  return (
    <>
      <section className="wrap hero reveal">
        <p className="eyebrow" style={{ margin: 0 }}>{settings.role}</p>
        <h1>
          <Emphasis text={settings.hero} />
        </h1>
        <span className="dot" aria-hidden="true" />
        {settings.now ? (
          <p className="muted" style={{ margin: "40px auto 0", maxWidth: 420, fontSize: 13 }}>
            Now — {settings.now}
          </p>
        ) : null}
      </section>

      <section id="work" className="section">
        <div className="wrap section-head">
          <h2>Selected work</h2>
          {projects.length > 2 ? <span className="mono" style={{ color: "var(--muted)" }}>Scroll →</span> : null}
        </div>
        <WorkStrip projects={projects} />
      </section>

      {books.some(onShelf) ? (
        <section id="books" className="wrap section">
          <div className="section-head center">
            <h2>On the shelf</h2>
          </div>
          <BookStage books={books.filter(onShelf).map(toStageBook)} />
          <p style={{ textAlign: "center", margin: "32px 0 0", fontSize: 13 }}>
            <Link href="/books" className="link-muted">All books →</Link>
          </p>
        </section>
      ) : null}

      <section id="writing" className="wrap section" style={{ maxWidth: 720 }}>
        <div className="section-head center">
          <h2>Writing</h2>
        </div>
        <WritingList posts={posts} />
        <p style={{ textAlign: "center", margin: "32px 0 0", fontSize: 13 }}>
          <Link href="/blog" className="link-muted">All writing →</Link>
        </p>
      </section>
    </>
  );
}
