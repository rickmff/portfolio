"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * The hero sentence, revealed one visual line at a time. Lines depend on the viewport, so the
 * words are measured after layout and every word on the same line shares that line's delay.
 */
export function HeroLines({ text }: { text: string }) {
  const ref = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const h = ref.current;
    if (!h) return;
    const measure = () => {
      let line = -1;
      let top = -Infinity;
      h.querySelectorAll<HTMLElement>(".hl-w").forEach((w) => {
        if (w.offsetTop > top + 4) {
          top = w.offsetTop;
          line++;
        }
        w.style.setProperty("--line", String(line));
      });
      // The lines after the sentence wait for its last line.
      h.parentElement?.style.setProperty("--hero-lines", String(line + 1));
    };
    measure();
    h.classList.add("is-ready");
    const ro = new ResizeObserver(measure);
    ro.observe(h);
    return () => ro.disconnect();
  }, []);

  // **bold** segments keep their emphasis; every word becomes its own span. A word that touches
  // the segment before it (the comma in "**problems**,") is glued on without a space.
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  const words = parts.flatMap((part, p) => {
    const bold = part.startsWith("**") && part.endsWith("**");
    const inner = bold ? part.slice(2, -2) : part;
    const touches = p > 0 && !/^\s/.test(inner) && !/\s$/.test(parts[p - 1]);
    return inner
      .split(/\s+/)
      .filter(Boolean)
      .map((w, i) => ({ w, bold, glue: i === 0 && touches }));
  });

  return (
    <h1 ref={ref} className="hero-lines">
      <span className="sr-only">{text.replace(/\*\*/g, "")}</span>
      <span aria-hidden="true">
        {words.map(({ w, bold, glue }, i) => (
          <span key={i}>
            {i > 0 && !glue ? " " : null}
            <span className="hl-w">{bold ? <strong>{w}</strong> : w}</span>
          </span>
        ))}
      </span>
    </h1>
  );
}
