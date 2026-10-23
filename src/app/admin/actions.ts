"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { checkPassword, requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/markdown";
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/session";
import { SETTING_KEYS } from "@/lib/settings";
import { type BookDetails, type BookHit, bookDetails, searchBooks } from "@/lib/book-lookup";
import { saveRemoteImage, saveUpload } from "@/lib/uploads";

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

/* Auth */

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const password = String(fd.get("password") ?? "");
  // Constant-ish delay blunts online guessing a little; put Caddy rate limiting in front for more.
  await new Promise((r) => setTimeout(r, 400));
  if (!(await checkPassword(password))) return { error: "Wrong password." };
  (await cookies()).set(SESSION_COOKIE, await createSessionToken(), sessionCookieOptions);
  const next = String(fd.get("next") ?? "");
  redirect(next.startsWith("/admin") ? next : "/admin");
}

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
});

export async function saveProject(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(fd.get("id")) || null;
  try {
    const { removeCover, ...data } = projectSchema.parse(fields(fd));
    const values = { ...data, slug: slugify(data.slug || data.title) };
    const cover = await saveUpload(fd.get("cover"));
    const coverUrl = cover ?? (removeCover ? null : undefined);
    // An uploaded clip wins over a typed preview URL.
    values.previewUrl = (await saveUpload(fd.get("preview"))) ?? values.previewUrl;
    if (id) {
      await db.update(projects).set({ ...values, ...(coverUrl !== undefined && { coverUrl }) }).where(eq(projects.id, id));
    } else {
      await db.insert(projects).values({ ...values, coverUrl: cover });
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
    const { removeCover, ...values } = bookSchema.parse(fields(fd));
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
    const values = harnessSchema.parse(fields(fd));
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
  const rows = Object.keys(SETTING_KEYS).map((key) => ({ key, value: String(fd.get(key) ?? "").trim() }));
  for (const row of rows) {
    await db.insert(settings).values(row).onConflictDoUpdate({ target: settings.key, set: { value: row.value } });
  }
  refreshSite();
  return { ok: true };
}
