// Fills an empty database with sample content so the site has something to show.
import { db, schema } from "../src/db";

async function main() {
  const existing = await db.select().from(schema.projects).limit(1);
  if (existing.length) {
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

  await db.insert(schema.books).values([
    { title: "Shape Up", author: "Ryan Singer", status: "reading", color: "#1F3A5F", ink: "#FFFFFF", thickness: 30, sort: 1 },
    { title: "Designing Data‑Intensive Applications", author: "Martin Kleppmann", status: "read", finishedYear: 2025, rating: 5, color: "#E5484D", ink: "#FFFFFF", thickness: 56, sort: 2 },
    { title: "Refactoring UI", author: "Adam Wathan & Steve Schoger", status: "read", finishedYear: 2024, rating: 5, color: "#F1F0EB", ink: "#0A0A0A", thickness: 22, sort: 3 },
    { title: "The Design of Everyday Things", author: "Don Norman", status: "read", finishedYear: 2023, rating: 5, color: "#E8C547", ink: "#0A0A0A", thickness: 36, sort: 4 },
    { title: "A Philosophy of Software Design", author: "John Ousterhout", status: "read", finishedYear: 2025, rating: 4, color: "#0A0A0A", ink: "#F1F0EB", thickness: 24, sort: 5 },
    { title: "Thinking in Systems", author: "Donella Meadows", status: "next", color: "#7C8B6F", ink: "#FFFFFF", thickness: 28, sort: 6 },
  ]);

  const day = 86_400_000;
  await db.insert(schema.posts).values([
    { slug: "hello-world", title: "Hello, world", excerpt: "Why I rebuilt my site from scratch.", body: "This is a sample post. Edit or delete it in the backoffice.\n\n## A heading\n\nSome **markdown** with `code`.", tags: "meta", published: true, publishedAt: new Date(Date.now() - day) },
    { slug: "draft-post", title: "A draft you can finish", excerpt: "", body: "Drafts stay hidden until you publish them.", published: false },
  ]);

  console.log("seeded");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
