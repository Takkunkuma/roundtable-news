# Roundtable — Project Plan

**Read the story in plain words, then ask the people in it.**

Course: Software Engineering Management (CMU MSSM), individual project. Inspired by "The Newsren" agentic news plan.

> This file is the product view. **`BUILD_PLAN.md` is the source of truth for what gets built**, how, and in what order. If the two ever disagree, follow `BUILD_PLAN.md`.

## 1. Problem
Engaged news readers want to understand a story from more than one side before forming their own opinion, but:
- Feeds (YouTube, news portals) mostly surface one angle, and they don't know how to find the others.
- When other perspectives exist (AllSides, Ground News, Tangle), they are framed as left / center / right political camps, with little to unpack.
- Articles and headlines assume background knowledge and use idioms, so readers with less context drop out.

## 2. Target customer: "The Dutiful Seeker"
- Long-time, engaged news consumer (often 45+); keeping informed started as a duty and became a habit.
- Uses YouTube and news portals regularly to educate herself.
- Wants multiple perspectives, then forms her own opinion.
- Pain: "I only see one side, and I don't know where to find the others."

Evidence so far: customer discovery interview (5 Whys), founder's own experience, Reuters Institute / Pew data on impartial-news preference, selective-exposure and backfire research.

## 3. Solution
A web app that finds stories covered by many outlets and turns each into a plain-language story page with a stakeholder layer:
1. **Plain-language surface** — an obvious title that states the fact, one line on why it matters, short context, and background. Instagram-card simplicity, ~8th-grade reading level.
2. **Stakeholder row** — icons for each group involved in or affected by the story.
3. **Stakeholder card** — what that group wants and worries about; expand for why they see it this way, the factual claims they make, and the cited sources.
4. **Stakeholder chat** — ask a group a question. Answers come only from the story's sources, with citations, and say plainly when the sources don't cover something.

Behind the page, a pipeline ingests public news feeds, groups articles about the same event, keeps stories covered by ≥ 5 outlets of ≥ 2 kinds, and drafts the story page for an editor to review and publish.

## 4. Product rules
(Full list and enforcement details in `BUILD_PLAN.md` §1.)
- Stakeholders are groups, never real named individuals; chat never impersonates a real person.
- Everything is sourced; no source, no claim.
- Chat is grounded in stored source excerpts only.
- A group's views are kept separate from its factual claims.
- No left/center/right framing, and no debate between stakeholders.
- The chat is clearly labeled as an AI summary of what the group has said.
- Plain language throughout.
- Human review before anything is published.
- Readers can flag a missing perspective.

## 5. MVP scope
Built in five milestones (details and "done when" checks in `BUILD_PLAN.md` §8):

| Milestone | Deliverable |
|---|---|
| M1 | Next.js app deployed on Vercel, rendering the example story |
| M2 | Feed ingestion and multi-source story clustering, admin candidate queue |
| M3 | AI story drafts with verified citations, admin editor and publish flow |
| M4 | Grounded stakeholder chat with citations |
| M5 | Home feed, feedback button, polish; three real stories live |

**Out of scope for the MVP:** user accounts, personalization, notifications, stakeholder debates, multiple languages, native apps, payments, YouTube integration, fully automatic publishing.

## 6. Validation plan
- Interview 5 more Dutiful Seekers: "Last time you wanted another side of a story, what did you do?"
- Usability test on the M5 build: can readers explain 3 stakeholder views after 5 minutes on a story page? What do they ask in chat?
- Compare against an AllSides page for the same story: which helps them understand more?

## 7. Risks
- Stakeholder selection becomes a new form of bias.
- Simplified views can turn into caricatures.
- Stakeholder chat misrepresents a group or goes beyond its sources.
- AI accuracy and low trust in AI news (≈20% trust chatbot news, Reuters Institute 2026).
- Publisher access and copyright: some sites block fetching or are paywalled; we store short excerpts only and link back.
- Paid market for balanced news is a niche (Ground News est. <$5M revenue; Tangle ≈$4.5M/yr).

## 8. Timeline
| Phase | Work |
|---|---|
| Done | One-pager, repo, plan, build plan |
| Next | M1–M2 build; 5 more interviews in parallel |
| Then | M3–M4 build |
| Then | M5, usability tests with Dutiful Seekers |
| Final | Pitch + live demo |
