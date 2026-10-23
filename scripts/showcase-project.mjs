// Films a 1920×1080 showcase of a project's site: the desktop site in a rounded window on a pastel
// gradient, scrolling slowly and resting on each section until its animations finish; then a phone
// rises with the mobile site, scrolls it, shows "Add to Home Screen", the home screen with the
// site's icon and the app opening; and it ends on the phone beside the name, a tagline and the URL.
//   node scripts/showcase-project.mjs https://example.com [--out capture/example] [--tagline "…"]
//     [--accent "#16A34A"] [--desktop 22] [--pause 1.6] [--wait 3] [--no-pwa]
// Writes showcase.mp4 (60 fps, H.264) and showcase.webp (poster, first frame) into --out.
// Filming runs on virtual time like capture-project.mjs, so every animation comes out at 60 fps.
// Needs ffmpeg on PATH and a Chromium for Playwright.
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
    tagline: { type: "string" },
    accent: { type: "string" },
    desktop: { type: "string", default: "22" },
    pause: { type: "string", default: "1.6" },
    wait: { type: "string", default: "3" },
    "no-pwa": { type: "boolean", default: false },
  },
});
const url = positionals[0];
if (!url) throw new Error("Usage: node scripts/showcase-project.mjs <url> [--out dir] [--tagline text]");

const FPS = 60;
const STEP = 16; // one tick of the page's faked requestAnimationFrame
const W = 1920;
const H = 1080;
const PAUSE = Number(opt.pause);
const DESKTOP_SECONDS = Number(opt.desktop);

// Desktop window: 16:10, centred, rounded, soft shadow, no browser chrome.
const WIN = { w: 1512, h: 945, r: 18 };
WIN.x = Math.round((W - WIN.w) / 2);
WIN.y = Math.round((H - WIN.h) / 2);
// Phone: an iPhone screen (390×844 CSS px) drawn at 2x, shown 402 px wide in a black body.
const SCREEN = { w: 780, h: 1688, bar: 94 }; // raw pixels; bar = status bar height
const PHONE = { w: 432, h: 904, bezel: 15, r: 66 };
PHONE.sw = PHONE.w - PHONE.bezel * 2;
PHONE.sh = PHONE.h - PHONE.bezel * 2;

const host = new URL(url).hostname.replace(/^www\./, "");
const out = path.resolve(opt.out ?? path.join("capture", host.split(".")[0]));
const raw = path.join(out, "showcase-frames");
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeOut = (t) => 1 - (1 - t) ** 3;
const clamp01 = (t) => Math.max(0, Math.min(1, t));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const consent = /^(accept|accept all|allow all|agree|i agree|ok|got it|aceitar|aceitar todos|aceito|concordo|entendi|permitir)$/i;
const FONT = "-apple-system, 'SF Pro Display', 'Helvetica Neue', Inter, Arial, sans-serif";

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

/** Loads the page on a controllable clock, clears banners, plays every reveal once, then freezes time. */
async function openPage(context) {
  const page = await browser.newPage({ ...context, reducedMotion: "no-preference", colorScheme: "light" });
  await page.clock.install();
  await page.goto(url, { waitUntil: "networkidle", timeout: 45_000 }).catch((e) => {
    if (e.name !== "TimeoutError") throw e;
  });
  await page.addStyleTag({
    content: `html,body{scroll-behavior:auto!important;scrollbar-width:none!important}::-webkit-scrollbar{display:none!important}`,
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
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 50));
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
        await page.evaluate((y) => scrollTo(0, y), Math.round(from + (to - from) * ease(i / count)));
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
  const { stops, vh } = await stopsOf(page);
  const travel = (a, b) => Math.min(2.4, Math.max(0.9, (Math.abs(b - a) / vh) * 1.0));
  const duration = (s) => firstRest + s.slice(1).reduce((t, y, i) => t + travel(s[i], y) + pause, 0);
  let plan = stops;
  while (plan.length > 2 && duration(plan) > budget) {
    const gaps = plan.slice(1, -1).map((y, i) => [i + 1, Math.min(y - plan[i], plan[i + 2] - y)]);
    plan = plan.filter((_, i) => i !== gaps.sort((a, b) => a[1] - b[1])[0][0]);
  }
  const quick = duration(plan) > budget;
  await rec.rest(firstRest);
  for (let i = 1; i < plan.length; i++) {
    await rec.glide(plan[i - 1], plan[i], quick ? (budget - firstRest) / (plan.length - 1) - 0.4 : travel(plan[i - 1], plan[i]));
    await rec.rest(quick ? 0.4 : pause);
  }
  return plan;
}

/* Site identity: name, icon, accent colour, tagline. */

async function identity(page) {
  const info = await page.evaluate(() => {
    const m = (sel) => document.querySelector(sel)?.getAttribute("content")?.trim() || "";
    const href = (sel) => {
      const el = document.querySelector(sel);
      return el ? new URL(el.getAttribute("href"), location.href).href : "";
    };
    return {
      title: m('meta[property="og:site_name"]') || document.title.split(/[|·–—-]/)[0].trim(),
      description: m('meta[property="og:description"]') || m('meta[name="description"]'),
      theme: m('meta[name="theme-color"]'),
      manifest: href('link[rel="manifest"]'),
      touchIcon: href('link[rel="apple-touch-icon"]') || href('link[rel="apple-touch-icon-precomposed"]'),
      icon: href('link[rel="icon"][type="image/png"]') || href('link[rel="icon"]') || href('link[rel="shortcut icon"]'),
    };
  });
  let manifest = null;
  if (info.manifest) {
    manifest = await fetch(info.manifest, { signal: AbortSignal.timeout(10_000) })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
  }
  const best = manifest?.icons?.length
    ? new URL(
        [...manifest.icons].sort((a, b) => parseInt(b.sizes ?? "0", 10) - parseInt(a.sizes ?? "0", 10))[0].src,
        info.manifest,
      ).href
    : "";
  let icon = null;
  for (const src of [info.touchIcon, best, info.icon]) {
    if (!src) continue;
    const buf = await fetch(src, { signal: AbortSignal.timeout(10_000) })
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .catch(() => null);
    if (!buf) continue;
    icon = await sharp(Buffer.from(buf)).resize(256, 256, { fit: "cover" }).png().toBuffer().catch(() => null);
    if (icon) break;
  }
  const name = manifest?.short_name || manifest?.name || info.title || host;
  const accent = opt.accent || manifest?.theme_color || info.theme || "#16A34A";
  const firstSentence = (info.description.match(/^[^.!?]+[.!?]?/)?.[0] ?? "").trim();
  return { name, accent, icon, tagline: opt.tagline || firstSentence, installable: Boolean(manifest) };
}

/* Drawing helpers (SVG rendered by sharp). */

const svg = (w, h, body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`);
const roundMask = (w, h, r) => svg(w, h, `<rect width="${w}" height="${h}" rx="${r}" ry="${r}" fill="#fff"/>`);

function background() {
  return svg(
    W,
    H,
    `<defs>
      <radialGradient id="a" cx="8%" cy="6%" r="60%"><stop offset="0" stop-color="#bfe9cf"/><stop offset="1" stop-color="#bfe9cf" stop-opacity="0"/></radialGradient>
      <radialGradient id="b" cx="92%" cy="4%" r="55%"><stop offset="0" stop-color="#cfe2f4"/><stop offset="1" stop-color="#cfe2f4" stop-opacity="0"/></radialGradient>
      <radialGradient id="c" cx="96%" cy="98%" r="65%"><stop offset="0" stop-color="#f7cfa8"/><stop offset="1" stop-color="#f7cfa8" stop-opacity="0"/></radialGradient>
      <radialGradient id="d" cx="4%" cy="100%" r="50%"><stop offset="0" stop-color="#e6eef0"/><stop offset="1" stop-color="#e6eef0" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="#f4f1ea"/>
    <rect width="${W}" height="${H}" fill="url(#d)"/><rect width="${W}" height="${H}" fill="url(#a)"/>
    <rect width="${W}" height="${H}" fill="url(#b)"/><rect width="${W}" height="${H}" fill="url(#c)"/>`,
  );
}

async function shadow(w, h, r, blur, opacity) {
  const pad = blur * 3;
  return sharp(svg(w + pad * 2, h + pad * 2, `<rect x="${pad}" y="${pad}" width="${w}" height="${h}" rx="${r}" fill="rgba(20,24,20,${opacity})"/>`))
    .blur(blur)
    .png()
    .toBuffer()
    .then((input) => ({ input, pad }));
}

function statusBar(color, dark) {
  const ink = dark ? "#fff" : "#111";
  return svg(
    SCREEN.w,
    SCREEN.bar,
    `<rect width="100%" height="100%" fill="${color}"/>
    <text x="96" y="62" font-family="${FONT}" font-size="34" font-weight="600" fill="${ink}">9:41</text>
    <g fill="${ink}" transform="translate(600 40)">
      <rect x="0" y="14" width="7" height="10" rx="2"/><rect x="11" y="10" width="7" height="14" rx="2"/>
      <rect x="22" y="6" width="7" height="18" rx="2"/><rect x="33" y="2" width="7" height="22" rx="2"/>
      <rect x="60" y="1" width="50" height="23" rx="7" fill="none" stroke="${ink}" stroke-width="2.5" opacity="0.5"/>
      <rect x="64" y="5" width="38" height="15" rx="4"/><rect x="112" y="9" width="4" height="8" rx="2" opacity="0.5"/>
    </g>`,
  );
}

function homeScreen(accent, name, iconX, iconY, size) {
  const cells = [];
  for (let row = 0; row < 5; row++)
    for (let col = 0; col < 4; col++) {
      const x = 68 + col * 172;
      const y = 300 + row * 200;
      if (x === iconX && y === iconY) continue;
      cells.push(`<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="34" fill="#fff" opacity="0.22"/>`);
    }
  const dock = [0, 1, 2, 3].map((i) => `<rect x="${68 + i * 172}" y="1478" width="${size}" height="${size}" rx="34" fill="#fff" opacity="0.28"/>`);
  return svg(
    SCREEN.w,
    SCREEN.h,
    `<defs><linearGradient id="w" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="${accent}"/><stop offset="1" stop-color="#0d1f16"/></linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#w)"/><rect width="100%" height="100%" fill="#000" opacity="0.18"/>
    <text x="50%" y="210" text-anchor="middle" font-family="${FONT}" font-size="120" font-weight="300" fill="#fff">9:41</text>
    ${cells.join("")}
    <rect x="40" y="1446" width="${SCREEN.w - 80}" height="176" rx="56" fill="#fff" opacity="0.16"/>${dock.join("")}
    <text x="${iconX + size / 2}" y="${iconY + size + 34}" text-anchor="middle" font-family="${FONT}" font-size="24" fill="#fff">${esc(name.slice(0, 16))}</text>`,
  );
}

function iconTile(icon, size, accent, name) {
  if (icon)
    return sharp(icon)
      .resize(size, size)
      .composite([{ input: roundMask(size, size, Math.round(size * 0.225)), blend: "dest-in" }])
      .png()
      .toBuffer();
  return sharp(
    svg(size, size, `<rect width="${size}" height="${size}" rx="${size * 0.225}" fill="${accent}"/><text x="50%" y="66%" text-anchor="middle" font-family="${FONT}" font-size="${size * 0.5}" font-weight="700" fill="#fff">${esc(name[0] ?? "")}</text>`),
  )
    .png()
    .toBuffer();
}

/* Filming. */

await rm(out + "/showcase.mp4", { force: true });
await rm(raw, { recursive: true, force: true });
await mkdir(raw, { recursive: true });

// 1. Desktop.
const desk = await openPage({ viewport: { width: WIN.w, height: WIN.h }, deviceScaleFactor: 1 });
const id = await identity(desk);
const deskRec = recorder(desk, raw, "d");
await filmScroll(deskRec, desk, DESKTOP_SECONDS, { pause: PAUSE, firstRest: 1.6 });
await desk.close();

// 2. Phone: scroll down and back up, with the status bar drawn above the page.
const mob = await openPage({
  viewport: { width: 390, height: (SCREEN.h - SCREEN.bar) / 2 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
});
const mobRec = recorder(mob, raw, "m");
await mobRec.rest(1.0);
const { maxY } = await stopsOf(mob);
const down = Math.min(maxY, Math.round(((SCREEN.h - SCREEN.bar) / 2) * 1.8));
await mobRec.glide(0, down, 2.2);
await mobRec.rest(0.6);
await mobRec.glide(down, 0, 1.4);
await mobRec.rest(0.5);
const mobFrames = mobRec.files.length;
await mobRec.rest(2.0); // the app "opening" at the end plays these
await mob.close();
await browser.close();

/* Compositing. */

const final = path.join(out, "showcase-final");
await rm(final, { recursive: true, force: true });
await mkdir(final, { recursive: true });
let n = 0;
const emit = (buf) => writeFile(path.join(final, `${String(n++).padStart(5, "0")}.jpg`), buf);

const bg = await sharp(background()).png().toBuffer();
const winShadow = await shadow(WIN.w, WIN.h, WIN.r, 28, 0.16);
const winMask = roundMask(WIN.w, WIN.h, WIN.r);
const phoneShadow = await shadow(PHONE.w, PHONE.h, PHONE.r, 30, 0.22);
const screenMask = roundMask(PHONE.sw, PHONE.sh, PHONE.r - PHONE.bezel);
const phoneBody = await sharp(
  svg(
    PHONE.w,
    PHONE.h,
    `<rect width="${PHONE.w}" height="${PHONE.h}" rx="${PHONE.r}" fill="#0b0b0c"/>
    <rect x="1.5" y="1.5" width="${PHONE.w - 3}" height="${PHONE.h - 3}" rx="${PHONE.r - 1}" fill="none" stroke="#3a3a3c" stroke-width="3"/>`,
  ),
)
  .png()
  .toBuffer();
const island = await sharp(svg(PHONE.sw, 60, `<rect x="${PHONE.sw / 2 - 60}" y="13" width="120" height="34" rx="17" fill="#000"/>`))
  .png()
  .toBuffer();

// Status bar colour = the page's top row.
const firstMob = path.join(raw, "m00000.jpg");
const { dominant } = await sharp(firstMob).extract({ left: 0, top: 0, width: SCREEN.w, height: 6 }).stats();
const barColor = `rgb(${dominant.r},${dominant.g},${dominant.b})`;
const barDark = dominant.r * 0.3 + dominant.g * 0.59 + dominant.b * 0.11 < 128;
const bar = await sharp(statusBar(barColor, barDark)).png().toBuffer();

/** A phone screen image (raw size) from a mobile frame, with the status bar on top. */
const pageScreen = (file) =>
  sharp({ create: { width: SCREEN.w, height: SCREEN.h, channels: 3, background: barColor } })
    .composite([{ input: bar, top: 0, left: 0 }, { input: file, top: SCREEN.bar, left: 0 }])
    .png()
    .toBuffer();

/** The whole phone (body, screen, island) as a PNG at a given scale. */
async function phone(screen, scale = 1) {
  const scr = await sharp(screen)
    .resize(PHONE.sw, PHONE.sh)
    .composite([{ input: screenMask, blend: "dest-in" }, { input: island, top: 0, left: 0 }])
    .png()
    .toBuffer();
  const img = sharp(phoneBody).composite([{ input: scr, top: PHONE.bezel, left: PHONE.bezel }]);
  if (scale === 1) return img.png().toBuffer();
  return sharp(await img.png().toBuffer())
    .resize(Math.round(PHONE.w * scale), Math.round(PHONE.h * scale))
    .png()
    .toBuffer();
}

const phoneAt = (cx, cy, scale = 1) => ({
  left: Math.round(cx - (PHONE.w * scale) / 2),
  top: Math.round(cy - (PHONE.h * scale) / 2),
});

/** Places `layers` on the background; layers outside the canvas are cropped by hand (sharp refuses them). */
async function scene(layers) {
  const fitted = [];
  for (const l of layers) {
    const meta = await sharp(l.input).metadata();
    let { input, left, top } = l;
    const x0 = Math.max(0, left);
    const y0 = Math.max(0, top);
    const x1 = Math.min(W, left + meta.width);
    const y1 = Math.min(H, top + meta.height);
    if (x1 <= x0 || y1 <= y0) continue;
    if (x0 !== left || y0 !== top || x1 - x0 !== meta.width || y1 - y0 !== meta.height) {
      input = await sharp(input).extract({ left: x0 - left, top: y0 - top, width: x1 - x0, height: y1 - y0 }).png().toBuffer();
    }
    if (l.opacity != null && l.opacity < 1) {
      input = await sharp(input)
        .ensureAlpha()
        .composite([{ input: Buffer.from([255, 255, 255, Math.round(255 * l.opacity)]), raw: { width: 1, height: 1, channels: 4 }, tile: true, blend: "dest-in" }])
        .png()
        .toBuffer();
    }
    fitted.push({ input, left: x0, top: y0 });
  }
  return sharp(bg).composite(fitted).jpeg({ quality: 92 }).toBuffer();
}

const deskWindow = (file) =>
  sharp(file).composite([{ input: winMask, blend: "dest-in" }]).png().toBuffer();

// Desktop frames.
const deskFiles = deskRec.files;
for (const f of deskFiles) {
  await emit(
    await scene([
      { input: winShadow.input, left: WIN.x - winShadow.pad, top: WIN.y - winShadow.pad + 18 },
      { input: await deskWindow(f), left: WIN.x, top: WIN.y },
    ]),
  );
}

// Transition: the window lifts away and fades while the phone rises into the centre.
const lastDesk = await deskWindow(deskFiles.at(-1));
const firstScreen = await pageScreen(firstMob);
const phoneImg0 = await phone(firstScreen);
const T = Math.round(1.3 * FPS);
for (let i = 1; i <= T; i++) {
  const t = easeOut(i / T);
  const s = 1 - 0.08 * t;
  const win = await sharp(lastDesk).resize(Math.round(WIN.w * s), Math.round(WIN.h * s)).png().toBuffer();
  const p = phoneAt(W / 2, H + PHONE.h / 2 - (H + PHONE.h / 2 - H / 2) * t);
  await emit(
    await scene([
      { input: win, left: Math.round((W - WIN.w * s) / 2), top: Math.round(WIN.y - 160 * t), opacity: 1 - clamp01(t * 1.2) },
      { input: phoneShadow.input, left: p.left - phoneShadow.pad, top: p.top - phoneShadow.pad + 20 },
      { input: phoneImg0, ...p },
    ]),
  );
}

const centre = phoneAt(W / 2, H / 2);
const phoneFrame = async (screen, pos = centre) =>
  emit(
    await scene([
      { input: phoneShadow.input, left: pos.left - phoneShadow.pad, top: pos.top - phoneShadow.pad + 20 },
      { input: await phone(screen), ...pos },
    ]),
  );

// Mobile scroll.
const mobFiles = mobRec.files;
for (const f of mobFiles.slice(0, mobFrames)) await phoneFrame(await pageScreen(f));

let lastScreen = await pageScreen(mobFiles[mobFrames - 1]);
if (id.installable && !opt["no-pwa"]) {
  const iconSize = 132;
  const sheetIcon = await iconTile(id.icon, 120, id.accent, id.name);
  const sheet = await sharp(
    svg(
      SCREEN.w,
      640,
      `<rect width="${SCREEN.w}" height="680" rx="44" fill="#f7f7f7"/>
      <text x="40" y="74" font-family="${FONT}" font-size="32" fill="#007aff">Cancel</text>
      <text x="50%" y="74" text-anchor="middle" font-family="${FONT}" font-size="32" font-weight="600" fill="#111">Add to Home Screen</text>
      <text x="${SCREEN.w - 40}" y="74" text-anchor="end" font-family="${FONT}" font-size="32" font-weight="600" fill="#007aff">Add</text>
      <rect x="40" y="130" width="${SCREEN.w - 80}" height="200" rx="24" fill="#fff"/>
      <text x="${70 + 120 + 30}" y="215" font-family="${FONT}" font-size="34" fill="#111">${esc(id.name.slice(0, 22))}</text>
      <text x="${70 + 120 + 30}" y="265" font-family="${FONT}" font-size="28" fill="#8a8a8e">${esc(host)}</text>
      <text x="60" y="400" font-family="${FONT}" font-size="26" fill="#8a8a8e">An icon will be added to your Home Screen so you</text>
      <text x="60" y="436" font-family="${FONT}" font-size="26" fill="#8a8a8e">can quickly access this website.</text>`,
    ),
  )
    .composite([{ input: sheetIcon, left: 70, top: 170 }])
    .png()
    .toBuffer();
  const dim = await sharp({ create: { width: SCREEN.w, height: SCREEN.h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0.35 } } })
    .png()
    .toBuffer();

  // Sheet slides up over the dimmed page, holds, slides away.
  const up = Math.round(0.45 * FPS);
  for (let i = 0; i <= up + Math.round(1.1 * FPS); i++) {
    const t = easeOut(clamp01(i / up));
    const screen = await sharp(lastScreen)
      .composite([
        { input: await sharp(dim).ensureAlpha(t).png().toBuffer(), top: 0, left: 0 },
        { input: sheet, top: Math.round(SCREEN.h - 640 * t), left: 0 },
      ])
      .png()
      .toBuffer();
    await phoneFrame(screen);
  }

  // Home screen with the new icon; a tap; a white splash; the app.
  const iconX = 68 + 2 * 172;
  const iconY = 300 + 1 * 200;
  const home = await sharp(homeScreen(id.accent, id.name, iconX, iconY, iconSize))
    .composite([{ input: await iconTile(id.icon, iconSize, id.accent, id.name), left: iconX, top: iconY }])
    .png()
    .toBuffer();
  const fade = Math.round(0.35 * FPS);
  for (let i = 1; i <= fade + Math.round(0.9 * FPS); i++) {
    const a = clamp01(i / fade);
    await phoneFrame(await sharp(lastScreen).composite([{ input: await sharp(home).ensureAlpha(a).png().toBuffer() }]).png().toBuffer());
  }
  const press = Math.round(0.25 * FPS);
  for (let i = 1; i <= press; i++) {
    const s = 1 - 0.12 * Math.sin((Math.PI * i) / press);
    const sz = Math.round(iconSize * s);
    const tile = await iconTile(id.icon, sz, id.accent, id.name);
    const pressed = await sharp(homeScreen(id.accent, id.name, iconX, iconY, iconSize))
      .composite([{ input: tile, left: Math.round(iconX + (iconSize - sz) / 2), top: Math.round(iconY + (iconSize - sz) / 2) }])
      .png()
      .toBuffer();
    await phoneFrame(pressed);
  }
  const splashIcon = await iconTile(id.icon, 200, id.accent, id.name);
  const splash = await sharp({ create: { width: SCREEN.w, height: SCREEN.h, channels: 3, background: "#ffffff" } })
    .composite([{ input: splashIcon, left: (SCREEN.w - 200) / 2, top: (SCREEN.h - 200) / 2 - 40 }])
    .png()
    .toBuffer();
  const grow = Math.round(0.35 * FPS);
  for (let i = 1; i <= grow + Math.round(0.4 * FPS); i++) {
    const a = clamp01(i / grow);
    await phoneFrame(await sharp(home).composite([{ input: await sharp(splash).ensureAlpha(a).png().toBuffer() }]).png().toBuffer());
  }
  // The app opens on the live page (its last two seconds of frames keep animations running).
  const tail = mobFiles.slice(mobFrames);
  for (const [i, f] of tail.slice(0, Math.round(1.0 * FPS)).entries()) {
    const a = clamp01(i / Math.round(0.35 * FPS));
    const live = await pageScreen(f);
    await phoneFrame(await sharp(splash).composite([{ input: await sharp(live).ensureAlpha(a).png().toBuffer() }]).png().toBuffer());
    lastScreen = live;
  }
}

// Outro: the phone moves left, the name, tagline and URL come in on the right.
const tagline = id.tagline;
const words = tagline.split(/\s+/);
const lines = [];
for (const w of words) {
  if (!lines.length || (lines.at(-1) + " " + w).length > 34) lines.push(w);
  else lines[lines.length - 1] += " " + w;
}
const brandIcon = await iconTile(id.icon, 76, id.accent, id.name);
const textW = 760;
const pillW = Math.round(host.length * 17 + 56);
const brand = await sharp(
  svg(
    textW,
    360,
    `<text x="100" y="62" font-family="${FONT}" font-size="64" font-weight="700" fill="#111">${esc(id.name)}</text>
    ${lines
      .slice(0, 3)
      .map((l, i) => `<text x="0" y="${150 + i * 46}" font-family="${FONT}" font-size="34" fill="${i === lines.length - 1 && lines.length > 1 ? id.accent : "#333"}">${esc(l)}</text>`)
      .join("")}
    <rect x="0" y="${150 + Math.min(lines.length, 3) * 46 - 10}" width="${pillW}" height="58" rx="29" fill="#111"/>
    <text x="${pillW / 2}" y="${150 + Math.min(lines.length, 3) * 46 + 28}" text-anchor="middle" font-family="${FONT}" font-size="28" font-weight="600" fill="#fff">${esc(host)}</text>`,
  ),
)
  .composite([{ input: brandIcon, left: 0, top: 6 }])
  .png()
  .toBuffer();
const outroPhone = await phone(lastScreen);
const O = Math.round(1.1 * FPS);
const hold = Math.round(2.2 * FPS);
const fromX = W / 2;
const toX = W / 2 - 330;
for (let i = 1; i <= O + hold; i++) {
  const t = ease(clamp01(i / O));
  const pos = phoneAt(fromX + (toX - fromX) * t, H / 2);
  const tt = easeOut(clamp01((i - O * 0.45) / (O * 0.8)));
  await emit(
    await scene([
      { input: phoneShadow.input, left: pos.left - phoneShadow.pad, top: pos.top - phoneShadow.pad + 20 },
      { input: outroPhone, ...pos },
      { input: brand, left: Math.round(W / 2 - 40 + 30 * (1 - tt)), top: Math.round(H / 2 - 150), opacity: tt },
    ]),
  );
}

// Encode at 60 fps with a silent track (some players expect one), plus a poster.
const mp4 = path.join(out, "showcase.mp4");
const encode = (crf) =>
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error",
    "-framerate", String(FPS), "-i", path.join(final, "%05d.jpg"),
    "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
    "-shortest",
    "-c:v", "libx264", "-preset", "slow", "-crf", String(crf), "-pix_fmt", "yuv420p", "-profile:v", "high", "-r", String(FPS),
    "-c:a", "aac", "-b:a", "32k",
    "-movflags", "+faststart",
    mp4,
  ]);
let crf = 20;
encode(crf);
while ((await stat(mp4)).size > 30 * 1024 * 1024 && crf < 32) encode((crf += 3));
await sharp(path.join(final, "00000.jpg")).webp({ quality: 86 }).toFile(path.join(out, "showcase.webp"));
await rm(raw, { recursive: true, force: true });
await rm(final, { recursive: true, force: true });

const seconds = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp4]).toString());
const files = await readdir(out);
console.log(
  JSON.stringify(
    {
      url,
      name: id.name,
      tagline,
      accent: id.accent,
      installable: id.installable,
      icon: Boolean(id.icon),
      seconds: +seconds.toFixed(1),
      crf,
      size: `${((await stat(mp4)).size / 1048576).toFixed(1)} MB`,
      files: files.filter((f) => f.startsWith("showcase")),
    },
    null,
    2,
  ),
);
