"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="font-sans">
      <h1 className="font-serif text-2xl">Something went wrong</h1>
      <p className="mt-2 text-base text-muted">This page didn&apos;t load. It&apos;s probably temporary.</p>
      <div className="mt-4 flex gap-3">
        <button type="button" onClick={() => retry()} className="cursor-pointer rounded-lg bg-accent px-4 py-2 text-accent-fg">
          Try again
        </button>
        <Link href="/" className="rounded-lg border border-line px-4 py-2">
          Back to today&apos;s stories
        </Link>
      </div>
    </main>
  );
}
