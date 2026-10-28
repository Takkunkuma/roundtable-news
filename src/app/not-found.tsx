import Link from "next/link";

export default function NotFound() {
  return (
    <main className="font-sans">
      <h1 className="font-serif text-2xl">We couldn&apos;t find that story</h1>
      <p className="mt-2 text-base text-muted">It may have been taken down or the link may be wrong.</p>
      <Link href="/" className="mt-4 inline-block rounded-lg bg-accent px-4 py-2 text-accent-fg">
        See today&apos;s stories
      </Link>
    </main>
  );
}
