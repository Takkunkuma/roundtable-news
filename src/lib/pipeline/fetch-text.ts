// Daily job 3 (BUILD_PLAN §4.3): download full text for candidate articles, politely,
// and purge stored text past its retention period.
import { Readability } from "@mozilla/readability";
import { and, eq, gte, inArray, isNotNull, lt, notInArray } from "drizzle-orm";
import { parseHTML } from "linkedom";
import robotsParser from "robots-parser";
import { db } from "@/db";
import { articles, citations, stories, storyCandidates } from "@/db/schema";
import { userAgent } from "@/lib/feeds";

const ROBOTS_AGENT = "RoundtableBot";
const PER_DOMAIN_DELAY_MS = 2_000;
const FETCH_TIMEOUT_MS = 15_000;
const TIME_BUDGET_MS = 240_000; // stop starting new fetches well before the 300 s limit
const MIN_TEXT_CHARS = 600; // shorter than this is almost always a paywall teaser or error page
const MAX_TEXT_CHARS = 100_000;
const RETENTION_DAYS = 30;
const CANDIDATE_WINDOW_HOURS = 72;

type Status = "ok" | "blocked" | "failed";
type Result = { status: Status; text?: string; reason?: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// robots.txt per origin, cached for the run. Unreachable or forbidden robots.txt
// means we don't fetch from that site.
const robotsCache = new Map<string, Promise<((url: string) => boolean) | null>>();
function robotsFor(url: URL) {
  const origin = url.origin;
  if (!robotsCache.has(origin)) {
    robotsCache.set(
      origin,
      (async () => {
        const robotsUrl = `${origin}/robots.txt`;
        try {
          const res = await fetch(robotsUrl, {
            headers: { "User-Agent": userAgent() },
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
          });
          if (res.status === 404 || res.status === 410) return () => true;
          if (!res.ok) return null;
          const robots = robotsParser(robotsUrl, await res.text());
          return (u: string) => robots.isAllowed(u, ROBOTS_AGENT) !== false;
        } catch {
          return null;
        }
      })(),
    );
  }
  return robotsCache.get(origin)!;
}

// linkedom rather than jsdom: jsdom's dependencies don't load on Vercel's runtime.
export function extractText(html: string): string | null {
  const { document } = parseHTML(html);
  const parsed = new Readability(document as unknown as Document).parse();
  const text = parsed?.textContent?.replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
  return text || null;
}

async function fetchArticle(rawUrl: string): Promise<Result> {
  const url = new URL(rawUrl);
  const allowed = await robotsFor(url);
  if (!allowed) return { status: "blocked", reason: "robots.txt unavailable" };
  if (!allowed(rawUrl)) return { status: "blocked", reason: "disallowed by robots.txt" };

  try {
    const res = await fetch(rawUrl, {
      headers: { "User-Agent": userAgent(), Accept: "text/html" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
    });
    if ([401, 402, 403, 451].includes(res.status)) return { status: "blocked", reason: `HTTP ${res.status}` };
    if (!res.ok) return { status: "failed", reason: `HTTP ${res.status}` };
    if (!(res.headers.get("content-type") ?? "").includes("html")) return { status: "failed", reason: "not HTML" };

    const text = extractText(await res.text());
    if (!text || text.length < MIN_TEXT_CHARS) return { status: "blocked", reason: "too little text (likely paywall)" };
    return { status: "ok", text: text.slice(0, MAX_TEXT_CHARS) };
  } catch (e) {
    return { status: "failed", reason: e instanceof Error ? e.message : String(e) };
  }
}

export async function runFetchText() {
  const started = Date.now();

  const candidates = await db()
    .select({ articleIds: storyCandidates.articleIds })
    .from(storyCandidates)
    .where(
      and(
        inArray(storyCandidates.status, ["new", "selected"]),
        gte(storyCandidates.createdAt, new Date(Date.now() - CANDIDATE_WINDOW_HOURS * 3600_000)),
      ),
    );
  const ids = [...new Set(candidates.flatMap((c) => c.articleIds))];
  const pending = ids.length
    ? await db()
        .select({ id: articles.id, url: articles.url })
        .from(articles)
        .where(and(inArray(articles.id, ids), eq(articles.fetchStatus, "pending")))
    : [];

  // One queue per domain: domains run in parallel, each domain's articles run one at a
  // time with a pause between them.
  const byDomain = new Map<string, typeof pending>();
  for (const a of pending) {
    const host = new URL(a.url).hostname;
    byDomain.set(host, [...(byDomain.get(host) ?? []), a]);
  }

  const counts = { ok: 0, blocked: 0, failed: 0, deferred: 0 };
  const reasons: Record<string, number> = {}; // why articles were skipped, for the job log
  await Promise.all(
    [...byDomain.values()].map(async (queue) => {
      for (const [i, a] of queue.entries()) {
        if (Date.now() - started > TIME_BUDGET_MS) {
          counts.deferred += queue.length - i; // left as pending for tomorrow's run
          return;
        }
        if (i > 0) await sleep(PER_DOMAIN_DELAY_MS);
        const result = await fetchArticle(a.url);
        counts[result.status]++;
        if (result.reason) {
          const key = `${new URL(a.url).hostname}: ${result.reason}`;
          reasons[key] = (reasons[key] ?? 0) + 1;
        }
        await db()
          .update(articles)
          .set({ fetchStatus: result.status, fullText: result.text ?? null, textFetchedAt: new Date() })
          .where(eq(articles.id, a.id));
      }
    }),
  );

  return {
    candidateArticles: ids.length,
    attempted: pending.length,
    ...counts,
    reasons,
    purged: await purgeExpiredText(),
  };
}

// Full text is private and kept for 30 days, except for articles cited by a published
// story, whose chat still needs them.
async function purgeExpiredText() {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86400_000);
  const cited = db()
    .select({ id: citations.articleId })
    .from(citations)
    .innerJoin(stories, eq(citations.storyId, stories.id))
    .where(eq(stories.status, "published"));
  const purged = await db()
    .update(articles)
    .set({ fullText: null })
    .where(and(isNotNull(articles.fullText), lt(articles.textFetchedAt, cutoff), notInArray(articles.id, cited)))
    .returning({ id: articles.id });
  return purged.length;
}
