"use client";

import { useState } from "react";

// M1 preview: nothing is saved yet. M5 wires this to the `feedback` table.
export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [text, setText] = useState("");

  if (sent) {
    return (
      <p role="status" className="mt-8 rounded-lg border border-line p-4 font-sans text-base text-muted">
        Thanks. In the finished app, an editor reviews every suggestion. (Preview: not saved yet.)
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

  return (
    <form
      className="mt-8 rounded-lg border border-line bg-card p-4 font-sans"
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim()) setSent(true);
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
      <div className="mt-3 flex gap-2">
        <button type="submit" className="cursor-pointer rounded-lg bg-accent px-4 py-2 text-base text-accent-fg">
          Send
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
