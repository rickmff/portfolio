import { NextResponse } from "next/server";
import { authorized, errorResponse } from "@/lib/content-api";
import { saveRemoteImage, saveUpload } from "@/lib/uploads";

export const dynamic = "force-dynamic";

/**
 * POST multipart with a "file" field (images, MP4/WebM clips, PDFs) → { url: "/media/<uuid>.<ext>" }.
 * Or JSON { "url": "https://covers.openlibrary.org/…" } to store an Open Library cover.
 */
export async function POST(req: Request) {
  const denied = authorized(req);
  if (denied) return denied;
  try {
    if (req.headers.get("content-type")?.includes("application/json")) {
      const { url } = (await req.json()) as { url?: string };
      const saved = url ? await saveRemoteImage(url) : null;
      return saved ? NextResponse.json({ url: saved }, { status: 201 }) : NextResponse.json({ error: "No cover at that URL" }, { status: 404 });
    }
    const form = await req.formData();
    const saved = await saveUpload(form.get("file"), { maxMb: 40, pdf: true });
    return saved ? NextResponse.json({ url: saved }, { status: 201 }) : NextResponse.json({ error: 'Send the file in a "file" field' }, { status: 400 });
  } catch (e) {
    return errorResponse(e);
  }
}
