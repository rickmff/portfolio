"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Dir = "down" | "right" | "left";

/**
 * A small arrow that trails the cursor inside the work section. Over the carousel it points the
 * way the carousel is moving (right by default, left after scrolling back); elsewhere in the
 * section it points down. Pointer devices only.
 */
export function CursorArrow({ section, strip }: { section: string; strip: string }) {
  const el = useRef<HTMLSpanElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const sec = document.querySelector<HTMLElement>(section);
    const arrow = el.current;
    if (!sec || !arrow || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let dir: Dir = "down";
    let lastDir: Exclude<Dir, "down"> = "right";
    let over = false;
    let x = 0;
    let y = 0;
    let cx = 0;
    let cy = 0;
    let raf = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Where the arrow sits relative to the cursor for each direction.
    const OFFSET: Record<Dir, [number, number]> = { down: [-7, 26], right: [22, -11], left: [-36, -11] };

    const frame = () => {
      const [ox, oy] = OFFSET[dir];
      const k = reduced ? 1 : 0.2;
      cx += (x + ox - cx) * k;
      cy += (y + oy - cy) * k;
      arrow.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      raf = Math.abs(x + ox - cx) + Math.abs(y + oy - cy) > 0.2 ? requestAnimationFrame(frame) : 0;
    };
    const run = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const setDir = (d: Dir) => {
      if (d === dir) return;
      dir = d;
      arrow.dataset.dir = d;
      run();
    };
    const inStrip = (t: EventTarget | null) => t instanceof Element && !!t.closest(strip);

    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!over) {
        over = true;
        const [ox, oy] = OFFSET[dir];
        cx = x + ox;
        cy = y + oy;
        arrow.classList.add("is-on");
      }
      setDir(inStrip(e.target) ? lastDir : "down");
      run();
    };
    // Page scrolling moves the content under a still cursor.
    const pageScrolled = () => {
      if (over) setDir(inStrip(document.elementFromPoint(x, y)) ? lastDir : "down");
    };
    const leave = () => {
      over = false;
      arrow.classList.remove("is-on");
    };

    // The carousel's own scroll position tells which way it is going, wheel or trackpad alike.
    const s = sec.querySelector<HTMLElement>(`${strip} .strip`) ?? sec.querySelector<HTMLElement>(strip);
    let prev = s?.scrollLeft ?? 0;
    const scrolled = () => {
      if (!s) return;
      const d = s.scrollLeft - prev;
      prev = s.scrollLeft;
      if (Math.abs(d) < 0.5) return;
      lastDir = d > 0 ? "right" : "left";
      // At the far end only going back makes sense, and at the start only going forward.
      if (s.scrollLeft >= s.scrollWidth - s.clientWidth - 2) lastDir = "left";
      if (s.scrollLeft <= 2) lastDir = "right";
      if (dir !== "down") setDir(lastDir);
    };

    sec.addEventListener("pointermove", move);
    sec.addEventListener("pointerleave", leave);
    s?.addEventListener("scroll", scrolled, { passive: true });
    window.addEventListener("scroll", pageScrolled, { passive: true });
    return () => {
      window.removeEventListener("scroll", pageScrolled);
      cancelAnimationFrame(raf);
      sec.removeEventListener("pointermove", move);
      sec.removeEventListener("pointerleave", leave);
      s?.removeEventListener("scroll", scrolled);
    };
  }, [mounted, section, strip]);

  if (!mounted) return null;
  return createPortal(
    <span ref={el} className="cursor-arrow" data-dir="down" aria-hidden="true">
      <svg width="14" height="22" viewBox="0 0 14 22" fill="none">
        <path d="M7 1v19M1 14l6 6 6-6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>,
    document.body,
  );
}
