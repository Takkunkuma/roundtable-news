// Story data for the reader pages: published stories from the database, plus the
// illustrative M1 example (shown in the feed only while there are no real stories).
import { and, desc, eq, inArray } from "drizzle-orm";
import { connection } from "next/server";
import prototypeStory from "../../data/stories/prototype-story.json";
import { db } from "@/db";
import { articles, citations, sources, stakeholderClaims, stakeholders, stories } from "@/db/schema";
import { storyFileSchema } from "./story-schema";

export type CitationView = { field: string; quote: string; outlet?: string; url?: string };
export type StakeholderView = {
  id?: number;
  name: string;
  icon: string;
  wants: string;
  worries: string;
  why: string;
  claims: { text: string; citations: CitationView[] }[];
  citations: CitationView[];
};
export type SourceView = { outlet: string; title: string; url: string };
export type StoryView = {
  slug: string;
  illustrative: boolean;
  plainTitle: string;
  whyItMatters: string;
  context: string;
  background: string;
  storyCitations: CitationView[];
  stakeholders: StakeholderView[];
  sources: SourceView[];
  publishedAt?: Date;
};
export type StoryCard = {
  slug: string;
  illustrative: boolean;
  plainTitle: string;
  whyItMatters: string;
  icons: { icon: string; name: string }[];
  sourceCount: number;
};

const example = storyFileSchema.parse(prototypeStory);
export const EXAMPLE_SLUG = example.slug;

function exampleView(): StoryView {
  const cite = (c: { field: string; quote: string }) => ({ field: c.field, quote: c.quote });
  return {
    slug: example.slug,
    illustrative: true,
    plainTitle: example.plain_title,
    whyItMatters: example.why_it_matters,
    context: example.context,
    background: example.background,
    storyCitations: example.story_citations.map(cite),
    stakeholders: example.stakeholders.map((s) => ({
      ...s,
      claims: s.claims.map((text, i) => ({ text, citations: s.citations.filter((c) => c.field === `claim:${i}`).map(cite) })),
      citations: s.citations.filter((c) => !c.field.startsWith("claim:")).map(cite),
    })),
    sources: [],
  };
}

export async function listStoryCards(): Promise<StoryCard[]> {
  await connection(); // the feed is read fresh on every request
  const rows = await db()
    .select()
    .from(stories)
    .where(eq(stories.status, "published"))
    .orderBy(desc(stories.publishedAt));
  if (rows.length === 0) {
    return [
      {
        slug: example.slug,
        illustrative: true,
        plainTitle: example.plain_title,
        whyItMatters: example.why_it_matters,
        icons: example.stakeholders.map((s) => ({ icon: s.icon, name: s.name })),
        sourceCount: 0,
      },
    ];
  }

  const ids = rows.map((r) => r.id);
  const [shs, cites] = await Promise.all([
    db()
      .select({ storyId: stakeholders.storyId, icon: stakeholders.icon, name: stakeholders.name })
      .from(stakeholders)
      .where(inArray(stakeholders.storyId, ids))
      .orderBy(stakeholders.sortOrder),
    db()
      .select({ storyId: citations.storyId, sourceId: articles.sourceId })
      .from(citations)
      .innerJoin(articles, eq(citations.articleId, articles.id))
      .where(inArray(citations.storyId, ids)),
  ]);
  return rows.map((r) => ({
    slug: r.slug,
    illustrative: r.illustrative,
    plainTitle: r.plainTitle,
    whyItMatters: r.whyItMatters,
    icons: shs.filter((s) => s.storyId === r.id).map((s) => ({ icon: s.icon, name: s.name })),
    sourceCount: new Set(cites.filter((c) => c.storyId === r.id).map((c) => c.sourceId)).size,
  }));
}

// The articles a story cites, in a fixed order. The story page lists sources in this
// order and the chat numbers them the same way, so "[2]" in a chat answer is the
// second source on the page.
export async function loadSourceArticles(storyId: number) {
  const rows = await db()
    .selectDistinct({
      articleId: articles.id,
      outlet: sources.name,
      title: articles.title,
      url: articles.url,
      fullText: articles.fullText,
    })
    .from(citations)
    .innerJoin(articles, eq(citations.articleId, articles.id))
    .innerJoin(sources, eq(articles.sourceId, sources.id))
    .where(eq(citations.storyId, storyId));
  return rows.sort((a, b) => a.outlet.localeCompare(b.outlet) || a.articleId - b.articleId);
}

export async function getStory(slug: string): Promise<StoryView | undefined> {
  if (slug === example.slug) return exampleView();
  await connection();

  const [story] = await db()
    .select()
    .from(stories)
    .where(and(eq(stories.slug, slug), eq(stories.status, "published")));
  if (!story) return undefined;

  const [shs, cites, sourceArticles] = await Promise.all([
    db().select().from(stakeholders).where(eq(stakeholders.storyId, story.id)).orderBy(stakeholders.sortOrder),
    db()
      .select({
        targetType: citations.targetType,
        targetId: citations.targetId,
        field: citations.fieldName,
        quote: citations.quote,
        outlet: sources.name,
        url: articles.url,
        title: articles.title,
      })
      .from(citations)
      .innerJoin(articles, eq(citations.articleId, articles.id))
      .innerJoin(sources, eq(articles.sourceId, sources.id))
      .where(eq(citations.storyId, story.id)),
    loadSourceArticles(story.id),
  ]);
  const claims = shs.length
    ? await db()
        .select()
        .from(stakeholderClaims)
        .where(inArray(stakeholderClaims.stakeholderId, shs.map((s) => s.id)))
    : [];

  const view = (c: (typeof cites)[number]): CitationView => ({ field: c.field, quote: c.quote, outlet: c.outlet, url: c.url });

  return {
    slug: story.slug,
    illustrative: story.illustrative,
    plainTitle: story.plainTitle,
    whyItMatters: story.whyItMatters,
    context: story.context,
    background: story.background,
    publishedAt: story.publishedAt ?? undefined,
    storyCitations: cites.filter((c) => c.targetType === "story_field").map(view),
    stakeholders: shs.map((s) => ({
      id: s.id,
      name: s.name,
      icon: s.icon,
      wants: s.wants,
      worries: s.worries,
      why: s.why,
      citations: cites.filter((c) => c.targetType === "stakeholder_field" && c.targetId === s.id).map(view),
      claims: claims
        .filter((cl) => cl.stakeholderId === s.id)
        .map((cl) => ({
          text: cl.claimText,
          citations: cites.filter((c) => c.targetType === "claim" && c.targetId === cl.id).map(view),
        })),
    })),
    sources: sourceArticles.map((a) => ({ outlet: a.outlet, title: a.title, url: a.url })),
  };
}
