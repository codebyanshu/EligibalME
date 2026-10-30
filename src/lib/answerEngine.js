import { getScheme, schemesForQuestion } from "@/data/schemes";
import { DOCUMENTS } from "@/data/taxonomy";
import { criteriaSummary, money } from "@/lib/eligibility";

const INTENTS = {
  docs: ["document", "documents", "paper", "papers", "proof", "certificate", "ਦਸਤਾਵੇਜ", "ਕਾਗਜ਼", "ਦਸਤਖਤ", "दस्तावेज", "कागज", "प्रमाण"],
  benefit: ["how much", "amount", "benefit", "benefits", "money", "paid", " rupees", "ਲਾਭ", "ਕਿੰਨ", "ਰਕਮ", "पैसा", "लाभ", "राशि", "कितन"],
  apply: ["apply", "application", "how do i", "how to", "where do i", "form", "ਅਰਜ਼ੀ", "ਕਿਵੇਂ", "ਕਿੱਥੇ", "आवेदन", "कैसे", "कहाँ"],
  eligibility: ["eligible", "eligibility", "qualify", "who can", "criteria", "ਯੋਗ", "ਕੌਣ", "पात्र", "कौन", "शर्त"],
};

const LABELS = {
  en: { docs: "Documents needed", benefit: "What you get", apply: "Apply here", eligibility: "Who qualifies", source: "Source" },
  hi: { docs: "ज़रूरी दस्तावेज़", benefit: "आपको क्या मिलेगा", apply: "यहाँ आवेदन करें", eligibility: "कौन पात्र है", source: "स्रोत" },
  pa: { docs: "ਲੋੜੀਂਦੇ ਦਸਤਾਵੇਜ਼", benefit: "ਤੁਹਾਨੂੰ ਕੀ ਮਿਲੇਗਾ", apply: "ਇੱਥੇ ਅਰਜ਼ੀ ਦਿਓ", eligibility: "ਕੌਣ ਯੋਗ ਹੈ", source: "ਸਰੋਤ" },
};

function detectIntent(text) {
  const q = text.toLowerCase();
  for (const [intent, words] of Object.entries(INTENTS)) {
    if (words.some((w) => q.includes(w))) return intent;
  }
  return "general";
}

/**
 * Answers strictly from the scheme record itself — no model involved, so it can
 * never drift from the published document. Returns null when no scheme matches.
 */
export function answerLocally(question, lang) {
  const ids = schemesForQuestion(question, 2);
  if (!ids.length) return null;

  const scheme = getScheme(ids[0]);
  if (!scheme) return null;

  const L = LABELS[lang] || LABELS.en;
  const intent = detectIntent(question);
  const lines = [scheme.name[lang]];

  if (intent === "docs") {
    lines.push(`${L.docs}: ${scheme.docs.map((d) => DOCUMENTS[d]?.[lang] || d).join(", ")}`);
    lines.push(`${L.apply}: ${scheme.link}`);
  } else if (intent === "benefit") {
    lines.push(`${L.benefit}: ${scheme.benefit[lang]}`);
    lines.push(scheme.summary[lang]);
  } else if (intent === "apply") {
    lines.push(`${L.apply}: ${scheme.link}`);
    lines.push(`${L.docs}: ${scheme.docs.map((d) => DOCUMENTS[d]?.[lang] || d).join(", ")}`);
  } else if (intent === "eligibility") {
    lines.push(`${L.eligibility}: ${criteriaSummary(scheme, lang).join(" · ")}`);
  } else {
    lines.push(scheme.summary[lang]);
    lines.push(`${L.benefit}: ${scheme.benefit[lang]}`);
  }

  lines.push(`${L.source}: ${scheme.source} — ${scheme.link}`);

  return { text: lines.join("\n"), citations: [scheme] };
}

export { money };