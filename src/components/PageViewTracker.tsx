"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { track } from "@/lib/track";

// Records one page view per route change (reader pages only).
export function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    const storySlug = pathname.startsWith("/story/") ? pathname.slice("/story/".length) : undefined;
    track({ type: "page_view", path: pathname, storySlug });
  }, [pathname]);
  return null;
}
