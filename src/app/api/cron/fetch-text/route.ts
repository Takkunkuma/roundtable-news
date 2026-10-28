import { runFetchText } from "@/lib/pipeline/fetch-text";
import { isAuthorizedCron } from "@/lib/secrets";

export const maxDuration = 300;

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return new Response("Unauthorized", { status: 401 });
  try {
    const result = await runFetchText();
    console.log("cron fetch-text", JSON.stringify(result));
    return Response.json(result);
  } catch (e) {
    console.error("cron fetch-text failed", e);
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
