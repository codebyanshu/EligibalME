import { ALL_SCHEMES } from "../../src/data/schemes/index.js";
import { rankSchemes } from "../../src/lib/eligibility.js";

const GENDERS = new Set(["female", "male", "other"]);
const OCCUPATIONS = new Set([
  "farmer", "farm_labour", "student", "salaried", "self_employed", "daily_wage",
  "construction", "street_vendor", "artisan", "unemployed", "homemaker",
]);
const CATEGORIES = new Set(["sc", "st", "obc", "bpl", "ews", "minority", "general"]);
const INCOME_BANDS = new Set(["lt50k", "50k_1l", "1l_25l", "25l_5l", "5l_8l", "gt8l"]);

export function validateEligibilityProfile(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const { age, gender, occupation, categories, incomeBand, state } = value;
  if (!Number.isInteger(age) || age < 1 || age > 120) return null;
  if (!GENDERS.has(gender) || !OCCUPATIONS.has(occupation) || !INCOME_BANDS.has(incomeBand)) return null;
  if (!Array.isArray(categories) || categories.length > CATEGORIES.size || categories.some((key) => !CATEGORIES.has(key))) return null;
  if (new Set(categories).size !== categories.length) return null;
  if (typeof state !== "string" || !state.trim() || state.length > 100) return null;
  return {
    age,
    gender,
    occupation,
    categories: [...categories],
    incomeBand,
    state: state.trim(),
  };
}

export function eligibleSchemes(profile) {
  return rankSchemes(ALL_SCHEMES, profile)
    .filter(({ tier }) => tier === "eligible")
    .map(({ scheme }) => ({ id: scheme.id, name: scheme.name.en, url: scheme.link }));
}

export { ALL_SCHEMES };
