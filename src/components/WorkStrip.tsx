"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Project } from "@/db/schema";

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
        el.scrollLeft += diff * 0.1;
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
        Math.abs(b.offsetLeft + b.offsetWidth / 2 - centre) < Math.abs(a.offsetLeft + a.offsetWidth / 2 - centre) ? b : a,
      );
      target = clamp(nearest.offsetLeft + nearest.offsetWidth / 2 - el.clientWidth / 2);
      animate();
    };

    const onWheel = (e: WheelEvent) => {
      // Sideways trackpad swipes and pinch-zoom keep their native behaviour.
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || max() <= 0) return;
      if (!frame) target = el.scrollLeft;
      if ((target <= 1 && e.deltaY < 0) || (target >= max() - 1 && e.deltaY > 0)) return;
      e.preventDefault();
      e.stopPropagation(); // keep the page's smooth scroller out of it
      const px = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * el.clientWidth : e.deltaY;
      el.classList.add("is-wheeling");
      snapping = false;
      target = clamp(target + px * 1.6);
      animate();
      clearTimeout(settle);
      settle = setTimeout(snapToNearest, 180);
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
