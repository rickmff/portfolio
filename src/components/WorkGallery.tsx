"use client";

import Image from "next/image";
import Link from "@/components/LocaleLink";
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { Project } from "@/db/schema";
import { useDict } from "@/lib/i18n/client";
import { useAtTop } from "@/lib/useAtTop";

// What the frames really measure, so the browser picks a sharp enough copy on retina screens:
// two columns inside a 1180px gallery (the first project takes the full row when the count is
// odd), one column on phones; reels are four to a row, two on phones.
const DESKTOP_SIZES = "(max-width: 640px) 92vw, (max-width: 1260px) 48vw, 590px";
const FEATURED_SIZES = "(max-width: 640px) 92vw, (max-width: 1260px) 96vw, 1180px";
const MOBILE_SIZES = "(max-width: 640px) 46vw, (max-width: 960px) 31vw, 280px";

const isVideo = (url: string) => /\.(mp4|webm|mov)(\?|$)/i.test(url);

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
  featured,
}: {
  project: Project;
  index: number;
  view: View;
  featured: boolean;
}) {
  const card = useRef<HTMLDivElement>(null);
  // "Mobile" shows the project's own mobile clip (a 9:16 reel). Older showcase films without one
  // carry a phone part instead, and their "Mobile" button jumps the film there.
  const showcase = p.showcaseUrl;
  const phoneClip = Boolean(p.coverMobileUrl || p.previewMobileUrl);
  const mobileAt = showcase && !phoneClip ? p.showcaseMobileAt : null;
  const jumps = mobileAt != null;
  // The gallery's switch picks the view; a project with no mobile clip stays on desktop.
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

    // The ring under the corner button follows the clip's progress, frame by frame, but only
    // while it plays: a paused clip leaves the ring where it is and the main thread idle.
    let frame = 0;
    const tick = () => {
      const c = ring.current;
      if (c && v.duration) c.style.strokeDashoffset = String(1 - v.currentTime / v.duration);
      frame = v.paused ? 0 : requestAnimationFrame(tick);
    };
    const sync = () => {
      setPlaying(!v.paused);
      cancelAnimationFrame(frame);
      tick();
    };
    v.addEventListener("play", sync);
    v.addEventListener("pause", sync);
    sync();
    return () => {
      cancelAnimationFrame(frame);
      v.removeEventListener("play", sync);
      v.removeEventListener("pause", sync);
    };
  }, [active, view, jumps, held]);

  return (
    <div
      ref={card}
      // Rendered hidden ("sr") so each card plays its entrance as it scrolls in; ScrollReveal adds
      // "sr-in". Without JS or with reduced motion the CSS shows them.
      className={`work-card sr${featured ? " is-featured" : ""}`}
      style={{ "--i": i, viewTransitionName: `work-${p.id}` } as CSSProperties}
      data-view={jumps ? "desktop" : view}
      onMouseEnter={() => !touch && setActive(true)}
      onMouseLeave={() => {
        if (touch) return;
        setActive(false);
        setHeld(false);
      }}
    >
      <div className="work-media">
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
                sizes={featured ? FEATURED_SIZES : DESKTOP_SIZES}
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
                sizes={featured ? FEATURED_SIZES : DESKTOP_SIZES}
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
      </div>
      <div className="work-meta">
        <Link href={`/work/${p.slug}`}>{p.title}</Link>
        <span>{p.year}</span>
      </div>
      {p.summary ? <p className="work-summary">{p.summary}</p> : null}
    </div>
  );
}

/**
 * The project gallery: a grid of cards (two to a row, the first one across the whole row when
 * the count is odd), with one Desktop · Mobile switch for all of them. Mobile turns every card
 * into a 9:16 reel, four to a row. With `hideAtTop` the switch stays out of sight while the page
 * is at the very top, where the scroll arrow shows.
 */
export function WorkGallery({ projects, hideAtTop = false }: { projects: Project[]; hideAtTop?: boolean }) {
  const atTop = useAtTop(hideAtTop);
  const t = useDict();
  // One switch for the whole gallery. It opens on the visitor's own kind of screen.
  const [view, setView] = useState<View>("desktop");
  const hasMobile = projects.some(
    (p) => p.coverMobileUrl || p.previewMobileUrl || (p.showcaseUrl && p.showcaseMobileAt != null),
  );
  useEffect(() => {
    if (hasMobile && matchMedia("(max-width: 600px)").matches) setView("mobile");
  }, [hasMobile]);

  // Where the browser can, the cards glide from one layout to the other (each card is its own
  // view transition, see .work-card in the CSS); elsewhere, and with reduced motion, they swap.
  const choose = (v: View) => {
    if (v === view) return;
    const doc = document as Document & { startViewTransition?: (update: () => void) => unknown };
    if (!doc.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) return setView(v);
    doc.startViewTransition(() => flushSync(() => setView(v)));
  };

  const hidden = hideAtTop && atTop;
  // An odd count leaves the last row half empty; the first (latest) project takes a row of its own instead.
  const featureFirst = projects.length % 2 === 1;

  if (projects.length === 0)
    return <p className="muted wrap">{t.home.noProjects}</p>;
  return (
    <>
      {hasMobile ? (
        <div className={`work-lead${hidden ? " is-hidden" : ""}`} inert={hidden}>
          <div className="view-toggle" role="group" aria-label={t.home.latestWork}>
            {(["desktop", "mobile"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => choose(v)}
              >
                {VIEW_ICON[v]}
                {t.home[v]}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="work-grid" data-view={view}>
        {projects.map((p, i) => (
          <WorkCard key={p.id} project={p} index={i} view={view} featured={featureFirst && i === 0} />
        ))}
      </div>
    </>
  );
}
