"use client";

import { useEffect, useRef, useState } from "react";

/** Down arrow under the work heading. Fades away once the projects it points at are on screen. */
export function ScrollCue({ target, label }: { target: string; label: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const el = document.querySelector(target);
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setGone(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, [target]);

  return (
    <a ref={ref} href={target} className={`scroll-cue${gone ? " is-gone" : ""}`} aria-label={label} tabIndex={gone ? -1 : 0}>
      <svg width="14" height="22" viewBox="0 0 14 22" fill="none" aria-hidden="true">
        <path d="M7 1v19M1 14l6 6 6-6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  );
}
