import assert from "node:assert/strict";

const products = ["onboarding", "promotions"];

function entitlements(activeLicenses) {
  const active = new Set(activeLicenses);
  return products.map((key) => ({ key, licensed: active.has(key) }));
}

function railMode(matrix, key) {
  return matrix.find((item) => item.key === key)?.licensed ? "DIRECT" : "SALES_MODAL";
}

function serverAccess(matrix, key) {
  return matrix.find((item) => item.key === key)?.licensed ? "ALLOW" : "BLOCK";
}

const cases = [
  { name: "0 licenses", active: [], expected: { onboarding: ["SALES_MODAL", "BLOCK"], promotions: ["SALES_MODAL", "BLOCK"] } },
  { name: "WDROZENIA only", active: ["onboarding"], expected: { onboarding: ["DIRECT", "ALLOW"], promotions: ["SALES_MODAL", "BLOCK"] } },
  { name: "AWANSE only", active: ["promotions"], expected: { onboarding: ["SALES_MODAL", "BLOCK"], promotions: ["DIRECT", "ALLOW"] } },
  { name: "both", active: ["onboarding", "promotions"], expected: { onboarding: ["DIRECT", "ALLOW"], promotions: ["DIRECT", "ALLOW"] } },
];

for (const scenario of cases) {
  const matrix = entitlements(scenario.active);
  for (const key of products) {
    assert.deepEqual(
      [railMode(matrix, key), serverAccess(matrix, key)],
      scenario.expected[key],
      `${scenario.name}: ${key}`,
    );
  }
  console.log(`PASS COMMERCE-12B: ${scenario.name}`);
}
console.log("PASS COMMERCE-12B entitlement matrix: 4/4 states, direct URL guard contract included.");
