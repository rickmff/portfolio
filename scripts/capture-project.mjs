// Records a project's site for the Latest Work carousel: a smooth scroll clip that rests on each
// section, a 4:5 cover that matches the clip's first frame, and the page's title and description.
//   node scripts/capture-project.mjs https://example.com [--out capture/example] [--device desktop|mobile]
//     [--pause 1.2] [--max 22] [--wait 2]
// Writes cover.webp (1200×1500), preview.mp4 (840×1050, H.264, no audio) and meta.json.
// Needs ffmpeg on PATH and a Chromium for Playwright (`pnpm exec playwright install chromium`).
import { execFileSync } from "node:child_process";
import { mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { chromium } from "playwright";
import sharp from "sharp";

const { values: opt, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    out: { type: "string" },
    device: { type: "string", default: "desktop" },
    pause: { type: "string", default: "1.2" },
    max: { type: "string", default: "22" },
    wait: { type: "string", default: "2" },
  },
});
const url = positionals[0];
if (!url) throw new Error("Usage: node scripts/capture-project.mjs <url> [--out dir] [--device desktop|mobile]");

const FPS = 30;
const OUT_W = 840; // twice the 420px card, so it stays sharp on retina screens
const OUT_H = 1050;
const MAX_MB = 6; // the admin upload takes 8 MB per request, cover included
const PAUSE = Number(opt.pause);
const MAX_SECONDS = Number(opt.max);

// Both viewports are 4:5 like the card. Desktop is wide enough for most sites' full layout.
const DEVICES = {
  desktop: { viewport: { width: 1200, height: 1500 }, deviceScaleFactor: 1 },
  mobile: { viewport: { width: 420, height: 525 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
const device = DEVICES[opt.device];
if (!device) throw new Error(`--device must be ${Object.keys(DEVICES).join(" or ")}`);

const host = new URL(url).hostname.replace(/^www\./, "");
const out = path.resolve(opt.out ?? path.join("capture", host.split(".")[0]));
const frames = path.join(out, "frames");
await rm(frames, { recursive: true, force: true });
await mkdir(frames, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({ ...device, reducedMotion: "no-preference", colorScheme: "light" });
await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 }).catch(() => page.waitForLoadState("load"));

// Hide scrollbars, stop CSS smooth scrolling from fighting the scripted one.
await page.addStyleTag({
  content: `html,body{scroll-behavior:auto!important;scrollbar-width:none!important}::-webkit-scrollbar{display:none!important}`,
});

// Close cookie and consent banners so they don't sit on every frame.
const consent = /^(accept|accept all|allow all|agree|i agree|ok|got it|aceitar|aceitar todos|aceito|concordo|entendi|permitir)$/i;
for (const frame of page.frames()) {
  const button = frame.getByRole("button", { name: consent }).first();
  if (await button.isVisible().catch(() => false)) await button.click({ timeout: 2000 }).catch(() => {});
}

// Walk the page once so lazy images load and one-shot reveal animations have played.
await page.evaluate(async () => {
  const step = innerHeight * 0.6;
  for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
    scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 160));
  }
  scrollTo(0, 0);
});
await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
await page.waitForTimeout(Number(opt.wait) * 1000);

// Resting points: the top of each tall block, below any fixed header, plus the very bottom.
const { stops, maxY } = await page.evaluate(() => {
  const vh = innerHeight;
  const maxY = document.documentElement.scrollHeight - vh;
  const header = [...document.querySelectorAll("body *")].find((el) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return (s.position === "fixed" || s.position === "sticky") && r.top <= 0 && r.width > innerWidth / 2 && r.height < vh / 4;
  });
  const offset = header ? header.getBoundingClientRect().height : 0;
  const blocks = document.querySelectorAll("section, footer, main > *, body > div > *, [class*='section' i]");
  const tops = [...blocks]
    .filter((el) => el.getBoundingClientRect().height >= vh * 0.3 && getComputedStyle(el).position !== "fixed")
    .map((el) => Math.round(el.getBoundingClientRect().top + scrollY - offset))
    .filter((y) => y > vh * 0.4 && y < maxY - vh * 0.3)
    .sort((a, b) => a - b);
  const stops = [0];
  for (const y of [...tops, maxY]) if (y - stops.at(-1) >= vh * 0.45) stops.push(Math.min(y, maxY));
  if (stops.at(-1) !== maxY && maxY - stops.at(-1) > 40) stops.push(maxY);
  return { stops, maxY };
});

// Scroll time grows with distance; pauses are fixed. Drop middle stops until it fits the budget.
const vh = device.viewport.height;
const travel = (a, b) => Math.min(2.6, Math.max(0.9, (Math.abs(b - a) / vh) * 1.1));
const duration = (s) => 1.4 + s.slice(1).reduce((t, y, i) => t + travel(s[i], y) + PAUSE, 0) + 0.6;
let plan = stops;
while (plan.length > 2 && duration(plan) > MAX_SECONDS) {
  const gaps = plan.slice(1, -1).map((y, i) => [i + 1, Math.min(y - plan[i], plan[i + 2] - y)]);
  plan = plan.filter((_, i) => i !== gaps.sort((a, b) => a[1] - b[1])[0][0]);
}
// A very long page still gets a single smooth pass, just a quicker one.
const tooLong = duration(plan) > MAX_SECONDS;

let n = 0;
const list = [];
const shoot = async (seconds) => {
  const file = `${String(n++).padStart(5, "0")}.jpg`;
  await page.screenshot({ path: path.join(frames, file), type: "jpeg", quality: 92 });
  list.push({ file, seconds });
};
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
// Pauses are filmed in real time so carousels and other running animations keep moving.
const rest = async (seconds) => {
  const end = Date.now() + seconds * 1000;
  while (Date.now() < end) {
    const t = Date.now();
    await shoot(0);
    list.at(-1).seconds = Math.min((Date.now() - t) / 1000, (end - t) / 1000);
  }
};
// Scrolls are filmed frame by frame, so they stay smooth however slow the screenshots are.
const glide = async (from, to, seconds) => {
  const count = Math.round(seconds * FPS);
  for (let i = 1; i <= count; i++) {
    await page.evaluate((y) => scrollTo(0, y), Math.round(from + (to - from) * ease(i / count)));
    await shoot(1 / FPS);
  }
};

await page.evaluate(() => scrollTo(0, 0));
await page.screenshot({ path: path.join(out, "cover.png"), type: "png" });
await rest(1.4);
for (let i = 1; i < plan.length; i++) {
  await glide(plan[i - 1], plan[i], tooLong ? (MAX_SECONDS - 2) / (plan.length - 1) - 0.3 : travel(plan[i - 1], plan[i]));
  await rest(tooLong ? 0.3 : i === plan.length - 1 ? 0.6 + PAUSE : PAUSE);
}

const meta = await page.evaluate(() => {
  const m = (sel) => document.querySelector(sel)?.getAttribute("content")?.trim() || "";
  return {
    title: m('meta[property="og:site_name"]') || m('meta[property="og:title"]') || document.title.trim(),
    description: m('meta[property="og:description"]') || m('meta[name="description"]'),
  };
});
await browser.close();

// The concat demuxer needs the last frame listed again to honour its duration.
const concat = list.map((f) => `file '${f.file}'\nduration ${Math.max(f.seconds, 0.001).toFixed(4)}`);
concat.push(`file '${list.at(-1).file}'`);
await writeFile(path.join(frames, "list.txt"), `${concat.join("\n")}\n`);

const encode = (crf) =>
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error",
    "-f", "concat", "-safe", "0", "-i", path.join(frames, "list.txt"),
    "-vf", `fps=${FPS},scale=${OUT_W}:${OUT_H}:force_original_aspect_ratio=increase:flags=lanczos,crop=${OUT_W}:${OUT_H}:0:0`,
    "-c:v", "libx264", "-preset", "slow", "-crf", String(crf), "-pix_fmt", "yuv420p",
    "-profile:v", "high", "-movflags", "+faststart", "-an",
    path.join(out, "preview.mp4"),
  ]);
let crf = 23;
encode(crf);
while ((await stat(path.join(out, "preview.mp4"))).size > MAX_MB * 1024 * 1024 && crf < 35) encode((crf += 3));

// Cover = the clip's first frame, so the hover crossfade doesn't jump.
const coverPng = path.join(out, "cover.png");
await sharp(coverPng).resize(1200, 1500, { fit: "cover", position: "top" }).webp({ quality: 84 }).toFile(path.join(out, "cover.webp"));
const { dominant } = await sharp(coverPng).stats();
const tint = `#${[dominant.r, dominant.g, dominant.b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
await rm(coverPng);
await rm(frames, { recursive: true, force: true });

const seconds = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path.join(out, "preview.mp4")]).toString());
const sizes = Object.fromEntries(
  await Promise.all((await readdir(out)).map(async (f) => [f, `${((await stat(path.join(out, f))).size / 1024).toFixed(0)} KB`])),
);
const info = { url, ...meta, tint, year: new Date().getFullYear(), device: opt.device, stops: plan.length, seconds: +seconds.toFixed(1), crf, maxY, sizes };
await writeFile(path.join(out, "meta.json"), `${JSON.stringify(info, null, 2)}\n`);
console.log(JSON.stringify(info, null, 2));
