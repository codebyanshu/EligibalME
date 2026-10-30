import { CENTRAL_SCHEMES } from "./central";
import { PUNJAB_SCHEMES } from "./punjab";

export const ALL_SCHEMES = [...CENTRAL_SCHEMES, ...PUNJAB_SCHEMES];

export const SCHEME_COUNT = ALL_SCHEMES.length;
export const CENTRAL_COUNT = CENTRAL_SCHEMES.length;
export const STATE_COUNT = PUNJAB_SCHEMES.length;

export const getScheme = (id) => ALL_SCHEMES.find((s) => s.id === id);

const STOP_WORDS = new Set([
  "the", "and", "for", "what", "does", "need", "needed", "how", "can", "get", "are", "you",
  "your", "with", "this", "that", "which", "from", "about", "tell", "scheme", "schemes",
  "government", "govt", "there", "any", "much", "many", "please", "want", "know", "would",
  "should", "could", "its", "their", "they", "them", "was", "were", "will", "have", "has",
  "had", "not", "but", "all", "when", "where", "who", "why", "document", "documents", "paper",
  "papers", "apply", "application", "benefit", "benefits", "eligibility", "eligible", "money",
  "help", "required", "requirement", "list", "give", "under",
  "ਹੈ", "ਹੈਂ", "ਦੇ", "ਦਾ", "ਦੀ", "ਲਈ", "ਵਿੱਚ", "ਕੀ", "ਕਿਹੜੇ", "ਕਿਵੇਂ", "ਸਕੀਮ", "ਸਕੀਮਾਂ",
  "सकीम", "योजना", "के", "की", "का", "क्या", "कौन", "कैसे", "लिए", "है", "हैं", "में",
]);

const INDEX = new Map(
  ALL_SCHEMES.map((s) => [
    s.id,
    {
      name: [s.name.en, s.name.hi, s.name.pa].join(" ").toLowerCase(),
      text: [s.id, s.dept, s.source, s.summary.en, s.benefit.en, s.group].join(" ").toLowerCase(),
    },
  ]),
);

function words(query) {
  return String(query || "")
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

// Keyword search used by the "all schemes" page and to pick context for follow-up questions.
export function searchSchemes(query) {
  const qs = words(query);
  if (!qs.length) return ALL_SCHEMES;
  return ALL_SCHEMES.filter((s) => {
    const entry = INDEX.get(s.id);
    return qs.some((w) => entry.name.includes(w) || entry.text.includes(w));
  });
}

export function schemesForQuestion(question, limit = 6) {
  const qs = words(question);
  if (!qs.length) return [];
  const scored = ALL_SCHEMES.map((s) => {
    const entry = INDEX.get(s.id);
    let score = 0;
    qs.forEach((w) => {
      if (entry.name.includes(w)) score += 3;
      else if (entry.text.includes(w)) score += 1;
    });
    return { id: s.id, score };
  }).filter((x) => x.score > 0);
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.id);
}