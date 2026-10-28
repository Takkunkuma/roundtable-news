import { describe, expect, it } from "vitest";
import { overlap, scoreCluster } from "./scoring";

const art = (id: number, sourceId: number, kind: string) => ({ id, sourceId, kind });

describe("scoreCluster", () => {
  it("counts distinct sources and kinds, not articles", () => {
    const r = scoreCluster(
      [art(1, 1, "national"), art(2, 1, "national"), art(3, 2, "national"), art(4, 3, "wire")],
      3,
    );
    expect(r.distinctSourceCount).toBe(3);
    expect(r.distinctKindsCount).toBe(2);
    expect(r.score).toBe(3 + 2 * 2 + 3 * 3);
    expect(r.qualifies).toBe(false);
  });

  it("qualifies at ≥ 5 sources and ≥ 2 kinds", () => {
    const items = [1, 2, 3, 4].map((i) => art(i, i, "national")).concat(art(5, 5, "official"));
    expect(scoreCluster(items, 1).qualifies).toBe(true);
  });

  it("does not qualify with 5 sources of one kind", () => {
    const items = [1, 2, 3, 4, 5].map((i) => art(i, i, "national"));
    expect(scoreCluster(items, 5).qualifies).toBe(false);
  });

  it("clamps the richness boost to 1–5", () => {
    const items = [art(1, 1, "national")];
    expect(scoreCluster(items, 9).stakeholderRichness).toBe(5);
    expect(scoreCluster(items, 0).stakeholderRichness).toBe(1);
  });
});

describe("overlap", () => {
  it("is shared / size of the smaller cluster", () => {
    expect(overlap([1, 2, 3, 4], [3, 4])).toBe(1);
    expect(overlap([1, 2, 3, 4], [4, 5, 6, 7])).toBe(0.25);
  });

  it("is 0 when either side is empty", () => {
    expect(overlap([], [1])).toBe(0);
  });
});
