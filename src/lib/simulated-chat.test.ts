import { describe, expect, it } from "vitest";
import { detectIntent, simulatedAnswer, toFirstPerson } from "./simulated-chat";
import type { StakeholderView } from "./stories";

const group: StakeholderView = {
  id: 1,
  name: "Landscaping business owners",
  icon: "🧑‍🌾",
  wants: "They want time and money to switch equipment.",
  worries: "They worry their customers will leave.",
  why: "Equipment is a big cost for them.",
  claims: [{ text: "Batteries don't last a full workday.", citations: [{ field: "claim", quote: "q", outlet: "NPR", url: "u" }] }],
  citations: [{ field: "wants", quote: "need time", outlet: "PBS", url: "u2" }],
};

describe("toFirstPerson", () => {
  it("switches card text to the group's own voice", () => {
    expect(toFirstPerson("They want their jobs. It hurts them.")).toBe("We want our jobs. It hurts us.");
  });
});

describe("detectIntent", () => {
  it.each([
    ["What do you want most?", "wants"],
    ["What worries you about this?", "worries"],
    ["Why do you see it this way?", "why"],
    ["Is that actually true? Any evidence?", "claims"],
    ["What do the other groups think?", "others"],
    ["Where does this come from?", "sources"],
    ["hello!", "greeting"],
    ["What's your favorite color?", null],
  ])("%s → %s", (q, intent) => {
    expect(detectIntent(q)).toBe(intent);
  });
});

describe("simulatedAnswer", () => {
  it("answers 'wants' in first person with the card's sources", () => {
    const [part] = simulatedAnswer(group, "What do you want?", [], []);
    expect(part.text).toBe("We want time and money to switch equipment.");
    expect(part.cites[0].outlet).toBe("PBS");
  });

  it("adds a lead-in when the card text isn't a sentence about the group", () => {
    const [part] = simulatedAnswer({ ...group, wants: "Time and money to switch." }, "What do you want?", [], []);
    expect(part.text).toBe("What we want: time and money to switch.");
  });

  it("lists claims with their own sources", () => {
    const parts = simulatedAnswer(group, "What are the facts?", [], []);
    expect(parts[1].text).toContain("Batteries");
    expect(parts[1].cites[0].outlet).toBe("NPR");
  });

  it("falls back to a short summary for questions it can't map", () => {
    const parts = simulatedAnswer(group, "What's your favorite color?", [], []);
    expect(parts[0].text).toMatch(/don't answer that directly/);
    expect(parts).toHaveLength(3);
  });

  it("points to the other groups", () => {
    const [part] = simulatedAnswer(group, "Who disagrees with you?", ["Residents", "City council"], []);
    expect(part.text).toContain("Residents, City council");
  });
});
