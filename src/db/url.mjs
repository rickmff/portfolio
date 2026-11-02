// Resolves the libSQL connection: Turso in production (TURSO_DATABASE_URL + TURSO_AUTH_TOKEN,
// the names the Turso Vercel integration injects) or a local SQLite file for dev and Docker
// (DATABASE_URL=file:./data/portfolio.db). A leftover postgres:// DATABASE_URL is ignored so
// an old .env doesn't break the switch.
export function dbConfig() {
  const env = process.env;
  const fromDatabaseUrl = env.DATABASE_URL && !/^postgres(ql)?:/.test(env.DATABASE_URL) ? env.DATABASE_URL : undefined;
  const url = env.TURSO_DATABASE_URL || env.LIBSQL_URL || fromDatabaseUrl || "file:./data/portfolio.db";
  const authToken = env.TURSO_AUTH_TOKEN || env.LIBSQL_AUTH_TOKEN || undefined;
  return { url, authToken };
}

/** Makes sure the folder of a file: URL exists, since SQLite won't create it. */
export async function ensureLocalDir(url) {
  if (!url.startsWith("file:")) return;
  const { mkdir } = await import("node:fs/promises");
  const { dirname } = await import("node:path");
  await mkdir(dirname(url.slice("file:".length)), { recursive: true });
}
