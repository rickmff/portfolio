// Films a guided tour of the portfolio itself for a showcase video: a drawn cursor walks the home
// page (carousel switched to Mobile and scrolled, a hover along the bookshelf), opens a book, turns
// it in 3D, reveals its notes, comes back home, hovers the writing list and opens a post. The
// browser sits in a window drawn over a background image, in one continuous 1920×1080 take.
//   node scripts/showcase-site.mjs [https://rickmff.com] --bg painting.jpg [--out capture/showcase]
//     [--book <slug>] [--post 0] [--lang en] [--scale 1.5] [--frames-only]
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
  },
});
const site = (positionals[0] ?? "https://rickmff.com").replace(/\/$/, "");
if (!opt.bg && !opt["frames-only"]) throw new Error("--bg <image> is required (the video's background)");

const FPS = 60;
const STEP = 1000 / FPS;
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
  const frame = async () => {
    await page.evaluate(
      ({ dt, m }) => {
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
        window.__media?.(dt);
        window.__cursor?.(m.x, m.y, m.down, m.shown);
      },
      { dt: STEP, m: mouse },
    );
    await page.clock.runFor(STEP);
    const file = path.join(raw, `f${String(n++).padStart(5, "0")}.jpg`);
    await page.screenshot({ path: file, type: "jpeg", quality: 92, animations: "allow", caret: "initial" });
    files.push(file);
    const u = new URL(page.url());
    urls.push(u.host.replace(/^www\./, "") + (u.pathname === "/" ? "" : u.pathname));
  };

  const rest = async (seconds) => {
    for (let i = Math.round(seconds * FPS); i > 0; i--) await frame();
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
    const count = Math.max(1, Math.round(seconds * FPS));
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
    const count = Math.max(1, Math.round(seconds * FPS));
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

  /** Glides the page until `el`'s top sits at `top` (a share of the viewport height). */
  const scrollTo = async (el, top, seconds) => {
    const box = await el.boundingBox();
    const from = await page.evaluate(() => scrollY);
    const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    const to = Math.max(0, Math.min(max, from + box.y - VIEW.height * top));
    await glide(from, to, seconds);
  };

  /** Scrolls the page from one position to another, eased (the page's smooth scroller follows along). */
  const glide = async (from, to, seconds) => {
    const count = Math.max(1, Math.round(seconds * FPS));
    for (let i = 1; i <= count; i++) {
      const y = Math.round(from + (to - from) * ease(i / count));
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

  return { until, files, urls, mouse, frame, rest, moveTo, click, wheel, scrollTo, scrollBy };
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
    await slots.nth(i).evaluate((b) => b.click());
    await scout.waitForTimeout(400);
    const href = await scout.locator(".shelf-detail a[href*='/books/']").first().getAttribute("href").catch(() => null);
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

const rec = recorder(page);
const { until, rest, moveTo, click, wheel, scrollTo, scrollBy } = rec;

// 1. The hero comes in.
await rest(2.4);

// 2. Down to the carousel; the cursor comes in from the lower right.
await scrollTo(page.locator("#work .section-head"), 0.04, 1.8);
await moveTo(page.locator(".strip-item").first().locator(".frame"), 1.0);
await rest(1.4);

// 3. Switch the carousel to Mobile.
const mobileBtn = page.locator(".strip-toggle button").nth(1);
if (await mobileBtn.count()) {
  await moveTo(mobileBtn, 0.9);
  await rest(0.2);
  await click({ settle: 0.2 });
  await rest(1.6);
}

// 4. Scroll the carousel sideways (Shift + wheel over it), then back a little.
await moveTo(page.locator(".strip"), 0.8, { dy: -20 });
await rest(0.3);
const strip = await page.locator(".strip").evaluate((el) => el.scrollWidth - el.clientWidth);
const across = Math.min(strip, VIEW.width * 1.4);
await wheel(across / 0.85, 2.6, { shift: true });
await rest(1.1);
await wheel(-across * 0.45 / 0.85, 1.4, { shift: true });
await rest(1.0);
// A card of the carousel, in its phone frame.
const cards = page.locator(".strip-item");
const middle = await cards.evaluateAll((items) => {
  const mid = innerWidth / 2;
  let best = 0;
  items.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    const a = items[best].getBoundingClientRect();
    if (Math.abs(r.left + r.width / 2 - mid) < Math.abs(a.left + a.width / 2 - mid)) best = i;
  });
  return best;
});
await moveTo(cards.nth(middle).locator(".frame"), 0.8);
await rest(1.6);

// 5. Down to the bookshelf; a slow pass along the spines.
await scrollTo(page.locator("#books .section-head"), 0.08, 1.7);
const slots = page.locator("#books .sb-slot");
const count = await slots.count();
const first = await slots.first().boundingBox();
const lastBox = await slots.nth(count - 1).boundingBox();
const along = first.y + first.height * 0.55;
await moveTo({ x: first.x + 8, y: along }, 0.9);
await moveTo({ x: lastBox.x + lastBox.width - 8, y: along }, 3.2);
await rest(0.3);

// 6. Pick the book, read its card, then open its page.
const slot = slots.nth(book.index);
await moveTo(slot, 0.9, { dy: 10 });
await rest(0.3);
// The first book is open from the start; any other opens with a first click.
if ((await slot.getAttribute("aria-pressed")) !== "true") {
  await click({ settle: 0.2 });
  await rest(1.4);
}
// The card opened under the shelf: glance down at it, then back to the book.
const detail = page.locator(".shelf-detail-title").first();
if (await detail.count()) {
  await scrollTo(page.locator("#books .shelf"), 0.06, 1.0);
  await moveTo(detail, 0.9, { dx: -40 });
  await rest(1.3);
}
await moveTo(slot, 0.8, { dy: 10 });
await rest(0.25);
await click({ settle: 0.1 });
await until(() => page.locator(".b3d-stage").isVisible());
await rest(2.0);

// 7. The 3D book: hover tilt, then a drag that turns it, a flick, and a turn back.
const stage = page.locator(".b3d-stage");
const sb = await stage.boundingBox();
const cx = sb.x + sb.width / 2;
const cy = sb.y + sb.height / 2;
await moveTo({ x: cx + sb.width * 0.28, y: cy - sb.height * 0.1 }, 1.0);
await moveTo({ x: cx - sb.width * 0.25, y: cy + sb.height * 0.15 }, 1.1);
await moveTo({ x: cx, y: cy }, 0.6);
await rest(0.4);
rec.mouse.down = true;
await page.mouse.down();
await moveTo({ x: cx + 180, y: cy - 30 }, 1.3);
await moveTo({ x: cx + 60, y: cy + 40 }, 0.9);
await rest(0.25);
// The flick: a quick throw to the left, let go while moving.
await moveTo({ x: cx - 120, y: cy + 20 }, 0.22);
await page.mouse.up();
rec.mouse.down = false;
await moveTo({ x: cx - 170, y: cy + 60 }, 0.6);
await rest(2.2);
// Double click puts it back to rest.
await moveTo({ x: cx, y: cy }, 0.6);
await page.mouse.dblclick(cx, cy);
await page.evaluate(({ x, y }) => window.__click(x, y), rec.mouse);
await rest(1.6);

// 8. Down to the notes and reveal them.
const notes = page.locator(".notes");
await scrollTo(notes, 0.3, 1.8);
const reveal = page.locator(".notes-btn");
await moveTo(reveal, 1.0);
await rest(0.3);
await click({ settle: 0.2 });
await moveTo({ x: VIEW.width * 0.78, y: VIEW.height * 0.5 }, 1.0);
await rest(1.6);
await scrollBy(220, 1.6);
await rest(1.2);

// 9. Back to the landing page through the name in the header.
await scrollBy(-(await page.evaluate(() => scrollY)), 1.8);
await rest(0.4);
await moveTo(page.locator(".site-brand"), 1.0);
await rest(0.2);
await click({ settle: 0.1 });
await until(async () => !/\/books\//.test(new URL(page.url()).pathname) && (await page.locator("#writing").isVisible()));
await rest(1.5);

// 10. Down to the writing list; hover along the posts, then open one.
await moveTo({ x: VIEW.width * 0.82, y: VIEW.height * 0.55 }, 0.6);
await scrollTo(page.locator("#writing .section-head"), 0.12, 3.0);
const posts = page.locator("#writing .post-link");
const pc = await posts.count();
for (let i = 0; i < Math.min(pc, 4); i++) await moveTo(posts.nth(i), i ? 0.75 : 1.0, { dx: -120 + i * 30 });
await rest(0.4);
const post = posts.nth(Math.min(Number(opt.post), pc - 1));
await moveTo(post, 0.9, { dx: -60 });
await rest(0.6);
await click({ settle: 0.1 });
await until(async () => /\/blog\//.test(new URL(page.url()).pathname) && (await page.locator("article, .prose").first().isVisible()));
await rest(1.6);

// 11. Read a little of the post, cursor out of the way.
await moveTo({ x: VIEW.width * 0.9, y: VIEW.height * 0.7 }, 0.8);
await scrollBy(VIEW.height * 1.1, 4.0);
await rest(1.6);

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

  // The background: the image covering the frame, a touch softened so the window reads first.
  const bg = await sharp(opt.bg).resize(W, H, { fit: "cover", position: "top" }).blur(0.6).toBuffer();
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
