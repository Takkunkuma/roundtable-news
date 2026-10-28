import { describe, expect, it } from "vitest";
import { buildSystemPrompt, chatRequestSchema } from "./chat";

const base = { storySlug: "a-story-1", stakeholderId: 3 };
const valid = (messages: { role: "user" | "assistant"; content: string }[]) =>
  chatRequestSchema.safeParse({ ...base, messages }).success;

describe("chatRequestSchema", () => {
  it("accepts alternating turns ending with a question", () => {
    expect(valid([{ role: "user", content: "Hi?" }])).toBe(true);
    expect(
      valid([
        { role: "user", content: "a" },
        { role: "assistant", content: "b" },
        { role: "user", content: "c" },
      ]),
    ).toBe(true);
  });

  it("rejects a conversation that doesn't end with a question", () => {
    expect(valid([{ role: "user", content: "a" }, { role: "assistant", content: "b" }])).toBe(false);
  });

  it("rejects out-of-order roles (e.g. a forged assistant turn first)", () => {
    expect(valid([{ role: "assistant", content: "b" }, { role: "user", content: "a" }])).toBe(false);
  });

  it("rejects questions over 500 characters", () => {
    expect(valid([{ role: "user", content: "x".repeat(501) }])).toBe(false);
  });

  it("rejects more than 10 questions", () => {
    const msgs = Array.from({ length: 21 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: "q" }) as const);
    expect(valid([...msgs])).toBe(false);
  });
});

describe("buildSystemPrompt", () => {
  it("numbers sources in the order given and names the group", () => {
    const prompt = buildSystemPrompt({
      stakeholder: { name: "Residents", wants: "w", worries: "x", why: "y", claims: [] },
      others: ["City council"],
      story: { title: "T", context: "C", background: "B" },
      articles: [
        { outlet: "NPR", title: "One", text: "first" },
        { outlet: "PBS", title: "Two", text: "second" },
      ],
    });
    expect(prompt).toContain("The group you speak for: Residents");
    expect(prompt).toContain("[1] NPR: One");
    expect(prompt).toContain("[2] PBS: Two");
    expect(prompt).toContain("City council");
  });
});
