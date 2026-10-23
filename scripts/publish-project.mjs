// Adds a captured project to the site through the admin, the same way you would by hand. The desktop
// pair goes up with the project, the mobile pair in a second save (each save takes 8 MB).
//   ADMIN_PASSWORD=… node scripts/publish-project.mjs capture/example --title "Example" \
//     [--summary "…"] [--stack "Next.js · Postgres"] [--year 2026] [--sort 0] [--repo URL] [--draft]
//     [--id 12]   update that project's cover, clip and fields instead of creating a new one
//     [--site https://novo.rickmff.com]
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { chromium } from "playwright";

const { values: opt, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    site: { type: "string", default: process.env.SITE_URL ?? "https://novo.rickmff.com" },
    id: { type: "string" },
    title: { type: "string" },
    slug: { type: "string" },
    summary: { type: "string" },
    stack: { type: "string" },
    year: { type: "string" },
    sort: { type: "string" },
    repo: { type: "string" },
    tint: { type: "string" },
    draft: { type: "boolean", default: false },
  },
});
const dir = path.resolve(positionals[0] ?? "");
const meta = JSON.parse(await readFile(path.join(dir, "meta.json"), "utf8"));
const password = process.env.ADMIN_PASSWORD;
if (!password) throw new Error("Set ADMIN_PASSWORD for the admin login.");

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage();
const has = async (file) => !!(await stat(path.join(dir, file)).catch(() => null));

let target = opt.id ? `/admin/projects/${opt.id}` : "/admin/projects/new";
await page.goto(new URL(`/admin/login?next=${encodeURIComponent(target)}`, opt.site).href);
await page.fill('input[name="password"]', password);
await page.click('button[type="submit"]');
await page.waitForURL((u) => u.pathname === target, { timeout: 20_000 }).catch(async () => {
  throw new Error((await page.locator(".adm-error").textContent().catch(() => null)) ?? "Login failed.");
});
if (!(await page.locator('input[name="previewMobile"]').count()))
  throw new Error("This admin has no clip upload yet. Deploy the version with the desktop/mobile upload fields first.");

const submit = async () => {
  await page.click('.adm-actions button[type="submit"]');
  const error = await Promise.race([
    page.waitForURL((u) => u.pathname === "/admin/projects", { timeout: 120_000 }).then(() => null),
    page.locator(".adm-error").waitFor({ timeout: 120_000 }).then(() => page.locator(".adm-error").textContent()),
  ]);
  if (error) throw new Error(`Admin refused the project: ${error}`);
};

const set = async (name, value) => {
  if (value != null && value !== "") await page.fill(`[name="${name}"]`, String(value));
};
await set("title", opt.title ?? (opt.id ? null : meta.title));
await set("slug", opt.slug);
await set("summary", opt.summary ?? (opt.id ? null : meta.description));
await set("stack", opt.stack);
await set("year", opt.year ?? (opt.id ? null : meta.year));
await set("sort", opt.sort);
await set("liveUrl", opt.id ? null : meta.url);
await set("repoUrl", opt.repo);
await page.locator('input[name="tint"]').fill((opt.tint ?? meta.tint).toLowerCase());
if (await has("desktop/cover.webp")) await page.setInputFiles('input[name="cover"]', path.join(dir, "desktop/cover.webp"));
if (await has("desktop/preview.mp4")) {
  await page.setInputFiles('input[name="preview"]', path.join(dir, "desktop/preview.mp4"));
  // The uploaded clip replaces whatever URL was there.
  await page.fill('input[name="previewUrl"]', "");
}
await page.locator('input[name="published"]').setChecked(!opt.draft);
await submit();

// Find the project's page in the list to add the phone view to it.
if (!opt.id) target = await page.locator("a", { hasText: opt.title ?? meta.title }).first().getAttribute("href");
if (await has("mobile/preview.mp4")) {
  await page.goto(new URL(target, opt.site).href);
  await page.setInputFiles('input[name="coverMobile"]', path.join(dir, "mobile/cover.webp"));
  await page.setInputFiles('input[name="previewMobile"]', path.join(dir, "mobile/preview.mp4"));
  await submit();
}
await browser.close();
console.log(JSON.stringify({ ok: true, admin: new URL(target, opt.site).href, home: opt.site }, null, 2));
