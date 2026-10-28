import { z } from "zod";
import { db } from "@/db";
import { events } from "@/db/schema";
import { rateLimit } from "@/lib/rate-limit";

// Anonymous usage events: no IP, user agent, cookies, or user ids are stored.
const eventSchema = z.object({
  type: z.enum(["page_view", "stakeholder_tap"]),
  path: z.string().max(300).optional(),
  storySlug: z.string().max(200).optional(),
  stakeholderId: z.number().int().positive().optional(),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`events:${ip}`, 120, 10 * 60_000)) return new Response(null, { status: 204 });
  const raw = await request.text().catch(() => "");
  const parsed = eventSchema.safeParse((() => { try { return JSON.parse(raw); } catch { return null; } })());
  if (!parsed.success) return new Response(null, { status: 400 });
  await db().insert(events).values(parsed.data).catch((e) => console.error("event insert failed", e));
  return new Response(null, { status: 204 });
}
