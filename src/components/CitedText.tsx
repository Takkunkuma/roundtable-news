"use client";

import { useState } from "react";
import type { CitationView } from "@/lib/stories";

// Text followed by small numbered source markers; tapping one shows the outlet, the
// short quote it's based on, and a link to the original article.
export function CitedText({
  text,
  cites,
  as: Tag = "p",
  className = "",
}: {
  text: string;
  cites: CitationView[];
  as?: "p" | "span";
  className?: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const shown = open !== null ? cites[open] : undefined;
  return (
    <>
      <Tag className={className}>
        {text}
        {cites.map((c, i) => (
          <button
            key={i}
            type="button"
            aria-expanded={open === i}
            aria-label={`Source ${i + 1}${c.outlet ? `: ${c.outlet}` : ""}`}
            onClick={() => setOpen(open === i ? null : i)}
            className="ml-1 cursor-pointer rounded px-1 align-super font-sans text-xs text-accent underline"
          >
            {i + 1}
          </button>
        ))}
      </Tag>
      {shown && (
        <span className="mt-1 block rounded-md bg-soft px-3 py-2 font-sans text-sm">
          &ldquo;{shown.quote}&rdquo;
          {shown.outlet && (
            <>
              {" — "}
              {shown.url ? (
                <a href={shown.url} target="_blank" rel="noreferrer" className="font-semibold underline">
                  {shown.outlet} ↗
                </a>
              ) : (
                <span className="font-semibold">{shown.outlet}</span>
              )}
            </>
          )}
        </span>
      )}
    </>
  );
}
