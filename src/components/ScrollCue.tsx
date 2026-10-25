"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Arrow } from "./Arrow";

/**
 * A down arrow at the foot of the screen that points at the work below. It shows only while the
 * page is at the very top and fades away on the first scroll.
 */
export function ScrollCue({ href, label }: { href: string; label: string }) {
  const [atTop, setAtTop] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const update = () => setAtTop(window.scrollY < 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  // Portalled to <body>: a transformed ancestor would pin a fixed element to that ancestor
  // instead of the screen.
  if (!mounted) return null;
  return createPortal(
    <a
      href={href}
      className={`scroll-cue${atTop ? " is-shown" : ""}`}
      aria-label={label}
      aria-hidden={!atTop}
      tabIndex={atTop ? 0 : -1}
    >
      <Arrow dir="down" />
    </a>,
    document.body,
  );
}
