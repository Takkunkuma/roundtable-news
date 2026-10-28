// Client-side analytics helper. Fire-and-forget; never blocks the page.
type Event =
  | { type: "page_view"; path: string; storySlug?: string }
  | { type: "stakeholder_tap" | "chat_question"; storySlug: string; stakeholderId: number };

export function track(event: Event) {
  try {
    const body = JSON.stringify(event);
    if (navigator.sendBeacon?.("/api/events", new Blob([body], { type: "application/json" }))) return;
    void fetch("/api/events", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
  } catch {
    // analytics must never break the page
  }
}
