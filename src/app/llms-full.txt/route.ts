import { llmsResponse, llmsText } from "@/lib/llms";

export const dynamic = "force-dynamic";

export async function GET() {
  return llmsResponse(await llmsText({ full: true }));
}
