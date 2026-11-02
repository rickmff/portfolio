// Runs pending SQL migrations from ./drizzle against Turso (or a local SQLite file).
// Used by the Vercel build (pnpm vercel-build) and `pnpm db:migrate`.
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { dbConfig, ensureLocalDir } from "../src/db/url.mjs";

const config = dbConfig();
await ensureLocalDir(config.url);
const client = createClient(config);
await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
client.close();
console.log(`migrations applied (${new URL(config.url).protocol.replace(":", "")})`);
