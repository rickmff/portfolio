import "server-only";
import { and, asc, desc, eq, isNotNull, lte } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Translations } from "@/db/schema";
import { getLocale } from "./i18n/server";
import type { Locale } from "./i18n/dict";
import { slugify } from "./markdown";
import { SETTING_KEYS, type SettingKey, type SiteSettings } from "./settings";

const { projects, books, posts, settings, harness } = schema;

/** Overlays the row's translation for the visitor's language on its base fields. */
function localize<T extends { translations: Translations }>(row: T, locale: Locale): T {
  const t = row.translations?.[locale];
  if (!t) return row;
  const out: Record<string, unknown> = { ...row };
  for (const [k, v] of Object.entries(t)) if (typeof v === "string" && v.trim() && k in row) out[k] = v;
  return out as T;
}

async function localizeAll<T extends { translations: Translations }>(rows: Promise<T[]> | T[]) {
  const [list, locale] = await Promise.all([rows, getLocale()]);
  return list.map((r) => localize(r, locale));
}

/** Settings take a per-language variant under "<key>:<locale>", e.g. "about:pt". */
export async function getSettings(): Promise<SiteSettings> {
  const [rows, locale] = await Promise.all([db.select().from(settings), getLocale()]);
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return Object.fromEntries(
    (Object.keys(SETTING_KEYS) as SettingKey[]).map((k) => [k, map[`${k}:${locale}`] || map[k] || SETTING_KEYS[k].fallback]),
  ) as SiteSettings;
}

export function getPublishedProjects() {
  return localizeAll(
    db.select().from(projects).where(eq(projects.published, true)).orderBy(asc(projects.sort), desc(projects.year)),
  );
}

export async function getProject(slug: string) {
  const [row] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.slug, slug), eq(projects.published, true)));
  return row ? localize(row, await getLocale()) : null;
}

export function getHarness() {
  return localizeAll(db.select().from(harness).orderBy(asc(harness.sort), asc(harness.id)));
}

export async function hasHarness() {
  return (await db.select({ id: harness.id }).from(harness).limit(1)).length > 0;
}

/** Book pages are addressed by a slug of the title, so there is nothing extra to keep in sync. */
export async function getBookBySlug(slug: string) {
  const all = await getBooks();
  return all.find((b) => b.slug === slug) ?? null;
}

/** Books carry a slug of their base title, so a translated title keeps the same URL. */
export async function getBooks() {
  const rows = await db.select().from(books).orderBy(asc(books.sort), asc(books.id));
  const locale = await getLocale();
  return rows.map((b) => ({ ...localize(b, locale), slug: slugify(b.title) }));
}

const livePost = and(
  eq(posts.published, true),
  isNotNull(posts.publishedAt),
  lte(posts.publishedAt, new Date()),
);

export function getPublishedPosts(limit?: number) {
  const q = db.select().from(posts).where(livePost).orderBy(desc(posts.publishedAt));
  return localizeAll(limit ? q.limit(limit) : q);
}

export async function getPost(slug: string) {
  const [row] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.slug, slug), livePost));
  return row ? localize(row, await getLocale()) : null;
}
