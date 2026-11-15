# Portfolio

Source of [rickmff.com](https://rickmff.com), the personal site of Henrique Matos. A minimalist portfolio with a small backoffice to manage all of its content.

## Features

- **Work**: a project gallery with case-study pages.
- **Books**: an interactive 3D bookshelf, book pages with notes, and a quotes page.
- **Blog**: posts in English and Portuguese, with RSS.
- **Admin** (`/admin`): a Notion-style editor (Tiptap) for projects, books, posts and settings. Google sign-in, limited to one account.
- **Content API** (`/api/content`): token-protected endpoints to publish content from scripts.
- SEO extras: sitemap, Open Graph images, `llms.txt`.

## Stack

- [Next.js 15](https://nextjs.org) (App Router), React 19, TypeScript
- Tailwind CSS 4
- [Drizzle ORM](https://orm.drizzle.team) on [Turso](https://turso.tech) (libSQL); local SQLite in development
- Vercel Blob for uploads, Vercel Analytics, Flags SDK
- Hosted on [Vercel](https://vercel.com)

## Run locally

Requires Node.js 20+ and pnpm 10.

```bash
pnpm install
cp .env.example .env.local   # fill in the values below
pnpm db:migrate              # create the schema
pnpm db:seed                 # load sample content
pnpm dev                     # http://localhost:3000
```

With no Turso variables set, the app uses a local SQLite file at `./data/portfolio.db` and stores uploads in `./uploads`.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `SESSION_SECRET` | Yes | Signs admin sessions. Generate with `openssl rand -base64 48`. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Yes, for `/admin` | Google OAuth client. Redirect URI: `<SITE_URL>/admin/auth/callback`. |
| `ADMIN_EMAIL` | Yes, for `/admin` | The only Google account allowed into the admin. |
| `SITE_URL` | Yes | Public URL for OAuth, sitemap and canonical links. Defaults to `http://localhost:3000`. |
| `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` | Production | Turso database. Leave empty for local SQLite. |
| `DATABASE_URL` | No | Local database file. Default `file:./data/portfolio.db`. |
| `CONTENT_API_TOKEN` | No | Enables the content API (min. 32 chars). Generate with `openssl rand -hex 32`. |
| `BLOB_READ_WRITE_TOKEN` | No | Stores uploads in Vercel Blob instead of the local disk. |
| `GOOGLE_BOOKS_API_KEY` | No | Book previews from the Google Books API. |
| `GITHUB_TOKEN` | No | GitHub contribution graph on the home page. Works without it. |

## Scripts

| Command | Action |
| --- | --- |
| `pnpm dev` | Start the dev server. |
| `pnpm build` / `pnpm start` | Build and serve for production. |
| `pnpm lint` / `pnpm typecheck` | Lint and type-check. |
| `pnpm db:generate` | Generate a migration from `src/db/schema.ts`. |
| `pnpm db:migrate` | Apply migrations. |
| `pnpm db:seed` | Seed sample content and sync book data. |
| `pnpm db:studio` | Open Drizzle Studio. |

## Deploying to Vercel

1. Import the repository in Vercel.
2. Add the Turso integration, or set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` yourself.
3. Connect a Blob store for uploads.
4. Set the other variables from the table above.

The build runs `pnpm vercel-build`: it applies migrations, seeds, then builds Next.js. The build fails on purpose if `TURSO_DATABASE_URL` is missing.

## Project structure

```
src/app/(site)   public pages: home, work, books, quotes, blog, about
src/app/admin    backoffice
src/app/api      content API
src/components   UI components (3D book, shelf, gallery, ...)
src/db           Drizzle schema and connection
src/lib          data access, auth, i18n, markdown, SEO
drizzle/         SQL migrations
scripts/         migrate, seed and import scripts
```
