/**
 * Checks that the block editor's Markdown conversion is lossless: every post under content/blog is
 * converted to editor blocks and back, and must render to the same HTML as the original.
 * Run: pnpm check:editor
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { docToMarkdown, markdownToDoc } from "../src/components/admin/editor/markdown";
import { renderMarkdown } from "../src/lib/markdown";

const dir = join(process.cwd(), "content/blog");
const extra = process.argv.slice(2);
const files = extra.length ? extra : readdirSync(dir).filter((f) => f.endsWith(".md") && f !== "README.md").map((f) => join(dir, f));
const norm = (h: string) => h.replace(/>\s+</g, "><").replace(/\s+/g, " ").trim();

let failed = 0;
for (const file of files) {
  const src = readFileSync(file, "utf8");
  try {
  const once = docToMarkdown(markdownToDoc(src));
  const twice = docToMarkdown(markdownToDoc(once));
  const a = norm(renderMarkdown(src));
  const b = norm(renderMarkdown(once));
  const problems: string[] = [];
  if (a !== b) {
    let i = 0;
    while (a[i] === b[i]) i++;
    problems.push(`HTML differs at ${i}:\n  before: …${a.slice(Math.max(0, i - 80), i + 120)}\n  after:  …${b.slice(Math.max(0, i - 80), i + 120)}`);
  }
  if (once !== twice) problems.push("Markdown is not stable after a second round trip");
  console.log(`${problems.length ? "✗" : "✓"} ${file.split("/").pop()}`);
  for (const p of problems) console.log(`  ${p}`);
  if (problems.length) failed++;
  } catch (e) {
    console.log(`✗ ${file.split("/").pop()}\n  ${(e as Error).message}`);
    failed++;
  }
}
if (failed) {
  console.log(`\n${failed} of ${files.length} files changed after the round trip.`);
  process.exit(1);
}
console.log(`\nAll ${files.length} files survive the round trip.`);
