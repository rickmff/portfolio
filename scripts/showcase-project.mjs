// Films a project's site for the Latest Work carousel, full frame, with nothing around it: the
// desktop site at 1920×1080 scrolling slowly and resting on each section until its animations
// finish, and the mobile site as its own 9:16 clip at 1080×1920, the reels format, no phone drawn.
//   node scripts/showcase-project.mjs https://example.com [--out capture/example] [--device both|desktop|mobile]
//     [--desktop 22] [--mobile 16] [--pause 1.6] [--wait 3] [--cookie NEXT_LOCALE=en] [--hide ".cookie-panel"]
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
    pause: { type: "string", default: "1.6" },
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
const PAUSE = Number(opt.pause);

// Desktop: a 1440×810 layout drawn at 4/3 scale fills 1920×1080. Mobile: a 405×720 phone layout
// drawn at 8/3 scale fills 1080×1920.
const DEVICES = {
  desktop: {
    context: { viewport: { width: 1440, height: 810 }, deviceScaleFactor: 4 / 3 },
    seconds: Number(opt.desktop),
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
    glide: async (from, to, seconds) => {
      const count = Math.max(1, Math.round(seconds * FPS));
      for (let i = 1; i <= count; i++) {
        await page.evaluate((y) => window.__film.to(y), Math.round(from + (to - from) * ease(i / count)));
        files.push(await frame());
      }
    },
  };
}

/** Resting points: the top of each tall block, below any fixed header, plus the bottom. */
async function stopsOf(page) {
  return page.evaluate(() => {
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
    return { stops, maxY, vh };
  });
}

/** Films a scroll through the page within `budget` seconds, dropping the most crowded stops first. */
async function filmScroll(rec, page, budget, { pause, firstRest }) {
  const { stops: found, vh } = await stopsOf(page);
  // Pages with few marked-up sections still get a stop about every screen.
  const stops = [found[0]];
  for (const y of found.slice(1)) {
    const prev = stops.at(-1);
    const extra = Math.floor((y - prev) / (vh * 1.1));
    for (let k = 1; k <= extra; k++) stops.push(Math.round(prev + ((y - prev) * k) / (extra + 1)));
    stops.push(y);
  }
  const travel = (a, b) => Math.min(2.4, Math.max(0.9, (Math.abs(b - a) / vh) * 1.0));
  const duration = (s) => firstRest + s.slice(1).reduce((t, y, i) => t + travel(s[i], y) + pause, 0);
  let plan = stops;
  while (plan.length > 2 && duration(plan) > budget) {
    const gaps = plan.slice(1, -1).map((y, i) => [i + 1, Math.min(y - plan[i], plan[i + 2] - y)]);
    plan = plan.filter((_, i) => i !== gaps.sort((a, b) => a[1] - b[1])[0][0]);
  }
  const quick = duration(plan) > budget;
  // A short page lingers longer on each stop rather than finishing early.
  if (!quick && plan.length > 1 && duration(plan) < budget * 0.75)
    pause = Math.min(3, pause + (budget * 0.75 - duration(plan)) / (plan.length - 1));
  await rec.rest(firstRest);
  for (let i = 1; i < plan.length; i++) {
    await rec.glide(plan[i - 1], plan[i], quick ? (budget - firstRest) / (plan.length - 1) - 0.4 : travel(plan[i - 1], plan[i]));
    await rec.rest(quick ? 0.4 : pause);
  }
  return plan;
}

/* Filming and encoding. */

await mkdir(out, { recursive: true });
const report = { url };
for (const name of names) {
  const { context, seconds, file, target } = DEVICES[name];
  const raw = path.join(out, `${file}-frames`);
  await rm(raw, { recursive: true, force: true });
  await mkdir(raw, { recursive: true });
  const page = await openPage(context, target);
  const rec = recorder(page, raw, "f");
  const plan = await filmScroll(rec, page, seconds, { pause: PAUSE, firstRest: 1.6 });
  // Glide back to the top so the clip loops without a jump.
  if (plan.length > 1) await rec.glide(plan.at(-1), 0, 1.8);
  await page.close();

  // H.264 needs even sides; the frames already are (1920×1080, 1080×1920).
  const mp4 = path.join(out, `${file}.mp4`);
  const encode = (crf) =>
    execFileSync("ffmpeg", [
      "-y", "-loglevel", "error",
      "-framerate", String(FPS), "-i", path.join(raw, "f%05d.jpg"),
      "-c:v", "libx264", "-preset", "slow", "-crf", String(crf), "-pix_fmt", "yuv420p", "-profile:v", "high", "-r", String(FPS),
      "-an", "-movflags", "+faststart",
      mp4,
    ]);
  let crf = 20;
  encode(crf);
  while ((await stat(mp4)).size > 30 * 1024 * 1024 && crf < 32) encode((crf += 3));
  await sharp(rec.files[0]).webp({ quality: 86 }).toFile(path.join(out, `${file}.webp`));
  await rm(raw, { recursive: true, force: true });

  const { width, height } = await sharp(path.join(out, `${file}.webp`)).metadata();
  report[name] = {
    files: [`${file}.mp4`, `${file}.webp`],
    size: `${width}×${height}`,
    seconds: +(rec.files.length / FPS).toFixed(1),
    stops: plan.length,
    crf,
    mb: +((await stat(mp4)).size / 1048576).toFixed(1),
  };
}
await browser.close();
console.log(JSON.stringify(report, null, 2));
