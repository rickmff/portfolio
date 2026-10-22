// Sets each book's spine colour (and a readable text colour) from its cover image.
//   node scripts/cover-colors.mjs
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const file = new URL("./data/books.json", import.meta.url);
const books = JSON.parse(await readFile(file, "utf8"));
const hex = (c) => `#${[c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
// WCAG relative luminance, to pick black or white spine text.
const lum = ({ r, g, b }) => {
  const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

for (const b of books) {
  if (!b.coverUrl) continue;
  const img = sharp(path.join("public", b.coverUrl));
  const { dominant } = await img.stats();
  b.color = hex(dominant);
  b.ink = lum(dominant) > 0.4 ? "#111111" : "#FFFFFF";
}
await writeFile(file, `${JSON.stringify(books, null, 1)}\n`);
console.log(`coloured ${books.filter((b) => b.coverUrl).length} books`);
