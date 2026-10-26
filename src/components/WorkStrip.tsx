"use client";

import Image from "next/image";
import Link from "@/components/LocaleLink";
import { type CSSProperties, type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Project } from "@/db/schema";
import { useDict } from "@/lib/i18n/client";
import { useAtTop } from "@/lib/useAtTop";

// What the cards really measure (see the slot maths in WorkStrip and .strip-item in the CSS), so
// the browser picks a sharp enough copy on retina screens: one card plus half of the next is about
// 60% of the width (most of it on phones), a little over half on very wide screens; a 9:16 reel
// is at most about 47vh wide.
const DESKTOP_SIZES = "(max-width: 640px) 84vw, (max-width: 1440px) 62vw, (max-width: 2400px) 52vw, 44vw";
const MOBILE_SIZES = "(max-width: 640px) 62vw, 47vh";

const isVideo = (url: string) => /\.(mp4|webm|mov)(\?|$)/i.test(url);

/**
 * Shift + wheel over the strip moves the carousel sideways with inertia, then eases onto the
 * nearest project. A plain wheel scrolls the page; sideways trackpad swipes stay native.
 */
function useWheelToHorizontal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let target = el.scrollLeft;
    let frame = 0;
    let snapping = false;
    let settle: ReturnType<typeof setTimeout> | undefined;
    const max = () => el.scrollWidth - el.clientWidth;
    const clamp = (v: number) => Math.min(max(), Math.max(0, v));

    const animate = () => {
      cancelAnimationFrame(frame);
      const step = () => {
        const diff = target - el.scrollLeft;
        if (Math.abs(diff) < 0.5) {
          el.scrollLeft = target;
          frame = 0;
          if (snapping) el.classList.remove("is-wheeling");
          snapping = false;
          return;
        }
        // At least a pixel a frame: smaller steps can be rounded away, and the glide would never land.
        el.scrollLeft += Math.sign(diff) * Math.max(1, Math.abs(diff) * 0.05);
        frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };

    // Once the wheel stops, glide to the project closest to the centre and hand back to CSS snapping.
    const snapToNearest = () => {
      snapping = true;
      if (target <= 1 || target >= max() - 1) return animate(); // the ends are already resting points
      const items = [...el.children] as HTMLElement[];
      const centre = target + el.clientWidth / 2;
      const nearest = items.reduce((a, b) =>
        Math.abs(b.offsetLeft + b.offsetWidth / 2 - centre) <
        Math.abs(a.offsetLeft + a.offsetWidth / 2 - centre)
          ? b
          : a,
      );
      target = clamp(
        nearest.offsetLeft + nearest.offsetWidth / 2 - el.clientWidth / 2,
      );
      animate();
    };

    const onWheel = (e: WheelEvent) => {
      // Only Shift + wheel; pinch-zoom and plain scrolling are left alone.
      if (!e.shiftKey || e.ctrlKey || max() <= 0) return;
      // Some browsers already turn Shift + wheel into a sideways delta.
      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (!frame) target = el.scrollLeft;
      if ((target <= 1 && delta < 0) || (target >= max() - 1 && delta > 0)) return;
      e.preventDefault();
      const px =
        e.deltaMode === 1
          ? delta * 32
          : e.deltaMode === 2
            ? delta * el.clientWidth
            : delta;
      el.classList.add("is-wheeling");
      snapping = false;
      target = clamp(target + px * 0.85);
      animate();
      clearTimeout(settle);
      settle = setTimeout(snapToNearest, 260);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      cancelAnimationFrame(frame);
      clearTimeout(settle);
    };
  }, []);
  return ref;
}

type View = "desktop" | "mobile";

/** A monitor and a phone, drawn in the text colour. */
const VIEW_ICON: Record<View, ReactNode> = {
  desktop: (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <rect x="1.5" y="2.5" width="13" height="8.5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6 14h4M8 11v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  mobile: (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <rect x="4.5" y="1.5" width="7" height="13" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M7 12.2h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
};

/** Plays the clip of the visible view while the card is hovered, or on touch screens from its corner button. */
function WorkCard({
  project: p,
  index: i,
  view: chosen,
}: {
  project: Project;
  index: number;
  view: View;
}) {
  const card = useRef<HTMLDivElement>(null);
  // "Mobile" shows the project's own mobile clip (a 9:16 reel). Older showcase films without one
  // carry a phone part instead, and their "Mobile" button jumps the film there.
  const showcase = p.showcaseUrl;
  const phoneClip = Boolean(p.coverMobileUrl || p.previewMobileUrl);
  const mobileAt = showcase && !phoneClip ? p.showcaseMobileAt : null;
  const jumps = mobileAt != null;
  // The carousel's switch picks the view; a project with no mobile clip stays on desktop.
  const view: View = jumps || phoneClip ? chosen : "desktop";
  const [active, setActive] = useState(false);
  // Paused from the corner button; cleared when the pointer leaves the card.
  const [held, setHeld] = useState(false);
  const [playing, setPlaying] = useState(false);
  const ring = useRef<SVGCircleElement>(null);
  const t = useDict();

  // On touch screens nothing plays by itself: the corner button, always shown, plays and pauses.
  const [touch, setTouch] = useState(false);
  useEffect(() => setTouch(matchMedia("(hover: none)").matches), []);

  // The film starts from the part that matches the chosen view.
  useEffect(() => {
    const v = card.current?.querySelector<HTMLVideoElement>("video[data-showcase]");
    if (!v || mobileAt == null) return;
    const at = view === "mobile" ? mobileAt : 0;
    // With preload="none" nothing is loaded yet, and some browsers drop a seek made before the
    // metadata arrives, so seek again once it does.
    if (v.readyState >= 1) v.currentTime = at;
    else v.addEventListener("loadedmetadata", () => (v.currentTime = at), { once: true });
  }, [view, mobileAt]);

  useEffect(() => {
    let current: HTMLVideoElement | null = null;
    card.current?.querySelectorAll("video").forEach((v) => {
      const shown = v.dataset.showcase != null ? jumps || view === "desktop" : v.dataset.view === view;
      const on = active && shown;
      if (on) current = v;
      v.classList.toggle("is-playing", on);
      if (on && !held) v.play().catch(() => {});
      else v.pause();
    });
    const v = current as HTMLVideoElement | null;
    if (!v) return setPlaying(false);

    // The ring under the corner button follows the clip's progress, frame by frame.
    let frame = 0;
    const tick = () => {
      const c = ring.current;
      if (c && v.duration) c.style.strokeDashoffset = String(1 - v.currentTime / v.duration);
      frame = requestAnimationFrame(tick);
    };
    const sync = () => setPlaying(!v.paused);
    v.addEventListener("play", sync);
    v.addEventListener("pause", sync);
    sync();
    tick();
    return () => {
      cancelAnimationFrame(frame);
      v.removeEventListener("play", sync);
      v.removeEventListener("pause", sync);
    };
  }, [active, view, jumps, held]);

  return (
    <div
      ref={card}
      className="strip-item"
      style={{ "--i": i } as CSSProperties}
      data-view={jumps ? "desktop" : view}
      onMouseEnter={() => !touch && setActive(true)}
      onMouseLeave={() => {
        if (touch) return;
        setActive(false);
        setHeld(false);
      }}
    >
      <Link
        href={`/work/${p.slug}`}
        className="frame"
        style={{ background: p.tint }}
        aria-label={p.title}
      >
        {showcase ? (
          <div className="frame-view frame-desktop">
            {p.showcasePosterUrl || p.coverUrl ? (
              <Image
                src={(p.showcasePosterUrl || p.coverUrl)!}
                alt=""
                fill
                sizes={DESKTOP_SIZES}
                quality={85}
                priority={i < 3}
              />
            ) : null}
            <video
              className="frame-preview"
              data-showcase=""
              src={showcase}
              muted
              loop={mobileAt == null}
              playsInline
              preload="none"
              // In the mobile view the film loops over its phone part.
              onEnded={(e) => {
                e.currentTarget.currentTime = view === "mobile" ? (mobileAt ?? 0) : 0;
                e.currentTarget.play().catch(() => {});
              }}
            />
          </div>
        ) : (
          <div className="frame-view frame-desktop">
            {p.coverUrl ? (
              <Image
                src={p.coverUrl}
                alt=""
                fill
                sizes={DESKTOP_SIZES}
                quality={85}
                priority={i < 3}
              />
            ) : (
              <span
                className="frame-empty eyebrow"
                style={{ color: "var(--faint)", fontSize: 10 }}
              >
                {p.title}
              </span>
            )}
            {p.previewUrl ? (
              isVideo(p.previewUrl) ? (
                <video
                  className="frame-preview"
                  data-view="desktop"
                  src={p.previewUrl}
                  muted
                  loop
                  playsInline
                  preload="none"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="frame-preview"
                  src={p.previewUrl}
                  alt=""
                  loading="lazy"
                />
              )
            ) : null}
          </div>
        )}
        {phoneClip ? (
          <div className="frame-view frame-mobile">
            <div className="reel">
              {p.coverMobileUrl ? (
                <Image
                  src={p.coverMobileUrl}
                  alt=""
                  fill
                  sizes={MOBILE_SIZES}
                  quality={85}
                />
              ) : null}
              {p.previewMobileUrl ? (
                <video
                  className="frame-preview"
                  data-view="mobile"
                  src={p.previewMobileUrl}
                  muted
                  loop
                  playsInline
                  preload="none"
                />
              ) : null}
            </div>
          </div>
        ) : null}
      </Link>
      {/* Outside the link, so pausing doesn't open the project. */}
      <button
        type="button"
        className={`frame-control${touch || (active && (playing || held)) ? " is-shown" : ""}`}
        aria-label={playing ? t.home.pause : t.home.play}
        tabIndex={touch || active ? 0 : -1}
        onClick={() => (touch ? setActive((a) => !a) : setHeld((h) => !h))}
      >
        <svg viewBox="0 0 36 36" aria-hidden="true">
          <circle className="frame-control-track" cx="18" cy="18" r="17" />
          <circle ref={ring} className="frame-control-ring" cx="18" cy="18" r="17" pathLength="1" />
          {!playing ? (
            <path d="M14.5 12.5v11l9-5.5z" fill="currentColor" />
          ) : (
            <path d="M14 12.5v11M22 12.5v11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          )}
        </svg>
      </button>
      <div className="strip-meta">
        <Link href={`/work/${p.slug}`}>{p.title}</Link>
        <span className="muted">{p.year}</span>
      </div>
    </div>
  );
}

/**
 * The carousel, with one Desktop · Mobile switch for all of its cards. With `hideAtTop` the
 * switch stays out of sight while the page is at the very top, where the scroll arrow shows.
 */
export function WorkStrip({ projects, hideAtTop = false }: { projects: Project[]; hideAtTop?: boolean }) {
  const strip = useWheelToHorizontal();
  const atTop = useAtTop(hideAtTop);
  const t = useDict();
  // One switch for the whole carousel. It opens on the visitor's own kind of screen.
  const [view, setView] = useState<View>("desktop");
  const viewRef = useRef(view);
  const fitRef = useRef(() => {});
  const hasMobile = projects.some(
    (p) => p.coverMobileUrl || p.previewMobileUrl || (p.showcaseUrl && p.showcaseMobileAt != null),
  );
  useEffect(() => {
    if (hasMobile && matchMedia("(max-width: 600px)").matches) setView("mobile");
  }, [hasMobile]);

  // Slot width: as large as the screen allows (a 16:9 card no taller than 62% of it), with the
  // first screen showing k whole slots and half of the next, whatever the viewport.
  useLayoutEffect(() => {
    const el = strip.current;
    if (!el) return;
    const fit = () => {
      const cs = getComputedStyle(el);
      const pad = parseFloat(cs.paddingLeft);
      const gap = parseFloat(cs.columnGap) || 0;
      const room = el.clientWidth - pad;
      // On a phone a 16:9 card one and a half to the screen is too small to read, so the Desktop
      // view there fills most of the width and leaves a sliver of the next card instead.
      if (el.clientWidth <= 640 && viewRef.current === "desktop")
        return el.style.setProperty("--slot-w", `${(room - gap) / 1.15}px`);
      const max = (window.innerHeight * 0.62 * 16) / 9;
      let k = 1;
      const slot = () => (room - k * gap) / (k + 0.5);
      while (slot() > max && k < 6) k++;
      el.style.setProperty("--slot-w", `${slot()}px`);
    };
    fitRef.current = fit;
    fit();
    // The cards slide in from 90px to the right (see .strip.sr), and scroll snapping measures
    // them where they are drawn, so a strip that snapped mid-slide would rest 90px off its start.
    // Snapping stays off (.is-entering) while the cards are out of place and until the slide-in
    // is over; then they are where the snap expects them.
    let shown = el.classList.contains("sr-in");
    let entered: ReturnType<typeof setTimeout> | undefined;
    const watch = () => {
      if (el.classList.contains("sr-in") === shown) return;
      shown = !shown;
      clearTimeout(entered);
      if (!shown) el.classList.add("is-entering");
      else entered = setTimeout(() => el.classList.remove("is-entering"), 2600);
    };
    if (shown) entered = setTimeout(() => el.classList.remove("is-entering"), 2600);
    const mo = new MutationObserver(watch);
    mo.observe(el, { attributes: true, attributeFilter: ["class"] });
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    window.addEventListener("resize", fit);
    return () => {
      ro.disconnect();
      mo.disconnect();
      clearTimeout(entered);
      window.removeEventListener("resize", fit);
    };
  }, [strip]);

  // The slot depends on the view on phones (see fit above).
  useLayoutEffect(() => {
    viewRef.current = view;
    fitRef.current();
  }, [view]);

  // While the cards morph between Desktop and Mobile, keep the one in the middle in the middle.
  const morphed = useRef(view);
  useLayoutEffect(() => {
    const el = strip.current;
    if (!el || morphed.current === view) return;
    morphed.current = view;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const items = [...el.children] as HTMLElement[];
    const centre = el.scrollLeft + el.clientWidth / 2;
    const anchor = items.reduce<HTMLElement | undefined>(
      (a, b) =>
        !a ||
        Math.abs(b.offsetLeft + b.offsetWidth / 2 - centre) <
          Math.abs(a.offsetLeft + a.offsetWidth / 2 - centre)
          ? b
          : a,
      undefined,
    );
    if (!anchor) return;
    el.classList.add("is-morphing");
    const end = performance.now() + 1400;
    let frame = 0;
    const step = () => {
      // The end cards rest against the padding (see .strip-item:first-child in the CSS).
      el.scrollLeft =
        anchor === items[0]
          ? 0
          : anchor === items.at(-1)
            ? el.scrollWidth
            : anchor.offsetLeft + anchor.offsetWidth / 2 - el.clientWidth / 2;
      if (performance.now() < end) frame = requestAnimationFrame(step);
      else el.classList.remove("is-morphing");
    };
    frame = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frame);
      el.classList.remove("is-morphing");
    };
  }, [view, strip]);

  // Cards cut off at an edge step the carousel when clicked; above it, a counter steps it with
  // − and +, and a hairline shows (and drags) the position.
  const track = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(0);
  const stepBy = useRef<(dir: 1 | -1) => void>(() => {});
  useEffect(() => {
    const el = strip.current;
    const bar = track.current;
    if (!el || !bar) return;
    const items = () => [...el.children] as HTMLElement[];
    const peekOf = (item: HTMLElement) => {
      const s = el.getBoundingClientRect();
      const r = (item.querySelector(".frame") ?? item).getBoundingClientRect();
      if (r.right > s.right + 2 && r.left < s.right) return "next";
      if (r.left < s.left - 2 && r.right > s.left) return "prev";
      return null;
    };
    // The card being looked at: the first at the start, the last at the end, else the one in the middle.
    const currentIndex = () => {
      const list = items();
      if (el.scrollLeft <= 1) return 0;
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 1) return list.length - 1;
      const centre = el.scrollLeft + el.clientWidth / 2;
      let best = 0;
      list.forEach((b, i) => {
        const a = list[best];
        if (Math.abs(b.offsetLeft + b.offsetWidth / 2 - centre) < Math.abs(a.offsetLeft + a.offsetWidth / 2 - centre))
          best = i;
      });
      return best;
    };
    let frame = 0;
    const update = () => {
      setPos(currentIndex());
      frame = 0;
      const total = el.scrollWidth;
      bar.style.setProperty("--thumb-w", String(Math.min(1, el.clientWidth / total)));
      bar.style.setProperty("--thumb-x", String(el.scrollLeft / total));
      bar.hidden = total <= el.clientWidth + 1;
      for (const item of items()) {
        const peek = peekOf(item);
        item.classList.toggle("is-peek", peek !== null);
        if (peek) item.dataset.peek = peek;
        else delete item.dataset.peek;
      }
    };
    const schedule = () => (frame ||= requestAnimationFrame(update));

    // Moves by one card, landing it where the snap would.
    const step = (dir: 1 | -1) => {
      const list = items();
      const next = list[Math.min(list.length - 1, Math.max(0, currentIndex() + dir))];
      el.scrollTo({ left: next.offsetLeft + next.offsetWidth / 2 - el.clientWidth / 2, behavior: "smooth" });
    };
    stepBy.current = step;
    const onClick = (e: MouseEvent) => {
      const item = (e.target as Element).closest<HTMLElement>(".strip-item");
      // Keyboard activation (detail 0) still opens the project.
      if (!item || e.detail === 0 || (e.target as Element).closest(".frame-control")) return;
      const peek = peekOf(item);
      if (!peek) return;
      e.preventDefault();
      e.stopPropagation();
      step(peek === "next" ? 1 : -1);
    };

    // Dragging the hairline moves the strip directly (snapping off), then eases onto a card.
    let drag: { x: number; left: number } | null = null;
    const ratio = () => el.scrollWidth / bar.clientWidth;
    // A press off the thumb glides there instead of jumping: the strip eases onto the card that
    // lands under the pointer, with snapping off until it arrives.
    let glide = 0;
    const glideTo = (to: number) => {
      cancelAnimationFrame(glide);
      const from = el.scrollLeft;
      const ms = Math.min(900, 380 + Math.abs(to - from) * 0.12);
      const start = performance.now();
      el.classList.add("is-wheeling");
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / ms);
        const k = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
        el.scrollLeft = from + (to - from) * k;
        if (t < 1) glide = requestAnimationFrame(tick);
        else {
          glide = 0;
          el.classList.remove("is-wheeling");
        }
      };
      glide = requestAnimationFrame(tick);
    };
    const onDown = (e: PointerEvent) => {
      const thumb = bar.querySelector<HTMLElement>(".strip-thumb")!.getBoundingClientRect();
      const box = bar.getBoundingClientRect();
      if (e.clientX < thumb.left || e.clientX > thumb.right) {
        const max = el.scrollWidth - el.clientWidth;
        const want = Math.min(max, Math.max(0, (e.clientX - box.left - thumb.width / 2) * ratio()));
        const centre = want + el.clientWidth / 2;
        const list = items();
        const card = list.reduce((a, b) =>
          Math.abs(b.offsetLeft + b.offsetWidth / 2 - centre) < Math.abs(a.offsetLeft + a.offsetWidth / 2 - centre) ? b : a,
        );
        // The end cards rest against the padding, like the snap does.
        const i = list.indexOf(card);
        glideTo(i === 0 ? 0 : i === list.length - 1 ? max : Math.min(max, card.offsetLeft + card.offsetWidth / 2 - el.clientWidth / 2));
        return;
      }
      cancelAnimationFrame(glide);
      el.classList.add("is-wheeling");
      drag = { x: e.clientX, left: el.scrollLeft };
      bar.setPointerCapture(e.pointerId);
      bar.classList.add("is-dragging");
    };
    const onMove = (e: PointerEvent) => {
      if (drag) el.scrollLeft = drag.left + (e.clientX - drag.x) * ratio();
    };
    const onUp = () => {
      if (!drag) return;
      drag = null;
      bar.classList.remove("is-dragging");
      el.classList.remove("is-wheeling"); // snapping back on settles onto the nearest card
    };

    update();
    el.addEventListener("scroll", schedule, { passive: true });
    el.addEventListener("click", onClick, true);
    bar.addEventListener("pointerdown", onDown);
    bar.addEventListener("pointermove", onMove);
    bar.addEventListener("pointerup", onUp);
    bar.addEventListener("pointercancel", onUp);
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    // The entrance and the Desktop/Mobile morph move the cards without scrolling.
    el.addEventListener("transitionend", schedule);
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(glide);
      ro.disconnect();
      el.removeEventListener("scroll", schedule);
      el.removeEventListener("click", onClick, true);
      el.removeEventListener("transitionend", schedule);
      bar.removeEventListener("pointerdown", onDown);
      bar.removeEventListener("pointermove", onMove);
      bar.removeEventListener("pointerup", onUp);
      bar.removeEventListener("pointercancel", onUp);
    };
  }, [strip, projects.length]);

  // The switch, the counter and the hairline all stay out of sight while the page is at the top.
  const hidden = hideAtTop && atTop;

  if (projects.length === 0)
    return <p className="muted wrap">{t.home.noProjects}</p>;
  return (
    <>
      {hasMobile ? (
        <div className={`strip-lead${hidden ? " is-hidden" : ""}`} inert={hidden}>
          <div className="view-toggle strip-toggle" role="group" aria-label={t.home.latestWork}>
            {(["desktop", "mobile"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
              >
                {VIEW_ICON[v]}
                {t.home[v]}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {projects.length > 1 ? (
        <div className={`strip-count${hidden ? " is-hidden" : ""}`} inert={hidden}>
          <button
            type="button"
            aria-label={t.home.previousProject}
            disabled={pos === 0}
            onClick={() => stepBy.current(-1)}
          >
            −
          </button>
          <span aria-live="polite">
            {pos + 1}/{projects.length}
          </span>
          <button
            type="button"
            aria-label={t.home.nextProject}
            disabled={pos === projects.length - 1}
            onClick={() => stepBy.current(1)}
          >
            +
          </button>
        </div>
      ) : null}
      <div className={`strip-track${hidden ? " is-hidden" : ""}`} ref={track} aria-hidden="true" inert={hidden}>
        <div className="strip-thumb" />
      </div>
      {/* Rendered hidden ("sr") so the cards can play their entrance even when the strip is on screen
          at load; ScrollReveal adds "sr-in". Without JS or with reduced motion the CSS shows them. */}
      <div className="strip sr is-entering" ref={strip}>
        {projects.map((p, i) => (
          <WorkCard key={p.id} project={p} index={i} view={view} />
        ))}
      </div>
    </>
  );
}
