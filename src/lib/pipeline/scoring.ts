// Candidate scoring (BUILD_PLAN §4.2). Pure functions so they can be unit-tested.

export const MIN_SOURCES = 5;
export const MIN_KINDS = 2;

export type ClusterArticle = { id: number; sourceId: number; kind: string };

export function scoreCluster(items: ClusterArticle[], stakeholderRichness: number) {
  const distinctSourceCount = new Set(items.map((a) => a.sourceId)).size;
  const distinctKindsCount = new Set(items.map((a) => a.kind)).size;
  const richness = Math.min(5, Math.max(1, Math.round(stakeholderRichness)));
  return {
    distinctSourceCount,
    distinctKindsCount,
    stakeholderRichness: richness,
    // score = distinct sources + 2 × distinct kinds, plus a 1–5 boost for stories
    // that plausibly affect several distinct groups.
    score: distinctSourceCount + 2 * distinctKindsCount + richness,
    qualifies: distinctSourceCount >= MIN_SOURCES && distinctKindsCount >= MIN_KINDS,
  };
}

// Share of the smaller cluster that also appears in the other. Used to recognize that
// today's cluster is the same event as an existing candidate.
export function overlap(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  const shared = a.filter((id) => setB.has(id)).length;
  return shared / Math.min(a.length, b.length);
}

export const SAME_EVENT_OVERLAP = 0.5;
