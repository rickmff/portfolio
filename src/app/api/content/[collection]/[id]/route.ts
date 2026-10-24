import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { COLLECTIONS, authorized, errorResponse, isCollection, readJson, refreshSite, withSlug } from "@/lib/content-api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ collection: string; id: string }> };

async function target(req: Request, params: Ctx["params"]) {
  const denied = authorized(req);
  if (denied) return { denied };
  const { collection, id } = await params;
  const n = Number(id);
  if (!isCollection(collection) || !Number.isInteger(n)) {
    return { denied: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }
  return { collection, id: n, table: COLLECTIONS[collection].table };
}

export async function GET(req: Request, { params }: Ctx) {
  const t = await target(req, params);
  if (t.denied) return t.denied;
  const [row] = await db.select().from(t.table).where(eq(t.table.id, t.id));
  return row ? NextResponse.json(row) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

/**
 * PATCH: partial update. `translations` is merged per language and field, so sending
 * { translations: { en: { notes } } } keeps every other translation; send "" to clear one.
 */
export async function PATCH(req: Request, { params }: Ctx) {
  const t = await target(req, params);
  if (t.denied) return t.denied;
  try {
    const body = withSlug(t.collection, await readJson(req));
    const data = COLLECTIONS[t.collection].insert.partial().parse(body) as Record<string, unknown>;
    const [current] = await db.select().from(t.table).where(eq(t.table.id, t.id));
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (data.translations) {
      const merged: Record<string, Record<string, string>> = { ...current.translations };
      for (const [lang, fields] of Object.entries(data.translations as Record<string, Record<string, string>>)) {
        const next = { ...merged[lang], ...fields };
        for (const k of Object.keys(next)) if (next[k] === "") delete next[k];
        merged[lang] = next;
      }
      data.translations = merged;
    }
    const [row] = await db.update(t.table).set(data as never).where(eq(t.table.id, t.id)).returning();
    refreshSite();
    return NextResponse.json(row);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const t = await target(req, params);
  if (t.denied) return t.denied;
  const [row] = await db.delete(t.table).where(eq(t.table.id, t.id)).returning({ id: t.table.id });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  refreshSite();
  return NextResponse.json({ deleted: row.id });
}
