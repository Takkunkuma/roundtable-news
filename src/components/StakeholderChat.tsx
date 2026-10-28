"use client";

import { useEffect, useRef, useState } from "react";
import { type AnswerPart, simulatedAnswer } from "@/lib/simulated-chat";
import type { SourceView, StakeholderView } from "@/lib/stories";
import { track } from "@/lib/track";

const STARTERS = ["What do you want most?", "What worries you about this?", "Why do you see it this way?", "What facts do you point to?"];
const MAX_QUESTION_CHARS = 500;
const TYPING_MS = 18; // per word, so answers appear to be typed

type Message = { role: "user"; text: string } | { role: "group"; parts: AnswerPart[]; shownWords: number };

const label = "font-sans text-[0.8rem] font-semibold uppercase tracking-[0.04em] text-muted";
const wordCount = (parts: AnswerPart[]) => parts.reduce((n, p) => n + p.text.split(" ").length, 0);

function Answer({ parts, shownWords }: { parts: AnswerPart[]; shownWords: number }) {
  // Word offset where each part starts, so each part knows how much of it to show.
  const starts = parts.map((_, i) => parts.slice(0, i).reduce((n, p) => n + p.text.split(" ").length, 0));
  return (
    <>
      {parts.map((p, i) => {
        const words = p.text.split(" ");
        const budget = shownWords - starts[i];
        if (budget <= 0) return null;
        const done = budget >= words.length;
        return (
          <span key={i} className="block [&+&]:mt-1.5">
            {words.slice(0, budget).join(" ")}
            {done &&
              p.cites.map((c, j) =>
                c.url ? (
                  <a
                    key={j}
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    title={`“${c.quote}”`}
                    className="ml-1 align-super text-xs text-accent underline"
                  >
                    {c.outlet}
                  </a>
                ) : null,
              )}
          </span>
        );
      })}
    </>
  );
}

export function StakeholderChat({
  s,
  storySlug,
  sources,
  others,
  illustrative,
}: {
  s: StakeholderView;
  storySlug: string;
  sources: SourceView[];
  others: string[];
  illustrative: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const typing = messages.some((m) => m.role === "group" && m.shownWords < wordCount(m.parts));

  // Reveal the latest answer a few words at a time.
  useEffect(() => {
    if (!typing) return;
    const t = setTimeout(() => {
      setMessages((ms) => ms.map((m) => (m.role === "group" ? { ...m, shownWords: m.shownWords + 2 } : m)));
      endRef.current?.scrollIntoView({ block: "nearest" });
    }, TYPING_MS * 2);
    return () => clearTimeout(t);
  }, [messages, typing]);

  function ask(text: string) {
    const q = text.trim();
    if (!q || typing) return;
    const outlets = [...new Set(sources.map((src) => src.outlet))];
    const parts = simulatedAnswer(s, q, others, outlets);
    setMessages((ms) => [...ms, { role: "user", text: q }, { role: "group", parts, shownWords: 0 }]);
    setQuestion("");
    if (s.id && !illustrative) track({ type: "chat_question", storySlug, stakeholderId: s.id });
  }

  return (
    <section aria-label={`Ask ${s.name}`} className="mt-4 rounded-xl bg-soft p-4 font-sans text-base">
      <p className="mb-3 text-xs text-muted">
        Prototype chat: answers are simulated from this group&apos;s card above (what the news sources say about them),
        not live AI and not an interview with a real person.
      </p>
      <div className={`${label} mb-2`}>Ask {s.name.toLowerCase()} a question</div>

      {messages.length > 0 && (
        <div className="mb-3 flex flex-col gap-3" aria-live="polite">
          {messages.map((m, i) =>
            m.role === "user" ? (
              <p key={i} className="self-end rounded-lg bg-card px-3 py-2 font-semibold">
                {m.text}
              </p>
            ) : (
              <div key={i} className="leading-relaxed">
                <span aria-hidden="true">{s.icon} </span>
                <Answer parts={m.parts} shownWords={m.shownWords} />
              </div>
            ),
          )}
          <div ref={endRef} />
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-2">
        {STARTERS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => ask(q)}
            disabled={typing}
            className="cursor-pointer rounded-lg border border-line bg-card px-3 py-1.5 text-sm disabled:opacity-60"
          >
            {q}
          </button>
        ))}
      </div>

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
          placeholder="Type any question"
          aria-label="Your question"
          className="min-w-0 flex-1 rounded-lg border border-line bg-card p-2.5 text-base text-fg"
        />
        <button
          type="submit"
          disabled={typing || !question.trim()}
          className="cursor-pointer rounded-lg bg-accent px-4 text-base text-accent-fg disabled:opacity-60"
        >
          Ask
        </button>
      </form>
    </section>
  );
}
