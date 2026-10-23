// Records a project's site for the Latest Work carousel, on desktop and on a phone: a smooth scroll
// clip that rests on each section, a cover that matches the clip's first frame, and the page meta.
//   node scripts/capture-project.mjs https://example.com [--out capture/example] [--device both|desktop|mobile]
//     [--pause 1.2] [--max 22] [--wait 2]
// Writes desktop/{cover.webp,preview.mp4} (4:5, fills the card), mobile/{cover.webp,preview.mp4}
// (390×844 phone screen, shown in a phone frame) and meta.json.
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
    device: { type: "string", default: "both" },
    pause: { type: "string", default: "1.2" },
    max: { type: "string", default: "22" },
    wait: { type: "string", default: "2" },
  },
});
const url = positionals[0];
if (!url) throw new Error("Usage: node scripts/capture-project.mjs <url> [--out dir] [--device both|desktop|mobile]");

const FPS = 30;
const PAUSE = Number(opt.pause);
const MAX_SECONDS = Number(opt.max);

// Desktop is 4:5 like the card and wide enough for most sites' full layout; the clip is twice the
// 420px card so it stays sharp on retina screens. Mobile is an iPhone screen at 2x.
// Each save in the admin takes 8 MB, so the desktop pair and the mobile pair go up separately.
const DEVICES = {
  desktop: {
    context: { viewport: { width: 1200, height: 1500 }, deviceScaleFactor: 1 },
    clip: [840, 1050],
    cover: [1200, 1500],
    maxMb: 6,
  },
  mobile: {
    context: {
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
    },
    clip: [480, 1038],
    cover: [780, 1688],
    maxMb: 6,
  },
};
const names = opt.device === "both" ? ["desktop", "mobile"] : [opt.device];
for (const n of names) if (!DEVICES[n]) throw new Error("--device must be both, desktop or mobile");

const host = new URL(url).hostname.replace(/^www\./, "");
const out = path.resolve(opt.out ?? path.join("capture", host.split(".")[0]));
const hex = (c) => `#${[c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const consent = /^(accept|accept all|allow all|agree|i agree|ok|got it|aceitar|aceitar todos|aceito|concordo|entendi|permitir)$/i;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

async function capture(name) {
  const { context, clip, cover, maxMb } = DEVICES[name];
  const dir = path.join(out, name);
  const frames = path.join(dir, "frames");
  await rm(dir, { recursive: true, force: true });
  await mkdir(frames, { recursive: true });

  const page = await browser.newPage({ ...context, reducedMotion: "no-preference", colorScheme: "light" });
  // Sites that keep polling never reach network idle; loaded is enough for those.
  await page.goto(url, { waitUntil: "networkidle", timeout: 45_000 }).catch(async (e) => {
    if (e.name !== "TimeoutError") throw e;
  });

  // Hide scrollbars, stop CSS smooth scrolling from fighting the scripted one.
  await page.addStyleTag({
    content: `html,body{scroll-behavior:auto!important;scrollbar-width:none!important}::-webkit-scrollbar{display:none!important}`,
  });

  // Close cookie and consent banners so they don't sit on every frame.
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

  // Scroll time grows with distance; pauses are fixed. Drop the most crowded stops until it fits.
  const vh = context.viewport.height;
  const travel = (a, b) => Math.min(2.6, Math.max(0.9, (Math.abs(b - a) / vh) * 1.1));
  const duration = (s) => 1.4 + s.slice(1).reduce((t, y, i) => t + travel(s[i], y) + PAUSE, 0) + 0.6;
  let plan = stops;
  while (plan.length > 2 && duration(plan) > MAX_SECONDS) {
    const gaps = plan.slice(1, -1).map((y, i) => [i + 1, Math.min(y - plan[i], plan[i + 2] - y)]);
    const drop = gaps.sort((a, b) => a[1] - b[1])[0][0];
    plan = plan.filter((_, i) => i !== drop);
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
  const coverPng = path.join(dir, "cover.png");
  await page.screenshot({ path: coverPng, type: "png" });
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
  await page.close();

  // The concat demuxer needs the last frame listed again to honour its duration.
  const concat = list.map((f) => `file '${f.file}'\nduration ${Math.max(f.seconds, 0.001).toFixed(4)}`);
  concat.push(`file '${list.at(-1).file}'`);
  await writeFile(path.join(frames, "list.txt"), `${concat.join("\n")}\n`);

  const [w, h] = clip;
  const mp4 = path.join(dir, "preview.mp4");
  const encode = (crf) =>
    execFileSync("ffmpeg", [
      "-y", "-loglevel", "error",
      "-f", "concat", "-safe", "0", "-i", path.join(frames, "list.txt"),
      "-vf", `fps=${FPS},scale=${w}:${h}:force_original_aspect_ratio=increase:flags=lanczos,crop=${w}:${h}:0:0`,
      "-c:v", "libx264", "-preset", "slow", "-crf", String(crf), "-pix_fmt", "yuv420p",
      "-profile:v", "high", "-movflags", "+faststart", "-an",
      mp4,
    ]);
  let crf = 23;
  encode(crf);
  while ((await stat(mp4)).size > maxMb * 1024 * 1024 && crf < 35) encode((crf += 3));

  // Cover = the clip's first frame, so the hover crossfade doesn't jump.
  await sharp(coverPng).resize(cover[0], cover[1], { fit: "cover", position: "top" }).webp({ quality: 84 }).toFile(path.join(dir, "cover.webp"));
  // A soft backdrop for the card: the screen's average colour, washed most of the way to paper.
  const { channels } = await sharp(coverPng).stats();
  const paper = [241, 240, 235];
  const [r, g, b] = paper.map((p, i) => Math.round(p * 0.7 + channels[i].mean * 0.3));
  await rm(coverPng);
  await rm(frames, { recursive: true, force: true });

  const seconds = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp4]).toString());
  const sizes = Object.fromEntries(
    await Promise.all((await readdir(dir)).map(async (f) => [f, `${((await stat(path.join(dir, f))).size / 1024).toFixed(0)} KB`])),
  );
  return { meta, tint: hex({ r, g, b }), info: { stops: plan.length, seconds: +seconds.toFixed(1), crf, pageHeight: maxY + vh, sizes } };
}

const results = {};
for (const name of names) results[name] = await capture(name);
await browser.close();

const first = results.desktop ?? results.mobile;
const info = {
  url,
  ...first.meta,
  tint: first.tint,
  year: new Date().getFullYear(),
  ...Object.fromEntries(Object.entries(results).map(([k, r]) => [k, r.info])),
};
await writeFile(path.join(out, "meta.json"), `${JSON.stringify(info, null, 2)}\n`);
console.log(JSON.stringify(info, null, 2));
