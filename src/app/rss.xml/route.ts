import { getPublishedPosts, getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET() {
  const site = process.env.SITE_URL ?? "http://localhost:3000";
  const [settings, posts] = await Promise.all([getSettings(), getPublishedPosts(30)]);
  const items = posts
    .map(
      (p) => `<item><title>${esc(p.title)}</title><link>${site}/blog/${p.slug}</link><guid>${site}/blog/${p.slug}</guid><pubDate>${p.publishedAt!.toUTCString()}</pubDate><description>${esc(p.excerpt)}</description></item>`,
    )
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(settings.name)}</title><link>${site}</link><description>Writing by ${esc(settings.name)}</description>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
