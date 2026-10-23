"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** What fades in as it enters the viewport and out again as it leaves. */
const TARGETS = [
  ".section-head",
  ".strip-item",
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
    const io = new IntersectionObserver(
      (entries) => {
        // Things that arrive together cascade in rather than popping at once.
        let i = 0;
        for (const e of entries) {
          const el = e.target as HTMLElement;
          if (e.isIntersecting) {
            el.style.setProperty("--sr-delay", `${Math.min(i++, 6) * 110}ms`);
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
        el.classList.add("sr");
        io.observe(el);
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
