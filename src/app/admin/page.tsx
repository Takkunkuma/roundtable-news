import { count, desc, eq, gte, inArray } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { db } from "@/db";
import { articles, events, feedback, sources, stories, storyCandidates } from "@/db/schema";
import { isAdmin } from "@/lib/admin-auth";
import { logout, setCandidateStatus, setStoryStatus } from "./actions";

// Public, read-only view of what the pipeline found. Actions (reject, and from M3 on
// generate / edit / publish) appear only for the logged-in editor.
export const metadata: Metadata = { title: "Story candidates", robots: { index: false } };

const QUEUE_DAYS = 7;

export default function AdminPage() {
  return (
    <main className="font-sans">
      <h1 className="font-serif text-3xl">Story candidates</h1>
      <Suspense fallback={<p className="mt-6 text-muted">Loading candidates…</p>}>
        <Queue />
      </Suspense>
    </main>
  );
}

const fetchLabel: Record<string, string> = {
  pending: "not fetched yet",
  ok: "full text ✓",
  blocked: "blocked / paywalled",
  failed: "fetch failed",
};

async function loadQueue() {
  await connection(); // the queue is always read fresh at request time
  const candidates = await db()
    .select()
    .from(storyCandidates)
    .where(gte(storyCandidates.createdAt, new Date(Date.now() - QUEUE_DAYS * 86400_000)))
    .orderBy(desc(storyCandidates.score));

  const ids = [...new Set(candidates.flatMap((c) => c.articleIds))];
  const rows = ids.length
    ? await db()
        .select({
          id: articles.id,
          title: articles.title,
          url: articles.url,
          fetchStatus: articles.fetchStatus,
          outlet: sources.name,
          kind: sources.kind,
        })
        .from(articles)
        .innerJoin(sources, eq(articles.sourceId, sources.id))
        .where(inArray(articles.id, ids))
    : [];
  const storyRows = await db()
    .select({ id: stories.id, slug: stories.slug, title: stories.plainTitle, status: stories.status, candidateId: stories.candidateId })
    .from(stories)
    .orderBy(desc(stories.createdAt));
  const since = new Date(Date.now() - QUEUE_DAYS * 86400_000);
  const [usage, suggestions] = await Promise.all([
    db().select({ type: events.type, n: count() }).from(events).where(gte(events.createdAt, since)).groupBy(events.type),
    db()
      .select({ text: feedback.text, createdAt: feedback.createdAt, story: stories.plainTitle, slug: stories.slug })
      .from(feedback)
      .innerJoin(stories, eq(feedback.storyId, stories.id))
      .orderBy(desc(feedback.createdAt))
      .limit(50),
  ]);
  return { candidates, byId: new Map(rows.map((r) => [r.id, r])), storyRows, usage, suggestions };
}

async function Queue() {
  const editor = await isAdmin();
  const { candidates, byId, storyRows, usage, suggestions } = await loadQueue();
  const usageCount = (t: string) => usage.find((u) => u.type === t)?.n ?? 0;
  const storyByCandidate = new Map(storyRows.map((s) => [s.candidateId, s]));
  const visibleStories = storyRows.filter((s) => editor || s.status === "published");

  const active = candidates.filter((c) => c.status !== "rejected");
  const rejected = candidates.filter((c) => c.status === "rejected");

  const editorBar = (
    <div className="mt-2 text-sm text-muted">
      {editor ? (
        <form action={logout} className="inline">
          Logged in as editor ·{" "}
          <button type="submit" className="cursor-pointer underline">
            Log out
          </button>
        </form>
      ) : (
        <Link href="/admin/login" className="underline">
          Editor login
        </Link>
      )}
    </div>
  );

  if (candidates.length === 0) {
    return (
      <>
        {editorBar}
        <p className="mt-6 text-muted">
          No candidates yet. They appear after the daily jobs run (ingest 06:00, cluster 07:00, full text 08:00 UTC).
        </p>
      </>
    );
  }

  return (
    <>
      {editorBar}
      <section className="mt-6">
        <h2 className="text-xl font-semibold">Reader activity (last {QUEUE_DAYS} days)</h2>
        <p className="mt-1 text-base">
          {usageCount("page_view")} page views · {usageCount("stakeholder_tap")} stakeholder taps ·{" "}
          {usageCount("chat_question")} chat questions
        </p>
        <p className="text-sm text-muted">Anonymous counts only; no personal data is collected.</p>
      </section>
      {editor && (
        <section className="mt-6">
          <h2 className="text-xl font-semibold">&ldquo;Missing a perspective?&rdquo; suggestions</h2>
          {suggestions.length === 0 ? (
            <p className="mt-1 text-sm text-muted">None yet.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2 text-base">
              {suggestions.map((f, i) => (
                <li key={i} className="rounded-lg border border-line p-3">
                  <p>{f.text}</p>
                  <p className="mt-1 text-sm text-muted">
                    on{" "}
                    <Link href={`/story/${f.slug}`} className="underline">
                      {f.story}
                    </Link>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      {visibleStories.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xl font-semibold">Generated stories</h2>
          <ul className="mt-2 flex flex-col gap-2 text-base">
            {visibleStories.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3">
                <span>
                  <Link href={`/story/${s.slug}`} className="underline">
                    {s.title}
                  </Link>
                  {s.status !== "published" && <span className="text-sm text-muted"> ({s.status})</span>}
                </span>
                {editor && (
                  <form action={setStoryStatus.bind(null, s.id, s.status === "published" ? "archived" : "published")}>
                    <button type="submit" className="cursor-pointer rounded-lg border border-line px-3 py-1 text-sm">
                      {s.status === "published" ? "Unpublish" : "Republish"}
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="mt-6 text-base">
        News stories the pipeline found that many different outlets covered. An editor picks from this list to write
        Roundtable story pages.
      </p>
      <p className="mt-2 text-sm text-muted">
        Stories covered by ≥ 5 outlets of ≥ 2 kinds in the last {QUEUE_DAYS} days, highest score first. Score = outlets +
        2 × kinds + 3 × affected-groups rating (1–5).
      </p>
      <ol className="mt-6 flex flex-col gap-4">
        {active.map((c) => {
          const items = c.articleIds.map((id) => byId.get(id)).filter((a) => a !== undefined);
          const withText = items.filter((a) => a.fetchStatus === "ok").length;
          return (
            <li key={c.id} className="rounded-xl border border-line bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold leading-snug">{c.label}</h2>
                <span className="shrink-0 rounded-full bg-soft px-3 py-1 text-sm font-semibold">{c.score}</span>
              </div>
              <div>
                {storyByCandidate.has(c.id) && (
                  <span className="text-sm font-semibold text-accent">Story generated</span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted">
                {c.distinctSourceCount} outlets · {c.distinctKindsCount} kinds · affected groups {c.stakeholderRichness}/5 ·
                full text {withText}/{items.length}
              </p>
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-accent">Articles ({items.length})</summary>
                <ul className="mt-2 flex flex-col gap-1.5 text-sm">
                  {items.map((a) => (
                    <li key={a.id}>
                      <span className="text-muted">
                        {a.outlet} ({a.kind}):
                      </span>{" "}
                      <a href={a.url} target="_blank" rel="noreferrer" className="underline">
                        {a.title}
                      </a>{" "}
                      <span className="text-muted">— {fetchLabel[a.fetchStatus]}</span>
                    </li>
                  ))}
                </ul>
              </details>
              {editor && (
                <form action={setCandidateStatus.bind(null, c.id, "rejected")} className="mt-3">
                  <button type="submit" className="cursor-pointer rounded-lg border border-line px-3 py-1.5 text-sm">
                    Reject
                  </button>
                </form>
              )}
            </li>
          );
        })}
      </ol>
      {editor && rejected.length > 0 && (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm text-muted">Rejected ({rejected.length})</summary>
          <ul className="mt-2 flex flex-col gap-2 text-sm">
            {rejected.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3">
                <span>{c.label}</span>
                <form action={setCandidateStatus.bind(null, c.id, "new")}>
                  <button type="submit" className="cursor-pointer underline">
                    Restore
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
