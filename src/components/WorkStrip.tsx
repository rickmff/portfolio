"use client";

import Image from "next/image";
import Link from "next/link";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import type { Project } from "@/db/schema";
import { useDict } from "@/lib/i18n/client";

const isVideo = (url: string) => /\.(mp4|webm|mov)(\?|$)/i.test(url);

/**
 * While the pointer is over the strip, the vertical wheel moves the carousel sideways with
 * inertia, then eases onto the nearest project. At either end the wheel goes back to the page.
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
        el.scrollLeft += diff * 0.06;
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
      // Sideways trackpad swipes and pinch-zoom keep their native behaviour.
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || max() <= 0)
        return;
      if (!frame) target = el.scrollLeft;
      if (
        (target <= 1 && e.deltaY < 0) ||
        (target >= max() - 1 && e.deltaY > 0)
      )
        return;
      e.preventDefault();
      e.stopPropagation(); // keep the page's smooth scroller out of it
      const px =
        e.deltaMode === 1
          ? e.deltaY * 32
          : e.deltaMode === 2
            ? e.deltaY * el.clientWidth
            : e.deltaY;
      el.classList.add("is-wheeling");
      snapping = false;
      target = clamp(target + px * 1.1);
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

/** Plays the clip of the visible view while the card is hovered, or on touch screens while it sits mostly in view. */
function WorkCard({
  project: p,
  index: i,
}: {
  project: Project;
  index: number;
}) {
  const t = useDict();
  const card = useRef<HTMLDivElement>(null);
  // A showcase film already covers desktop and phone, so it replaces the two views.
  const showcase = p.showcaseUrl;
  const hasMobile =
    !showcase && Boolean(p.coverMobileUrl || p.previewMobileUrl);
  const [view, setView] = useState<View>("desktop");
  const [active, setActive] = useState(false);

  // Open on the visitor's own kind of screen.
  useEffect(() => {
    if (hasMobile && matchMedia("(max-width: 600px)").matches)
      setView("mobile");
  }, [hasMobile]);

  useEffect(() => {
    const el = card.current;
    if (!el || !matchMedia("(hover: none)").matches) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), {
      threshold: 0.6,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    card.current?.querySelectorAll("video").forEach((v) => {
      const on = active && v.dataset.view === view;
      v.classList.toggle("is-playing", on);
      if (on) v.play().catch(() => {});
      else v.pause();
    });
  }, [active, view]);

  return (
    <div
      ref={card}
      className="strip-item"
      style={{ "--i": i } as CSSProperties}
      data-view={view}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
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
                sizes="(max-width: 600px) 86vw, 720px"
                quality={82}
                priority={i < 3}
              />
            ) : null}
            <video
              className="frame-preview"
              data-view="desktop"
              src={showcase}
              muted
              loop
              playsInline
              preload="none"
            />
          </div>
        ) : (
          <div className="frame-view frame-desktop">
            {p.coverUrl ? (
              <Image
                src={p.coverUrl}
                alt=""
                fill
                sizes="(max-width: 600px) 86vw, 720px"
                quality={80}
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
        {hasMobile ? (
          <div className="frame-view frame-mobile">
            <div className="phone">
              {p.coverMobileUrl ? (
                <Image
                  src={p.coverMobileUrl}
                  alt=""
                  fill
                  sizes="220px"
                  quality={80}
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
      <div className="strip-meta">
        <Link href={`/work/${p.slug}`}>
          <span
            className="mono"
            style={{ color: "var(--faint)", marginRight: 12 }}
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          {p.title}
        </Link>
        {hasMobile ? (
          <span className="view-toggle" role="group" aria-label={p.title}>
            {(["desktop", "mobile"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
              >
                {t.home[v]}
              </button>
            ))}
          </span>
        ) : (
          <span className="muted">{p.year}</span>
        )}
      </div>
    </div>
  );
}

export function WorkStrip({ projects }: { projects: Project[] }) {
  const strip = useWheelToHorizontal();
  const t = useDict();
  if (projects.length === 0)
    return <p className="muted wrap">{t.home.noProjects}</p>;
  return (
    // Rendered hidden ("sr") so the cards can play their entrance even when the strip is on screen
    // at load; ScrollReveal adds "sr-in". Without JS or with reduced motion the CSS shows them.
    <div className="strip sr" ref={strip}>
      {projects.map((p, i) => (
        <WorkCard key={p.id} project={p} index={i} />
      ))}
    </div>
  );
}
