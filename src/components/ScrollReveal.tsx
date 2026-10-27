"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** What fades in as it enters the viewport and out again as it leaves. */
const TARGETS = [
  ".section-head",
  ".strip",
  ".shelf-label",
  ".shelf",
  ".year-row",
  ".prose > *",
  ".harness-group h2",
  ".harness-group li",
  ".site-footer",
  "[data-reveal]",
].join(",");

/**
 * Soft fade-and-rise for page content on scroll. Classes are added from JS only, so without
 * JS (or with reduced motion) everything is simply visible.
 */
export function ScrollReveal() {
  const pathname = usePathname();
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const seen = new WeakSet<Element>();
    const fresh: Element[] = [];
    const io = new IntersectionObserver(
      (entries) => {
        // Things that arrive together cascade in rather than popping at once.
        let i = 0;
        for (const e of entries) {
          const el = e.target as HTMLElement;
          if (e.isIntersecting) {
            // A section can hold its content back a little more with data-sr-delay="<ms>".
            const base = Number(el.closest<HTMLElement>("[data-sr-delay]")?.dataset.srDelay) || 0;
            el.style.setProperty("--sr-delay", `${base + Math.min(i++, 6) * 110}ms`);
            el.classList.add("sr-in");
          } else {
            el.style.setProperty("--sr-delay", "0ms");
            el.classList.remove("sr-in");
          }
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.08 },
    );
    const scan = () => {
      for (const el of document.querySelectorAll(TARGETS)) {
        if (seen.has(el)) continue;
        seen.add(el);
        if (el.classList.contains("sr")) {
          // Rendered hidden on the server (the work strip): it always plays its entrance.
          io.observe(el);
          continue;
        }
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) {
          // Already on screen when the script runs: it was painted visible, so leave it that way.
          el.classList.add("sr", "sr-in");
        } else {
          // Hide without a transition, otherwise it visibly fades out before fading back in.
          el.classList.add("sr", "sr-instant");
          fresh.push(el);
        }
        io.observe(el);
      }
      if (fresh.length) {
        const batch = fresh.splice(0);
        requestAnimationFrame(() =>
          requestAnimationFrame(() => batch.forEach((el) => el.classList.remove("sr-instant"))),
        );
      }
    };
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      io.disconnect();
    };
  }, [pathname]);
  return null;
}
