---
name: portfolio
description: Manage the content of rickmff's portfolio (novo.rickmff.com): projects, books, blog, about and harness. Asks which section to edit, interviews for the content, then formats, translates (EN/PT), captures project videos and publishes through the content API.
---

# Portfolio content

Use when the user types `/portfolio` or asks to add, edit, reorder or remove anything on their portfolio site: a project in Latest Work, a book on the shelf, a blog post, the About page, a Harness link, or the hero / "now" lines. The same content can also be edited by hand in the /admin backoffice (Google sign-in, rickmff@gmail.com only); both write to the same database. Talk to the user in Portuguese.

## 0. Connect

- API: `https://novo.rickmff.com/api/content`. Every call needs `Authorization: Bearer $TOKEN`.
- Token: `$PORTFOLIO_TOKEN` if set, otherwise `~/.config/portfolio/token` on the user's Mac. Never print it, write it to another file, commit it or paste it in chat. Read it inline: `TOKEN=$(cat ~/.config/portfolio/token)`.
- Check first: `curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" $API/harness` must print 200.
- **Where to run.** API calls and project captures need the token, open internet, Node, pnpm and ffmpeg. A cloud session usually has none of these (its proxy blocks novo.rickmff.com and most sites). In that case, do the interview and all the writing/translating in the session, and run the commands on the user's Mac: in a Claude project thread, start or reuse a Remote Control session on the Mac and hand it the exact commands; in Claude Code on the Mac, run them directly. The repo checkout on the Mac is needed for project captures (`scripts/capture-project.mjs`). Say this limit to the user in one line when it applies.

## 1. Ask what to edit

Ask one question with these choices (use the ask-question tool if available): **Projetos**, **Livros**, **Blog**, **About**, **Harness**, **Textos do site** (hero, cargo, "now"). Then ask the action: adicionar, editar, reordenar ou remover. For edit/remove/reorder, list the current rows (`GET $API/<collection>`) as short numbered lines and let the user pick.

Interview for what's missing, a few questions at a time, never a long form. Write and format everything yourself; only ask the user for facts, opinions and files.

## 2. Languages (every section)

The site shows English by default and Portuguese to pt-BR visitors. Every human-facing text must exist in both:
- New rows: English in the base fields, Portuguese in `translations.pt` (same field names).
- Existing rows: check which language the base field is in (most books are Portuguese) and put the other one in `translations.en` or `translations.pt`.
- PATCH merges translations per field, so `{"translations":{"pt":{"summary":"…"}}}` keeps the rest; `""` clears one.
- Translate naturally (not word for word), keep Markdown structure, keep names, code and product names as they are. Use the official title of a book in each language when one exists.
- Settings use per-language keys: `about` (English) and `about:pt`, `hero` / `hero:pt`, `role` / `role:pt`, `now` / `now:pt`.

## 3. Sections

### Projetos (Latest Work carousel and /work/<slug>)
Fields: `title`, `summary` (one line, what it is and for whom), `body` (Markdown case study: problem, what I built, result), `year`, `stack` ("Next.js · Postgres · Stripe"), `liveUrl`, `repoUrl`, `tint` (card background hex), `coverUrl` + `previewUrl` (desktop 4:5 cover and muted looping clip), `coverMobileUrl` + `previewMobileUrl` (phone view), `sort` (lower shows first), `published`.
1. Ask for the URL, then what the project is, the user's role, stack, year and repo (optional).
2. Capture on the Mac, in the repo: `node scripts/capture-project.mjs <url> --out capture/<slug>` (both devices by default; `--device desktop|mobile`, `--pause 1.2`, `--max 22`, `--wait 2`). Needs `pnpm install` and `pnpm exec playwright install chromium` once, and ffmpeg. Output: `desktop/{cover.webp,preview.mp4}`, `mobile/{cover.webp,preview.mp4}`, `meta.json` (title, description, tint).
3. Review before publishing: make a contact sheet `ffmpeg -loglevel error -y -i capture/<slug>/desktop/preview.mp4 -vf "fps=1,scale=210:-1,tile=6x3" capture/<slug>/sheet.png`, look at it and the covers. Reject cookie banners, popups, blank unloaded sections, a long empty footer. Fix with `--wait`, `--pause`, `--max`, or a CSS selector in the script's hide list, then re-run. Show the user the cover and sheet and get an OK.
4. Upload each file: `curl -s -H "Authorization: Bearer $TOKEN" -F "file=@capture/<slug>/desktop/cover.webp" $API/media` → `{"url":"/media/…"}` (clips up to 40 MB).
5. Write the summary and body in English and Portuguese, then `POST $API/projects` with JSON (slug comes from the title if omitted). Use `tint` from meta.json. To place it, `POST $API/reorder {"collection":"projects","ids":[…all ids in order…]}`.
Sites behind a login or with scroll-jacking: use `--device mobile` or `--max 4` for just the hero.

### Livros (shelf and /books/<slug>)
Fields: `title`, `author`, `status` (`reading`, `read`, `wishlist` = Waitlist shelf, `abandoned`; never `next`), `finishedYear`, `rating` (1–5), `synopsis`, `notes` (Markdown, hidden behind "Reveal"), `notesGenerated` (true when you drafted the notes), `readUrl` (public-domain editions only, e.g. Project Gutenberg; never pirated PDFs), `color`, `ink`, `coverUrl`, `thickness` (pages ÷ 10, 14–80), `sort`.
1. Ask the title (or ISBN). `GET $API/lookup?q=<title>` → pick the right edition with the user; `GET $API/lookup?key=<key>&coverId=<id>` → synopsis, cover URL, colours.
2. Store the cover: `POST $API/media` with JSON `{"url":"<openlibrary cover url>"}`, or upload a file the user gives.
3. Ask status, year finished and rating. Ask for their notes; if they want you to draft them, write them in their style and set `notesGenerated: true`.
4. Synopsis: 2–3 spoiler-free sentences. Notes style: short bullets, one idea each, **bold** for the key concept, quotes in quotation marks, no intro or conclusion. Write both languages (title too when the book has an official translated title).
5. `POST $API/books`; place it on the shelf with reorder (`collection: "books"`).
The page slug comes from the base title, so don't change a published book's base `title`; put another-language title in translations.

### Blog (/blog and /blog/<slug>)
Fields: `title`, `slug`, `excerpt` (one sentence, used in RSS, previews and the hover card), `body` (Markdown: headings, lists, tables, task lists, footnotes, `> [!NOTE]` callouts, fenced code with a language, images `![alt](url "caption")`), `tags` ("infra, product", up to 3 show), `bannerUrl` (2:1, at least 1600×800), `published`, `publishedAt` (ISO date; future = scheduled).
1. Ask the topic and what they want to say, or take their draft. Edit lightly for clarity, keep their voice; don't invent facts or opinions.
2. Ask for the banner image (a file path or URL). Upload it to `/media`. Images inside the post go to `/media` too.
3. Ask: publish now, schedule (date) or keep as draft.
4. Write title, excerpt and body in both languages; `POST $API/posts`.

### About (/about)
Setting `about` (English) and `about:pt`: Markdown. Format: a short intro paragraph, then `## Experience` with each job as `### Company <small>2023</small>`, then `*Role*` on its own line, then one short description paragraph; then `## Awards` as a bullet list `- **Place · Award** (date) — description`. No Stack or Certificates sections. `PATCH $API/settings {"about":"…","about:pt":"…"}`.

### Harness (/harness)
Fields: `name`, `url`, `description` (one line: what it is and what you use it for), `category` (groups the page, e.g. "Editor", "Infra", "AI"), `sort`. Write `translations.pt.description` (and category if it differs). Batch several items in one go when the user pastes a list.

### Textos do site
Settings `hero` (wrap one or two words in `**…**` for emphasis), `role`, `now`, plus `:pt` variants; `email`, `github`, `linkedin`, `twitter`, `discord` are single values. `GET $API/settings` lists keys and current values.

## 4. API reference

- `GET /<collection>` list (projects, books, posts, harness; drafts included) · `GET /<collection>/<id>`
- `POST /<collection>` create · `PATCH /<collection>/<id>` partial update · `DELETE /<collection>/<id>`
- `GET /settings` · `PATCH /settings {key: value}`
- `POST /media` multipart `file` (images, mp4/webm up to 40 MB) or JSON `{"url"}` for Open Library covers → `{url}`
- `POST /reorder {"collection","ids"}` sets order 1..n
- `GET /lookup?q=` · `GET /lookup?key=&coverId=` (Open Library)
Errors come back as `{"error", "issues"}` with 400 (fix the fields), 401 (token), 409 (slug taken).

## 5. Finish

- Changes are live immediately. Check the page with `curl -s -H 'Accept-Language: en' <page>` and `-H 'Accept-Language: pt-BR'`, or open it, and give the user the link (https://novo.rickmff.com/...).
- Deleting is permanent: confirm with the user first, naming the item.
- Don't commit captures (`capture/` is git-ignored) and never commit the token.
