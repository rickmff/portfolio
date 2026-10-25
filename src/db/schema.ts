import {
  boolean,
  integer,
  real,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const bookStatus = pgEnum("book_status", ["reading", "read", "next", "wishlist", "abandoned"]);
export const BOOK_STATUSES = bookStatus.enumValues;
export type BookStatus = (typeof BOOK_STATUSES)[number];

/**
 * Per-language overrides of a row's text fields, e.g. { en: { notes: "…" }, pt: { notes: "…" } }.
 * The site shows the visitor's language when present and the base column otherwise.
 */
export type Translations = Partial<Record<"en" | "pt", Record<string, string>>>;
const translations = () => jsonb("translations").$type<Translations>().notNull().default({});

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
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
  published: boolean("published").notNull().default(true),
  translations: translations(),
  ...timestamps,
});

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  author: varchar("author", { length: 200 }).notNull(),
  status: bookStatus("status").notNull().default("read"),
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
  notesGenerated: boolean("notes_generated").notNull().default(false),
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

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  title: varchar("title", { length: 240 }).notNull(),
  excerpt: text("excerpt").notNull().default(""),
  body: text("body").notNull().default(""),
  tags: text("tags").notNull().default(""),
  /** Wide image on top of the post and in the hover preview on the blog list. */
  bannerUrl: text("banner_url"),
  published: boolean("published").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  translations: translations(),
  ...timestamps,
});

/** Key/value site copy editable from the backoffice (hero line, "now", links). */
export const settings = pgTable("settings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: text("value").notNull().default(""),
});

export type Project = typeof projects.$inferSelect;
/** The /harness page: the tools, services and setup behind the work, grouped by category. */
export const harness = pgTable("harness", {
  id: serial("id").primaryKey(),
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
