"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect } from "react";

/** Page-wide smooth, inertial wheel scrolling. Touch keeps the native feel; reduced motion opts out. */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.075, wheelMultiplier: 0.9, anchors: { offset: -24 } });
    let frame = requestAnimationFrame(function raf(t) {
      lenis.raf(t);
      frame = requestAnimationFrame(raf);
    });
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);
  return null;
}
