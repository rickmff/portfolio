# Blog content

Source of the posts published on novo.rickmff.com/blog through the content API.

- `<slug>.en.md` / `<slug>.pt.md`: post source (EN is the base, PT goes to `translations.pt`). `img:<key>` and `{{credit:<key>}}` are filled from `media.json` and `credits.json`.
- `payloads/<slug>.json`: the rendered body sent to `POST /api/content/posts` or `PATCH /api/content/posts/<id>`.
- `images/`: diagrams drawn for the posts (uploaded to `/media`).
