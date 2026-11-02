// One-off move from the VPS to Vercel: uploads every file of a local copy of the `uploads`
// volume to Vercel Blob (as media/<name>, same name as before), then rewrites every
// "/media/<name>" (and "https://<old-domain>/media/<name>") the database holds to the Blob URL.
//
//   BLOB_READ_WRITE_TOKEN=… DATABASE_URL=… pnpm migrate:blob ./uploads-vps --dry-run
//   BLOB_READ_WRITE_TOKEN=… DATABASE_URL=… pnpm migrate:blob ./uploads-vps
//   (--old-host=example.com if absolute links point at another domain; default rickmff.com)
//
// Safe to re-run: files already in Blob are skipped and rewritten rows no longer match.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { head, put } from "@vercel/blob";
import postgres from "postgres";
import { databaseUrl } from "../src/db/url.mjs";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf",
};

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const dir = args.find((a) => !a.startsWith("--"));
  if (!dir) throw new Error("Usage: pnpm migrate:blob <uploads dir> [--dry-run]");
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN is not set");
  const url = databaseUrl({ direct: true });
  if (!url) throw new Error("DATABASE_URL is not set");

  // Matches what the /media route serves: <uuid-ish>.<ext>
  const NAME = /^[a-f0-9-]+\.[a-z0-9]+$/i;
  const files = (await readdir(dir)).filter((f) => NAME.test(f) && MIME[path.extname(f).toLowerCase()]);
  console.log(`${files.length} files in ${dir}${dryRun ? " (dry run)" : ""}`);

  let base: string | undefined;
  let uploaded = 0;
  for (const name of files) {
    const pathname = `media/${name}`;
    const existing = await head(pathname).catch(() => null);
    if (existing) {
      base ??= existing.url.slice(0, -pathname.length);
      continue;
    }
    if (dryRun) continue;
    const blob = await put(pathname, await readFile(path.join(dir, name)), {
      access: "public",
      contentType: MIME[path.extname(name).toLowerCase()],
      addRandomSuffix: false,
      cacheControlMaxAge: 31_536_000,
    });
    base ??= blob.url.slice(0, -pathname.length);
    uploaded++;
    if (uploaded % 20 === 0) console.log(`  uploaded ${uploaded}…`);
  }
  console.log(`uploaded ${uploaded}, ${files.length - uploaded} already in Blob${dryRun ? " or skipped" : ""}`);

  if (!base) {
    console.log(dryRun ? "dry run: nothing uploaded yet, so the Blob URL is unknown; rewrite counts below are matches only" : "no files, nothing to rewrite");
  }

  // Every text-like column of every table in public: covers, previews, banners, Markdown bodies,
  // settings values and the jsonb translations.
  const sql = postgres(url, { max: 1, prepare: false });
  const cols = await sql<{ table_name: string; column_name: string; data_type: string }[]>`
    select table_name, column_name, data_type from information_schema.columns
    where table_schema = 'public' and data_type in ('text', 'character varying', 'jsonb')`;

  // "/media/x" at the start of a value or after a non-URL character (quote, paren, space…),
  // optionally prefixed by the old site's own origin (--old-host, default rickmff.com).
  const oldHost = (args.find((a) => a.startsWith("--old-host="))?.split("=")[1] ?? "rickmff.com").replace(/[.]/g, "\\.");
  const pattern = String.raw`(^|[^A-Za-z0-9._~:/-])(https?://(www\.)?` + oldHost + String.raw`)?/media/([A-Fa-f0-9-]+\.[A-Za-z0-9]+)`;
  let rows = 0;
  for (const { table_name: t, column_name: c, data_type: type } of cols) {
    const asText = type === "jsonb" ? sql`${sql(c)}::text` : sql`${sql(c)}`;
    const [{ n }] = await sql<{ n: number }[]>`
      select count(*)::int as n from ${sql(t)} where ${asText} ~ ${pattern}`;
    if (!n) continue;
    console.log(`  ${t}.${c}: ${n} rows`);
    rows += n;
    if (dryRun || !base) continue;
    const replaced = sql`regexp_replace(${asText}, ${pattern}, ${"\\1" + base + "media/\\4"}, 'g')`;
    await sql`update ${sql(t)} set ${sql(c)} = ${type === "jsonb" ? sql`${replaced}::jsonb` : replaced}
      where ${asText} ~ ${pattern}`;
  }
  console.log(`${dryRun ? "would rewrite" : "rewrote"} ${rows} rows`);
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
