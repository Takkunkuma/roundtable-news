import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { FeedbackButton } from "@/components/FeedbackButton";
import { StakeholderPanel } from "@/components/StakeholderPanel";
import { getStory, listStories } from "@/lib/stories";

export function generateStaticParams() {
  return listStories().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata(props: PageProps<"/story/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const story = getStory(slug);
  return story ? { title: story.plain_title, description: story.why_it_matters } : {};
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-8 mb-2 font-sans text-sm font-semibold uppercase tracking-[0.06em] text-muted">
      {children}
    </h2>
  );
}

// The Suspense boundary lets navigation show the page shell before params resolve.
export default function StoryPage(props: PageProps<"/story/[slug]">) {
  return (
    <Suspense fallback={<p className="font-sans text-muted">Loading story…</p>}>
      <Story params={props.params} />
    </Suspense>
  );
}

async function Story({ params }: { params: PageProps<"/story/[slug]">["params"] }) {
  const { slug } = await params;
  const story = getStory(slug);
  if (!story) notFound();

  const storyCites = story.story_citations;

  return (
    <main>
      <article>
        <h1 className="text-[1.75rem] leading-tight">{story.plain_title}</h1>
        <p className="mt-2 font-sans text-lg font-semibold leading-snug">{story.why_it_matters}</p>
        {story.illustrative && (
          <p className="mt-4 border-l-[3px] border-line pl-3 font-sans text-sm text-muted">
            Illustrative example. Not based on real sources yet.
          </p>
        )}

        <SectionHeading>What happened</SectionHeading>
        <p>{story.context}</p>

        <SectionHeading>Background</SectionHeading>
        <p>{story.background}</p>

        <SectionHeading>Who&apos;s at the table</SectionHeading>
        <StakeholderPanel stakeholders={story.stakeholders} illustrative={story.illustrative} />

        <FeedbackButton />

        <SectionHeading>Sources</SectionHeading>
        {storyCites.length === 0 ? (
          <p className="font-sans text-base text-muted">
            {story.illustrative ? "No sources yet (illustrative example)." : "No sources listed."}
          </p>
        ) : (
          <ul className="list-disc pl-5 font-sans text-base">
            {storyCites.map((c, i) => (
              <li key={i}>
                &ldquo;{c.quote}&rdquo; <span className="text-muted">(source {c.article_id})</span>
              </li>
            ))}
          </ul>
        )}
      </article>
    </main>
  );
}
