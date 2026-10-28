"use client";

import { useState } from "react";
import { CitedText } from "@/components/CitedText";
import { StakeholderChat } from "@/components/StakeholderChat";
import type { SourceView, StakeholderView } from "@/lib/stories";

type Stakeholder = StakeholderView;

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

export function StakeholderPanel({
  stakeholders,
  illustrative,
  storySlug,
  sources,
}: {
  stakeholders: Stakeholder[];
  illustrative: boolean;
  storySlug: string;
  sources: SourceView[];
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
        <StakeholderChat s={s} storySlug={storySlug} sources={sources} illustrative={illustrative} />
      </div>
    </div>
  );
}
