import { notInArray, sql } from "drizzle-orm";
import { z } from "zod";
import sourcesFile from "../../data/sources.json";
import { db } from "@/db";
import { sources } from "@/db/schema";

const sourceEntrySchema = z.object({
  name: z.string().min(1),
  feed_url: z.url(),
  homepage: z.url().optional(),
  kind: z.enum(["national", "local", "international", "trade", "wire", "official", "advocacy"]),
  country: z.string().optional(),
});

export const sourceList = z.array(sourceEntrySchema).parse(sourcesFile);

// Makes the `sources` table match data/sources.json: upserts every entry and
// deactivates feeds that were removed from the file (rows are kept for old articles).
export async function syncSources() {
  const rows = sourceList.map((s) => ({
    name: s.name,
    feedUrl: s.feed_url,
    homepage: s.homepage ?? null,
    kind: s.kind,
    country: s.country ?? null,
    active: true,
  }));
  await db()
    .insert(sources)
    .values(rows)
    .onConflictDoUpdate({
      target: sources.feedUrl,
      set: {
        name: sql`excluded.name`,
        homepage: sql`excluded.homepage`,
        kind: sql`excluded.kind`,
        country: sql`excluded.country`,
        active: true,
      },
    });
  await db()
    .update(sources)
    .set({ active: false })
    .where(notInArray(sources.feedUrl, rows.map((r) => r.feedUrl)));
}
