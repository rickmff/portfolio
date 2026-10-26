"use client";

import Image from "next/image";
import { useRef } from "react";
import Link from "@/components/LocaleLink";

type Tile = {
  slug: string;
  title: string;
  year: number;
  summary: string;
  image: string | null;
  video: string | null;
  tint: string;
};

/** Every published project as a two-column gallery; the film plays while a tile is hovered. */
export function ProjectGallery({ projects }: { projects: Tile[] }) {
  return (
    <ul className="gallery">
      {projects.map((p, i) => (
        <GalleryTile key={p.slug} p={p} priority={i < 2} />
      ))}
    </ul>
  );
}

function GalleryTile({ p, priority }: { p: Tile; priority: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const play = () => {
    if (!video.current || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    video.current.play().catch(() => {});
  };
  const stop = () => {
    if (!video.current) return;
    video.current.pause();
    video.current.currentTime = 0;
  };
  return (
    <li className="gallery-item reveal">
      <Link href={`/work/${p.slug}`} onMouseEnter={play} onMouseLeave={stop} onFocus={play} onBlur={stop}>
        <div className="gallery-frame" style={{ background: p.tint }}>
          {p.image ? (
            <Image src={p.image} alt="" fill sizes="(max-width: 760px) 100vw, 50vw" priority={priority} />
          ) : null}
          {p.video ? <video ref={video} src={p.video} muted loop playsInline preload="none" aria-hidden="true" /> : null}
        </div>
        <div className="gallery-meta">
          <h2>{p.title}</h2>
          <span>{p.year}</span>
        </div>
        {p.summary ? <p>{p.summary}</p> : null}
      </Link>
    </li>
  );
}
