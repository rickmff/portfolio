import { SURFACES } from "./config";

const BAT =
  "M12 5.6c.4-1.1.9-1.8 1.3-2.1l.3 1.2c1-.9 2.7-1.7 4.6-1.9 1.7-.1 3.4.4 4.8 1.6-1.2 0-2.1.5-2.5 1.4-.9-.6-2.3-.4-2.8.6-1-.6-2.4-.3-2.8.9-.6-.4-1.7-.2-2.2.6-.3.4-.5 1-.7 1.7-.2-.7-.4-1.3-.7-1.7-.5-.8-1.6-1-2.2-.6-.4-1.2-1.8-1.5-2.8-.9-.5-1-1.9-1.2-2.8-.6C3.1 4.9 2.2 4.4 1 4.4c1.4-1.2 3.1-1.7 4.8-1.6 1.9.2 3.6 1 4.6 1.9l.3-1.2c.4.3.9 1 1.3 2.1Z";

/** Hangs from the avatar in the header. */
export function HalloweenHeader() {
  if (!SURFACES.header) return null;
  return (
    <svg className="hw-spider" viewBox="0 0 12 46" fill="none" aria-hidden="true">
      <path d="M6 0v36" stroke="var(--holiday-thread)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <g stroke="currentColor" strokeWidth="1" strokeLinecap="round" vectorEffect="non-scaling-stroke">
        <path d="M4.8 38.8 2.6 37.4 1.6 35.6M4.6 40.2 2 39.8.8 41M4.8 41.4l-1.8 1.4-.6 2M7.2 38.8l2.2-1.4 1-1.8M7.4 40.2l2.6-.4 1.2 1.2M7.2 41.4l1.8 1.4.6 2" fill="none" strokeLinejoin="round" />
      </g>
      <circle cx="6" cy="37.4" r="1.4" fill="currentColor" />
      <ellipse cx="6" cy="40.6" rx="2" ry="2.4" fill="currentColor" />
    </svg>
  );
}

/** A small flight of bats in the hero. */
export function HalloweenHero() {
  if (!SURFACES.hero) return null;
  return (
    <svg className="hw-bats" viewBox="0 0 96 52" fill="currentColor" aria-hidden="true">
      <path d={BAT} transform="translate(0 26) scale(1.15 1.45)" />
      <path d={BAT} transform="translate(44 10) scale(0.8 1) rotate(-8 12 6)" />
      <path d={BAT} transform="translate(78 0) scale(0.55 0.7) rotate(-14 12 6)" />
    </svg>
  );
}
