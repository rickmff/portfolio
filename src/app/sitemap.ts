import type { MetadataRoute } from "next";
import { bookHref } from "@/lib/books";
import { getBooks, getPublishedPosts, getPublishedProjects, getSettings } from "@/lib/data";
import { LOCALES } from "@/lib/i18n/dict";
import { absoluteUrl, languageAlternates, localeUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Page = { path: string; lastModified?: Date; priority?: number };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, posts, books, settings] = await Promise.all([
    getPublishedProjects(),
    getPublishedPosts(),
    getBooks(),
    getSettings(),
  ]);
  const latest = (rows: { updatedAt: Date }[]) =>
    rows.reduce<Date | undefined>((max, r) => (!max || r.updatedAt > max ? r.updatedAt : max), undefined);
  const pages: Page[] = [
    { path: "/", lastModified: latest([...projects, ...posts]), priority: 1 },
    ...(settings.about ? [{ path: "/about", priority: 0.9 }] : []),
    { path: "/work", lastModified: latest(projects), priority: 0.9 },
    { path: "/blog", lastModified: latest(posts), priority: 0.8 },
    { path: "/books", lastModified: latest(books) },
    { path: "/quotes", lastModified: latest(books) },
    { path: "/harness" },
    ...projects.map((p) => ({ path: `/work/${p.slug}`, lastModified: p.updatedAt, priority: 0.8 })),
    ...posts.map((p) => ({ path: `/blog/${p.slug}`, lastModified: p.updatedAt, priority: 0.8 })),
    ...books.map((b) => ({ path: bookHref(b), lastModified: b.updatedAt, priority: 0.4 })),
  ];
  // Every page in both languages, each entry naming its twin (hreflang).
  return pages.flatMap(({ path, ...rest }) => {
    const languages = Object.fromEntries(Object.entries(languageAlternates(path)).map(([k, v]) => [k, absoluteUrl(v)]));
    return LOCALES.map((l) => ({ url: localeUrl(l, path), ...rest, alternates: { languages } }));
  });
}
