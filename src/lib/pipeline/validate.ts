// Draft validation (BUILD_PLAN §4.5). Pure functions so they can be unit-tested.

// Lowercase, unify curly quotes and dashes, collapse whitespace.
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’‛′]/g, "'")
    .replace(/[“”‟″]/g, '"')
    .replace(/[‐-―−]/g, "-")
    .replace(/ /g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const words = (text: string) => normalize(text).replace(/[^a-z0-9' ]+/g, " ").split(" ").filter(Boolean);

// True if the quote appears in the article text: exactly (after normalizing), or with
// small differences (punctuation, a changed word) — at least 85% of its word trigrams match.
export function quoteFound(quote: string, articleText: string): boolean {
  const q = normalize(quote).replace(/^["']+|["']+$/g, "");
  if (q.length < 8) return false;
  if (normalize(articleText).includes(q)) return true;

  const qw = words(quote);
  const aw = words(articleText);
  if (qw.length < 4) return aw.join(" ").includes(qw.join(" "));
  const trigrams = new Set<string>();
  for (let i = 0; i + 2 < aw.length; i++) trigrams.add(`${aw[i]} ${aw[i + 1]} ${aw[i + 2]}`);
  let hits = 0;
  const total = qw.length - 2;
  for (let i = 0; i < total; i++) if (trigrams.has(`${qw[i]} ${qw[i + 1]} ${qw[i + 2]}`)) hits++;
  return hits / total >= 0.85;
}

const GROUP_WORDS =
  /\b(people|residents|voters|workers|officials|government|governments|administration|party|parties|groups?|families|owners|businesses|companies|industry|advocates|activists|supporters|opponents|critics|leaders|members|community|communities|citizens|patients|students|parents|teachers|police|prosecutors|investigators|court|courts|agency|agencies|department|ministry|council|congress|senate|lawmakers|legislators|union|unions|employees|consumers|farmers|immigrants|victims|survivors|military|forces|authorities|officers|regulators|experts|scientists|researchers|organizations|nations|states|countries|allies|team|fans|public|campaign|investors|producers|developers|customers|residents|households|commission|board|office|staff|clergy|church|movement|coalition|bloc|delegation|diplomats|governors|mayors|judges|lawyers|attorneys|defense|prosecution)\b/i;
const PERSON_TITLE = /^(mr|mrs|ms|dr|sen|senator|rep|gov|governor|president|prime minister|judge|justice|mayor|king|queen|prince|pope|ceo)\.?\s/i;

// Heuristic: flags names that read like one real person ("Jane Smith", "Sen. Jane Smith",
// "President X") rather than a group. A name with a group word ("Justice Department
// leaders", "President Trump and his allies") is a group, even if it starts with a title.
export function looksLikeNamedIndividual(name: string): boolean {
  const n = name.trim();
  if (GROUP_WORDS.test(n)) return false;
  if (PERSON_TITLE.test(n)) return true;
  const tokens = n.split(/\s+/);
  return tokens.length >= 2 && tokens.length <= 3 && tokens.every((t) => /^[A-Z][a-z'’.-]+$/.test(t));
}

function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;
  const groups = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "").match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups?.length ?? 1);
}

// Flesch–Kincaid grade level. The plan targets about 8th grade.
export function gradeLevel(text: string): number {
  const sentences = Math.max(1, (text.match(/[.!?]+(\s|$)/g) ?? []).length);
  const ws = text.split(/\s+/).filter((w) => /[a-z]/i.test(w));
  if (ws.length === 0) return 0;
  const syl = ws.reduce((n, w) => n + syllables(w), 0);
  return 0.39 * (ws.length / sentences) + 11.8 * (syl / ws.length) - 15.59;
}
