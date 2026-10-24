"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * The project page's cover: the film's poster, and the film itself while the pointer is over it
 * (or, on touch screens, while it sits mostly in view), like the cards in Latest Work.
 */
export function ProjectCover({ poster, video, title, tint }: { poster: string | null; video: string | null; title: string; tint: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const clip = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = frame.current;
    if (!el || !video || !matchMedia("(hover: none)").matches) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, [video]);

  useEffect(() => {
    const v = clip.current;
    if (!v) return;
    v.classList.toggle("is-playing", active);
    if (active) v.play().catch(() => {});
    else v.pause();
  }, [active]);

  return (
    <div
      ref={frame}
      className="frame project-cover"
      style={{ aspectRatio: "16 / 9", background: tint, marginBottom: 80 }}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
    >
      {poster ? <Image src={poster} alt={title} fill sizes="(max-width: 1100px) 100vw, 1000px" priority /> : null}
      {video ? <video ref={clip} className="frame-preview" src={video} muted loop playsInline preload="metadata" /> : null}
    </div>
  );
}
