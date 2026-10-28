import { desc, eq, gte, inArray } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { db } from "@/db";
import { articles, sources, storyCandidates } from "@/db/schema";
import { isAdmin } from "@/lib/admin-auth";
import { logout, setCandidateStatus } from "./actions";

export const metadata: Metadata = { title: "Candidate queue", robots: { index: false } };

const QUEUE_DAYS = 7;

export default function AdminPage() {
  return (
    <main className="font-sans">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="font-serif text-3xl">Candidate queue</h1>
        <form action={logout}>
          <button type="submit" className="cursor-pointer text-sm text-muted underline">
            Log out
          </button>
        </form>
      </div>
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
  return { candidates, byId: new Map(rows.map((r) => [r.id, r])) };
}

async function Queue() {
  if (!(await isAdmin())) redirect("/admin/login");
  const { candidates, byId } = await loadQueue();

  const active = candidates.filter((c) => c.status !== "rejected");
  const rejected = candidates.filter((c) => c.status === "rejected");

  if (candidates.length === 0) {
    return (
      <p className="mt-6 text-muted">
        No candidates yet. They appear after the daily jobs run (ingest 06:00, cluster 07:00, full text 08:00 UTC).
      </p>
    );
  }

  return (
    <>
      <p className="mt-2 text-sm text-muted">
        Stories covered by ≥ 5 outlets of ≥ 2 kinds in the last {QUEUE_DAYS} days, highest score first. Score = outlets +
        2 × kinds + affected-groups rating (1–5).
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
              <form action={setCandidateStatus.bind(null, c.id, "rejected")} className="mt-3">
                <button type="submit" className="cursor-pointer rounded-lg border border-line px-3 py-1.5 text-sm">
                  Reject
                </button>
              </form>
            </li>
          );
        })}
      </ol>
      {rejected.length > 0 && (
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
