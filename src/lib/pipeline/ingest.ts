// Daily job 1 (BUILD_PLAN §4.1): read every active RSS feed and save new articles.
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { articles, sources } from "@/db/schema";
import { fetchFeed } from "@/lib/feeds";
import { syncSources } from "@/lib/sources";

export async function runIngest() {
  await syncSources();
  const active = await db().select().from(sources).where(eq(sources.active, true));

  const results = await Promise.all(
    active.map(async (source) => {
      try {
        const items = await fetchFeed(source.feedUrl);
        if (items.length === 0) return { source: source.name, fetched: 0, inserted: 0 };
        const inserted = await db()
          .insert(articles)
          .values(items.map((i) => ({ ...i, sourceId: source.id, fetchedAt: new Date() })))
          .onConflictDoNothing({ target: articles.url })
          .returning({ id: articles.id });
        return { source: source.name, fetched: items.length, inserted: inserted.length };
      } catch (e) {
        return { source: source.name, error: e instanceof Error ? e.message : String(e) };
      }
    }),
  );

  const failed = results.filter((r) => "error" in r);
  return {
    feeds: active.length,
    failedFeeds: failed,
    inserted: results.reduce((n, r) => n + ("inserted" in r ? (r.inserted ?? 0) : 0), 0),
  };
}
