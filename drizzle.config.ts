import { defineConfig } from "drizzle-kit";
import { dbConfig } from "./src/db/url.mjs";

const { url, authToken } = dbConfig();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: { url, authToken },
});
