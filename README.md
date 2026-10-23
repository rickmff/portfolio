# Portfolio

Minimal portfolio with a project gallery, an interactive 3D bookshelf, a blog and a backoffice to manage it all. Built to self‑host on a single VPS.

- **Next.js 15** (App Router, server actions) + **TypeScript**
- **Postgres** + **Drizzle ORM** (SQL migrations in `drizzle/`)
- **CSS 3D** books, no WebGL needed
- **Content API** (`/api/content`, bearer token) for projects, books, posts, harness, settings and media, driven by the `portfolio` Claude skill instead of a backoffice. Every text field can carry English and Portuguese versions
- **Docker Compose** with Postgres and Caddy (automatic HTTPS)

## Local development

```bash
pnpm install
cp .env.example .env.local          # set DATABASE_URL and CONTENT_API_TOKEN (openssl rand -hex 32)
pnpm db:migrate && pnpm db:seed     # schema + sample content
pnpm dev                            # http://localhost:3000, content API at /api/content
```

Change the schema in `src/db/schema.ts`, then `pnpm db:generate` to write a migration.

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
src/app/api/content content API (CRUD, settings, media, reorder, book lookup)
src/components      BookStage (3D book), WorkStrip, WritingList
src/db              Drizzle schema and client
scripts/            migrate, seed, hash-password
```
