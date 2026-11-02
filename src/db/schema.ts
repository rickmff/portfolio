import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// SQLite (Turso / libSQL). Types map from the old Postgres schema like this: serial → integer
// autoincrement, varchar(n) → text (length checked by zod, not the database), boolean → integer
// 0/1, jsonb → JSON text, timestamptz → integer milliseconds, pg enum → text checked by zod.

export const BOOK_STATUSES = ["reading", "read", "next", "wishlist", "abandoned"] as const;
export type BookStatus = (typeof BOOK_STATUSES)[number];

/**
 * Per-language overrides of a row's text fields, e.g. { en: { notes: "…" }, pt: { notes: "…" } }.
 * The site shows the visitor's language when present and the base column otherwise.
 */
export type Translations = Partial<Record<"en" | "pt", Record<string, string>>>;
const translations = () =>
  text("translations", { mode: "json" }).$type<Translations>().notNull().default(sql`'{}'`);

const ms = (name: string) => integer(name, { mode: "timestamp_ms" });
const nowMs = sql`(cast(unixepoch('subsec') * 1000 as integer))`;
const id = () => integer("id").primaryKey({ autoIncrement: true });
const bool = (name: string) => integer(name, { mode: "boolean" });
const varchar = (name: string, { length }: { length: number }) => text(name, { length });

const timestamps = {
  createdAt: ms("created_at").default(nowMs).notNull(),
  updatedAt: ms("updated_at")
    .default(nowMs)
    .notNull()
    .$onUpdate(() => new Date()),
};

export const projects = sqliteTable("projects", {
  id: id(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  summary: text("summary").notNull().default(""),
  body: text("body").notNull().default(""),
  year: integer("year").notNull(),
  stack: text("stack").notNull().default(""),
  coverUrl: text("cover_url"),
  /** Short looping video or GIF that plays when the card is hovered. */
  previewUrl: text("preview_url"),
  /** The same pair captured on a phone, shown in a phone frame when the card is switched to mobile. */
  coverMobileUrl: text("cover_mobile_url"),
  previewMobileUrl: text("preview_mobile_url"),
  /** 16:9 showcase film (desktop window, phone, outro) and its first frame; the card plays it on hover. */
  showcaseUrl: text("showcase_url"),
  showcasePosterUrl: text("showcase_poster_url"),
  /** Second where the film's phone part starts; the card's "Mobile" button jumps there. */
  showcaseMobileAt: real("showcase_mobile_at"),
  liveUrl: text("live_url"),
  repoUrl: text("repo_url"),
  tint: varchar("tint", { length: 9 }).notNull().default("#F1F0EB"),
  sort: integer("sort").notNull().default(0),
  published: bool("published").notNull().default(true),
  translations: translations(),
  ...timestamps,
});

export const books = sqliteTable("books", {
  id: id(),
  title: varchar("title", { length: 200 }).notNull(),
  author: varchar("author", { length: 200 }).notNull(),
  status: text("status", { enum: BOOK_STATUSES }).notNull().default("read"),
  finishedYear: integer("finished_year"),
  rating: integer("rating"),
  note: text("note").notNull().default(""),
  color: varchar("color", { length: 9 }).notNull().default("#1F3A5F"),
  ink: varchar("ink", { length: 9 }).notNull().default("#FFFFFF"),
  coverUrl: text("cover_url"),
  /** Spoiler-free blurb shown above the notes on the book page. */
  synopsis: text("synopsis").notNull().default(""),
  /** Reading notes in Markdown, hidden behind a reveal on the book page. */
  notes: text("notes").notNull().default(""),
  /** True when the notes were drafted for the owner rather than written by them. */
  notesGenerated: bool("notes_generated").notNull().default(false),
  /** The book's best-known line, highlighted on the shelf, the book page and /quotes. */
  quote: text("quote").notNull().default(""),
  /** Where the quote sits in the book, e.g. "Act III, Scene 1" or "Chapter 21". */
  quoteSource: text("quote_source").notNull().default(""),
  /** A free, legal edition (public domain) to read online. */
  readUrl: text("read_url"),
  /** Spine thickness in px, roughly page count / 10. */
  thickness: integer("thickness").notNull().default(36),
  sort: integer("sort").notNull().default(0),
  translations: translations(),
  ...timestamps,
});

export const posts = sqliteTable("posts", {
  id: id(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  title: varchar("title", { length: 240 }).notNull(),
  excerpt: text("excerpt").notNull().default(""),
  body: text("body").notNull().default(""),
  tags: text("tags").notNull().default(""),
  /** Wide image on top of the post and in the hover preview on the blog list. */
  bannerUrl: text("banner_url"),
  published: bool("published").notNull().default(false),
  publishedAt: ms("published_at"),
  translations: translations(),
  ...timestamps,
});

/** Key/value site copy editable from the backoffice (hero line, "now", links). */
export const settings = sqliteTable("settings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: text("value").notNull().default(""),
});

export type Project = typeof projects.$inferSelect;
/** The /harness page: the tools, services and setup behind the work, grouped by category. */
export const harness = sqliteTable("harness", {
  id: id(),
  name: varchar("name", { length: 160 }).notNull(),
  url: text("url").notNull(),
  description: text("description").notNull().default(""),
  category: varchar("category", { length: 80 }).notNull().default(""),
  sort: integer("sort").notNull().default(0),
  translations: translations(),
  ...timestamps,
});

export type Book = typeof books.$inferSelect;
export type HarnessItem = typeof harness.$inferSelect;
export type Post = typeof posts.$inferSelect;
