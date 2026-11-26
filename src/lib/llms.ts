import "server-only";
import { bookHref, readAndReading } from "./books";
import { getBooks, getHarness, getPublishedPosts, getPublishedProjects, getSettings } from "./data";
import { getLocale } from "./i18n/server";
import { absoluteUrl, expertise, languagesSpoken, localeUrl, otherNames, profiles } from "./seo";

const line = (s: string) => s.replace(/\s+/g, " ").trim();
/** Bodies nest under a list entry, so their headings drop two levels below the file's own. */
const nested = (md: string) => md.trim().replace(/^(#{1,4}) /gm, "$1## ");

/**
 * The site as Markdown for AI assistants (llmstxt.org): who Henrique is, then every project
 * and post with a one-line summary. `full` inlines the About page and each body as well, so a
 * model can answer from one fetch without crawling.
 */
export async function llmsText({ full = false } = {}) {
  const [s, projects, posts, books, harness, locale] = await Promise.all([
    getSettings(),
    getPublishedProjects(),
    getPublishedPosts(),
    getBooks(),
    getHarness(),
    getLocale(),
  ]);
  const u = (path: string) => localeUrl(locale, path);
  const out: string[] = [`# ${s.name}`, "", `> ${line(s.bio)}`, ""];

  const facts = [
    otherNames(s).length > 0 && `Also known as: ${otherNames(s).join(", ")}`,
    `Role: ${s.role}`,
    s.worksFor && `Works at: ${s.worksFor}`,
    s.location && `Based in: ${s.location}`,
    languagesSpoken(s).length > 0 && `Speaks: ${languagesSpoken(s).join(", ")}`,
    expertise(s).length && `Known for: ${expertise(s).join(", ")}`,
    s.now && `Currently: ${line(s.now)}`,
    `Website: ${u("/")}`,
    ...profiles(s).map((u) => `Profile: ${u}`),
    s.email && `Contact: ${s.email}`,
  ].filter(Boolean);
  out.push(...facts.map((f) => `- ${f}`), "");

  if (full && s.about) out.push("## About", "", nested(s.about), "");
  else if (s.about) out.push(`For the full biography, career and awards, see [About](${u(`/about`)}).`, "");

  if (projects.length) {
    out.push("## Projects", "");
    for (const p of projects) {
      const meta = [p.year, p.stack].filter(Boolean).join(" · ");
      out.push(`- [${p.title}](${u(`/work/${p.slug}`)}): ${line(p.summary)}${meta ? ` (${meta})` : ""}`);
      if (full && p.body.trim()) out.push("", nested(p.body), "");
    }
    out.push("");
  }

  if (posts.length) {
    out.push("## Writing", "");
    for (const p of posts) {
      const date = p.publishedAt!.toISOString().slice(0, 10);
      out.push(`- [${p.title}](${u(`/blog/${p.slug}`)}) (${date}): ${line(p.excerpt)}`);
      if (full && p.body.trim()) out.push("", nested(p.body), "");
    }
    out.push("");
  }

  if (harness.length) {
    out.push("## Harness", "", `The tools and services ${s.name} builds with: ${u(`/harness`)}`, "");
    if (full) out.push(...harness.map((h) => `- [${h.name}](${h.url})${h.description ? `: ${line(h.description)}` : ""}`), "");
  }

  out.push("## Optional", "");
  const read = readAndReading(books).slice(0, full ? undefined : 10);
  if (read.length) out.push(`- [Books](${u(`/books`)}): reading list — ${read.map((b) => `[${b.title}](${u(bookHref(b))}) by ${b.author}`).join("; ")}`);
  out.push(`- [RSS](${absoluteUrl("/rss.xml")})`);
  if (!full) out.push(`- [Full text](${u(`/llms-full.txt`)}): this file with the About page and every project and post inlined`);
  return out.join("\n") + "\n";
}

export const llmsResponse = (body: string) =>
  new Response(body, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
