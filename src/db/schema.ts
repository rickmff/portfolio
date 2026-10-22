import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const bookStatus = pgEnum("book_status", ["reading", "read", "next"]);

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
  liveUrl: text("live_url"),
  repoUrl: text("repo_url"),
  tint: varchar("tint", { length: 9 }).notNull().default("#F1F0EB"),
  sort: integer("sort").notNull().default(0),
  published: boolean("published").notNull().default(true),
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
  /** Spine thickness in px, roughly page count / 10. */
  thickness: integer("thickness").notNull().default(36),
  sort: integer("sort").notNull().default(0),
  ...timestamps,
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  title: varchar("title", { length: 240 }).notNull(),
  excerpt: text("excerpt").notNull().default(""),
  body: text("body").notNull().default(""),
  tags: text("tags").notNull().default(""),
  published: boolean("published").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  ...timestamps,
});

/** Key/value site copy editable from the backoffice (hero line, "now", links). */
export const settings = pgTable("settings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: text("value").notNull().default(""),
});

export type Project = typeof projects.$inferSelect;
export type Book = typeof books.$inferSelect;
export type Post = typeof posts.$inferSelect;
