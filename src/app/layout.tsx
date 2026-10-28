import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Roundtable", template: "%s · Roundtable" },
  description: "Read the story in plain words, then ask the people in it.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-bg font-serif leading-relaxed text-fg">
        <div className="mx-auto max-w-[680px] px-4 pt-8 pb-16">
          <header className="mb-6">
            <Link
              href="/"
              className="font-sans text-sm font-semibold uppercase tracking-[0.08em] text-accent"
            >
              Roundtable
            </Link>
          </header>
          {children}
          <footer className="mt-16 border-t border-line pt-4 font-sans text-sm text-muted">
            <Link href="/admin" className="underline">
              How stories are found
            </Link>
          </footer>
        </div>
      </body>
    </html>
  );
}
