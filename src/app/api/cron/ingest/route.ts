import { runIngest } from "@/lib/pipeline/ingest";
import { isAuthorizedCron } from "@/lib/secrets";

export const maxDuration = 300;

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return new Response("Unauthorized", { status: 401 });
  try {
    const result = await runIngest();
    console.log("cron ingest", JSON.stringify(result));
    return Response.json(result);
  } catch (e) {
    console.error("cron ingest failed", e);
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
