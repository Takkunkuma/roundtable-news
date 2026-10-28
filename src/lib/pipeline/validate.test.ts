import { describe, expect, it } from "vitest";
import { gradeLevel, looksLikeNamedIndividual, quoteFound } from "./validate";

const article = `The city council voted 7–2 on Tuesday to phase out gas-powered leaf blowers by 2028.
"We can't keep breathing this," said one resident. Landscapers said electric models cost twice as much.`;

describe("quoteFound", () => {
  it("finds an exact quote", () => {
    expect(quoteFound("voted 7–2 on Tuesday to phase out gas-powered leaf blowers", article)).toBe(true);
  });

  it("ignores case, curly quotes, and whitespace differences", () => {
    expect(quoteFound("“We can’t keep   breathing this,”", article)).toBe(true);
    expect(quoteFound("LANDSCAPERS SAID electric models", article)).toBe(true);
  });

  it("tolerates a small difference in a long quote", () => {
    const long = `The city council voted on Tuesday to phase out gas-powered leaf blowers by 2028. "We can't keep breathing this," said one resident. Landscapers said electric models cost twice as much.`;
    expect(quoteFound(long, article)).toBe(true);
  });

  it("rejects quotes that are not in the article", () => {
    expect(quoteFound("the mayor vetoed the leaf blower ban", article)).toBe(false);
    expect(quoteFound("Landscapers said electric models are cheaper", article)).toBe(false);
  });

  it("rejects tiny quotes that would match anywhere", () => {
    expect(quoteFound("the", article)).toBe(false);
  });
});

describe("looksLikeNamedIndividual", () => {
  it.each(["Jane Smith", "Sen. Jane Smith", "President Lopez", "Benjamin Netanyahu"])("flags %s", (name) => {
    expect(looksLikeNamedIndividual(name)).toBe(true);
  });

  it.each([
    "Landscaping business owners",
    "Residents",
    "Likud Party Members",
    "Israeli Voters",
    "City council",
    "Environmental groups",
    "Trump administration",
  ])("allows %s", (name) => {
    expect(looksLikeNamedIndividual(name)).toBe(false);
  });
});

describe("gradeLevel", () => {
  it("scores simple text lower than dense text", () => {
    const simple = "The city wants to ban gas leaf blowers. Some people like the idea. Others worry about the cost.";
    const dense =
      "Municipal legislators promulgated comprehensive regulatory restrictions encompassing combustion-powered horticultural equipment, notwithstanding considerable socioeconomic ramifications.";
    expect(gradeLevel(simple)).toBeLessThan(6);
    expect(gradeLevel(dense)).toBeGreaterThan(14);
  });
});
