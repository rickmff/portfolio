ALTER TABLE "books" ADD COLUMN "quote" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "quote_source" text DEFAULT '' NOT NULL;