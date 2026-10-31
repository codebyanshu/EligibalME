import { CATEGORIES, GENDERS, INCOME_BANDS, OCCUPATIONS } from "../data/taxonomy.js";

const money = (n) => "₹" + new Intl.NumberFormat("en-IN").format(n);

const labelOf = (list, key, lang) => {
  const found = list.find((x) => x.key === key);
  return found ? found.label[lang] : key;
};

export function bandOf(key) {
  return INCOME_BANDS.find((b) => b.key === key) || null;
}

/**
 * Rule-based eligibility check. Every constraint is evaluated explicitly so the
 * UI can show exactly which conditions pass and which need a closer look.
 */
export function evaluateScheme(scheme, profile) {
  const c = scheme.criteria || {};
  const checks = [];

  if (c.minAge != null) {
    checks.push({ kind: "minAge", ok: profile.age >= c.minAge, value: c.minAge });
  }
  if (c.maxAge != null) {
    checks.push({ kind: "maxAge", ok: profile.age <= c.maxAge, value: c.maxAge });
  }
  if (c.gender && c.gender !== "any") {
    checks.push({ kind: "gender", ok: profile.gender === c.gender, value: c.gender });
  }
  if (c.maxIncome != null) {
    const band = bandOf(profile.incomeBand);
    if (band) {
      checks.push({
        kind: "income",
        ok: band.min < c.maxIncome,
        tight: band.max > c.maxIncome,
        value: c.maxIncome,
      });
    }
  }
  if (Array.isArray(c.occupations)) {
    checks.push({
      kind: "occupation",
      ok: c.occupations.includes(profile.occupation),
      value: c.occupations,
    });
  }
  if (Array.isArray(c.categories)) {
    checks.push({
      kind: "category",
      ok: c.categories.some((k) => (profile.categories || []).includes(k)),
      value: c.categories,
    });
  }

  const failed = checks.filter((x) => !x.ok);
  const tight = checks.some((x) => x.ok && x.tight);
  const passed = checks.length - failed.length;
  const ratio = checks.length ? passed / checks.length : 1;

  let tier = "none";
  if (!failed.length && !tight) tier = "eligible";
  else if (!failed.length || ratio >= 0.75) tier = "check";

  return { tier, checks, failed, reasons: checks.filter((x) => x.ok) };
}

export function describeCheck(check, lang) {
  switch (check.kind) {
    case "minAge":
      return lang === "en" ? `Age ${check.value}+` : lang === "hi" ? `${check.value}+ वर्ष आयु` : `${check.value}+ ਸਾਲ ਉਮਰ`;
    case "maxAge":
      return lang === "en" ? `Up to age ${check.value}` : lang === "hi" ? `${check.value} वर्ष तक` : `${check.value} ਸਾਲ ਤੱਕ`;
    case "gender":
      return lang === "en"
        ? `For ${labelOf(GENDERS, check.value, lang).toLowerCase()} applicants`
        : lang === "hi"
          ? `${labelOf(GENDERS, check.value, lang)} आवेदकों के लिए`
          : `${labelOf(GENDERS, check.value, lang)} ਅਰਜ਼ੀਕਰਤਾਵਾਂ ਲਈ`;
    case "income":
      return lang === "en"
        ? `Family income under ${money(check.value)} / year`
        : lang === "hi"
          ? `पारिवारिक आय ${money(check.value)} / वर्ष से कम`
          : `ਪਰਿਵਾਰਕ ਆਮਦਨ ${money(check.value)} / ਸਾਲ ਤੋਂ ਘੱਟ`;
    case "occupation":
      return check.value.map((k) => labelOf(OCCUPATIONS, k, lang)).join(", ");
    case "category":
      return check.value.map((k) => labelOf(CATEGORIES, k, lang)).join(", ");
    default:
      return "";
  }
}

export function criteriaSummary(scheme, lang) {
  const c = scheme.criteria || {};
  const out = [];
  if (c.minAge != null) out.push(describeCheck({ kind: "minAge", value: c.minAge }, lang));
  if (c.maxAge != null) out.push(describeCheck({ kind: "maxAge", value: c.maxAge }, lang));
  if (c.gender && c.gender !== "any") out.push(describeCheck({ kind: "gender", value: c.gender }, lang));
  if (c.maxIncome != null) out.push(describeCheck({ kind: "income", value: c.maxIncome }, lang));
  if (Array.isArray(c.occupations)) out.push(describeCheck({ kind: "occupation", value: c.occupations }, lang));
  if (Array.isArray(c.categories)) out.push(describeCheck({ kind: "category", value: c.categories }, lang));
  if (c.note && c.note[lang]) out.push(c.note[lang]);
  return out;
}

export function rankSchemes(schemes, profile) {
  return schemes
    .map((scheme) => ({ scheme, ...evaluateScheme(scheme, profile) }))
    .filter((x) => x.tier !== "none")
    .sort((a, b) => {
      if (a.tier !== b.tier) return a.tier === "eligible" ? -1 : 1;
      return b.reasons.length - a.reasons.length;
    });
}

export { money, labelOf };