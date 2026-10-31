import test from "node:test";
import assert from "node:assert/strict";
import { ALL_SCHEMES, eligibleSchemes, validateEligibilityProfile } from "../src/schemeAlerts.js";

const profile = {
  age: 30,
  gender: "female",
  occupation: "farmer",
  categories: ["sc"],
  incomeBand: "lt50k",
  state: "Maharashtra",
};

test("validates and normalizes the consented eligibility profile", () => {
  const validated = validateEligibilityProfile({ ...profile, state: " Maharashtra " });
  assert.equal(validated.state, "Maharashtra");
  assert.equal(validateEligibilityProfile({ ...profile, district: "Ludhiana" }).district, undefined);
  assert.equal(validateEligibilityProfile({ ...profile, age: 121 }), null);
  assert.equal(validateEligibilityProfile({ ...profile, categories: ["sc", "sc"] }), null);
  assert.equal(validateEligibilityProfile({ ...profile, occupation: "unknown" }), null);
});

test("national scheme matches do not depend on the selected state", () => {
  const maharashtraMatches = eligibleSchemes(profile);
  const otherStateMatches = eligibleSchemes({ ...profile, state: "Haryana" });
  assert.deepEqual(maharashtraMatches, otherStateMatches);
  assert.ok(ALL_SCHEMES.every((scheme) => scheme.level === "central"));
});

test("returns only catalogue schemes with HTTPS links where available", () => {
  const matches = eligibleSchemes(profile);
  assert.ok(matches.length > 0);
  assert.ok(matches.every(({ id, name, url }) => (
    ALL_SCHEMES.some((scheme) => scheme.id === id) &&
    typeof name === "string" &&
    (!url || url.startsWith("https://"))
  )));
});
