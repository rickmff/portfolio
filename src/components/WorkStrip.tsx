"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Project } from "@/db/schema";

const isVideo = (url: string) => /\.(mp4|webm|mov)(\?|$)/i.test(url);

/**
 * While the pointer is over the strip, the vertical wheel moves the carousel sideways.
 * At either end the wheel goes back to scrolling the page, so nobody gets stuck.
 */
function useWheelToHorizontal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let settle: ReturnType<typeof setTimeout> | undefined;
    const onWheel = (e: WheelEvent) => {
      // Sideways trackpad swipes and pinch-zoom keep their native behaviour.
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      const atStart = el.scrollLeft <= 1 && e.deltaY < 0;
      const atEnd = el.scrollLeft >= max - 1 && e.deltaY > 0;
      if (atStart || atEnd) return;
      e.preventDefault();
      const px = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * el.clientWidth : e.deltaY;
      // Snapping fights small wheel steps, so it is paused while the wheel moves and
      // restored once it stops, which then eases the strip onto the nearest project.
      el.classList.add("is-wheeling");
      el.scrollLeft += px * 1.4;
      clearTimeout(settle);
      settle = setTimeout(() => el.classList.remove("is-wheeling"), 160);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      clearTimeout(settle);
    };
  }, []);
  return ref;
}

export function WorkStrip({ projects }: { projects: Project[] }) {
  const strip = useWheelToHorizontal();
  if (projects.length === 0) return <p className="muted wrap">No projects yet.</p>;
  return (
    <div className="strip" ref={strip}>
      {projects.map((p, i) => (
        <Link
          key={p.id}
          href={`/work/${p.slug}`}
          className="strip-item"
          onMouseEnter={(e) => e.currentTarget.querySelector("video")?.play().catch(() => {})}
          onMouseLeave={(e) => e.currentTarget.querySelector("video")?.pause()}
        >
          <div className="frame" style={{ background: p.tint }}>
            {p.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.coverUrl} alt="" loading="lazy" />
            ) : (
              <span className="frame-empty eyebrow" style={{ color: "var(--faint)", fontSize: 10 }}>
                {p.title}
              </span>
            )}
            {p.previewUrl ? (
              isVideo(p.previewUrl) ? (
                <video className="frame-preview" src={p.previewUrl} muted loop playsInline preload="none" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="frame-preview" src={p.previewUrl} alt="" loading="lazy" />
              )
            ) : null}
          </div>
          <div className="strip-meta">
            <span>
              <span className="mono" style={{ color: "var(--faint)", marginRight: 12 }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              {p.title}
            </span>
            <span className="muted">{p.year}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
