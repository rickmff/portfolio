import type { MetadataRoute } from "next";
import { bookHref } from "@/lib/books";
import { getBooks, getPublishedPosts, getPublishedProjects } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.SITE_URL ?? "http://localhost:3000";
  const [projects, posts, books] = await Promise.all([getPublishedProjects(), getPublishedPosts(), getBooks()]);
  return [
    { url: site },
    { url: `${site}/books` },
    { url: `${site}/blog` },
    { url: `${site}/harness` },
    ...projects.map((p) => ({ url: `${site}/work/${p.slug}`, lastModified: p.updatedAt })),
    ...books.map((b) => ({ url: `${site}${bookHref(b)}`, lastModified: b.updatedAt })),
    ...posts.map((p) => ({ url: `${site}/blog/${p.slug}`, lastModified: p.updatedAt })),
  ];
}
