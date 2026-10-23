import { NextResponse } from "next/server";
import { bookDetails, searchBooks } from "@/lib/book-lookup";
import { authorized, errorResponse } from "@/lib/content-api";

export const dynamic = "force-dynamic";

/**
 * Open Library book lookup.
 * GET ?q=title|author|isbn → candidates; GET ?key=/works/OL…W&coverId=123 → synopsis, cover URL, colours.
 */
export async function GET(req: Request) {
  const denied = authorized(req);
  if (denied) return denied;
  const p = new URL(req.url).searchParams;
  try {
    if (p.get("key")) {
      const cover = Number(p.get("coverId"));
      return NextResponse.json(await bookDetails(p.get("key")!, Number.isFinite(cover) && cover > 0 ? cover : null));
    }
    const q = p.get("q")?.trim() ?? "";
    if (q.length < 2) return NextResponse.json({ error: "Pass ?q= (title, author or ISBN)" }, { status: 400 });
    return NextResponse.json(await searchBooks(q));
  } catch (e) {
    return errorResponse(e);
  }
}
