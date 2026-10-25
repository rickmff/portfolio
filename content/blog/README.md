# Blog content

Source of the posts published on novo.rickmff.com/blog through the content API.

- `<slug>.en.md` / `<slug>.pt.md`: post source (EN is the base, PT goes to `translations.pt`). `img:<key>` is filled from `media.json`. Image sources and licenses live in `credits.json` and are not shown on the page.
- `payloads/<slug>.json`: the rendered body sent to `POST /api/content/posts` or `PATCH /api/content/posts/<id>`.
- `images/`: diagrams drawn for the posts (uploaded to `/media`).
