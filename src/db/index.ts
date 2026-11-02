import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import { dbConfig } from "./url.mjs";

const globalForDb = globalThis as unknown as { libsql?: Client };

// Remote Turso URLs talk HTTP, so there is no pool to size: one client per process is enough.
const client = globalForDb.libsql ?? createClient(dbConfig());

if (process.env.NODE_ENV !== "production") globalForDb.libsql = client;

export const db = drizzle(client, { schema });
export { schema };
