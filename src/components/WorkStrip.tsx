"use client";

import Link from "next/link";
import type { Project } from "@/db/schema";

const isVideo = (url: string) => /\.(mp4|webm|mov)(\?|$)/i.test(url);

export function WorkStrip({ projects }: { projects: Project[] }) {
  if (projects.length === 0) return <p className="muted wrap">No projects yet.</p>;
  return (
    <div className="strip">
      {projects.map((p, i) => (
        <Link
          key={p.id}
          href={`/work/${p.slug}`}
          className="strip-item"
          onMouseEnter={(e) => e.currentTarget.querySelector("video")?.play().catch(() => {})}
          onMouseLeave={(e) => e.currentTarget.querySelector("video")?.pause()}
        >
          <div className="frame" style={{ background: p.tint }}>
            {p.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.coverUrl} alt="" loading="lazy" />
            ) : (
              <span className="frame-empty eyebrow" style={{ color: "var(--faint)", fontSize: 10 }}>
                {p.title}
              </span>
            )}
            {p.previewUrl ? (
              isVideo(p.previewUrl) ? (
                <video className="frame-preview" src={p.previewUrl} muted loop playsInline preload="none" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="frame-preview" src={p.previewUrl} alt="" loading="lazy" />
              )
            ) : null}
          </div>
          <div className="strip-meta">
            <span>
              <span className="mono" style={{ color: "var(--faint)", marginRight: 12 }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              {p.title}
            </span>
            <span className="muted">{p.year}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
