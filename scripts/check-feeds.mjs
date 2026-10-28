// Checks every feed in a sources file: does it parse, how many items, how fresh is the newest one.
// Usage: node scripts/check-feeds.mjs [path/to/sources.json]   (default: data/sources.json)
import { readFileSync } from "node:fs";
import Parser from "rss-parser";

const path = process.argv[2] ?? "data/sources.json";
const sources = JSON.parse(readFileSync(path, "utf8"));
const userAgent =
  process.env.SCRAPER_USER_AGENT ?? "RoundtableBot/0.1 (+https://github.com/Takkunkuma/roundtable-news)";
const parser = new Parser();

// rss-parser's own timeout doesn't cover a stalled response body, so fetch with a hard abort.
async function fetchFeed(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": userAgent, Accept: "application/rss+xml, application/xml, text/xml, */*" },
    signal: AbortSignal.timeout(15000),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return parser.parseString(await res.text());
}

const results = await Promise.all(
  sources.map(async (s) => {
    try {
      const feed = await fetchFeed(s.feed_url);
      const dates = feed.items.map((i) => Date.parse(i.isoDate ?? i.pubDate ?? "")).filter(Number.isFinite);
      const newestHours = dates.length ? Math.round((Date.now() - Math.max(...dates)) / 36e5) : null;
      const withSnippet = feed.items.filter((i) => (i.contentSnippet ?? "").trim().length > 20).length;
      return { ...s, ok: feed.items.length > 0, items: feed.items.length, newestHours, withSnippet };
    } catch (e) {
      return { ...s, ok: false, error: String(e.message ?? e).slice(0, 80) };
    }
  }),
);

for (const r of results) {
  const status = !r.ok ? "FAIL" : r.newestHours === null || r.newestHours > 72 ? "STALE" : "ok";
  const detail = r.ok
    ? `${r.items} items, newest ${r.newestHours ?? "?"}h ago, ${r.withSnippet} with snippets`
    : r.error ?? "no items";
  console.log(`${status.padEnd(5)} ${r.kind.padEnd(13)} ${r.name.padEnd(38)} ${detail}`);
}
const good = results.filter((r) => r.ok && r.newestHours !== null && r.newestHours <= 72);
console.log(`\n${good.length}/${results.length} feeds ok and fresh (newest item ≤ 72h old)`);
process.exitCode = good.length === results.length ? 0 : 1;
