import Parser from "rss-parser";

export const userAgent = () =>
  process.env.SCRAPER_USER_AGENT || "RoundtableBot/0.1 (+https://github.com/Takkunkuma/roundtable-news)";

const parser = new Parser();

export type FeedItem = { url: string; title: string; snippet: string | null; publishedAt: Date | null };

// rss-parser's own timeout doesn't cover a stalled response body, so fetch with a hard abort.
export async function fetchFeed(url: string, timeoutMs = 15_000): Promise<FeedItem[]> {
  const res = await fetch(url, {
    headers: { "User-Agent": userAgent(), Accept: "application/rss+xml, application/xml, text/xml, */*" },
    signal: AbortSignal.timeout(timeoutMs),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const feed = await parser.parseString(await res.text());
  return feed.items.flatMap((item) => {
    const link = item.link?.trim();
    const title = item.title?.trim();
    if (!link || !title || !/^https?:\/\//.test(link)) return [];
    const date = new Date(item.isoDate ?? item.pubDate ?? "");
    const snippet = (item.contentSnippet ?? "").replace(/\s+/g, " ").trim().slice(0, 500);
    return [{ url: link, title, snippet: snippet || null, publishedAt: isNaN(date.getTime()) ? null : date }];
  });
}
