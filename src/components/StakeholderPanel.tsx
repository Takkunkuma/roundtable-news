"use client";

import { useState } from "react";
import { CitedText } from "@/components/CitedText";
import type { StakeholderView } from "@/lib/stories";

type Stakeholder = StakeholderView;

// Placeholder starters until §11 Q3 (generic vs. per-story) is decided.
const STARTERS = ["What do you want most?", "What worries you about this?", "What would change your mind?"];

const label = "font-sans text-[0.8rem] font-semibold uppercase tracking-[0.04em] text-muted";

function StakeholderCard({ s, illustrative }: { s: Stakeholder; illustrative: boolean }) {
  const citesFor = (field: string) => s.citations.filter((c) => c.field === field);
  const allSources = [...new Set([...s.citations, ...s.claims.flatMap((c) => c.citations)].map((c) => c.outlet).filter(Boolean))];

  return (
    <div className="mt-4 rounded-xl border border-line bg-card p-5 font-sans text-base">
      <h3 className="mb-2 text-xl font-semibold">
        <span aria-hidden="true">{s.icon}</span> {s.name}
      </h3>

      <div className={`${label} mt-3`}>Wants</div>
      <CitedText text={s.wants} cites={citesFor("wants")} className="mt-0.5" />

      <div className={`${label} mt-3`}>Worries</div>
      <CitedText text={s.worries} cites={citesFor("worries")} className="mt-0.5" />

      <details className="mt-4">
        <summary className="cursor-pointer text-accent">Why they see it this way</summary>
        <div className="mt-2">
          <CitedText text={s.why} cites={citesFor("why")} className="mt-0.5" />

          <div className={`${label} mt-4`}>Factual claims</div>
          {s.claims.length === 0 ? (
            <p className="mt-0.5">None listed.</p>
          ) : (
            <ul className="mt-1 list-disc pl-5">
              {s.claims.map((claim, i) => (
                <li key={i}>
                  <CitedText as="span" text={claim.text} cites={claim.citations} />{" "}
                  <span className="text-sm text-muted">(claimed by this group)</span>
                </li>
              ))}
            </ul>
          )}

          <div className={`${label} mt-4`}>Based on</div>
          <p className="mt-0.5 text-sm">
            {allSources.length > 0
              ? allSources.join(", ")
              : illustrative
                ? "No sources yet (illustrative example)."
                : "No sources listed."}
          </p>
        </div>
      </details>
    </div>
  );
}

// M1 preview of the chat. The real grounded, streaming chat arrives in M4.
function ChatPreview({ s }: { s: Stakeholder }) {
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState(false);

  return (
    <section aria-label={`Ask ${s.name}`} className="mt-4 rounded-xl bg-soft p-4 font-sans text-base">
      <p className="mb-3 text-xs text-muted">
        AI summary of what this group has said in the sources. Not an interview with a real person.
      </p>
      <div className={`${label} mb-2`}>Ask {s.name.toLowerCase()} a question</div>
      <div className="mb-3 flex flex-wrap gap-2">
        {STARTERS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => {
              setQuestion(q);
              setAsked(true);
            }}
            className="cursor-pointer rounded-lg border border-line bg-card px-3 py-1.5 text-sm"
          >
            {q}
          </button>
        ))}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (question.trim()) setAsked(true);
        }}
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={500}
          placeholder="Type your question"
          aria-label="Your question"
          className="min-w-0 flex-1 rounded-lg border border-line bg-card p-2.5 text-base text-fg"
        />
        <button type="submit" className="cursor-pointer rounded-lg bg-accent px-4 text-base text-accent-fg">
          Ask
        </button>
      </form>
      <p aria-live="polite" className="mt-3 text-muted">
        {asked &&
          "Preview only. Soon, this group will answer using only this story's sources, with citations, and will say so when the sources don't cover your question."}
      </p>
    </section>
  );
}

export function StakeholderPanel({
  stakeholders,
  illustrative,
}: {
  stakeholders: Stakeholder[];
  illustrative: boolean;
  storySlug: string;
}) {
  const [selected, setSelected] = useState(0);
  const s = stakeholders[selected];

  return (
    <div>
      <div className="flex flex-wrap gap-2.5" role="group" aria-label="Stakeholders">
        {stakeholders.map((st, i) => (
          <button
            key={st.name}
            type="button"
            aria-pressed={i === selected}
            onClick={() => setSelected(i)}
            className="cursor-pointer rounded-full border border-line bg-card px-4 py-2.5 font-sans text-base aria-pressed:border-accent aria-pressed:ring-1 aria-pressed:ring-accent"
          >
            <span aria-hidden="true">{st.icon}</span> {st.name}
          </button>
        ))}
      </div>
      {/* key resets card and chat state when switching stakeholders */}
      <div key={selected}>
        <StakeholderCard s={s} illustrative={illustrative} />
        <ChatPreview s={s} />
      </div>
    </div>
  );
}
