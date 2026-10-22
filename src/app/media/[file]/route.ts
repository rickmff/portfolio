import { readFile } from "node:fs/promises";
import path from "node:path";
import { MIME, UPLOAD_DIR } from "@/lib/uploads";

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!/^[a-f0-9-]+\.[a-z0-9]+$/i.test(file)) return new Response("Not found", { status: 404 });
  const type = MIME[path.extname(file).toLowerCase()];
  if (!type) return new Response("Not found", { status: 404 });
  try {
    const data = await readFile(path.join(UPLOAD_DIR, file));
    return new Response(data, {
      headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
