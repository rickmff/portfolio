export type ArrowDir = "right" | "left" | "down" | "up" | "out";

const ROTATE: Record<ArrowDir, number> = { right: 0, down: 90, left: 180, up: -90, out: -45 };

/**
 * The one arrow used across the site: a thin stroke that inherits colour and scales with the
 * text. `out` (north-east) marks external links. Inside a link it nudges on hover.
 */
export function Arrow({
  dir = "right",
  solid = false,
  className = "",
}: {
  dir?: ArrowDir;
  /** Same shape as a filled glyph with a hairline outline, for use over images. */
  solid?: boolean;
  className?: string;
}) {
  return (
    <svg
      className={`arrow ${className}`.trim()}
      data-dir={dir}
      width="1em"
      height="1em"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{ "--arrow-rotate": `${ROTATE[dir]}deg` } as React.CSSProperties}
    >
      {solid ? (
        <path
          d="M1.5 6.6h8.2V3.2L14.8 8l-5.1 4.8V9.4H1.5Z"
          fill="#fff"
          stroke="#111"
          strokeWidth="0.9"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ) : (
      <path
        d="M2.5 8h11M9 3.5 13.5 8 9 12.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      )}
    </svg>
  );
}
