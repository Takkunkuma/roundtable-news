// Simulated stakeholder chat for the proof of concept: no AI calls. Answers are built
// from the group's card (wants, worries, why, claims) and keep the card's source links.
import type { CitationView, StakeholderView } from "./stories";

export type AnswerPart = { text: string; cites: CitationView[] };

// Card text is written about the group ("They want…"); the chat speaks as the group.
export function toFirstPerson(text: string): string {
  return text
    .replace(/\bThey're\b/g, "We're")
    .replace(/\bthey're\b/g, "we're")
    .replace(/\bThey\b/g, "We")
    .replace(/\bthey\b/g, "we")
    .replace(/\bTheir\b/g, "Our")
    .replace(/\btheir\b/g, "our")
    .replace(/\bthemselves\b/g, "ourselves")
    .replace(/\bthem\b/g, "us");
}

const lowerFirst = (t: string) => (/^[A-Z][a-z]/.test(t) ? t[0].toLowerCase() + t.slice(1) : t);

// "We want X." reads fine alone; "Time and money to switch." needs a lead-in.
function voiced(lead: string, cardText: string): string {
  const t = toFirstPerson(cardText);
  return /^(We|Our)\b/.test(t) ? t : `${lead} ${lowerFirst(t)}`;
}

type Intent = "greeting" | "wants" | "worries" | "why" | "claims" | "sources" | "others";

// Checked in order; the first match wins.
const INTENTS: [Intent, RegExp][] = [
  ["greeting", /^\s*(hi|hello|hey|good (morning|afternoon|evening))\b[\s!.?]*$/i],
  ["sources", /\b(source|sources|article|articles|where .*(from|read|learn)|news outlets?|link)\b/i],
  ["claims", /\b(fact|facts|claim|claims|evidence|true|truth|prove|proof|data|numbers?|statistics?|stats)\b/i],
  ["others", /\b(other (sides?|groups?|people)|disagree\w*|oppon\w*|critic\w*|who else|the other)\b/i],
  ["worries", /\b(worr\w*|fear\w*|concern\w*|afraid|scared|risk\w*|problem\w*|oppose\w*|against|downside|wrong|bad)\b/i],
  ["why", /\b(why|reason\w*|believe|think|feel|see it|because|values?|motivat\w*)\b/i],
  ["wants", /\b(want\w*|goal\w*|hope\w*|need\w*|wish|achieve|ask\w*|most|prefer|outcome|solution)\b/i],
];

export function detectIntent(question: string): Intent | null {
  return INTENTS.find(([, re]) => re.test(question))?.[0] ?? null;
}

export function simulatedAnswer(
  s: StakeholderView,
  question: string,
  others: string[],
  sourceOutlets: string[],
): AnswerPart[] {
  const cites = (field: string) => s.citations.filter((c) => c.field === field);
  const wants = { text: voiced("What we want:", s.wants), cites: cites("wants") };
  const worries = { text: voiced("What worries us:", s.worries), cites: cites("worries") };
  const why = { text: voiced("Why we see it this way:", s.why), cites: cites("why") };

  switch (detectIntent(question)) {
    case "greeting":
      return [
        {
          text: `Hello. I speak for ${s.name.toLowerCase()} in this story. Ask me what we want, what worries us, why we see it this way, or what facts we point to.`,
          cites: [],
        },
      ];
    case "wants":
      return [wants];
    case "worries":
      return [worries];
    case "why":
      return [why];
    case "claims":
      if (s.claims.length === 0) {
        return [{ text: "In these sources, we don't make specific factual claims, so there's nothing to check here.", cites: [] }];
      }
      return [
        { text: "Here's what we say the facts are. These are our claims, so check them against the sources:", cites: [] },
        ...s.claims.map((c) => ({ text: `• ${c.text}`, cites: c.citations })),
      ];
    case "others":
      return [
        {
          text: others.length
            ? `Other groups in this story see it differently: ${others.join(", ")}. Tap one of them above to hear their side.`
            : "No other groups are listed for this story.",
          cites: [],
        },
        worries,
      ];
    case "sources":
      return [
        {
          text: sourceOutlets.length
            ? `Everything I say comes from this story's news sources: ${sourceOutlets.join(", ")}. The links are at the bottom of the page.`
            : "This is an illustrative example, so it isn't based on real news sources yet.",
          cites: [],
        },
      ];
    default:
      return [
        {
          text: "I can only speak to what this story's sources say about our group, and they don't answer that directly. Here's our view in short:",
          cites: [],
        },
        wants,
        worries,
      ];
  }
}
