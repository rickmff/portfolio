// Films a guided tour of the portfolio itself for a showcase video: a drawn cursor walks the home
// page (the Menu Online desktop demo played through fast, the carousel scrolled to its end and
// switched to Mobile, a hover along the bookshelf), opens a book and sets it spinning, reveals its
// notes, goes home from the footer, hovers the writing list and opens a post. The browser sits in
// a window drawn over a background image, in one continuous 1920×1080 take of about 33 s.
//   node scripts/showcase-site.mjs [https://rickmff.com] --bg painting.jpg [--out capture/showcase]
//     [--book <slug>] [--post 0] [--lang en] [--scale 1.5] [--speed 1] [--menu-rate 5] [--blur 10] [--frames-only] [--compose-only]
// Filming runs on virtual time like showcase-project.mjs: every frame moves the page's clock,
// its CSS animations and its videos on by exactly one tick, so the take is a clean 60 fps however
// slow the screenshots are. Needs ffmpeg on PATH and a Chromium for Playwright.
import { execFileSync } from "node:child_process";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { chromium } from "playwright";
import sharp from "sharp";
import { ensureLanguage, languageContext, presetLanguage } from "./pin-language.mjs";

const { values: opt, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    out: { type: "string", default: "capture/showcase" },
    bg: { type: "string" },
    book: { type: "string" },
    post: { type: "string", default: "0" },
    lang: { type: "string", default: "en" },
    scale: { type: "string", default: "1.5" },
    "frames-only": { type: "boolean", default: false },
    "compose-only": { type: "boolean", default: false },
    speed: { type: "string", default: "1" },
    "menu-rate": { type: "string", default: "5" },
    blur: { type: "string", default: "10" },
  },
});
const site = (positionals[0] ?? "https://rickmff.com").replace(/\/$/, "");
if (!opt.bg && !opt["frames-only"]) throw new Error("--bg <image> is required (the video's background)");

const FPS = 60;
const STEP = 1000 / FPS;
// Every pause, glide and scroll of the tour is divided by this: 1.25 plays it a quarter faster.
// The tour below is timed at 1, about 38 s.
const SPEED = Number(opt.speed);
// The Menu Online demo plays to its end in the carousel, this many times faster than real time.
const MENU_RATE = Number(opt["menu-rate"]);
const VIEW = { width: 1440, height: 810 };
const out = path.resolve(opt.out);
const raw = path.join(out, "frames");

/* The page: a drawn cursor, media and animations that only move when a frame is filmed. */

function filmKit() {
  const w = window;
  // Event times follow the page's (fake) clock, so drags and flicks measure the filmed pace.
  Object.defineProperty(Event.prototype, "timeStamp", { configurable: true, get: () => performance.now() });

  // Every animation and transition is paused the moment it starts; the recorder moves it on.
  const held = (w.__held = new Set());
  const hold = () => {
    for (const a of document.getAnimations())
      if (a.playState === "running" && a.timeline === document.timeline) {
        a.pause();
        held.add(a);
      }
  };
  for (const t of ["animationstart", "transitionrun", "animationiteration"]) w.addEventListener(t, hold, true);
  w.__hold = hold;

  // Videos the page asks to play advance with the frames instead; it still sees them as playing.
  const want = new WeakSet();
  const proto = HTMLMediaElement.prototype;
  const play = proto.play;
  const pause = proto.pause;
  const paused = Object.getOwnPropertyDescriptor(proto, "paused");
  let quiet = false;
  proto.play = function () {
    want.add(this);
    this.dispatchEvent(new Event("play"));
    // Load it, so frames can be seeked once the data arrives.
    if (this.preload === "none") this.preload = "auto";
    if (this.readyState === 0) this.load();
    return Promise.resolve();
  };
  proto.pause = function () {
    const was = want.has(this);
    want.delete(this);
    quiet = true;
    pause.call(this);
    quiet = false;
    if (was) this.dispatchEvent(new Event("pause"));
  };
  Object.defineProperty(proto, "paused", { configurable: true, get() { return !want.has(this) && paused.get.call(this); } });
  for (const t of ["play", "pause", "playing"])
    w.addEventListener(t, (e) => quiet && e.stopImmediatePropagation(), true);
  w.__media = (dt) => {
    for (const v of document.querySelectorAll("video")) {
      if (!want.has(v) || !v.duration) continue;
      let t = v.currentTime + dt / 1000;
      if (t >= v.duration) t = v.loop ? t % v.duration : v.duration;
      v.currentTime = t;
    }
  };
  void play;

  // The cursor: drawn in the page, following the shape the page asks for at that point.
  const ARROW =
    "data:image/svg+xml," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='26' height='34' viewBox='-1.5 -1.5 17 23'><path d='M0 0v17.2l4.3-4.1 2.9 6.6 2.7-1.2-2.9-6.4h6z' fill='#111' stroke='#fff' stroke-width='1.4' stroke-linejoin='round'/></svg>`,
    );
  const HAND =
    "data:image/svg+xml," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='30' height='32' viewBox='0 0 30 32'><path d='M10.2 2.6c1.3 0 2.2 1 2.2 2.2v8.1l.1-.1c.4-1 1.3-1.6 2.3-1.6 1.2 0 2 .7 2.3 1.7.4-.6 1.1-1 1.9-1 1.2 0 2.1.8 2.3 1.9.4-.3.9-.5 1.5-.5 1.3 0 2.3 1 2.3 2.3v6.2c0 4.6-3.4 8.5-8.3 8.5h-2.4c-2.6 0-4.4-1-5.9-2.9l-5.2-6.7c-.8-1-.6-2.4.4-3.1 1-.7 2.3-.5 3.1.4l1.2 1.4V4.8c0-1.2 1-2.2 2.2-2.2z' fill='#fff' stroke='#111' stroke-width='1.4' stroke-linejoin='round'/><path d='M14.4 19.8v4.8M17.6 19.8v4.8M20.8 19.8v4.8' stroke='#111' stroke-width='1.2' stroke-linecap='round'/></svg>`,
    );
  const GRAB =
    "data:image/svg+xml," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 30 30'><path d='M8.6 9.2c0-1.1.9-1.9 2-1.9s2 .8 2 1.9V8c0-1.1.9-1.9 2-1.9s2 .8 2 1.9v1c0-1.1.9-1.9 2-1.9s2 .8 2 1.9v1.4c0-1.1.9-1.9 2-1.9s2 .8 2 1.9v7.4c0 4.8-3.3 8.4-8 8.4h-1.6c-2.6 0-4.3-.9-5.8-2.7L4.6 17c-.8-.9-.7-2.3.2-3 .9-.8 2.3-.7 3.1.2l.7.8z' fill='#fff' stroke='#111' stroke-width='1.4' stroke-linejoin='round'/></svg>`,
    );
  const GRABBING =
    "data:image/svg+xml," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 30 30'><path d='M8.8 13.2c0-1.1.9-1.9 2-1.9s2 .8 2 1.9v-.6c0-1.1.9-1.9 2-1.9s2 .8 2 1.9v.4c0-1.1.9-1.9 2-1.9s2 .8 2 1.9v.6c0-1.1.9-1.9 2-1.9s2 .8 2 1.9v4.6c0 4.8-3.3 8.4-8 8.4h-1.6c-2.6 0-4.4-.9-5.8-2.7l-2.6-3.3c-.8-.9-.7-2.3.2-3 .9-.8 2.3-.7 3.1.2l.7.8z' fill='#fff' stroke='#111' stroke-width='1.4' stroke-linejoin='round'/></svg>`,
    );
  const SHAPES = {
    default: [ARROW, 5, 3],
    pointer: [HAND, 10, 3],
    grab: [GRAB, 15, 12],
    grabbing: [GRABBING, 15, 14],
  };
  const css = `#__cur,#__ring{position:fixed;left:0;top:0;pointer-events:none;z-index:2147483647}
#__cur{background-repeat:no-repeat;background-size:100% 100%;filter:drop-shadow(0 1.5px 2px rgba(0,0,0,.28));will-change:transform}
#__ring{width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;border:1.5px solid rgba(20,20,20,.55);opacity:0}
html,body{scrollbar-width:none!important}::-webkit-scrollbar{display:none!important}`;
  const sizes = new Map();
  const mount = () => {
    if (document.getElementById("__cur")) return;
    const style = document.createElement("style");
    style.textContent = css;
    document.head.append(style);
    for (const id of ["__ring", "__cur"]) {
      const el = document.createElement("div");
      el.id = id;
      document.documentElement.append(el);
    }
  };
  let last = "";
  w.__cursor = (x, y, down, visible) => {
    mount();
    const cur = document.getElementById("__cur");
    let shape = "default";
    let custom = null;
    const at = document.elementFromPoint(x, y);
    if (at) {
      const c = getComputedStyle(at).cursor;
      const url = c.match(/url\("?([^")]+)"?\)\s*(\d+)?\s*(\d+)?/);
      if (url) custom = [url[1], Number(url[2] ?? 0), Number(url[3] ?? 0)];
      else if (/pointer/.test(c)) shape = "pointer";
      else if (/grabbing/.test(c)) shape = "grabbing";
      else if (/grab/.test(c)) shape = "grab";
      else if (/text/.test(c) && !at.closest("a,button")) shape = "default";
    }
    const [src, hx, hy] = custom ?? SHAPES[shape];
    if (src !== last) {
      last = src;
      cur.style.backgroundImage = `url("${src}")`;
      const known = sizes.get(src);
      const apply = ([wd, ht]) => {
        cur.style.width = `${wd}px`;
        cur.style.height = `${ht}px`;
      };
      if (known) apply(known);
      else {
        const m = decodeURIComponent(src).match(/width='(\d+)'[^>]*height='(\d+)'/);
        const size = m ? [Number(m[1]), Number(m[2])] : [28, 28];
        sizes.set(src, size);
        apply(size);
      }
    }
    const press = down ? 0.88 : 1;
    cur.style.transformOrigin = `${hx}px ${hy}px`;
    cur.style.transform = `translate(${x - hx}px, ${y - hy}px) scale(${press})`;
    cur.style.opacity = visible ? "1" : "0";
  };
  w.__click = (x, y) => {
    mount();
    const ring = document.getElementById("__ring");
    ring.style.left = `${x}px`;
    ring.style.top = `${y}px`;
    ring.animate(
      [
        { transform: "scale(.4)", opacity: 0.9 },
        { transform: "scale(1.25)", opacity: 0 },
      ],
      { duration: 520, easing: "cubic-bezier(.2,.7,.3,1)" },
    );
    hold();
  };
}

/* Recorder */

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeOut = (t) => 1 - (1 - t) ** 3;

function recorder(page) {
  const files = [];
  const urls = [];
  const mouse = { x: VIEW.width * 0.86, y: VIEW.height * 1.08, down: false, shown: true };
  let n = 0;
  // How fast the page's videos run against the take: 4 plays a clip four times over in its span.
  let rate = 1;
  const frame = async () => {
    await page.evaluate(
      ({ dt, m, r }) => {
        window.__hold?.();
        for (const a of window.__held ?? []) {
          if (a.playState !== "paused") {
            window.__held.delete(a);
            continue;
          }
          const end = a.effect?.getComputedTiming().endTime;
          const t = (a.currentTime ?? 0) + dt;
          if (Number.isFinite(end) && t >= end) {
            a.finish();
            window.__held.delete(a);
          } else a.currentTime = t;
        }
        window.__media?.(dt * r);
        window.__cursor?.(m.x, m.y, m.down, m.shown);
      },
      { dt: STEP, m: mouse, r: rate },
    );
    await page.clock.runFor(STEP);
    const file = path.join(raw, `f${String(n++).padStart(5, "0")}.jpg`);
    await page.screenshot({ path: file, type: "jpeg", quality: 92, animations: "allow", caret: "initial" });
    files.push(file);
    const u = new URL(page.url());
    urls.push(u.host.replace(/^www\./, "") + (u.pathname === "/" ? "" : u.pathname));
  };

  const rest = async (seconds) => {
    for (let i = Math.round(seconds * FPS / SPEED); i > 0; i--) await frame();
  };

  /** Glides the cursor to a point (or the middle of an element) along a gentle curve. */
  const moveTo = async (target, seconds = 0.9, { dx = 0, dy = 0, during } = {}) => {
    const box = typeof target === "object" && "x" in target ? null : await target.boundingBox();
    const to = box ? { x: box.x + box.width / 2 + dx, y: box.y + box.height / 2 + dy } : { x: target.x + dx, y: target.y + dy };
    const from = { x: mouse.x, y: mouse.y };
    // A slight bow, like a hand moving a mouse.
    const len = Math.hypot(to.x - from.x, to.y - from.y);
    const bow = Math.min(60, len * 0.12);
    const nx = len ? -(to.y - from.y) / len : 0;
    const ny = len ? (to.x - from.x) / len : 0;
    const count = Math.max(1, Math.round(seconds * FPS / SPEED));
    for (let i = 1; i <= count; i++) {
      const t = ease(i / count);
      const arc = Math.sin(Math.PI * t) * bow;
      mouse.x = from.x + (to.x - from.x) * t + nx * arc;
      mouse.y = from.y + (to.y - from.y) * t + ny * arc;
      await page.mouse.move(mouse.x, mouse.y);
      await during?.(i / count);
      await frame();
    }
  };

  const click = async ({ settle = 0.25 } = {}) => {
    mouse.down = true;
    await page.mouse.down();
    await rest(0.08);
    await page.evaluate(({ x, y }) => window.__click(x, y), mouse);
    await page.mouse.up();
    mouse.down = false;
    await rest(settle);
  };

  /** Scrolls the page with the wheel, eased, by `dy` pixels. */
  const wheel = async (dy, seconds, { shift = false } = {}) => {
    if (shift) await page.keyboard.down("Shift");
    const count = Math.max(1, Math.round(seconds * FPS / SPEED));
    let sent = 0;
    for (let i = 1; i <= count; i++) {
      const want = Math.round(dy * ease(i / count));
      const d = want - sent;
      sent = want;
      if (d) await page.mouse.wheel(0, d);
      await frame();
    }
    if (shift) await page.keyboard.up("Shift");
  };

  /**
   * Glides the page until `el`'s top sits at `top` (a share of the viewport height). With `cursor`
   * (an element, or a point in the page) the cursor travels there in the same move, so the scroll
   * and the next gesture are one motion.
   */
  const scrollTo = async (el, top, seconds, { cursor, dx = 0, dy = 0 } = {}) => {
    const box = await el.boundingBox();
    const from = await page.evaluate(() => scrollY);
    const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    const to = Math.max(0, Math.min(max, from + box.y - VIEW.height * top));
    let aim = null;
    if (cursor) {
      const c = "x" in cursor ? null : await cursor.boundingBox();
      const at = c ? { x: c.x + c.width / 2, y: c.y + c.height / 2 } : { x: cursor.x, y: cursor.y - from };
      aim = { x: at.x + dx, y: at.y - (to - from) + dy };
    }
    await glide(from, to, seconds, aim);
  };

  /** Scrolls the page from one position to another, eased (the page's smooth scroller follows along). */
  const glide = async (from, to, seconds, aim = null) => {
    const count = Math.max(1, Math.round(seconds * FPS / SPEED));
    const start = { x: mouse.x, y: mouse.y };
    for (let i = 1; i <= count; i++) {
      const y = Math.round(from + (to - from) * ease(i / count));
      if (aim) {
        const t = easeOut(i / count);
        mouse.x = start.x + (aim.x - start.x) * t;
        mouse.y = start.y + (aim.y - start.y) * t;
      }
      await page.evaluate((y) => window.scrollTo(0, y), y);
      // Keeps hover in step with what passes under the resting cursor.
      await page.mouse.move(mouse.x, mouse.y);
      await frame();
    }
  };
  const scrollBy = async (dy, seconds) => {
    const from = await page.evaluate(() => scrollY);
    const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    await glide(from, Math.max(0, Math.min(max, from + dy)), seconds);
  };

  /** Keeps filming (the page's timers need the clock to move) until `ready` holds. */
  const until = async (ready, max = 12) => {
    for (let i = 0; i < max * FPS; i++) {
      if (await ready().catch(() => false)) return;
      await frame();
    }
    throw new Error(`timed out waiting: ${ready}`);
  };

  const setRate = (r) => (rate = r);
  return { until, files, urls, mouse, frame, rest, moveTo, click, wheel, scrollTo, scrollBy, setRate };
}

/* Filming */

if (!opt["compose-only"]) await film();
if (!opt["frames-only"]) await compose();

async function film() {
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const context = await browser.newContext({
  viewport: VIEW,
  deviceScaleFactor: Number(opt.scale),
  ...languageContext(opt.lang),
  reducedMotion: "no-preference",
  colorScheme: "light",
});
const page = await context.newPage();
await presetLanguage(page, site, opt.lang);

// Picks the book to open: the first on the home shelf with notes (and a cover, if any has one).
async function pickBook() {
  const scout = await context.newPage();
  await scout.goto(site, { waitUntil: "networkidle" }).catch(() => {});
  const slots = scout.locator("#books .sb-slot");
  const slugs = [];
  for (let i = 0; i < (await slots.count()); i++) {
    // The card under the shelf swaps after a moment: wait for the clicked book's own link.
    const link = scout.locator(".shelf-detail a[href*='/books/']").first();
    const before = await link.getAttribute("href").catch(() => null);
    await slots.nth(i).evaluate((b) => b.click());
    let href = before;
    for (let t = 0; t < 20 && (i > 0 ? href === before : !href); t++) {
      await scout.waitForTimeout(150);
      href = await link.getAttribute("href").catch(() => null);
    }
    slugs.push(href ? href.split("/books/")[1] : null);
  }
  let pick = null;
  for (const [index, slug] of slugs.entries()) {
    if (!slug || (opt.book && slug !== opt.book)) continue;
    const html = await (await scout.request.get(`${site}/books/${slug}`)).text();
    if (!html.includes("notes-btn")) continue;
    const cover = /b3d-front[^>]*>\s*<img/.test(html);
    // Not the first book: that one is open when the page loads, and the shelf should open one.
    if (cover && index > 0) {
      pick = { slug, index };
      break;
    }
    if (!pick || (pick.index === 0 && index > 0)) pick = { slug, index };
  }
  await scout.close();
  if (!pick) throw new Error("No book on the home shelf has notes; pass --book <slug> (one on the home shelf)");
  return pick;
}

const book = await pickBook();
console.log(`book: ${book.slug} (#${book.index + 1} on the shelf)`);

await rm(raw, { recursive: true, force: true });
await mkdir(raw, { recursive: true });

await page.clock.install();
await page.addInitScript(filmKit);
await page.goto(site, { waitUntil: "load" });
await ensureLanguage(page, opt.lang);
// Let the images arrive while time stands still, then start the take on the hero's entrance.
const now = await page.evaluate(() => Date.now());
await page.clock.pauseAt(now + 300).catch(() => page.clock.pauseAt(Date.now() + 2000));
await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
await page.evaluate(() => document.fonts.ready);
// Load the carousel's clips now, as blobs: the server answers /media without byte ranges, and a
// clip that can't be seeked can't be stepped frame by frame.
await page.evaluate(() =>
  Promise.all(
    [...document.querySelectorAll(".strip-item video")].map(async (v) => {
      const blob = await (await fetch(v.src)).blob();
      v.src = URL.createObjectURL(blob);
      v.preload = "auto";
      v.load();
    }),
  ),
);

const rec = recorder(page);
const { until, rest, moveTo, click, scrollTo, scrollBy } = rec;

// The tour only moves forward: no gesture goes back over ground already covered, and every
// beat overlaps the next (the cursor travels while the page scrolls), so something is always
// moving on screen.

// 1. The hero comes in while the page is already on its way down to the carousel, and the cursor
//    heads for the Menu Online card in the same move.
await rest(0.9);
const cards = page.locator(".strip-item");
const menu = cards.first();
await scrollTo(page.locator("#work .section-head"), 0.04, 1.4, { cursor: menu.locator(".frame") });

// 2. Its desktop demo plays to the end, several times over, while the cursor rests on it.
const clip = await menu.evaluate((el) => el.querySelector("video[data-showcase]")?.duration || el.querySelector("video")?.duration || 0);
await until(() => menu.evaluate((el) => [...el.querySelectorAll("video")].some((v) => v.readyState >= 2 && v.classList.contains("is-playing"))), 4);
rec.setRate(MENU_RATE);
await rest(Math.max(2, clip / MENU_RATE - 0.05));
rec.setRate(1);

// 3. The carousel runs sideways to its end, once, under a cursor drifting right over the other cards.
const strip = await page.locator(".strip").evaluate((el) => el.scrollWidth - el.clientWidth);
const drift = { x: Math.min(VIEW.width * 0.72, rec.mouse.x + 520), y: rec.mouse.y + 10 };
const from = { ...rec.mouse };
const sideways = 2.4;
const steps = Math.round(sideways * FPS / SPEED);
await page.keyboard.down("Shift");
for (let i = 1, sent = 0; i <= steps; i++) {
  // A touch past the end, so the smooth scroller settles right on it.
  const want = Math.round(((strip + 200) / 0.85) * ease(i / steps));
  const t = easeOut(i / steps);
  rec.mouse.x = from.x + (drift.x - from.x) * t;
  rec.mouse.y = from.y + (drift.y - from.y) * t;
  await page.mouse.move(rec.mouse.x, rec.mouse.y);
  if (want - sent) await page.mouse.wheel(0, want - sent);
  sent = want;
  await rec.frame();
}
await page.keyboard.up("Shift");

// 4. Up to the switch: the carousel turns to its Mobile view while the cursor drifts back down.
const mobileBtn = page.locator(".strip-toggle button").nth(1);
await moveTo(mobileBtn, 0.8);
await click({ settle: 0.05 });
await moveTo({ x: VIEW.width * 0.62, y: VIEW.height * 0.62 }, 1.1);

// 5. Down to the bookshelf, the cursor landing on the first spine, then one pass along the
//    spines that ends on the book to open.
const slots = page.locator("#books .sb-slot");
const count = await slots.count();
const slot = slots.nth(book.index);
// The pass runs from the end of the shelf farther from the book, so it has the most to show.
const startAt = book.index < count / 2 ? count - 1 : 0;
await scrollTo(page.locator("#books .section-head"), 0.08, 1.3, { cursor: slots.nth(startAt), dy: 20 });
const target = await slot.boundingBox();
await moveTo({ x: target.x + target.width / 2, y: target.y + target.height / 2 + 20 }, 1.9);

// 6. A click pulls it from the shelf; the cursor goes straight on to "Open the book" in its card.
if ((await slot.getAttribute("aria-pressed")) !== "true") await click({ settle: 0.15 });
const open = page.locator(`.shelf-detail a[href$='/books/${book.slug}']`).first();
await until(() => open.isVisible(), 3);
await rest(0.1);
await moveTo(open, 0.9);
await click({ settle: 0 });

// 7. The book's page: the cursor is already moving toward the book while it comes in.
await until(() => page.locator(".b3d-stage").isVisible());
const stage = page.locator(".b3d-stage");
await rest(0.15);
const sb = await stage.boundingBox();
const cx = sb.x + sb.width / 2;
const cy = sb.y + sb.height / 2;
// One flick sets it spinning, and the tour moves straight on.
await moveTo({ x: cx + 70, y: cy - 10 }, 0.7);
rec.mouse.down = true;
await page.mouse.down();
await moveTo({ x: cx - 160, y: cy + 15 }, 0.22);
await page.mouse.up();
rec.mouse.down = false;

// 8. While the book spins out its flick, down to the notes; the cursor arrives on the button.
const reveal = page.locator(".notes-btn");
await scrollTo(page.locator(".notes"), 0.3, 1.5, { cursor: reveal });
// The page's smooth scroller lands a beat after the glide: a last nudge onto the button.
await moveTo(reveal, 0.25);
await click({ settle: 0.1 });

// 9. The notes open; the page carries on down through them to the footer and its Home link.
const home = page.locator("footer a[href='/']").first();
await rest(0.5);
await scrollTo(home, 0.85, 2.6, { cursor: home });
await moveTo(home, 0.25);
await click({ settle: 0 });

// 10. Home again, at the top: one glide down to the writing list, the cursor meeting the first post.
await until(async () => new URL(page.url()).pathname === "/" && (await page.locator("#writing").isVisible()));
const posts = page.locator("#writing .post-link");
const pc = await posts.count();
await scrollTo(page.locator("#writing .section-head"), 0.12, 1.8, { cursor: posts.first(), dx: -140 });

// 11. Down the list, hovering each post; the last hover is the one opened.
const pick = Math.min(Number(opt.post), pc - 1);
const order = [...Array(pc).keys()].filter((i) => i !== pick).slice(0, 3);
for (const i of order) await moveTo(posts.nth(i), 0.55, { dx: -140 + i * 30 });
await moveTo(posts.nth(pick), 0.6, { dx: -80 });
await click({ settle: 0 });

// 12. The post: the cursor eases off to the side as the page starts reading down.
await until(async () => /\/blog\//.test(new URL(page.url()).pathname) && (await page.locator("article, .prose").first().isVisible()));
await moveTo({ x: VIEW.width * 0.9, y: VIEW.height * 0.72 }, 0.8);
await scrollBy(VIEW.height * 1.1, 3.0);

await browser.close();
await writeFile(path.join(out, "urls.json"), JSON.stringify(rec.urls));
console.log(`filmed ${rec.files.length} frames (${(rec.files.length / FPS).toFixed(1)}s)`);
}


/* Composition: the take inside a browser window, over the background, at 1920×1080. */

async function compose() {
  const W = 1920;
  const H = 1080;
  const vw = 1400;
  const vh = Math.round((vw * VIEW.height) / VIEW.width);
  const bar = 44;
  const r = 14;
  const x0 = (W - vw) / 2;
  const y0 = Math.round((H - vh - bar) / 2);
  const urls = JSON.parse(await readFile(path.join(out, "urls.json"), "utf8"));
  const dir = path.join(out, "layers");
  await mkdir(dir, { recursive: true });

  // The background: the image covering the frame, softly blurred (--blur, 0 for none) so the window reads first.
  // Blurred a little larger than the frame, then cropped, so the edges don't fade in.
  const sigma = Number(opt.blur);
  const pad = Math.ceil(sigma * 3);
  let bgImg = sharp(opt.bg).resize(W + pad * 2, H + pad * 2, { fit: "cover", position: "top" });
  if (sigma > 0.3) bgImg = sharp(await bgImg.blur(sigma).toBuffer());
  const bg = await bgImg.extract({ left: pad, top: pad, width: W, height: H }).toBuffer();
  const shadow = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <defs><filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="28"/></filter>
      <filter id="t" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter></defs>
      <rect x="${x0}" y="${y0 + 26}" width="${vw}" height="${vh + bar}" rx="${r}" fill="rgba(20,30,50,.38)" filter="url(#s)"/>
      <rect x="${x0}" y="${y0 + 4}" width="${vw}" height="${vh + bar}" rx="${r}" fill="rgba(20,30,50,.18)" filter="url(#t)"/>
    </svg>`,
  );
  const backdrop = await sharp(bg).composite([{ input: shadow }]).png().toBuffer();

  const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const chrome = (url) =>
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
        <defs><clipPath id="c"><rect x="${x0}" y="${y0}" width="${vw}" height="${vh + bar}" rx="${r}"/></clipPath></defs>
        <g clip-path="url(#c)">
          <rect x="${x0}" y="${y0}" width="${vw}" height="${bar}" fill="#f3f2ee"/>
          <rect x="${x0}" y="${y0 + bar - 1}" width="${vw}" height="1" fill="#e2e0da"/>
          <rect x="${x0}" y="${y0 + bar}" width="${vw}" height="${vh}" fill="#fff"/>
        </g>
        <circle cx="${x0 + 22}" cy="${y0 + bar / 2}" r="6" fill="#ff5f57" stroke="#e2463f" stroke-width=".6"/>
        <circle cx="${x0 + 42}" cy="${y0 + bar / 2}" r="6" fill="#febc2e" stroke="#e1a116" stroke-width=".6"/>
        <circle cx="${x0 + 62}" cy="${y0 + bar / 2}" r="6" fill="#28c840" stroke="#1aab29" stroke-width=".6"/>
        <rect x="${W / 2 - 230}" y="${y0 + 9}" width="460" height="26" rx="8" fill="#e8e6e0"/>
        <g transform="translate(${W / 2 - 8 - url.length * 3.6}, ${y0 + 16.5})" fill="none" stroke="#8a877f" stroke-width="1.3">
          <rect x="0.5" y="4.5" width="8" height="6.5" rx="1.4" fill="#8a877f" stroke="none"/>
          <path d="M2.3 4.6V3.2a2.2 2.2 0 0 1 4.4 0v1.4"/>
        </g>
        <text x="${W / 2 + 7}" y="${y0 + 26.5}" text-anchor="middle" font-family="-apple-system, 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="13" fill="#3c3a35">${esc(url)}</text>
      </svg>`,
    );

  // One base per address the take visits, in order.
  const segments = [];
  for (const [i, u] of urls.entries()) {
    const last = segments.at(-1);
    if (last && last.url === u) last.end = i;
    else segments.push({ url: u, start: i, end: i });
  }
  const bases = [];
  for (const [i, seg] of segments.entries()) {
    const file = path.join(dir, `base${i}.png`);
    await sharp(backdrop).composite([{ input: chrome(seg.url) }]).png().toFile(file);
    bases.push(file);
  }

  // Above the page: the backdrop again, kept only at the rounded bottom corners, plus a hairline edge.
  const corners = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <rect width="${W}" height="${H}" fill="#fff"/>
      <rect x="${x0}" y="${y0}" width="${vw}" height="${vh + bar}" rx="${r}" fill="#000"/>
    </svg>`,
  );
  const mask = await sharp(corners).extractChannel(0).raw().toBuffer();
  const top = await sharp(await sharp(backdrop).removeAlpha().toBuffer()).joinChannel(mask, { raw: { width: W, height: H, channels: 1 } }).png().toBuffer();
  const edge = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <rect x="${x0 + 0.5}" y="${y0 + 0.5}" width="${vw - 1}" height="${vh + bar - 1}" rx="${r}" fill="none" stroke="rgba(0,0,0,.14)"/>
    </svg>`,
  );
  const topFile = path.join(dir, "top.png");
  await sharp(top).composite([{ input: edge }]).png().toFile(topFile);
  if (process.env.LAYERS_ONLY) return;

  const frames = urls.length;
  const seconds = frames / FPS;
  const inputs = ["-framerate", String(FPS), "-i", path.join(raw, "f%05d.jpg")];
  for (const b of bases) inputs.push("-loop", "1", "-framerate", String(FPS), "-t", String(seconds), "-i", b);
  inputs.push("-loop", "1", "-framerate", String(FPS), "-t", String(seconds), "-i", topFile);
  const chain = [`[0:v]scale=${vw}:${vh}:flags=lanczos,setsar=1[page]`];
  let canvas = "[1:v]";
  segments.forEach((seg, i) => {
    if (i === 0) return;
    chain.push(`${canvas}[${i + 1}:v]overlay=0:0:enable='gte(n\\,${seg.start})'[b${i}]`);
    canvas = `[b${i}]`;
  });
  chain.push(`${canvas}[page]overlay=${x0}:${y0 + bar}:shortest=1[w]`);
  chain.push(`[w][${bases.length + 1}:v]overlay=0:0,fade=t=in:st=0:d=0.5,fade=t=out:st=${(seconds - 0.7).toFixed(2)}:d=0.7,format=yuv420p[v]`);
  const mp4 = path.join(out, "showcase.mp4");
  execFileSync(
    "ffmpeg",
    [
      "-y", "-loglevel", "error", ...inputs,
      "-filter_complex", chain.join(";"), "-map", "[v]",
      "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-profile:v", "high", "-r", String(FPS),
      "-an", "-movflags", "+faststart", mp4,
    ],
    { stdio: "inherit" },
  );
  console.log(`${mp4}: ${seconds.toFixed(1)}s, ${((await stat(mp4)).size / 1048576).toFixed(1)} MB`);
}
