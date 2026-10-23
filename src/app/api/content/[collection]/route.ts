import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { COLLECTIONS, authorized, errorResponse, isCollection, readJson, refreshSite, withSlug } from "@/lib/content-api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ collection: string }> };

/** GET /api/content/:collection: every row, drafts included, in display order. */
export async function GET(req: Request, { params }: Ctx) {
  const denied = authorized(req);
  if (denied) return denied;
  const { collection } = await params;
  if (!isCollection(collection)) return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  const t = COLLECTIONS[collection].table;
  const order = "sort" in t ? [asc(t.sort), asc(t.id)] : [asc(t.id)];
  return NextResponse.json(await db.select().from(t).orderBy(...order));
}

/** POST /api/content/:collection: create a row from a JSON body. */
export async function POST(req: Request, { params }: Ctx) {
  const denied = authorized(req);
  if (denied) return denied;
  const { collection } = await params;
  if (!isCollection(collection)) return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  try {
    const { table, insert } = COLLECTIONS[collection];
    const data = insert.parse(withSlug(collection, await readJson(req)));
    const [row] = await db.insert(table).values(data as never).returning();
    refreshSite();
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
