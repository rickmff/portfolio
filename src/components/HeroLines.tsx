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

  // **bold** segments keep their emphasis; every word becomes its own span.
  const words = text
    .split(/(\*\*[^*]+\*\*)/g)
    .flatMap((part) => {
      const bold = part.startsWith("**") && part.endsWith("**");
      return (bold ? part.slice(2, -2) : part).split(/\s+/).filter(Boolean).map((w) => ({ w, bold }));
    });

  return (
    <h1 ref={ref} className="hero-lines">
      <span className="sr-only">{text.replace(/\*\*/g, "")}</span>
      <span aria-hidden="true">
        {words.map(({ w, bold }, i) => (
          <span key={i}>
            <span className="hl-w">{bold ? <strong>{w}</strong> : w}</span>{" "}
          </span>
        ))}
      </span>
    </h1>
  );
}
