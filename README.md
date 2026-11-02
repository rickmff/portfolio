# Portfolio

Minimal portfolio with a project gallery, an interactive 3D bookshelf, a blog and a backoffice to manage it all. Runs on Vercel (Turso + Vercel Blob) or self‑hosted on a single VPS with Docker.

- **Next.js 15** (App Router, server actions) + **TypeScript**
- **Turso** (libSQL / SQLite) + **Drizzle ORM** (SQL migrations in `drizzle/`; the old Postgres ones are kept in `drizzle-pg/` for reference)
- **CSS 3D** books, no WebGL needed
- **/admin** backoffice: projects, books, posts, harness and site texts, each with English and Portuguese versions
- **Content API** (`/api/content`, bearer token) for projects, books, posts, harness, settings and media, driven by the `portfolio` Claude skill. Every text field can carry English and Portuguese versions
- **GitHub contribution graph** on the home page, read server-side from the profile in Settings and cached for an hour (optional `GITHUB_TOKEN` switches it to the GraphQL API)
- **Vercel** (Turso + Blob) or **Docker Compose** with Caddy (automatic HTTPS) and Turso or a local SQLite file

## Local development

```bash
pnpm install
cp .env.example .env.local          # set CONTENT_API_TOKEN (openssl rand -hex 32)
pnpm db:migrate && pnpm db:seed     # schema + sample content in ./data/portfolio.db (no server needed)
pnpm dev                            # http://localhost:3000, backoffice at /admin, content API at /api/content
```

Change the schema in `src/db/schema.ts`, then `pnpm db:generate` to write a migration.

## Deploying to Vercel

1. Import the repo in Vercel. `vercel.json` sets the build to `pnpm vercel-build` (migrations, seed/backfill, `next build`) and the functions region to `fra1`.
2. Storage: a **Turso** database (Marketplace integration, or `turso db create` + `turso db tokens create`) in the region closest to `fra1`, and a **Blob** store. Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` (the integration does it) and `BLOB_READ_WRITE_TOKEN`.
   - Turso has no automatic per-deploy branches, and the build runs migrations. Give the **Preview** environment its own database (e.g. `portfolio-preview`) so previews never migrate production.
3. Environment variables: `SESSION_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ADMIN_EMAIL`, `CONTENT_API_TOKEN`, `SITE_URL` (e.g. `https://rickmff.com`), and optionally `GOOGLE_BOOKS_API_KEY`, `GITHUB_TOKEN`.
4. Add the Google OAuth redirect URI `https://<domain>/admin/auth/callback`.

With `BLOB_READ_WRITE_TOKEN` set, uploads go to Vercel Blob instead of the local disk, and `/media/<file>` redirects to the Blob copy. Vercel caps request bodies at 4.5 MB, so uploads through the admin or the content API are limited to 4 MB there.

### Moving an existing VPS install

1. Copy the database: open an SSH tunnel to the VPS Postgres, run `pnpm db:migrate` against Turso, then `PG_URL=… pnpm migrate:turso --dry-run` and `pnpm migrate:turso --replace` (`scripts/migrate-pg-to-turso.ts`). Ids are kept and every row count is checked.
2. Copy the `uploads` volume to `./uploads-vps`, then `pnpm migrate:blob ./uploads-vps --dry-run` and `pnpm migrate:blob ./uploads-vps` (with `BLOB_READ_WRITE_TOKEN`, `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` set). It uploads every file to Blob under `media/<name>` and rewrites the `/media/…` URLs in the database.
3. Redeploy, check the `*.vercel.app` URL, then point the domain at Vercel.

## Deploying to the VPS

1. Point your domain's A/AAAA records at the server.
2. On the server: clone the repo, `cp .env.example .env`, fill in `DOMAIN` and `CONTENT_API_TOKEN`, plus `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` to use Turso (without them the app keeps a SQLite file in the `data` volume).
3. `docker compose up -d --build`

Migrations run automatically when the app container starts. Caddy fetches the TLS certificate. Uploaded images live in the `uploads` volume; back it up. With Turso the database is backed up by Turso (point-in-time restore); with the local file, back up the `data` volume (for example `docker compose cp app:/app/data/portfolio.db ./backup.db`).


## Importing the old rickmff.com content

The previous site loads its content from Contentful in the browser, so it is imported through the Contentful Delivery API rather than scraped:

```bash
CONTENTFUL_SPACE_ID=… CONTENTFUL_ACCESS_TOKEN=… pnpm import:contentful --dry-run   # preview
CONTENTFUL_SPACE_ID=… CONTENTFUL_ACCESS_TOKEN=… pnpm import:contentful             # write
```

`work` entries become projects (thumbnail → cover, gif/video → hover preview, files downloaded into `uploads/`), and the `about` entries (profile, experience, stack, awards, certificates) become the About page, editable under Settings. Re-running updates projects by slug.

## Structure

```
src/app/(site)      public pages: home, /work/[slug], /books, /blog, /blog/[slug]
src/app/admin       backoffice (login, CRUD, settings) and server actions
src/app/api/content content API (CRUD, settings, media, reorder, book lookup)
src/components      BookStage (3D book), WorkGallery, WritingList
src/db              Drizzle schema and client
scripts/            migrate, seed, migrate-pg-to-turso, migrate-uploads-to-blob, imports
```
