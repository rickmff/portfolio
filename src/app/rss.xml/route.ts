import { getPublishedPosts, getSettings } from "@/lib/data";
import { getLocale } from "@/lib/i18n/server";
import { absoluteUrl, SITE_URL as site } from "@/lib/seo";

export const dynamic = "force-dynamic";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET() {
  const [settings, posts, locale] = await Promise.all([getSettings(), getPublishedPosts(30), getLocale()]);
  const items = posts
    .map((p) => {
      const url = `${site}/blog/${p.slug}`;
      const tags = p.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => `<category>${esc(t)}</category>`)
        .join("");
      const banner = p.bannerUrl ? `<media:content url="${esc(absoluteUrl(p.bannerUrl))}" medium="image"/>` : "";
      return `<item><title>${esc(p.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><pubDate>${p.publishedAt!.toUTCString()}</pubDate><dc:creator>${esc(settings.name)}</dc:creator>${tags}<description>${esc(p.excerpt)}</description>${banner}</item>`;
    })
    .join("");
  const updated = posts[0]?.publishedAt ? `<lastBuildDate>${posts[0].publishedAt.toUTCString()}</lastBuildDate>` : "";
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/"><channel><title>${esc(settings.name)}</title><link>${site}</link><atom:link href="${site}/rss.xml" rel="self" type="application/rss+xml"/><description>${esc(settings.bio)}</description><language>${locale === "pt" ? "pt-BR" : "en"}</language>${updated}${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
