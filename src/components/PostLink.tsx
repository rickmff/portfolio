"use client";

import Image from "next/image";
import Link from "@/components/LocaleLink";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  href: string;
  title: string;
  month: string;
  banner: string | null;
  meta: string;
  excerpt: string;
};

/**
 * A post on the writing list. On hover (pointer devices only) a small card trails the cursor
 * with the banner, reading time, date and excerpt.
 */
export function PostLink({ href, title, month, banner, meta, excerpt }: Props) {
  const card = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pos = useRef({ x: 0, y: 0, tx: 0, ty: 0, raf: 0 });

  useEffect(() => {
    setMounted(true);
    const p = pos.current;
    return () => cancelAnimationFrame(p.raf);
  }, []);

  const follow = () => {
    const p = pos.current;
    p.x += (p.tx - p.x) * 0.16;
    p.y += (p.ty - p.y) * 0.16;
    if (card.current) card.current.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
    p.raf = Math.abs(p.tx - p.x) + Math.abs(p.ty - p.y) > 0.3 ? requestAnimationFrame(follow) : 0;
  };

  const place = (e: React.MouseEvent, snap = false) => {
    const p = pos.current;
    const w = card.current?.offsetWidth ?? 260;
    const h = card.current?.offsetHeight ?? 220;
    // Sit to the lower right of the cursor, flipping near the window edges.
    p.tx = e.clientX + 24 + w > window.innerWidth ? e.clientX - w - 24 : e.clientX + 24;
    p.ty = e.clientY + 24 + h > window.innerHeight ? e.clientY - h - 16 : e.clientY + 20;
    if (snap) {
      p.x = p.tx;
      p.y = p.ty;
    }
    if (!p.raf) p.raf = requestAnimationFrame(follow);
  };

  // Portalled to <body>: page wrappers animate transforms, which would trap a fixed element.
  const peek = (
      <span ref={card} className={`post-peek${open ? " is-open" : ""}`} aria-hidden="true">
      <span className="post-peek-inner">
        {banner ? (
          <span className="post-peek-banner">
            <Image src={banner} alt="" fill sizes="260px" quality={70} />
          </span>
        ) : null}
        <span className="post-peek-body">
          <span className="post-peek-meta">{meta}</span>
          {excerpt ? <span className="post-peek-excerpt">{excerpt}</span> : null}
        </span>
      </span>
    </span>
  );

  return (
    <Link
      href={href}
      className="post-link"
      onMouseEnter={(e) => {
        place(e, true);
        setOpen(true);
      }}
      onMouseMove={(e) => place(e)}
      onMouseLeave={() => setOpen(false)}
    >
      <span className="dash" />
      <span style={{ flex: 1 }}>{title}</span>
      <span className="mono" style={{ color: "var(--faint)" }}>{month}</span>
      {mounted ? createPortal(peek, document.body) : null}
    </Link>
  );
}
