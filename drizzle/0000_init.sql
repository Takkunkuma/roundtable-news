CREATE TYPE "public"."candidate_status" AS ENUM('new', 'selected', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."citation_target" AS ENUM('story_field', 'stakeholder_field', 'claim');--> statement-breakpoint
CREATE TYPE "public"."fetch_status" AS ENUM('pending', 'ok', 'blocked', 'failed');--> statement-breakpoint
CREATE TYPE "public"."source_kind" AS ENUM('national', 'local', 'international', 'trade', 'wire', 'official', 'advocacy');--> statement-breakpoint
CREATE TYPE "public"."story_status" AS ENUM('draft', 'approved', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "articles" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "articles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"source_id" integer NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"snippet" text,
	"published_at" timestamp with time zone,
	"fetched_at" timestamp with time zone,
	"text_excerpt" text,
	"fetch_status" "fetch_status" DEFAULT 'pending' NOT NULL,
	CONSTRAINT "articles_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "chat_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "chat_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"story_id" integer NOT NULL,
	"stakeholder_id" integer NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "citations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "citations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"story_id" integer NOT NULL,
	"target_type" "citation_target" NOT NULL,
	"target_id" integer NOT NULL,
	"field_name" text NOT NULL,
	"article_id" integer NOT NULL,
	"quote" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "feedback_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"story_id" integer NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sources_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"feed_url" text NOT NULL,
	"homepage" text,
	"kind" "source_kind" NOT NULL,
	"country" text,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "sources_feedUrl_unique" UNIQUE("feed_url")
);
--> statement-breakpoint
CREATE TABLE "stakeholder_claims" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "stakeholder_claims_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"stakeholder_id" integer NOT NULL,
	"claim_text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stakeholders" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "stakeholders_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"story_id" integer NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	"wants" text NOT NULL,
	"worries" text NOT NULL,
	"why" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "stories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"candidate_id" integer,
	"status" "story_status" DEFAULT 'draft' NOT NULL,
	"illustrative" boolean DEFAULT false NOT NULL,
	"plain_title" text NOT NULL,
	"why_it_matters" text NOT NULL,
	"context" text NOT NULL,
	"background" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"model_used" text,
	CONSTRAINT "stories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "story_candidates" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "story_candidates_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"label" text NOT NULL,
	"article_ids" integer[] NOT NULL,
	"distinct_source_count" integer NOT NULL,
	"distinct_kinds_count" integer NOT NULL,
	"stakeholder_richness" smallint,
	"score" real NOT NULL,
	"status" "candidate_status" DEFAULT 'new' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_logs" ADD CONSTRAINT "chat_logs_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_logs" ADD CONSTRAINT "chat_logs_stakeholder_id_stakeholders_id_fk" FOREIGN KEY ("stakeholder_id") REFERENCES "public"."stakeholders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citations" ADD CONSTRAINT "citations_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citations" ADD CONSTRAINT "citations_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stakeholder_claims" ADD CONSTRAINT "stakeholder_claims_stakeholder_id_stakeholders_id_fk" FOREIGN KEY ("stakeholder_id") REFERENCES "public"."stakeholders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stakeholders" ADD CONSTRAINT "stakeholders_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_candidate_id_story_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."story_candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "articles_published_at_idx" ON "articles" USING btree ("published_at");