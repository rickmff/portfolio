CREATE TABLE `books` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text(200) NOT NULL,
	`author` text(200) NOT NULL,
	`status` text DEFAULT 'read' NOT NULL,
	`finished_year` integer,
	`rating` integer,
	`note` text DEFAULT '' NOT NULL,
	`color` text(9) DEFAULT '#1F3A5F' NOT NULL,
	`ink` text(9) DEFAULT '#FFFFFF' NOT NULL,
	`cover_url` text,
	`synopsis` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`notes_generated` integer DEFAULT false NOT NULL,
	`quote` text DEFAULT '' NOT NULL,
	`quote_source` text DEFAULT '' NOT NULL,
	`read_url` text,
	`thickness` integer DEFAULT 36 NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL,
	`translations` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `harness` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(160) NOT NULL,
	`url` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`category` text(80) DEFAULT '' NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL,
	`translations` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text(160) NOT NULL,
	`title` text(240) NOT NULL,
	`excerpt` text DEFAULT '' NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`tags` text DEFAULT '' NOT NULL,
	`banner_url` text,
	`published` integer DEFAULT false NOT NULL,
	`published_at` integer,
	`translations` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `posts_slug_unique` ON `posts` (`slug`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text(120) NOT NULL,
	`title` text(200) NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`year` integer NOT NULL,
	`stack` text DEFAULT '' NOT NULL,
	`cover_url` text,
	`preview_url` text,
	`cover_mobile_url` text,
	`preview_mobile_url` text,
	`showcase_url` text,
	`showcase_poster_url` text,
	`showcase_mobile_at` real,
	`live_url` text,
	`repo_url` text,
	`tint` text(9) DEFAULT '#F1F0EB' NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL,
	`published` integer DEFAULT true NOT NULL,
	`translations` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_slug_unique` ON `projects` (`slug`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text(64) PRIMARY KEY NOT NULL,
	`value` text DEFAULT '' NOT NULL
);
