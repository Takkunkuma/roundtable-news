import { describe, expect, it } from "vitest";
import { extractText } from "./fetch-text";

const para = "The city council voted on Tuesday to phase out gas leaf blowers over two years. ".repeat(6);
const html = `<!doctype html><html><head><title>Council vote</title><style>p{color:red}</style></head><body>
<nav><a href="/">Home</a> <a href="/news">News</a></nav>
<article><h1>Council votes to phase out gas leaf blowers</h1><p>${para}</p><p>${para}</p></article>
<footer>© Example News</footer><script>window.tracking = true;</script></body></html>`;

describe("extractText", () => {
  it("keeps the article body and drops navigation, scripts, and styles", () => {
    const text = extractText(html)!;
    expect(text).toContain("voted on Tuesday");
    expect(text).not.toContain("window.tracking");
    expect(text).not.toContain("color:red");
  });

  it("returns null for a page with no readable content", () => {
    expect(extractText("<html><body></body></html>")).toBeNull();
  });
});
