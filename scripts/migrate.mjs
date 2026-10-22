// Runs pending SQL migrations from ./drizzle. Used by the container on boot.
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const client = postgres(url, { max: 1 });
await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
await client.end();
console.log("migrations applied");
