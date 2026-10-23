import { NextResponse } from "next/server";
import { z } from "zod";
import { db, schema } from "@/db";
import { authorized, errorResponse, readJson, refreshSite } from "@/lib/content-api";
import { SETTING_KEYS } from "@/lib/settings";

export const dynamic = "force-dynamic";

const KEY = new RegExp(`^(${Object.keys(SETTING_KEYS).join("|")})(:(en|pt))?$`);

/** GET: every stored setting plus the known keys and what they are for. */
export async function GET(req: Request) {
  const denied = authorized(req);
  if (denied) return denied;
  const rows = await db.select().from(schema.settings);
  return NextResponse.json({
    values: Object.fromEntries(rows.map((r) => [r.key, r.value])),
    keys: Object.fromEntries(Object.entries(SETTING_KEYS).map(([k, v]) => [k, v.label])),
    note: 'Add ":en" or ":pt" to a key for a per-language value, e.g. "about:pt".',
  });
}

/** PATCH { key: value, … }: upserts each key; an empty string deletes a language variant. */
export async function PATCH(req: Request) {
  const denied = authorized(req);
  if (denied) return denied;
  try {
    const body = z.record(z.string().regex(KEY, "Unknown setting key"), z.string()).parse(await readJson(req));
    for (const [key, value] of Object.entries(body)) {
      await db
        .insert(schema.settings)
        .values({ key, value })
        .onConflictDoUpdate({ target: schema.settings.key, set: { value } });
    }
    refreshSite();
    return NextResponse.json({ updated: Object.keys(body) });
  } catch (e) {
    return errorResponse(e);
  }
}
