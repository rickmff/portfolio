# Portfolio

Minimal portfolio with a project gallery, an interactive 3D bookshelf, a blog and a backoffice to manage it all. Runs on Vercel (Neon Postgres + Vercel Blob) or self‑hosted on a single VPS with Docker.

- **Next.js 15** (App Router, server actions) + **TypeScript**
- **Postgres** + **Drizzle ORM** (SQL migrations in `drizzle/`)
- **CSS 3D** books, no WebGL needed
- **/admin** backoffice: projects, books, posts, harness and site texts, each with English and Portuguese versions
- **Content API** (`/api/content`, bearer token) for projects, books, posts, harness, settings and media, driven by the `portfolio` Claude skill. Every text field can carry English and Portuguese versions
- **GitHub contribution graph** on the home page, read server-side from the profile in Settings and cached for an hour (optional `GITHUB_TOKEN` switches it to the GraphQL API)
- **Vercel** (Neon + Blob) or **Docker Compose** with Postgres and Caddy (automatic HTTPS)

## Local development

```bash
pnpm install
cp .env.example .env.local          # set DATABASE_URL and CONTENT_API_TOKEN (openssl rand -hex 32)
pnpm db:migrate && pnpm db:seed     # schema + sample content
pnpm dev                            # http://localhost:3000, backoffice at /admin, content API at /api/content
```

Change the schema in `src/db/schema.ts`, then `pnpm db:generate` to write a migration.

## Deploying to Vercel

1. Import the repo in Vercel. `vercel.json` sets the build to `pnpm vercel-build` (migrations, seed/backfill, `next build`) and the functions region to `fra1`.
2. Storage: add a **Neon** Postgres database (Marketplace, same region, preview branching on) and a **Blob** store. They inject `DATABASE_URL`/`POSTGRES_URL` and `BLOB_READ_WRITE_TOKEN`.
3. Environment variables: `SESSION_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ADMIN_EMAIL`, `CONTENT_API_TOKEN`, `SITE_URL` (e.g. `https://rickmff.com`), and optionally `GOOGLE_BOOKS_API_KEY`, `GITHUB_TOKEN`.
4. Add the Google OAuth redirect URI `https://<domain>/admin/auth/callback`.

With `BLOB_READ_WRITE_TOKEN` set, uploads go to Vercel Blob instead of the local disk, and `/media/<file>` redirects to the Blob copy. Vercel caps request bodies at 4.5 MB, so uploads through the admin or the content API are limited to 4 MB there.

### Moving an existing VPS install

1. Copy the database: `pg_dump -Fc` on the VPS, then `pg_restore --clean --if-exists --no-owner --no-acl -d "$DATABASE_URL_UNPOOLED"` into Neon.
2. Copy the `uploads` volume to `./uploads-vps`, then `pnpm migrate:blob ./uploads-vps --dry-run` and `pnpm migrate:blob ./uploads-vps` (with `BLOB_READ_WRITE_TOKEN` and the Neon `DATABASE_URL` set). It uploads every file to Blob under `media/<name>` and rewrites the `/media/…` URLs in the database.
3. Redeploy, check the `*.vercel.app` URL, then point the domain at Vercel.

## Deploying to the VPS

1. Point your domain's A/AAAA records at the server.
2. On the server: clone the repo, `cp .env.example .env`, fill in `DOMAIN`, `POSTGRES_PASSWORD`, and `CONTENT_API_TOKEN`.
3. `docker compose up -d --build`

Migrations run automatically when the app container starts. Caddy fetches the TLS certificate. Uploaded images live in the `uploads` volume and the database in `pgdata`; back both up (for example `docker compose exec db pg_dump -U portfolio portfolio > backup.sql`).


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
scripts/            migrate, seed, migrate-uploads-to-blob, imports
```
