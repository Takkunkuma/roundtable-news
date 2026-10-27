# Roundtable

**Read the story in plain words, then ask the people in it.**

Roundtable finds news stories covered by many different outlets and turns each one into a plain-language story page. Instead of splitting a story into left / center / right, it shows each group involved in or affected by the story: what they want, what they worry about, and why. Readers can then ask each group questions in a chat that answers only from the story's sources, with citations.

Built for **"The Dutiful Seeker"**: engaged news readers who want to hear multiple perspectives before forming their own opinion, but don't know where to find them.

## Docs

| File | What it is |
|---|---|
| [`docs/BUILD_PLAN.md`](docs/BUILD_PLAN.md) | **Source of truth for the build.** Product rules, stack, data model, pipeline, milestones M1–M5 |
| [`docs/PLAN.md`](docs/PLAN.md) | Product view: problem, customer, validation plan, risks |
| [`docs/prototype.html`](docs/prototype.html) | Original clickable design reference (open in a browser) |

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in values as milestones need them
npm run dev                  # http://localhost:3000
```

M1 needs no environment variables: the example story is read from `data/stories/`.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm test` | Unit tests (Vitest) |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate a SQL migration from `src/db/schema.ts` into `drizzle/` |
| `npm run db:migrate` | Apply migrations to `DATABASE_URL` |

## Layout

```
data/stories/          Story JSON in the BUILD_PLAN §4.4 format (M1: the illustrative example)
drizzle/               SQL migrations
src/db/schema.ts       Database schema (BUILD_PLAN §3)
src/lib/story-schema.ts  Zod schemas for story drafts
src/lib/stories.ts     Story loader (static files in M1, database from M3)
src/app/               Pages: home feed, /story/[slug]
src/components/        Stakeholder row, card, chat preview, feedback button
```

## Status

**M1 — Skeleton & deploy.** The illustrative leaf-blower story renders at `/story/city-proposes-leaf-blower-ban`. The chat and "Missing a perspective?" are previews; they become real in M4 and M5.

Course project — Software Engineering Management, CMU MSSM.
