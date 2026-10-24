"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/markdown";
import { SESSION_COOKIE } from "@/lib/session";
import { SETTING_KEYS, TRANSLATED_SETTINGS, type SettingKey } from "@/lib/settings";
import { type BookDetails, type BookHit, bookDetails, searchBooks } from "@/lib/book-lookup";
import { saveRemoteImage, saveUpload } from "@/lib/uploads";
import type { Translations } from "@/db/schema";

export type FormState = { error?: string; ok?: boolean } | undefined;

const { projects, books, posts, settings, harness } = schema;

const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v));
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Colours must be hex, like #1F3A5F");
const checkbox = z.preprocess((v) => v === "on", z.boolean());
const optionalInt = (min: number, max: number) =>
  z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().min(min).max(max).nullable());

/** Screen recordings run larger than images. */
const CLIP = { maxMb: 40 };

function fields(fd: FormData) {
  return Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string"));
}

function fail(e: unknown): FormState {
  if (e instanceof z.ZodError) return { error: e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" · ") };
  if (e instanceof Error && /unique/i.test(e.message)) return { error: "That slug is already used." };
  if (e instanceof Error) return { error: e.message };
  return { error: "Something went wrong." };
}

function refreshSite() {
  revalidatePath("/", "layout");
}

/**
 * Reads the `tr.<locale>.<field>` inputs into the row's translations, keeping fields the form
 * does not show. An emptied input removes that override, so the base field shows again.
 */
function withTranslations(fd: FormData, current: Translations = {}): Translations {
  const out: Translations = { en: { ...current.en }, pt: { ...current.pt } };
  for (const [key, value] of fd.entries()) {
    const m = /^tr\.(en|pt)\.(\w+)$/.exec(key);
    if (!m || typeof value !== "string") continue;
    const [, locale, field] = m as unknown as [string, "en" | "pt", string];
    if (value.trim()) out[locale]![field] = value.trim();
    else delete out[locale]![field];
  }
  return Object.fromEntries(Object.entries(out).filter(([, v]) => Object.keys(v ?? {}).length)) as Translations;
}

async function currentTranslations(table: typeof projects | typeof books | typeof posts | typeof harness, id: number | null) {
  if (!id) return {};
  const [row] = await db.select({ t: table.translations }).from(table).where(eq(table.id, id));
  return row?.t ?? {};
}

/* Auth */

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}

/* Projects */

const projectSchema = z.object({
  title: z.string().trim().min(1, "required"),
  slug: z.string().trim(),
  summary: z.string().trim(),
  body: z.string(),
  year: z.coerce.number().int().min(1990).max(2100),
  stack: z.string().trim(),
  liveUrl: optionalText,
  repoUrl: optionalText,
  previewUrl: optionalText,
  tint: hex,
  sort: z.coerce.number().int(),
  published: checkbox,
  removeCover: checkbox,
  removeMobile: checkbox,
  removeShowcase: checkbox,
  showcaseMobileAt: z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.number().min(0).nullable()),
});

export async function saveProject(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(fd.get("id")) || null;
  try {
    const { removeCover, removeMobile, removeShowcase, ...data } = projectSchema.parse(fields(fd));
    const values = {
      ...data,
      slug: slugify(data.slug || data.title),
      translations: withTranslations(fd, await currentTranslations(projects, id)),
    };
    const cover = await saveUpload(fd.get("cover"));
    const coverUrl = cover ?? (removeCover ? null : undefined);
    // An uploaded clip wins over a typed preview URL.
    values.previewUrl = (await saveUpload(fd.get("preview"), CLIP)) ?? values.previewUrl;
    const mobile = {
      coverMobileUrl: (await saveUpload(fd.get("coverMobile"))) ?? (removeMobile ? null : undefined),
      previewMobileUrl: (await saveUpload(fd.get("previewMobile"), CLIP)) ?? (removeMobile ? null : undefined),
      showcaseUrl: (await saveUpload(fd.get("showcase"), CLIP)) ?? (removeShowcase ? null : undefined),
      showcasePosterUrl: (await saveUpload(fd.get("showcasePoster"))) ?? (removeShowcase ? null : undefined),
    };
    if (id) {
      await db
        .update(projects)
        .set({ ...values, ...(coverUrl !== undefined && { coverUrl }), ...mobile })
        .where(eq(projects.id, id));
    } else {
      await db.insert(projects).values({ ...values, coverUrl: cover, ...mobile });
    }
  } catch (e) {
    return fail(e);
  }
  refreshSite();
  redirect("/admin/projects");
}

export async function deleteProject(id: number) {
  await requireAdmin();
  await db.delete(projects).where(eq(projects.id, id));
  refreshSite();
  redirect("/admin/projects");
}

/* Books */

const bookSchema = z.object({
  title: z.string().trim().min(1, "required"),
  author: z.string().trim().min(1, "required"),
  status: z.enum(schema.BOOK_STATUSES),
  finishedYear: optionalInt(1900, 2100),
  rating: optionalInt(1, 5),
  note: z.string().trim(),
  synopsis: z.string().trim(),
  notes: z.string().trim(),
  notesGenerated: checkbox,
  readUrl: optionalText.pipe(z.url("Free edition link must be a URL").nullable()),
  color: hex,
  ink: hex,
  thickness: z.coerce.number().int().min(14).max(80),
  sort: z.coerce.number().int(),
  removeCover: checkbox,
});

export async function saveBook(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(fd.get("id")) || null;
  try {
    const { removeCover, ...data } = bookSchema.parse(fields(fd));
    const values = { ...data, translations: withTranslations(fd, await currentTranslations(books, id)) };
    const remote = String(fd.get("coverRemote") ?? "").trim();
    const cover = (await saveUpload(fd.get("cover"))) ?? (remote ? await saveRemoteImage(remote) : null);
    const coverUrl = cover ?? (removeCover ? null : undefined);
    if (id) {
      await db.update(books).set({ ...values, ...(coverUrl !== undefined && { coverUrl }) }).where(eq(books.id, id));
    } else {
      await db.insert(books).values({ ...values, coverUrl: cover });
    }
  } catch (e) {
    return fail(e);
  }
  refreshSite();
  redirect("/admin/books");
}

/** Book lookup on Open Library for the add-book form. */
export async function lookupBooks(q: string): Promise<{ hits?: BookHit[]; error?: string }> {
  await requireAdmin();
  try {
    return { hits: await searchBooks(z.string().trim().min(2).max(200).parse(q)) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Search failed" };
  }
}

export async function lookupBookDetails(key: string, coverId: number | null): Promise<BookDetails | { error: string }> {
  await requireAdmin();
  try {
    return await bookDetails(key, coverId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lookup failed" };
  }
}

/** Saves the shelf order: `ids` is every book, first to last. */
export async function reorderBooks(ids: number[]): Promise<FormState> {
  await requireAdmin();
  try {
    const order = z.array(z.number().int().positive()).parse(ids);
    await db.transaction(async (tx) => {
      for (const [i, id] of order.entries()) {
        await tx.update(books).set({ sort: i + 1 }).where(eq(books.id, id));
      }
    });
  } catch (e) {
    return fail(e);
  }
  refreshSite();
  return { ok: true };
}

export async function deleteBook(id: number) {
  await requireAdmin();
  await db.delete(books).where(eq(books.id, id));
  refreshSite();
  redirect("/admin/books");
}

/* Posts */

const postSchema = z.object({
  title: z.string().trim().min(1, "required"),
  slug: z.string().trim(),
  excerpt: z.string().trim(),
  body: z.string(),
  tags: z.string().trim(),
  published: checkbox,
  removeCover: checkbox,
  publishedAt: z
    .string()
    .trim()
    .transform((v) => (v ? new Date(v) : null))
    .refine((d) => d === null || !Number.isNaN(d.getTime()), "invalid date"),
});

export async function savePost(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(fd.get("id")) || null;
  try {
    const { removeCover, ...data } = postSchema.parse(fields(fd));
    const banner = await saveUpload(fd.get("cover"));
    const bannerUrl = banner ?? (removeCover ? null : undefined);
    const values = {
      ...data,
      slug: slugify(data.slug || data.title),
      translations: withTranslations(fd, await currentTranslations(posts, id)),
      // Publishing without a date means "now".
      publishedAt: data.published ? (data.publishedAt ?? new Date()) : data.publishedAt,
      ...(bannerUrl !== undefined && { bannerUrl }),
    };
    if (id) await db.update(posts).set(values).where(eq(posts.id, id));
    else await db.insert(posts).values(values);
  } catch (e) {
    return fail(e);
  }
  refreshSite();
  redirect("/admin/posts");
}

export async function deletePost(id: number) {
  await requireAdmin();
  await db.delete(posts).where(eq(posts.id, id));
  refreshSite();
  redirect("/admin/posts");
}

/** Lets the Markdown editor drop images into a post body. */
export async function uploadImage(fd: FormData): Promise<{ url?: string; error?: string }> {
  await requireAdmin();
  try {
    const url = await saveUpload(fd.get("file"));
    return url ? { url } : { error: "No file." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Upload failed." };
  }
}

/* Harness */

const harnessSchema = z.object({
  name: z.string().trim().min(1, "required"),
  url: z.url("Link must be a URL"),
  description: z.string().trim(),
  category: z.string().trim(),
  sort: z.coerce.number().int(),
});

export async function saveHarnessItem(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(fd.get("id")) || null;
  try {
    const values = {
      ...harnessSchema.parse(fields(fd)),
      translations: withTranslations(fd, await currentTranslations(harness, id)),
    };
    if (id) await db.update(harness).set(values).where(eq(harness.id, id));
    else await db.insert(harness).values(values);
  } catch (e) {
    return fail(e);
  }
  refreshSite();
  redirect("/admin/harness");
}

export async function deleteHarnessItem(id: number) {
  await requireAdmin();
  await db.delete(harness).where(eq(harness.id, id));
  refreshSite();
  redirect("/admin/harness");
}

/* Settings */

export async function saveSettings(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const rows: { key: string; value: string }[] = [];
  for (const key of Object.keys(SETTING_KEYS) as SettingKey[]) {
    if (!TRANSLATED_SETTINGS.includes(key)) {
      rows.push({ key, value: String(fd.get(key) ?? "").trim() });
      continue;
    }
    // English is the site default, so it is also the plain key every language falls back to.
    const en = String(fd.get(`${key}:en`) ?? "").trim();
    const pt = String(fd.get(`${key}:pt`) ?? "").trim();
    rows.push({ key, value: en || pt }, { key: `${key}:en`, value: en }, { key: `${key}:pt`, value: pt });
  }
  for (const row of rows) {
    await db.insert(settings).values(row).onConflictDoUpdate({ target: settings.key, set: { value: row.value } });
  }
  refreshSite();
  return { ok: true };
}
