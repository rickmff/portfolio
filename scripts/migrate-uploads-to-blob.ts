// One-off move from the VPS to Vercel: uploads every file of a local copy of the `uploads`
// volume to Vercel Blob (as media/<name>, same name as before), then rewrites every
// "/media/<name>" (and "https://<old-domain>/media/<name>") the database holds to the Blob URL.
//
//   BLOB_READ_WRITE_TOKEN=… TURSO_DATABASE_URL=… TURSO_AUTH_TOKEN=… pnpm migrate:blob ./uploads-vps --dry-run
//   BLOB_READ_WRITE_TOKEN=… TURSO_DATABASE_URL=… TURSO_AUTH_TOKEN=… pnpm migrate:blob ./uploads-vps
//   (--old-host=example.com if absolute links point at another domain; default rickmff.com)
//
// Safe to re-run: files already in Blob are skipped and rewritten rows no longer match.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { head, put } from "@vercel/blob";
import { createClient } from "@libsql/client";
import { dbConfig } from "../src/db/url.mjs";

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

  // Every text column of every table: covers, previews, banners, Markdown bodies, settings
  // values and the JSON translations. SQLite has no regexp_replace, so rows are rewritten here.
  const db = createClient(dbConfig());
  const tables = (await db.execute(`select name from sqlite_master where type = 'table' and name not like 'sqlite_%' and name not like '\\_\\_%' escape '\\'`)).rows.map((r) => String(r.name));

  // "/media/x" at the start of a value or after a non-URL character (quote, paren, space…),
  // optionally prefixed by the old site's own origin (--old-host, default rickmff.com).
  const oldHost = (args.find((a) => a.startsWith("--old-host="))?.split("=")[1] ?? "rickmff.com").replace(/[.]/g, "\\.");
  const pattern = new RegExp(String.raw`(^|[^A-Za-z0-9._~:/-])(https?://(www\.)?` + oldHost + String.raw`)?/media/([A-Fa-f0-9-]+\.[A-Za-z0-9]+)`, "g");
  let rows = 0;
  for (const t of tables) {
    const cols = (await db.execute(`pragma table_info("${t}")`)).rows
      .filter((r) => /^text/i.test(String(r.type)))
      .map((r) => String(r.name));
    for (const c of cols) {
      const found = (await db.execute(`select rowid as rid, "${c}" as v from "${t}" where "${c}" like '%/media/%'`)).rows;
      const changes = found
        .map((r) => ({ rid: r.rid, before: String(r.v), after: String(r.v).replace(pattern, `$1${base ?? ""}media/$4`) }))
        .filter((r) => r.before.replace(pattern, "") !== r.before);
      if (!changes.length) continue;
      console.log(`  ${t}.${c}: ${changes.length} rows`);
      rows += changes.length;
      if (dryRun || !base) continue;
      await db.batch(
        changes.map((r) => ({ sql: `update "${t}" set "${c}" = ? where rowid = ?`, args: [r.after, r.rid] })),
        "write",
      );
    }
  }
  console.log(`${dryRun ? "would rewrite" : "rewrote"} ${rows} rows`);
  db.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
