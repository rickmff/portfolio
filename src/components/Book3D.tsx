"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useDict } from "@/lib/i18n/client";

type Props = {
  title: string;
  author: string;
  color: string;
  ink: string;
  coverUrl: string | null;
  thickness: number;
};

const REST = { x: -6, y: -28 };
const clampX = (x: number) => Math.max(-40, Math.min(40, x));

/**
 * A CSS 3D book: six faces, no WebGL, so it costs nothing to load and paints with the page.
 * Drag (or arrow keys) turns it, a flick keeps it spinning with friction, double-click resets.
 */
export function Book3D({ title, author, color, ink, coverUrl, thickness }: Props) {
  const t = useDict();
  const stage = useRef<HTMLDivElement>(null);
  const book = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLParagraphElement>(null);
  const depth = Math.round(Math.min(72, Math.max(22, thickness * 1.3)));

  useEffect(() => {
    const el = stage.current;
    const b = book.current;
    if (!el || !b) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let rot = { ...REST };
    let vel = { x: 0, y: 0 };
    let target: { x: number; y: number } | null = null;
    let drag: { id: number; x: number; y: number; t: number } | null = null;
    let raf = 0;

    const paint = () => {
      b.style.transform = `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`;
      // Light comes from the upper left: the cover dims as it turns away from it.
      const facing = Math.cos(((rot.y + 20) * Math.PI) / 180);
      b.style.setProperty("--shade", String(Math.max(0, 0.28 - facing * 0.28).toFixed(3)));
    };

    const tick = () => {
      raf = 0;
      if (drag) return;
      if (target) {
        rot.x += (target.x - rot.x) * 0.12;
        rot.y += (target.y - rot.y) * 0.12;
        if (Math.abs(target.x - rot.x) + Math.abs(target.y - rot.y) < 0.05) {
          rot = { ...target };
          target = null;
        }
      } else {
        rot.y += vel.y;
        rot.x = clampX(rot.x + vel.x);
        vel = { x: vel.x * 0.94, y: vel.y * 0.94 };
        if (Math.abs(vel.x) + Math.abs(vel.y) < 0.02) vel = { x: 0, y: 0 };
      }
      paint();
      if (target || vel.x || vel.y) raf = requestAnimationFrame(tick);
    };
    const run = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const goTo = (x: number, y: number) => {
      vel = { x: 0, y: 0 };
      if (reduced) {
        rot = { x, y };
        paint();
      } else {
        target = { x, y };
        run();
      }
    };

    const seen = () => hint.current?.classList.add("is-hidden");

    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp };
      target = null;
      vel = { x: 0, y: 0 };
      el.setPointerCapture(e.pointerId);
      el.classList.add("is-dragging");
      seen();
    };
    const move = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      const dt = Math.max(1, e.timeStamp - drag.t);
      rot.y += dx * 0.5;
      rot.x = clampX(rot.x - dy * 0.35);
      // Velocity per frame (16ms), for the flick after release.
      const cap = (v: number) => Math.max(-12, Math.min(12, v));
      vel = { x: cap(((-dy * 0.35) / dt) * 16), y: cap(((dx * 0.5) / dt) * 16) };
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp };
      paint();
    };
    const up = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      // Held still before letting go: no flick.
      if (reduced || e.timeStamp - drag.t > 80) vel = { x: 0, y: 0 };
      drag = null;
      el.classList.remove("is-dragging");
      run();
    };
    const key = (e: KeyboardEvent) => {
      const step = { ArrowLeft: [0, -20], ArrowRight: [0, 20], ArrowUp: [12, 0], ArrowDown: [-12, 0] }[e.key];
      if (step) {
        e.preventDefault();
        seen();
        goTo(clampX((target ?? rot).x + step[0]), (target ?? rot).y + step[1]);
      } else if (e.key === "Home" || e.key === "Escape") {
        goTo(REST.x, REST.y);
      }
    };
    const reset = () => goTo(REST.x, REST.y + Math.round((rot.y - REST.y) / 360) * 360);

    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("keydown", key);
    el.addEventListener("dblclick", reset);

    // Entrance: the book turns in from showing its back.
    if (reduced) paint();
    else {
      rot = { x: REST.x, y: REST.y - 200 };
      paint();
      goTo(REST.x, REST.y);
    }

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("keydown", key);
      el.removeEventListener("dblclick", reset);
    };
  }, []);

  return (
    <div className="b3d">
      <div
        ref={stage}
        className="b3d-stage"
        tabIndex={0}
        role="img"
        aria-label={t.books.model(title)}
      >
        <div
          ref={book}
          className="b3d-book"
          style={{ "--d": `${depth}px`, "--bg": color, "--book-ink": ink } as React.CSSProperties}
        >
          <div className="b3d-face b3d-front">
            {coverUrl ? (
              <Image src={coverUrl} alt="" fill sizes="200px" priority draggable={false} />
            ) : (
              <>
                <span className="b3d-author">{author}</span>
                <span className="b3d-title">{title}</span>
              </>
            )}
            <span className="b3d-shade" />
          </div>
          <div className="b3d-face b3d-back">
            <span className="b3d-author">{author}</span>
          </div>
          <div className="b3d-face b3d-spine">
            <span className="b3d-spine-title">{title}</span>
          </div>
          <div className="b3d-face b3d-edge" />
          <div className="b3d-face b3d-top" />
          <div className="b3d-face b3d-bottom" />
        </div>
        <div className="b3d-floor" aria-hidden />
      </div>
      <p ref={hint} className="b3d-hint" aria-hidden>
        {t.books.dragHint}
      </p>
    </div>
  );
}
