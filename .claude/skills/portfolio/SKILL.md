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
Fields: `title`, `summary` (one line, what it is and for whom), `body` (Markdown case study: problem, what I built, result), `year`, `stack` (kept in the data, not shown on the site), `liveUrl`, `repoUrl` (only if public), `tint` (card background hex), `showcaseUrl` + `showcasePosterUrl` (the 16:9 desktop film the card plays on hover, and its first frame), `previewMobileUrl` + `coverMobileUrl` (the 9:16 mobile reel and its first frame; they turn on the card's Desktop · Mobile buttons), `showcaseMobileAt` (only for older films with a phone part and no mobile reel: set it to null when you add a reel), `coverUrl` + `previewUrl` (older 4:5 desktop clip; the card falls back to it when there is no showcase), `sort` (lower shows first), `published`.
1. Ask for the URL, then what the project is, the user's role, stack, year and repo (optional). Read the site and, if the user points to it, the repo (`gh`) for facts.
2. Film it on the Mac, in the repo: `node scripts/showcase-project.mjs <url> --out capture/<slug>` (options: `--device both|desktop|mobile`, `--desktop 22` and `--mobile 16` seconds of scroll, `--pause 1.6` rest per section, `--wait 3`, `--cookie NAME=VALUE` to pin a language when the site picks it from the visitor's location, e.g. `--cookie NEXT_LOCALE=en`; `--hide "<css selector>"` for a banner the script doesn't close by itself; `--mobile-url <url>` when the phone should show a different page, such as a demo store; an archived page works as a `web.archive.org/web/<ts>if_/<url>` link, where `if_` drops the Wayback toolbar). It films at a true 60 fps on virtual time, full frame with no background, window or phone drawn around the site, and writes `showcase.mp4` + `showcase.webp` (the desktop site, 1920×1080) and `mobile.mp4` + `mobile.webp` (the mobile site, 1080×1920, the reels format). Each clip scrolls down resting on each section, then glides back to the top so it loops cleanly. Takes a few minutes.
3. Review before publishing: contact sheet `ffmpeg -loglevel error -y -i capture/<slug>/showcase.mp4 -vf "fps=1,scale=320:-1,tile=6x5" capture/<slug>/sheet.png` (and `mobile.mp4` with `scale=180:-1,tile=9x3`); look at it. Reject cookie banners, popups, blank unloaded sections. Fix with `--wait`, `--pause`, `--desktop`/`--mobile` and re-run (`--device mobile` re-films only the reel). Open the sheet and the mp4 for the user (`open …`) and get an OK.
4. Upload: `curl -s -H "Authorization: Bearer $TOKEN" -F "file=@capture/<slug>/showcase.mp4" $API/media` and the same for `showcase.webp`, `mobile.mp4` and `mobile.webp` → `{"url":"/media/…"}` (up to 40 MB).
5. Write the summary and body in English and Portuguese, then `POST $API/projects` with JSON including `showcaseUrl`, `showcasePosterUrl`, `previewMobileUrl`, `coverMobileUrl` and `showcaseMobileAt: null` (slug comes from the title if omitted). To place it, `POST $API/reorder {"collection":"projects","ids":[…all ids in order…]}`.
The older 4:5 desktop clip still works: `node scripts/capture-project.mjs <url> --out capture/<slug> --device desktop` writes `desktop/{cover.webp,preview.mp4}` and `thumbnail.webp` (the site's share image on a 4:5 card).
Sites behind a login or with scroll-jacking: lower `--desktop`, or use `--no-pwa` when the phone flow makes no sense.

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
