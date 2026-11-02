ALTER TABLE "projects" ADD COLUMN "translations" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "translations" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "translations" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "harness" ADD COLUMN "translations" jsonb DEFAULT '{}'::jsonb NOT NULL;
