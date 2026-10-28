import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { feedback, stories } from "@/db/schema";
import { rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  storySlug: z.string().min(1).max(200),
  text: z.string().trim().min(3, "Please describe the missing group.").max(1000),
});

// "Missing a perspective?" submissions, reviewed by an editor in /admin.
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`feedback:${ip}`, 5, 10 * 60_000)) {
    return Response.json({ error: "Thanks! You've sent several suggestions already. Please try again later." }, { status: 429 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });

  const [story] = await db()
    .select({ id: stories.id })
    .from(stories)
    .where(and(eq(stories.slug, parsed.data.storySlug), eq(stories.status, "published")));
  if (!story) return Response.json({ error: "Story not found" }, { status: 404 });

  await db().insert(feedback).values({ storyId: story.id, text: parsed.data.text });
  return Response.json({ ok: true });
}
