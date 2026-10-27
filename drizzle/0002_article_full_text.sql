ALTER TABLE "articles" ADD COLUMN "full_text" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "text_fetched_at" timestamp with time zone;