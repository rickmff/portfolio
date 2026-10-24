"use client";

import { Arrow } from "./Arrow";
import { useEffect, useRef, useState } from "react";

/** Down arrow under the work heading. Fades away once the projects it points at are on screen. */
export function ScrollCue({ target, label }: { target: string; label: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const el = document.querySelector(target);
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setGone(e.isIntersecting), { threshold: 0.85 });
    io.observe(el);
    return () => io.disconnect();
  }, [target]);

  return (
    <a ref={ref} href={target} className={`scroll-cue${gone ? " is-gone" : ""}`} aria-label={label} tabIndex={gone ? -1 : 0}>
      <Arrow dir="down" />
    </a>
  );
}
