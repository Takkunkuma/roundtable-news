import { describe, expect, it } from "vitest";
import prototypeStory from "../../data/stories/prototype-story.json";
import { storyDraftSchema, storyFileSchema } from "./story-schema";

const stakeholder = {
  name: "Residents",
  icon: "🏠",
  wants: "Quiet.",
  worries: "Noise.",
  why: "They live nearby.",
  claims: ["Noise affects health."],
  citations: [{ field: "claim:0", article_id: "12", quote: "noise affects health" }],
};
const draft = {
  plain_title: "City plans to ban gas leaf blowers",
  why_it_matters: "It affects neighbors and small businesses.",
  context: "A council proposed a ban.",
  background: "Gas blowers are loud.",
  stakeholders: [stakeholder, { ...stakeholder, name: "A" }, { ...stakeholder, name: "B" }],
  story_citations: [{ field: "context", article_id: "12", quote: "proposed a ban" }],
};

describe("storyFileSchema", () => {
  it("accepts the prototype story", () => {
    const story = storyFileSchema.parse(prototypeStory);
    expect(story.slug).toBe("city-proposes-leaf-blower-ban");
    expect(story.illustrative).toBe(true);
    expect(story.stakeholders).toHaveLength(4);
  });
});

describe("storyDraftSchema", () => {
  it("accepts a valid draft", () => {
    expect(storyDraftSchema.safeParse(draft).success).toBe(true);
  });

  it("requires 3–6 stakeholders", () => {
    expect(storyDraftSchema.safeParse({ ...draft, stakeholders: [stakeholder] }).success).toBe(false);
  });

  it("rejects unknown citation fields", () => {
    const bad = { ...stakeholder, citations: [{ field: "mood", article_id: "1", quote: "x" }] };
    expect(storyDraftSchema.safeParse({ ...draft, stakeholders: [bad, bad, bad] }).success).toBe(false);
  });

  it("rejects empty text fields", () => {
    expect(storyDraftSchema.safeParse({ ...draft, plain_title: "  " }).success).toBe(false);
  });
});
