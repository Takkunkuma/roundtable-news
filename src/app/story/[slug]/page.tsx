import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CitedText } from "@/components/CitedText";
import { FeedbackButton } from "@/components/FeedbackButton";
import { StakeholderPanel } from "@/components/StakeholderPanel";
import { EXAMPLE_SLUG, getStory } from "@/lib/stories";

export function generateStaticParams() {
  return [{ slug: EXAMPLE_SLUG }];
}

export async function generateMetadata(props: PageProps<"/story/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const story = await getStory(slug);
  return story ? { title: story.plainTitle, description: story.whyItMatters } : {};
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
  const story = await getStory(slug);
  if (!story) notFound();

  const cites = (field: string) => story.storyCitations.filter((c) => c.field === field);

  return (
    <main>
      <article>
        <h1 className="text-[1.75rem] leading-tight">{story.plainTitle}</h1>
        <CitedText
          text={story.whyItMatters}
          cites={cites("why_it_matters")}
          className="mt-2 font-sans text-lg font-semibold leading-snug"
        />
        <p className="mt-4 border-l-[3px] border-line pl-3 font-sans text-sm text-muted">
          {story.illustrative
            ? "Illustrative example. Not based on real sources yet."
            : `AI-generated from ${story.sources.length} news ${story.sources.length === 1 ? "source" : "sources"}. Not reviewed by an editor. Tap the small numbers to see each source.`}
        </p>

        <SectionHeading>What happened</SectionHeading>
        <CitedText text={story.context} cites={cites("context")} />

        <SectionHeading>Background</SectionHeading>
        <CitedText text={story.background} cites={cites("background")} />

        <SectionHeading>Who&apos;s at the table</SectionHeading>
        <StakeholderPanel stakeholders={story.stakeholders} illustrative={story.illustrative} storySlug={story.slug} />

        <FeedbackButton />

        <SectionHeading>Sources</SectionHeading>
        {story.sources.length === 0 ? (
          <p className="font-sans text-base text-muted">
            {story.illustrative ? "No sources yet (illustrative example)." : "No sources listed."}
          </p>
        ) : (
          <ul className="flex flex-col gap-2 font-sans text-base">
            {story.sources.map((s) => (
              <li key={s.url}>
                <span className="font-semibold">{s.outlet}:</span>{" "}
                <a href={s.url} target="_blank" rel="noreferrer" className="underline">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        )}
      </article>
    </main>
  );
}
