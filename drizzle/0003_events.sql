CREATE TYPE "public"."event_type" AS ENUM('page_view', 'stakeholder_tap', 'chat_question');--> statement-breakpoint
CREATE TABLE "events" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"type" "event_type" NOT NULL,
	"path" text,
	"story_slug" text,
	"stakeholder_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "events_created_at_idx" ON "events" USING btree ("created_at");