// One-off copy of the current Postgres database (VPS or Neon) into Turso.
// Run `pnpm db:migrate` against Turso first so the tables exist, then:
//
//   PG_URL=postgres://… TURSO_DATABASE_URL=libsql://… TURSO_AUTH_TOKEN=… pnpm migrate:turso --dry-run
//   PG_URL=postgres://… TURSO_DATABASE_URL=libsql://… TURSO_AUTH_TOKEN=… pnpm migrate:turso --replace
//
// --replace empties the Turso tables first (needed when the first deploy already seeded sample
// content). Ids are kept, so links between rows and admin URLs stay the same, and the
// autoincrement counters continue from the highest id. Types are converted on the way:
// timestamps → epoch milliseconds, booleans → 0/1, jsonb → JSON text.
import { createClient, type InValue } from "@libsql/client";
import postgres from "postgres";
import { dbConfig } from "../src/db/url.mjs";

// Parents first is irrelevant here (no foreign keys), but a stable order makes the log readable.
const TABLES = ["settings", "projects", "books", "posts", "harness"] as const;
const BATCH = 100;

function toSqlite(v: unknown): InValue {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v.getTime();
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "object") return JSON.stringify(v);
  return v as InValue;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const replace = args.includes("--replace");
  const from = process.env.PG_URL ?? args.find((a) => /^postgres(ql)?:/.test(a));
  if (!from) throw new Error("Set PG_URL to the Postgres connection string to copy from");
  const target = dbConfig();
  if (target.url.startsWith("file:") && !args.includes("--local")) {
    throw new Error(`Target is a local file (${target.url}). Set TURSO_DATABASE_URL, or pass --local to copy into it on purpose.`);
  }

  const pg = postgres(from, { max: 1, prepare: false });
  const turso = createClient(target);
  console.log(`copying ${new URL(from).host} → ${target.url}${dryRun ? " (dry run)" : ""}`);

  for (const t of TABLES) {
    const cols = (await turso.execute(`pragma table_info("${t}")`)).rows.map((r) => String(r.name));
    if (!cols.length) throw new Error(`Table ${t} is missing in Turso: run pnpm db:migrate against it first`);
    const pgCols = new Set((await pg`select column_name from information_schema.columns where table_schema = 'public' and table_name = ${t}`).map((r) => r.column_name as string));
    const missing = cols.filter((c) => !pgCols.has(c));
    if (missing.length) console.warn(`  ${t}: not in Postgres, left at default: ${missing.join(", ")}`);
    const shared = cols.filter((c) => pgCols.has(c));

    const rows = await pg.unsafe(`select ${shared.map((c) => `"${c}"`).join(", ")} from "${t}" order by 1`);
    const [{ n: existing }] = (await turso.execute(`select count(*) as n from "${t}"`)).rows as unknown as { n: number }[];
    console.log(`  ${t}: ${rows.length} rows in Postgres, ${existing} already in Turso`);
    if (dryRun) continue;
    if (existing && !replace) throw new Error(`${t} already has rows in Turso; pass --replace to overwrite them`);

    const insert = `insert into "${t}" (${shared.map((c) => `"${c}"`).join(", ")}) values (${shared.map(() => "?").join(", ")})`;
    const statements = [
      ...(replace ? [{ sql: `delete from "${t}"`, args: [] }] : []),
      ...rows.map((r) => ({ sql: insert, args: shared.map((c) => toSqlite(r[c])) })),
    ];
    // Each chunk of 100 is atomic. If one fails midway, fix the cause and rerun with --replace.
    for (let i = 0; i < statements.length; i += BATCH) await turso.batch(statements.slice(i, i + BATCH), "write");

    const [{ n: after }] = (await turso.execute(`select count(*) as n from "${t}"`)).rows as unknown as { n: number }[];
    if (Number(after) !== rows.length) throw new Error(`${t}: copied ${after} rows, expected ${rows.length}`);
  }

  await pg.end();
  turso.close();
  console.log(dryRun ? "dry run done, nothing written" : "done: row counts match");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
