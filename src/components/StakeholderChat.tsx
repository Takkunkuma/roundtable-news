"use client";

import { Fragment, useRef, useState } from "react";
import type { SourceView, StakeholderView } from "@/lib/stories";

// Placeholder starters until §11 Q3 (generic vs. per-story) is decided.
const STARTERS = ["What do you want most?", "What worries you about this?", "Why do you see it this way?"];
const MAX_QUESTION_CHARS = 500;
const MAX_QUESTIONS = 10;

type Message = { role: "user" | "assistant"; content: string };

const label = "font-sans text-[0.8rem] font-semibold uppercase tracking-[0.04em] text-muted";

// Turns "[2]" markers in an answer into links to the story's second source.
function AnswerText({ text, sources }: { text: string; sources: SourceView[] }) {
  const parts = text.split(/(\[\d+(?:,\s*\d+)*\])/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^\[(\d+(?:,\s*\d+)*)\]$/);
        if (!m) return <Fragment key={i}>{part}</Fragment>;
        return (
          <Fragment key={i}>
            {m[1].split(/,\s*/).map((n) => {
              const src = sources[Number(n) - 1];
              return src ? (
                <a
                  key={n}
                  href={src.url}
                  target="_blank"
                  rel="noreferrer"
                  title={`${src.outlet}: ${src.title}`}
                  className="ml-0.5 align-super text-xs text-accent underline"
                >
                  {src.outlet}
                </a>
              ) : null;
            })}
          </Fragment>
        );
      })}
    </>
  );
}

export function StakeholderChat({
  s,
  storySlug,
  sources,
  illustrative,
}: {
  s: StakeholderView;
  storySlug: string;
  sources: SourceView[];
  illustrative: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const asked = messages.filter((m) => m.role === "user").length;
  const atLimit = asked >= MAX_QUESTIONS;

  if (illustrative || !s.id) {
    return (
      <section className="mt-4 rounded-xl bg-soft p-4 font-sans text-base text-muted">
        Chat is available on real stories with sources. This illustrative example has none.
      </section>
    );
  }

  async function ask(text: string) {
    const q = text.trim();
    if (!q || busy || atLimit) return;
    const history: Message[] = [...messages, { role: "user", content: q }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setQuestion("");
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storySlug, stakeholderId: s.id, messages: history }),
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setMessages([...history, { role: "assistant", content: answer }]);
        endRef.current?.scrollIntoView({ block: "nearest" });
      }
    } catch (e) {
      setMessages(messages); // drop the unanswered question so it can be retried
      setQuestion(q);
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label={`Ask ${s.name}`} className="mt-4 rounded-xl bg-soft p-4 font-sans text-base">
      <p className="mb-3 text-xs text-muted">
        AI summary of what this group has said in this story&apos;s news sources. Not an interview with a real person.
        Answers can be wrong; check the linked sources.
      </p>
      <div className={`${label} mb-2`}>Ask {s.name.toLowerCase()} a question</div>

      {messages.length > 0 && (
        <div className="mb-3 flex flex-col gap-3" aria-live="polite">
          {messages.map((m, i) =>
            m.role === "user" ? (
              <p key={i} className="self-end rounded-lg bg-card px-3 py-2 font-semibold">
                {m.content}
              </p>
            ) : (
              <p key={i} className="leading-relaxed">
                <span aria-hidden="true">{s.icon} </span>
                {m.content ? <AnswerText text={m.content} sources={sources} /> : <span className="text-muted">Thinking…</span>}
              </p>
            ),
          )}
          <div ref={endRef} />
        </div>
      )}

      {messages.length === 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {STARTERS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => ask(q)}
              className="cursor-pointer rounded-lg border border-line bg-card px-3 py-1.5 text-sm"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="mb-2 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}

      {atLimit ? (
        <p className="text-sm text-muted">You&apos;ve reached the {MAX_QUESTIONS}-question limit for this chat. Try another group!</p>
      ) : (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            ask(question);
          }}
        >
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={MAX_QUESTION_CHARS}
            placeholder={busy ? "Answering…" : "Type your question"}
            aria-label="Your question"
            disabled={busy}
            className="min-w-0 flex-1 rounded-lg border border-line bg-card p-2.5 text-base text-fg"
          />
          <button
            type="submit"
            disabled={busy || !question.trim()}
            className="cursor-pointer rounded-lg bg-accent px-4 text-base text-accent-fg disabled:opacity-60"
          >
            Ask
          </button>
        </form>
      )}
    </section>
  );
}
