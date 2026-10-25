// Films a project's site for the Latest Work carousel, full frame, with nothing around it: the
// desktop site at 1920×1080 in one smooth, continuous scroll from top to bottom, and the mobile
// site the same way as its own 9:16 clip at 1080×1920, the reels format, with no phone drawn.
//   node scripts/showcase-project.mjs https://example.com [--out capture/example] [--device both|desktop|mobile]
//     [--desktop 22] [--mobile 16] [--wait 3] [--cookie NEXT_LOCALE=en] [--hide ".cookie-panel"]
//     [--mobile-url https://example.com/demo]   (the page the phone shows; default: the url)
// Writes showcase.mp4 + showcase.webp (desktop film and poster, the project's showcaseUrl and
// showcasePosterUrl) and mobile.mp4 + mobile.webp (previewMobileUrl and coverMobileUrl).
// Filming runs on virtual time like capture-project.mjs, so every animation comes out at 60 fps.
// Needs ffmpeg on PATH and a Chromium for Playwright.
import { execFileSync } from "node:child_process";
import { mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { chromium } from "playwright";
import sharp from "sharp";

const { values: opt, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    out: { type: "string" },
    device: { type: "string", default: "both" },
    desktop: { type: "string", default: "22" },
    mobile: { type: "string", default: "16" },
    wait: { type: "string", default: "3" },
    cookie: { type: "string", multiple: true },
    hide: { type: "string", multiple: true },
    "mobile-url": { type: "string" },
  },
});
const url = positionals[0];
if (!url) throw new Error("Usage: node scripts/showcase-project.mjs <url> [--out dir] [--device both|desktop|mobile]");

const FPS = 60;
const STEP = 16; // one tick of the page's faked requestAnimationFrame

// Desktop: a 1440×810 layout drawn at 4/3 scale fills 1920×1080. Mobile: a 405×720 phone layout
// drawn at 8/3 scale fills 1080×1920.
const DEVICES = {
  desktop: {
    context: { viewport: { width: 1440, height: 810 }, deviceScaleFactor: 4 / 3 },
    seconds: Number(opt.desktop),
    size: [1920, 1080],
    file: "showcase",
    target: url,
  },
  mobile: {
    context: {
      viewport: { width: 405, height: 720 },
      deviceScaleFactor: 8 / 3,
      isMobile: true,
      hasTouch: true,
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
    },
    seconds: Number(opt.mobile),
    size: [1080, 1920],
    file: "mobile",
    target: opt["mobile-url"] ?? url,
  },
};
const names = opt.device === "both" ? ["desktop", "mobile"] : [opt.device];
for (const n of names) if (!DEVICES[n]) throw new Error("--device must be both, desktop or mobile");

// An archived page (web.archive.org/web/<timestamp>[if_]/<original>) is named after its original address.
const unwrap = (u) => u.match(/^https?:\/\/web\.archive\.org\/web\/\d+[a-z_]*\/(.+)$/)?.[1] ?? u;
const host = new URL(/^https?:/.test(unwrap(url)) ? unwrap(url) : `https://${unwrap(url)}`).hostname.replace(/^www\./, "");
const out = path.resolve(opt.out ?? path.join("capture", host.split(".")[0]));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const consent =
  /^(accept|accept all|accept cookies|allow all|agree|i agree|ok|okay|got it|close|dismiss|save|save preferences|save settings|reject|reject all|decline|deny|necessary only|accept necessary|aceitar|aceitar todos|aceito|concordo|entendi|permitir|fechar|recusar|rejeitar|salvar|salvar preferências|apenas necessários)$/i;
// Consent tools that sit on every frame unless hidden, plus whatever --hide adds.
const HIDE = [
  "#onetrust-banner-sdk", "#onetrust-consent-sdk", "#CybotCookiebotDialog", ".cc-window", ".cky-consent-container",
  "#usercentrics-root", "#didomi-host", ".osano-cm-window", "[id*='cookie-banner' i]", "[class*='cookie-banner' i]",
  "[id*='cookie-consent' i]", "[class*='cookie-consent' i]", "[aria-label*='cookie' i][role='dialog']",
  ...[].concat(opt.hide ?? []),
];

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

/** Loads the page on a controllable clock, clears banners, plays every reveal once, then freezes time. */
async function openPage(context, target = url) {
  const page = await browser.newPage({ ...context, reducedMotion: "no-preference", colorScheme: "light" });
  await page.clock.install();
  // While filming, only the script scrolls: the page's own scroll guides, snapping and smooth
  // scrollers are muted, and the script's position is put back before every frame.
  await page.addInitScript(() => {
    const w = window;
    const scrollTo = w.scrollTo.bind(w);
    const film = (w.__film = {
      lock: false,
      y: null,
      to(y) {
        film.y = y;
        scrollTo(0, y);
      },
      hold() {
        if (film.y != null && Math.abs(w.scrollY - film.y) > 0.5) scrollTo(0, film.y);
      },
    });
    const guard = (fn) =>
      function (...args) {
        if (film.lock) return;
        return fn.apply(this, args);
      };
    w.scrollTo = guard(w.scrollTo);
    w.scroll = guard(w.scroll);
    w.scrollBy = guard(w.scrollBy);
    for (const k of ["scrollIntoView", "scrollTo", "scroll", "scrollBy"]) Element.prototype[k] = guard(Element.prototype[k]);
    const top = Object.getOwnPropertyDescriptor(Element.prototype, "scrollTop");
    Object.defineProperty(Element.prototype, "scrollTop", {
      configurable: true,
      get() {
        return top.get.call(this);
      },
      set(v) {
        if (film.lock && (this === document.documentElement || this === document.body)) return;
        top.set.call(this, v);
      },
    });
  });
  // Sites that pick the language from the visitor's location can be pinned with --cookie NAME=VALUE.
  for (const c of [].concat(opt.cookie ?? [])) {
    const [name, ...rest] = c.split("=");
    await page.context().addCookies([{ name, value: rest.join("="), url: target }]);
  }
  await page.goto(target, { waitUntil: "networkidle", timeout: 45_000 }).catch((e) => {
    if (e.name !== "TimeoutError") throw e;
  });
  await page.addStyleTag({
    content: `html,body{scroll-behavior:auto!important;scroll-snap-type:none!important;scrollbar-width:none!important}::-webkit-scrollbar{display:none!important}${HIDE.join(",")}{display:none!important}`,
  });
  for (const frame of page.frames()) {
    const button = frame.getByRole("button", { name: consent }).first();
    if (await button.isVisible().catch(() => false)) await button.click({ timeout: 2000 }).catch(() => {});
  }
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
  await page.evaluate(() => {
    window.__film.to(0);
    window.__film.lock = true;
  });
  // Freeze time just ahead of the page's clock. Pages that fake Date themselves can sit behind it,
  // so fall back to a little ahead of real time.
  const now = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(now + 50).catch(() => page.clock.pauseAt(Date.now() + 2000));
  return page;
}

/** Frame recorder on virtual time: each frame advances animations, timers and videos by one tick. */
function recorder(page, dir, prefix) {
  let n = 0;
  const frame = async () => {
    await page.evaluate((dt) => {
      for (const a of document.getAnimations()) {
        // Scroll-driven animations follow the scroll position, not time; their currentTime is a percentage.
        if (a.timeline !== document.timeline || typeof a.currentTime !== "number") continue;
        if (a.playState === "running") a.pause();
        a.currentTime += dt;
      }
      for (const v of document.querySelectorAll("video")) {
        if (!v.paused) v.pause();
        if (v.duration) v.currentTime = (v.currentTime + dt / 1000) % v.duration;
      }
    }, STEP);
    await page.clock.runFor(STEP);
    await page.evaluate(() => window.__film.hold());
    const file = path.join(dir, `${prefix}${String(n++).padStart(5, "0")}.jpg`);
    await page.screenshot({ path: file, type: "jpeg", quality: 93 });
    return file;
  };
  const files = [];
  return {
    files,
    rest: async (seconds) => {
      for (let i = Math.round(seconds * FPS); i > 0; i--) files.push(await frame());
    },
    scrollTo: async (y) => {
      await page.evaluate((y) => window.__film.to(y), y);
      files.push(await frame());
    },
    glide: async (from, to, seconds) => {
      const count = Math.max(1, Math.round(seconds * FPS));
      for (let i = 1; i <= count; i++) {
        await page.evaluate((y) => window.__film.to(y), Math.round(from + (to - from) * ease(i / count)));
        files.push(await frame());
      }
    },
  };
}

/**
 * One continuous scroll from the top to the bottom of the page: it eases in, keeps a steady,
 * readable pace and eases out at the bottom. Long pages go faster to fit `budget` seconds, short
 * ones never crawl slower than `minSpeed` screens a second. Returns how far it scrolled.
 */
async function filmScroll(rec, page, budget, { firstRest, lastRest, minSpeed = 0.28 }) {
  const { maxY, vh } = await page.evaluate(() => ({
    maxY: document.documentElement.scrollHeight - innerHeight,
    vh: innerHeight,
  }));
  await rec.rest(firstRest);
  if (maxY < 4) return 0;
  const seconds = Math.max(2, Math.min(budget - firstRest - lastRest, maxY / (vh * minSpeed)));
  // Speed ramps up over the first and down over the last `ramp` of the time (a trapezoid),
  // so the middle of the page passes at one even speed.
  const ramp = Math.min(0.2, 1.2 / seconds);
  const at = (t) => {
    const area = 1 - ramp;
    if (t < ramp) return (t * t) / (2 * ramp) / area;
    if (t > 1 - ramp) return 1 - ((1 - t) * (1 - t)) / (2 * ramp) / area;
    return (t - ramp / 2) / area;
  };
  const count = Math.round(seconds * FPS);
  for (let i = 1; i <= count; i++) await rec.scrollTo(Math.round(maxY * Math.min(1, at(i / count))));
  await rec.rest(lastRest);
  return maxY;
}

/* Filming and encoding. */

await mkdir(out, { recursive: true });
const report = { url };
for (const name of names) {
  const { context, seconds, size, file, target } = DEVICES[name];
  const raw = path.join(out, `${file}-frames`);
  await rm(raw, { recursive: true, force: true });
  await mkdir(raw, { recursive: true });
  const page = await openPage(context, target);
  const rec = recorder(page, raw, "f");
  const bottom = await filmScroll(rec, page, seconds, { firstRest: 1.2, lastRest: 1.0 });
  // Glide back to the top so the clip loops without a jump.
  if (bottom) await rec.glide(bottom, 0, 1.8);
  await page.close();

  // A fractional scale factor can round a screenshot a pixel short (1080×1919), which H.264
  // refuses, so both the clip and the poster are scaled to the exact size.
  const mp4 = path.join(out, `${file}.mp4`);
  const encode = (crf) =>
    execFileSync("ffmpeg", [
      "-y", "-loglevel", "error",
      "-framerate", String(FPS), "-i", path.join(raw, "f%05d.jpg"),
      "-vf", `scale=${size[0]}:${size[1]}:flags=lanczos`,
      "-c:v", "libx264", "-preset", "slow", "-crf", String(crf), "-pix_fmt", "yuv420p", "-profile:v", "high", "-r", String(FPS),
      "-an", "-movflags", "+faststart",
      mp4,
    ]);
  let crf = 20;
  encode(crf);
  while ((await stat(mp4)).size > 30 * 1024 * 1024 && crf < 32) encode((crf += 3));
  await sharp(rec.files[0]).resize(size[0], size[1], { fit: "fill" }).webp({ quality: 86 }).toFile(path.join(out, `${file}.webp`));
  await rm(raw, { recursive: true, force: true });

  const { width, height } = await sharp(path.join(out, `${file}.webp`)).metadata();
  report[name] = {
    files: [`${file}.mp4`, `${file}.webp`],
    size: `${width}×${height}`,
    seconds: +(rec.files.length / FPS).toFixed(1),
    crf,
    mb: +((await stat(mp4)).size / 1048576).toFixed(1),
  };
}
await browser.close();
console.log(JSON.stringify(report, null, 2));
