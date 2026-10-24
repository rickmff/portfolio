import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { createInsertSchema } from "drizzle-zod";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { schema } from "@/db";
import { slugify } from "./markdown";

/**
 * Content API used by the portfolio-content Claude skill instead of a backoffice.
 * Every request needs `Authorization: Bearer <CONTENT_API_TOKEN>`; with no token configured the
 * API is off. Schemas come from the tables, so new columns are writable without edits here.
 */

const sha = (v: string) => createHash("sha256").update(v).digest();

export function authorized(req: Request): NextResponse | null {
  const token = process.env.CONTENT_API_TOKEN;
  if (!token || token.length < 32) return NextResponse.json({ error: "Content API is disabled" }, { status: 503 });
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!timingSafeEqual(sha(given), sha(token))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Colours must be hex, like #1F3A5F");
const url = z.string().refine((v) => v.startsWith("/media/") || /^https?:\/\//.test(v), "Must be a URL or a /media/ path");
const translations = z
  .object({ en: z.record(z.string(), z.string()).optional(), pt: z.record(z.string(), z.string()).optional() })
  .strict();
const omit = { id: true, createdAt: true, updatedAt: true } as const;

export const COLLECTIONS = {
  projects: {
    table: schema.projects,
    insert: createInsertSchema(schema.projects, {
      tint: hex,
      coverUrl: url.nullish(),
      previewUrl: url.nullish(),
      liveUrl: url.nullish(),
      repoUrl: url.nullish(),
      translations: translations.optional(),
    }).omit(omit),
    slugFrom: "title",
  },
  books: {
    table: schema.books,
    insert: createInsertSchema(schema.books, {
      color: hex,
      ink: hex,
      coverUrl: url.nullish(),
      readUrl: url.nullish(),
      rating: (s) => s.int().min(1).max(5),
      thickness: (s) => s.int().min(14).max(80),
      translations: translations.optional(),
    }).omit(omit),
    slugFrom: null,
  },
  posts: {
    table: schema.posts,
    insert: createInsertSchema(schema.posts, {
      bannerUrl: url.nullish(),
      publishedAt: z.coerce.date().nullish(),
      translations: translations.optional(),
    }).omit(omit),
    slugFrom: "title",
  },
  harness: {
    table: schema.harness,
    insert: createInsertSchema(schema.harness, { url, translations: translations.optional() }).omit(omit),
    slugFrom: null,
  },
} as const;

export type Collection = keyof typeof COLLECTIONS;
export const isCollection = (c: string): c is Collection => c in COLLECTIONS;

/** Fills or normalises the slug for collections addressed by one. */
export function withSlug(c: Collection, data: Record<string, unknown>) {
  const from = COLLECTIONS[c].slugFrom;
  if (!from) return data;
  const base = (data.slug as string | undefined) || (data[from] as string | undefined);
  return base ? { ...data, slug: slugify(base) } : data;
}

export function refreshSite() {
  revalidatePath("/", "layout");
}

export function errorResponse(e: unknown) {
  if (e instanceof z.ZodError) {
    return NextResponse.json(
      { error: "Invalid fields", issues: e.issues.map((i) => `${i.path.join(".")}: ${i.message}`) },
      { status: 400 },
    );
  }
  const msg = e instanceof Error ? (e.cause instanceof Error ? e.cause.message : e.message) : "Something went wrong";
  const status = /unique|duplicate/i.test(msg) ? 409 : 500;
  return NextResponse.json({ error: status === 409 ? "That slug is already used" : msg }, { status });
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new z.ZodError([
    { code: "custom", path: [], message: "Send a JSON object", input: body },
  ]);
  return body as Record<string, unknown>;
}
