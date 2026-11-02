# Old Postgres migrations

The site ran on Postgres until it moved to Turso (SQLite). These are the Postgres migrations it
used, kept for reference and for rolling back to an old Postgres-based build. The live
migrations are in `../drizzle/`; `pnpm migrate:turso` copies an existing Postgres database over.
