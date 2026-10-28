import { runGenerate } from "@/lib/pipeline/generate";
import { isAuthorizedCron } from "@/lib/secrets";

export const maxDuration = 300;

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return new Response("Unauthorized", { status: 401 });
  try {
    // ?limit=N (1–5) lets a manual run generate fewer stories.
    const limit = Number(new URL(request.url).searchParams.get("limit") ?? 5);
    const result = await runGenerate(Math.min(5, Math.max(1, Number.isFinite(limit) ? limit : 5)));
    console.log("cron generate", JSON.stringify(result));
    return Response.json(result);
  } catch (e) {
    console.error("cron generate failed", e);
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
