import Link from "next/link";
import { listStories, sourceCount } from "@/lib/stories";

export default function Home() {
  const stories = listStories();

  return (
    <main>
      <h1 className="mb-6 text-3xl leading-tight">Today&apos;s stories</h1>
      <ul className="flex flex-col gap-4">
        {stories.map((story) => {
          const count = sourceCount(story);
          return (
            <li key={story.slug}>
              <Link
                href={`/story/${story.slug}`}
                className="block rounded-xl border border-line bg-card p-5 transition-colors hover:border-accent"
              >
                <h2 className="text-2xl leading-snug">{story.plain_title}</h2>
                <p className="mt-2 font-sans text-base text-fg">{story.why_it_matters}</p>
                <div className="mt-4 flex items-center justify-between gap-4 font-sans text-sm text-muted">
                  <span aria-label={story.stakeholders.map((s) => s.name).join(", ")} className="text-xl">
                    {story.stakeholders.map((s) => s.icon).join(" ")}
                  </span>
                  <span>
                    {story.illustrative
                      ? "Illustrative example"
                      : `${count} ${count === 1 ? "source" : "sources"}`}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
