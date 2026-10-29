/*
 * Inert markup: hidden by CSS unless <html data-holiday="halloween">. Strokes follow the site's
 * one icon (Arrow): round caps and joins, ~1.25px.
 */

/** A small spider on a thread, hanging off the avatar's shoulder. Climbs up, shy, on hover. */
export function HalloweenSpider() {
  return (
    <span className="hw-spider" aria-hidden="true">
      <span className="hw-spider-sway">
        <span className="hw-spider-climb">
          <span className="hw-thread" />
          <svg viewBox="0 0 16 16" width="18" height="18" fill="none">
            <g stroke="currentColor" strokeWidth="0.95" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6.8 6 4.6 3.4 2.6 4.2M6.4 7.4 3.6 5.6 1.4 7.2M6.4 8.8 3.6 8.2 1.6 10.6M6.8 10.2l-2.4.4L3 13.4" />
              <path d="M9.2 6l2.2-2.6 2 .8M9.6 7.4l2.8-1.8 2.2 1.6M9.6 8.8l2.8-.6 2 2.4M9.2 10.2l2.4.4 1.4 2.8" />
            </g>
            <ellipse cx="8" cy="9.8" rx="2.6" ry="3" fill="currentColor" />
            <ellipse className="hw-sheen" cx="7.2" cy="8.7" rx="0.9" ry="1.3" />
            <circle cx="8" cy="5.7" r="1.75" fill="currentColor" />
            <circle className="hw-eye" cx="7.35" cy="5.95" r="0.48" />
            <circle className="hw-eye" cx="8.65" cy="5.95" r="0.48" />
          </svg>
        </span>
      </span>
    </span>
  );
}

const BAT =
  "M10.9 3.2 11.4 4.4Q12 4.1 12.6 4.4L13.1 3.2 13.6 5C15.5 3.6 19 2.6 23 3.6 21.6 4.4 21 5.6 21 6.8 20 6 18.6 6 18 7.2 17 6.4 15.6 6.6 15 7.8 14 7.2 13 7.8 12 9.4 11 7.8 10 7.2 9 7.8 8.4 6.6 7 6.4 6 7.2 5.4 6 4 6 3 6.8 3 5.6 2.4 4.4 1 3.6 5 2.6 8.5 3.6 10.4 5Z";

/** Each bat: position, size, and its own rhythm so no two move together. */
const BATS = [
  { x: 0, y: 30, w: 30, r: -4, d: "0ms", t: "4.2s" },
  { x: 44, y: 12, w: 22, r: -10, d: "180ms", t: "3.6s" },
  { x: 78, y: 0, w: 15, r: -16, d: "340ms", t: "4.8s" },
];

/** Three bats leaving the headline, top right of the hero. */
export function HalloweenBats() {
  return (
    <span className="hw-bats" aria-hidden="true">
      {BATS.map((b, i) => (
        <span
          key={i}
          className="hw-bat"
          style={{ left: b.x, top: b.y, width: b.w, "--r": `${b.r}deg`, "--d": b.d, "--t": b.t } as React.CSSProperties}
        >
          <svg viewBox="0 0 24 12" fill="currentColor">
            <path d={BAT} />
          </svg>
        </span>
      ))}
    </span>
  );
}
