import "server-only";
import { and, asc, desc, eq, isNotNull, lte } from "drizzle-orm";
import { db, schema } from "@/db";
import { SETTING_KEYS, type SettingKey, type SiteSettings } from "./settings";

const { projects, books, posts, settings } = schema;

export async function getSettings(): Promise<SiteSettings> {
  const rows = await db.select().from(settings);
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return Object.fromEntries(
    (Object.keys(SETTING_KEYS) as SettingKey[]).map((k) => [k, map[k] || SETTING_KEYS[k].fallback]),
  ) as SiteSettings;
}

export function getPublishedProjects() {
  return db
    .select()
    .from(projects)
    .where(eq(projects.published, true))
    .orderBy(asc(projects.sort), desc(projects.year));
}

export async function getProject(slug: string) {
  const [row] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.slug, slug), eq(projects.published, true)));
  return row ?? null;
}

export function getBooks() {
  return db.select().from(books).orderBy(asc(books.sort), desc(books.finishedYear));
}

const livePost = and(
  eq(posts.published, true),
  isNotNull(posts.publishedAt),
  lte(posts.publishedAt, new Date()),
);

export function getPublishedPosts(limit?: number) {
  const q = db.select().from(posts).where(livePost).orderBy(desc(posts.publishedAt));
  return limit ? q.limit(limit) : q;
}

export async function getPost(slug: string) {
  const [row] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.slug, slug), livePost));
  return row ?? null;
}
