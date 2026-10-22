import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { databaseUrl } from "./url.mjs";

const globalForDb = globalThis as unknown as { pg?: ReturnType<typeof postgres> };

const client =
  globalForDb.pg ??
  postgres(databaseUrl() ?? "postgres://portfolio:portfolio@localhost:5432/portfolio", {
    // Serverless functions each hold their own pool; keep it tiny there.
    max: process.env.VERCEL ? 1 : 10,
    // Transaction-mode poolers (Supabase, Neon pooled) don't support prepared statements.
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pg = client;

export const db = drizzle(client, { schema });
export { schema };
