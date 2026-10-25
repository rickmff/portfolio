// Fills an empty database with sample content so the site has something to show,
// and backfills book covers and book pages on every boot.
import { db, schema } from "../src/db";
import { importBooks, syncBookCovers, syncBookPages, syncQuotes, syncTranslations } from "./import-books";

async function main() {
  const covers = await syncBookCovers();
  if (covers) console.log(`books: added ${covers} covers`);

  const existing = await db.select().from(schema.projects).limit(1);
  if (existing.length) {
    const pages = await syncBookPages();
    if (pages) console.log(`books: filled ${pages} synopsis/notes/link fields`);
    const translated = await syncTranslations();
    if (translated) console.log(`books: added translations to ${translated} books`);
    const quoted = await syncQuotes();
    if (quoted) console.log(`books: added quotes to ${quoted} books`);
    console.log("database already has content, skipping seed");
    process.exit(0);
  }

  await db.insert(schema.projects).values([
    { slug: "saas-product", title: "[SaaS product]", summary: "My own product, built and run solo.", year: 2026, stack: "Next.js · Postgres · Stripe", tint: "#F1F0EB", sort: 1, body: "## The problem\n\n[Describe the problem.]\n\n## What I built\n\n[Describe the solution.]" },
    { slug: "vps-stack", title: "Self‑hosted VPS stack", summary: "Deploys, backups and monitoring on one box.", year: 2025, stack: "Docker · Caddy · Grafana", tint: "#ECEEF0", sort: 2, body: "[Write the case study.]" },
    { slug: "portfolio", title: "Portfolio & backoffice", summary: "This site, with an admin built for an audience of one.", year: 2026, stack: "Next.js · Drizzle · CSS 3D", tint: "#F3EEEA", sort: 3, body: "[Write the case study.]" },
    { slug: "client-project", title: "[Client project]", summary: "[One line on the problem you solved.]", year: 2025, stack: "React · Node", tint: "#EEF0EC", sort: 4 },
    { slug: "open-source", title: "[Open‑source library]", summary: "[One line on what it does.]", year: 2024, stack: "TypeScript", tint: "#F1F0EB", sort: 5 },
  ]);

  console.log(`books: ${await importBooks()} imported from Notion export`);
  await syncBookCovers();
  await syncBookPages();
  await syncTranslations();
  await syncQuotes();

  const day = 86_400_000;
  await db.insert(schema.posts).values([
    { slug: "hello-world", title: "Hello, world", excerpt: "Why I rebuilt my site from scratch.", body: "This is a sample post. Edit or delete it with the portfolio-content skill.\n\n## A heading\n\nSome **markdown** with `code`.", tags: "meta", published: true, publishedAt: new Date(Date.now() - day) },
    { slug: "draft-post", title: "A draft you can finish", excerpt: "", body: "Drafts stay hidden until you publish them.", published: false },
  ]);

  console.log("seeded");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
