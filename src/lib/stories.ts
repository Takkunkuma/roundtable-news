// M1: stories come from static JSON files. From M3 on, published stories come from the database.
import prototypeStory from "../../data/stories/prototype-story.json";
import { storyFileSchema, type StoryFile } from "./story-schema";

const storyFiles: unknown[] = [prototypeStory];

const stories: StoryFile[] = storyFiles.map((raw) => storyFileSchema.parse(raw));

export function listStories(): StoryFile[] {
  return stories;
}

export function getStory(slug: string): StoryFile | undefined {
  return stories.find((s) => s.slug === slug);
}

export function sourceCount(story: StoryFile): number {
  const ids = new Set<string>();
  for (const c of story.story_citations) ids.add(c.article_id);
  for (const s of story.stakeholders) for (const c of s.citations) ids.add(c.article_id);
  return ids.size;
}
