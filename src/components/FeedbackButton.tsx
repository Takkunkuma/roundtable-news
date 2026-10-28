"use client";

import { useState } from "react";

// "Missing a perspective?" — saved to the feedback table for an editor to review.
export function FeedbackButton({ storySlug, illustrative }: { storySlug: string; illustrative: boolean }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");

  if (sent) {
    return (
      <p role="status" className="mt-8 rounded-lg border border-line p-4 font-sans text-base text-muted">
        Thanks. An editor will read your suggestion
        {illustrative ? " (this is an example story, so nothing was saved)" : ""}.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-8 w-full cursor-pointer rounded-lg border border-dashed border-line px-4 py-3 font-sans text-base text-muted hover:border-accent hover:text-fg"
      >
        Missing a perspective? Tell us who.
      </button>
    );
  }

  async function submit() {
    if (text.trim().length < 3 || busy) return;
    if (illustrative) return setSent(true);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storySlug, text }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Couldn't send. Please try again.");
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="mt-8 rounded-lg border border-line bg-card p-4 font-sans"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <label htmlFor="missing" className="block text-base font-semibold">
        Which group is missing from this story?
      </label>
      <textarea
        id="missing"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={1000}
        className="mt-2 w-full rounded-lg border border-line bg-bg p-3 text-base text-fg"
        placeholder="For example: parents of students at nearby schools"
      />
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={busy || text.trim().length < 3}
          className="cursor-pointer rounded-lg bg-accent px-4 py-2 text-base text-accent-fg disabled:opacity-60"
        >
          {busy ? "Sending…" : "Send"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="cursor-pointer rounded-lg border border-line px-4 py-2 text-base"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
