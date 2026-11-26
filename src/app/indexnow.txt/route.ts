import { INDEXNOW_KEY } from "@/lib/indexnow";

export const dynamic = "force-dynamic";

export function GET() {
  if (!INDEXNOW_KEY) return new Response("Not found", { status: 404 });
  return new Response(INDEXNOW_KEY, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
