/**
 * One-off import of the old rickmff.com content (Contentful) into this site's database.
 *
 *   CONTENTFUL_SPACE_ID=… CONTENTFUL_ACCESS_TOKEN=… pnpm import:contentful [--dry-run]
 *
 * Uses the read-only Content Delivery API. Content types it understands:
 *   work  → projects (title, description, url, thumb → cover, gif → hover preview)
 *   about → About page Markdown (profile, experiences, awards)
 * Images are downloaded into UPLOAD_DIR so the new site no longer depends on Contentful.
 * Re-running is safe: projects are matched by slug and updated.
 */
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { like } from "drizzle-orm";
import { db, schema } from "../src/db";
import { slugify } from "../src/lib/markdown";

const SPACE = process.env.CONTENTFUL_SPACE_ID;
const TOKEN = process.env.CONTENTFUL_ACCESS_TOKEN;
const ENV = process.env.CONTENTFUL_ENVIRONMENT ?? "master";
const HOST = process.env.CONTENTFUL_HOST ?? "https://cdn.contentful.com";
const DRY = process.argv.includes("--dry-run");
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");

type Asset = { sys: { id: string }; fields: { title?: string; file?: { url: string; fileName: string; contentType: string } } };
type Entry = { sys: { id: string; createdAt: string }; fields: Record<string, unknown> };
type Link = { sys: { type: "Link"; linkType: "Asset"; id: string } };

async function entries(contentType: string) {
  const url = `${HOST}/spaces/${SPACE}/environments/${ENV}/entries?content_type=${contentType}&include=10&limit=1000`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!res.ok) throw new Error(`Contentful ${contentType}: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { items: Entry[]; includes?: { Asset?: Asset[] } };
  const assets = new Map((json.includes?.Asset ?? []).map((a) => [a.sys.id, a]));
  return { items: json.items, asset: (l: unknown) => assets.get((l as Link | undefined)?.sys?.id ?? "") };
}

async function download(asset: Asset | undefined): Promise<string | null> {
  const file = asset?.fields.file;
  if (!file) return null;
  const src = file.url.startsWith("//") ? `https:${file.url}` : file.url;
  if (DRY) return src;
  const res = await fetch(src);
  if (!res.ok) {
    console.warn(`  could not download ${src}: ${res.status}`);
    return null;
  }
  const ext = path.extname(file.fileName).toLowerCase() || ".bin";
  const name = `${randomUUID()}${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await res.arrayBuffer()));
  return `/media/${name}`;
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const list = <T>(v: unknown) => (Array.isArray(v) ? (v as T[]) : []);

/** Rebuilds the old About page (profile, experience, awards) as Markdown. */
export function aboutMarkdown(items: Entry[]) {
  const by = (title: string) => items.find((i) => i.fields.title === title)?.fields.content;
  const out: string[] = [];

  const profile = (by("profile") as { content?: unknown } | undefined)?.content;
  for (const p of list<string>(profile)) if (str(p)) out.push(str(p));

  const exp = list<Record<string, string>>(by("experiences"));
  if (exp.length) {
    out.push("## Experience");
    for (const e of exp) {
      out.push(`### ${str(e.company)}${e.startDate ? ` <small>${str(e.startDate)}</small>` : ""}`);
      if (str(e.position)) out.push(`*${str(e.position)}*`);
      if (str(e.description)) out.push(str(e.description));
    }
  }

  const awards = list<Record<string, string>>(by("awards"));
  if (awards.length) {
    out.push("## Awards");
    out.push(
      awards
        .map((a) => `- **${[str(a.place), str(a.award)].filter(Boolean).join(" · ")}**${a.date ? ` (${str(a.date)})` : ""}${a.description ? ` — ${str(a.description)}` : ""}`)
        .join("\n"),
    );
  }

  return out.join("\n\n");
}

async function main() {
  if (!SPACE || !TOKEN) throw new Error("Set CONTENTFUL_SPACE_ID and CONTENTFUL_ACCESS_TOKEN");

  const work = await entries("work");
  console.log(`work: ${work.items.length} entries`);
  for (const [i, e] of work.items.entries()) {
    const title = str(e.fields.title) || `Project ${i + 1}`;
    const url = str(e.fields.url);
    const values = {
      slug: slugify(title),
      title,
      summary: str(e.fields.description) || str(e.fields.summary),
      year: new Date(e.sys.createdAt).getFullYear(),
      liveUrl: url && url !== "#" ? url : null,
      coverUrl: await download(work.asset(e.fields.thumb)),
      previewUrl: await download(work.asset(e.fields.gif)),
      sort: i + 1,
    };
    console.log(`  · ${title}`);
    if (DRY) {
      console.log(JSON.stringify(values, null, 2));
      continue;
    }
    await db
      .insert(schema.projects)
      .values(values)
      .onConflictDoUpdate({ target: schema.projects.slug, set: { ...values, updatedAt: new Date() } });
  }

  // The starter seed's placeholder projects are titled "[…]"; the real ones replace them.
  if (!DRY && work.items.length) {
    const gone = await db.delete(schema.projects).where(like(schema.projects.title, "[%")).returning({ slug: schema.projects.slug });
    if (gone.length) console.log(`removed ${gone.length} placeholder projects`);
  }

  const about = await entries("about");
  const md = aboutMarkdown(about.items);
  console.log(`about: ${md.length} characters of Markdown`);
  if (DRY) console.log(md);
  else if (md) {
    await db
      .insert(schema.settings)
      .values({ key: "about", value: md })
      .onConflictDoUpdate({ target: schema.settings.key, set: { value: md } });
  }

  console.log(DRY ? "dry run, nothing written" : "import done");
  process.exit(0);
}

if (process.argv[1]?.includes("import-contentful")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
