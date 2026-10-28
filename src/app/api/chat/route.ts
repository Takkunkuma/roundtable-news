import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { chatLogs, events, stakeholderClaims, stakeholders, stories } from "@/db/schema";
import { buildSystemPrompt, chatRequestSchema } from "@/lib/chat";
import { anthropic, fallbackOptions, llmModel } from "@/lib/llm";
import { rateLimit } from "@/lib/rate-limit";
import { loadSourceArticles } from "@/lib/stories";

export const maxDuration = 60;

const json = (body: unknown, status: number) => Response.json(body, { status });

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`chat:${ip}`, 20, 10 * 60_000)) {
    return json({ error: "You've asked a lot of questions in a short time. Please wait a few minutes." }, 429);
  }

  const parsed = chatRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, 400);
  const { storySlug, stakeholderId, messages } = parsed.data;

  const [story] = await db()
    .select()
    .from(stories)
    .where(and(eq(stories.slug, storySlug), eq(stories.status, "published")));
  if (!story) return json({ error: "Story not found" }, 404);

  const groups = await db().select().from(stakeholders).where(eq(stakeholders.storyId, story.id));
  const stakeholder = groups.find((g) => g.id === stakeholderId);
  if (!stakeholder) return json({ error: "Group not found in this story" }, 404);

  await db()
    .insert(events)
    .values({ type: "chat_question", storySlug, stakeholderId })
    .catch((e) => console.error("event insert failed", e));

  const [claims, articles] = await Promise.all([
    db().select().from(stakeholderClaims).where(eq(stakeholderClaims.stakeholderId, stakeholder.id)),
    loadSourceArticles(story.id),
  ]);

  const system = buildSystemPrompt({
    stakeholder: { ...stakeholder, claims: claims.map((c) => c.claimText) },
    others: groups.filter((g) => g.id !== stakeholder.id).map((g) => g.name),
    story: { title: story.plainTitle, context: story.context, background: story.background },
    articles: articles.map((a) => ({ outlet: a.outlet, title: a.title, text: a.fullText ?? "(text no longer stored)" })),
  });

  const stream = anthropic().beta.messages.stream({
    model: llmModel(),
    max_tokens: 2_000,
    ...fallbackOptions(),
    output_config: { effort: "low" },
    // The system prompt is the same for every question to this group, so cache it.
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    messages,
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let answer = "";
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            answer += event.delta.text;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal" && !answer) {
          const note = "Sorry, I can't answer that one. Try asking about this group's views on the story.";
          answer = note;
          controller.enqueue(encoder.encode(note));
        }
        // What readers ask, for learning (no personal data).
        await db()
          .insert(chatLogs)
          .values({ storyId: story.id, stakeholderId: stakeholder.id, question: messages.at(-1)!.content, answer })
          .catch((e) => console.error("chat log failed", e));
      } catch (e) {
        console.error("chat failed", e);
        controller.enqueue(encoder.encode("\n\nSorry, something went wrong. Please try again."));
      } finally {
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
