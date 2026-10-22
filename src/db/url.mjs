// Resolves the Postgres URL on a VPS (DATABASE_URL) or on Vercel, where the Neon/Supabase
// integrations inject POSTGRES_URL (pooled) and POSTGRES_URL_NON_POOLING / DATABASE_URL_UNPOOLED.
// Integration URLs carry extra query params (e.g. `supa=`) that Postgres rejects as startup
// options, so only sslmode is kept.
export function databaseUrl({ direct = false } = {}) {
  const env = process.env;
  const raw = direct
    ? env.DATABASE_URL_UNPOOLED || env.POSTGRES_URL_NON_POOLING || env.DATABASE_URL || env.POSTGRES_URL
    : env.DATABASE_URL || env.POSTGRES_URL;
  if (!raw) return undefined;
  const url = new URL(raw);
  const sslmode = url.searchParams.get("sslmode");
  url.search = sslmode ? `?sslmode=${sslmode}` : "";
  return url.toString();
}
