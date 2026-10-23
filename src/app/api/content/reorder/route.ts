import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { COLLECTIONS, authorized, errorResponse, readJson, refreshSite } from "@/lib/content-api";

export const dynamic = "force-dynamic";

const body = z.object({
  collection: z.enum(["projects", "books", "harness"]),
  ids: z.array(z.number().int().positive()).min(1),
});

/** POST { collection, ids }: sets sort = 1, 2, 3… in the order given (first shows first). */
export async function POST(req: Request) {
  const denied = authorized(req);
  if (denied) return denied;
  try {
    const { collection, ids } = body.parse(await readJson(req));
    const t = COLLECTIONS[collection].table;
    await db.transaction(async (tx) => {
      for (const [i, id] of ids.entries()) await tx.update(t).set({ sort: i + 1 }).where(eq(t.id, id));
    });
    refreshSite();
    return NextResponse.json({ ordered: ids.length });
  } catch (e) {
    return errorResponse(e);
  }
}
