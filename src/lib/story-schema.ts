// Zod schemas for the story draft format in BUILD_PLAN.md §4.4.
import { z } from "zod";

const nonEmpty = z.string().trim().min(1);

export const stakeholderCitationSchema = z.object({
  field: z.string().regex(/^(wants|worries|why|claim:\d+)$/, "field must be wants, worries, why, or claim:<n>"),
  article_id: z.coerce.string().min(1),
  quote: nonEmpty,
});

export const storyCitationSchema = z.object({
  field: z.enum(["context", "background", "why_it_matters"]),
  article_id: z.coerce.string().min(1),
  quote: nonEmpty,
});

export const stakeholderSchema = z.object({
  name: nonEmpty,
  icon: nonEmpty,
  wants: nonEmpty,
  worries: nonEmpty,
  why: nonEmpty,
  claims: z.array(nonEmpty),
  citations: z.array(stakeholderCitationSchema),
});

// Exactly what the LLM must return.
export const storyDraftSchema = z.object({
  plain_title: nonEmpty,
  why_it_matters: nonEmpty,
  context: nonEmpty,
  background: nonEmpty,
  stakeholders: z.array(stakeholderSchema).min(3).max(6),
  story_citations: z.array(storyCitationSchema),
});

// A stored story file: the draft plus page metadata.
export const storyFileSchema = storyDraftSchema.extend({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  illustrative: z.boolean().default(false),
});

export type StoryDraft = z.infer<typeof storyDraftSchema>;
export type StoryFile = z.infer<typeof storyFileSchema>;
export type Stakeholder = z.infer<typeof stakeholderSchema>;
