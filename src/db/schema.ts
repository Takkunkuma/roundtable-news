// Database schema — mirrors BUILD_PLAN.md §3.
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  real,
} from "drizzle-orm/pg-core";

const id = () => integer().primaryKey().generatedAlwaysAsIdentity();
const createdAt = () => timestamp({ withTimezone: true }).notNull().defaultNow();

export const sourceKind = pgEnum("source_kind", [
  "national",
  "local",
  "international",
  "trade",
  "wire",
  "official",
  "advocacy",
]);
export const fetchStatus = pgEnum("fetch_status", ["pending", "ok", "blocked", "failed"]);
export const candidateStatus = pgEnum("candidate_status", ["new", "selected", "rejected"]);
export const storyStatus = pgEnum("story_status", ["draft", "approved", "published", "archived"]);
export const citationTarget = pgEnum("citation_target", ["story_field", "stakeholder_field", "claim"]);

// Outlets we ingest from. No political label is stored, by design.
export const sources = pgTable("sources", {
  id: id(),
  name: text().notNull(),
  feedUrl: text().notNull().unique(),
  homepage: text(),
  kind: sourceKind().notNull(),
  country: text(),
  active: boolean().notNull().default(true),
});

export const articles = pgTable(
  "articles",
  {
    id: id(),
    sourceId: integer()
      .notNull()
      .references(() => sources.id),
    url: text().notNull().unique(),
    title: text().notNull(),
    snippet: text(),
    publishedAt: timestamp({ withTimezone: true }),
    fetchedAt: timestamp({ withTimezone: true }),
    // Short excerpt for grounding only (≤ ~4,000 chars). Never republished.
    textExcerpt: text(),
    fetchStatus: fetchStatus().notNull().default("pending"),
  },
  (t) => [index("articles_published_at_idx").on(t.publishedAt)],
);

export const storyCandidates = pgTable("story_candidates", {
  id: id(),
  createdAt: createdAt(),
  label: text().notNull(),
  articleIds: integer().array().notNull(),
  distinctSourceCount: integer().notNull(),
  distinctKindsCount: integer().notNull(),
  stakeholderRichness: smallint(),
  score: real().notNull(),
  status: candidateStatus().notNull().default("new"),
});

export const stories = pgTable("stories", {
  id: id(),
  slug: text().notNull().unique(),
  candidateId: integer().references(() => storyCandidates.id),
  status: storyStatus().notNull().default("draft"),
  // True only for hand-written examples with no real sources (e.g. the M1 prototype story).
  illustrative: boolean().notNull().default(false),
  plainTitle: text().notNull(),
  whyItMatters: text().notNull(),
  context: text().notNull(),
  background: text().notNull(),
  createdAt: createdAt(),
  publishedAt: timestamp({ withTimezone: true }),
  modelUsed: text(),
});

export const stakeholders = pgTable("stakeholders", {
  id: id(),
  storyId: integer()
    .notNull()
    .references(() => stories.id, { onDelete: "cascade" }),
  name: text().notNull(),
  icon: text().notNull(),
  wants: text().notNull(),
  worries: text().notNull(),
  why: text().notNull(),
  sortOrder: integer().notNull().default(0),
});

export const stakeholderClaims = pgTable("stakeholder_claims", {
  id: id(),
  stakeholderId: integer()
    .notNull()
    .references(() => stakeholders.id, { onDelete: "cascade" }),
  claimText: text().notNull(),
});

// Links any field to evidence. target_id points at a story, stakeholder, or claim
// depending on target_type.
export const citations = pgTable("citations", {
  id: id(),
  storyId: integer()
    .notNull()
    .references(() => stories.id, { onDelete: "cascade" }),
  targetType: citationTarget().notNull(),
  targetId: integer().notNull(),
  fieldName: text().notNull(),
  articleId: integer()
    .notNull()
    .references(() => articles.id),
  quote: text().notNull(),
});

// What readers ask. No personal data.
export const chatLogs = pgTable("chat_logs", {
  id: id(),
  storyId: integer()
    .notNull()
    .references(() => stories.id, { onDelete: "cascade" }),
  stakeholderId: integer()
    .notNull()
    .references(() => stakeholders.id, { onDelete: "cascade" }),
  question: text().notNull(),
  answer: text().notNull(),
  createdAt: createdAt(),
});

// "Missing a perspective?" submissions.
export const feedback = pgTable("feedback", {
  id: id(),
  storyId: integer()
    .notNull()
    .references(() => stories.id, { onDelete: "cascade" }),
  text: text().notNull(),
  createdAt: createdAt(),
});
