import type { MetadataRoute } from "next";
import { bookHref } from "@/lib/books";
import { getBooks, getPublishedPosts, getPublishedProjects, getSettings } from "@/lib/data";
import { SITE_URL as site } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, posts, books, settings] = await Promise.all([
    getPublishedProjects(),
    getPublishedPosts(),
    getBooks(),
    getSettings(),
  ]);
  const latest = (rows: { updatedAt: Date }[]) =>
    rows.reduce<Date | undefined>((max, r) => (!max || r.updatedAt > max ? r.updatedAt : max), undefined);
  return [
    { url: site, lastModified: latest([...projects, ...posts]), priority: 1 },
    ...(settings.about ? [{ url: `${site}/about`, priority: 0.9 }] : []),
    { url: `${site}/blog`, lastModified: latest(posts), priority: 0.8 },
    { url: `${site}/books`, lastModified: latest(books) },
    { url: `${site}/quotes`, lastModified: latest(books) },
    { url: `${site}/harness` },
    ...projects.map((p) => ({ url: `${site}/work/${p.slug}`, lastModified: p.updatedAt, priority: 0.8 })),
    ...posts.map((p) => ({ url: `${site}/blog/${p.slug}`, lastModified: p.updatedAt, priority: 0.8 })),
    ...books.map((b) => ({ url: `${site}${bookHref(b)}`, lastModified: b.updatedAt, priority: 0.4 })),
  ];
}
