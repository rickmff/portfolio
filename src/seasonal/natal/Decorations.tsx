/*
 * Inert markup: hidden by CSS unless <html data-holiday="natal">. Strokes follow the site's
 * one icon (Arrow): round caps and joins, ~1.25px. Static on purpose: this one is quiet.
 */

/** A sprig of holly pinned to the avatar's lower-right edge, like a brooch. */
export function NatalHolly() {
  return (
    <span className="nt-holly" aria-hidden="true">
      <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
        <g className="nt-leaf" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.6 9.4C8.4 8.9 7.6 7.6 6.2 7.7 6.4 6.6 5.6 5.7 4.4 5.6 4.4 4.4 3.4 3.6 2 3.6 3.6 2.4 6.6 2.2 8.4 4.2 9.8 5.8 10 7.8 9.6 9.4Z" />
          <path d="M10.4 9.4C11.6 8.9 12.4 7.6 13.8 7.7 13.6 6.6 14.4 5.7 15.6 5.6 15.6 4.4 16.6 3.6 18 3.6 16.4 2.4 13.4 2.2 11.6 4.2 10.2 5.8 10 7.8 10.4 9.4Z" />
          <path className="nt-vein" d="M9.4 8.8 4.4 4M10.6 8.8 15.6 4" />
        </g>
        <circle className="nt-berry" cx="8.7" cy="11.3" r="1.75" />
        <circle className="nt-berry" cx="11.5" cy="11" r="1.75" />
        <circle className="nt-berry" cx="10.1" cy="13.6" r="1.75" />
        <circle className="nt-shine" cx="11" cy="10.5" r="0.5" />
      </svg>
    </span>
  );
}

const SPOKES = "M8 1.5v13M2.4 4.75l11.2 6.5M2.4 11.25l11.2-6.5";
const BRANCHES = "M6.4 2.9 8 4.3l1.6-1.4M6.4 13.1 8 11.7l1.6 1.4M3.2 7.4l1.9-.3-.4-2M12.8 8.6l-1.9.3.4 2M3.2 8.6l1.9.3-.4 2M12.8 7.4l-1.9-.3.4-2";

/** Each flake: position, size, tilt. Only the largest carries branches; at 10px they'd be noise. */
const FLAKES = [
  { x: 0, y: 24, w: 20, r: 8, branches: true },
  { x: 34, y: 4, w: 11, r: -14, branches: false },
  { x: 58, y: 32, w: 8, r: 22, branches: false },
];

/** Three snowflakes off the headline, top right of the hero (where the bats sit at Halloween). */
export function NatalSnow() {
  return (
    <span className="nt-snow" aria-hidden="true">
      {FLAKES.map((f, i) => (
        <svg
          key={i}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={f.branches ? 1 : 1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="nt-flake"
          style={{ left: f.x, top: f.y, width: f.w, height: f.w, rotate: `${f.r}deg` }}
        >
          <path d={f.branches ? `${SPOKES}${BRANCHES}` : SPOKES} />
        </svg>
      ))}
    </span>
  );
}
