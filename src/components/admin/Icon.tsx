/** Small line icons for the backoffice, drawn on a 16px grid like Notion's property icons. */
const PATHS = {
  text: "M3 4h10M3 8h10M3 12h6",
  long: "M3 3.5h10M3 6.5h10M3 9.5h10M3 12.5h6",
  title: "M3.5 13 7 3h2l3.5 10M5 9.5h6",
  hash: "M6 2.5 5 13.5M11 2.5l-1 11M2.5 6h11M2 10.5h11",
  link: "M7 9a3 3 0 0 0 4.2.3l2-2a3 3 0 0 0-4.2-4.2l-1 1M9 7a3 3 0 0 0-4.2-.3l-2 2a3 3 0 0 0 4.2 4.2l1-1",
  calendar: "M2.5 4.5h11v9h-11zM2.5 7.5h11M5.5 2.5v3M10.5 2.5v3",
  select: "M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12ZM5.5 7l2.5 2.5L10.5 7",
  check: "M2.5 2.5h11v11h-11zM5 8l2 2 4-4",
  color: "M8 2.5s4.5 4.6 4.5 7.5a4.5 4.5 0 0 1-9 0c0-2.9 4.5-7.5 4.5-7.5Z",
  image: "M2.5 3h11v10h-11zM2.5 10.5 6 7l3 3 2-2 2.5 2.5M10.5 5.8h.01",
  film: "M2.5 3h11v10h-11zM5 3v10M11 3v10M2.5 6h2.5M2.5 10h2.5M11 6h2.5M11 10h2.5",
  file: "M4 2h5l3 3v9H4zM9 2v3h3",
  tag: "M2.5 2.5h5.5l5.5 5.5-5.5 5.5-5.5-5.5zM5.5 5.5h.01",
  layers: "M8 2 14 5 8 8 2 5zM2 8l6 3 6-3M2 11l6 3 6-3",
  star: "M8 2l1.8 3.9 4.2.5-3.1 2.9.8 4.2L8 11.4l-3.7 2.1.8-4.2L2 6.4l4.2-.5z",
  globe: "M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12ZM2 8h12M8 2c1.7 1.8 2.5 3.8 2.5 6S9.7 12.2 8 14C6.3 12.2 5.5 10.2 5.5 8S6.3 3.8 8 2Z",
  user: "M8 8a2.75 2.75 0 1 0 0-5.5A2.75 2.75 0 0 0 8 8ZM2.5 14c.6-2.6 2.8-4 5.5-4s4.9 1.4 5.5 4",
  quote: "M3 12V9c0-2.5 1-4 3-5M9 12V9c0-2.5 1-4 3-5M3 9h3v3H3zM9 9h3v3H9z",
  book: "M3 2.5h7.5A1.5 1.5 0 0 1 12 4v9.5H4.5A1.5 1.5 0 0 1 3 12zM3 12a1.5 1.5 0 0 1 1.5-1.5H12",
  home: "M2.5 7 8 2.5 13.5 7v6.5h-11zM6.5 13.5v-4h3v4",
  grid: "M2.5 2.5h4.5v4.5H2.5zM9 2.5h4.5v4.5H9zM2.5 9h4.5v4.5H2.5zM9 9h4.5v4.5H9z",
  pen: "M10.5 2.5l3 3-8 8h-3v-3zM9 4l3 3",
  wrench: "M10 2.5a3.5 3.5 0 0 0-3.3 4.7L2.5 11.4 4.6 13.5l4.2-4.2A3.5 3.5 0 0 0 13.5 6l-2 2-2-.5-.5-2 2-2a3.5 3.5 0 0 0-1-.9Z",
  gear: "M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4",
  sun: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3 3l1 1M12 12l1 1M3 13l1-1M12 4l1-1",
  moon: "M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7Z",
  monitor: "M2 3h12v8H2zM6 14h4M8 11v3",
  out: "M6 2.5H3v11h3M10.5 5 13.5 8l-3 3M13.5 8H6",
  external: "M6 3H3v10h10v-3M9 2.5h4.5V7M13.5 2.5 7.5 8.5",
  trash: "M2.5 4h11M6 4V2.5h4V4M4 4l.7 9.5h6.6L12 4M6.8 6.5v4.5M9.2 6.5v4.5",
  upload: "M8 10.5V2.5M5 5.5l3-3 3 3M2.5 10v3.5h11V10",
  x: "M4 4l8 8M12 4l-8 8",
  plus: "M8 3v10M3 8h10",
  search: "M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10ZM10.5 10.5 14 14",
  clock: "M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12ZM8 4.5V8l2.5 1.5",
  list: "M5.5 4h8M5.5 8h8M5.5 12h8M2.5 4h.01M2.5 8h.01M2.5 12h.01",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  return (
    <svg
      className="adm-icon"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
