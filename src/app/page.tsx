import Link from "next/link";
import { Suspense } from "react";
import { listStoryCards } from "@/lib/stories";

export default function Home() {
  return (
    <main>
      <h1 className="mb-2 text-3xl leading-tight">Today&apos;s stories</h1>
      <p className="mb-6 font-sans text-base text-muted">
        Each story in plain words, then the groups involved: what they want, what worries them, and why.
      </p>
      <Suspense fallback={<p className="font-sans text-muted">Loading stories…</p>}>
        <Feed />
      </Suspense>
    </main>
  );
}

async function Feed() {
  const cards = await listStoryCards();
  return (
    <ul className="flex flex-col gap-4">
      {cards.map((story) => (
        <li key={story.slug}>
          <Link
            href={`/story/${story.slug}`}
            className="block rounded-xl border border-line bg-card p-5 transition-colors hover:border-accent"
          >
            <h2 className="text-2xl leading-snug">{story.plainTitle}</h2>
            <p className="mt-2 font-sans text-base text-fg">{story.whyItMatters}</p>
            <div className="mt-4 flex items-center justify-between gap-4 font-sans text-sm text-muted">
              <span aria-label={`Groups: ${story.icons.map((s) => s.name).join(", ")}`} className="text-xl">
                {story.icons.map((s) => s.icon).join(" ")}
              </span>
              <span className="shrink-0">
                {story.illustrative
                  ? "Illustrative example"
                  : `${story.sourceCount} ${story.sourceCount === 1 ? "source" : "sources"}`}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
