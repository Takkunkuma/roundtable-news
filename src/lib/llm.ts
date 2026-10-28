import Anthropic from "@anthropic-ai/sdk";

// Model is configurable (BUILD_PLAN §2); default is the current Claude Sonnet.
export const llmModel = () => process.env.LLM_MODEL || "claude-sonnet-5-5";

let client: Anthropic | undefined;
export function anthropic(): Anthropic {
  client ??= new Anthropic();
  return client;
}

// If a request is declined by a safety classifier, the API reruns it on Anthropic's
// recommended fallback model instead of returning a refusal.
export const fallbackOptions = (): { betas: Anthropic.Beta.AnthropicBeta[]; fallbacks: "default" } => ({
  betas: ["server-side-fallback-2026-07-01"],
  fallbacks: "default",
});
