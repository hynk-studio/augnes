import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { runPerspectiveIaSmoke } from "./smoke-cockpit-perspective-ia-core.mjs";

const oldSpecPath = "docs/COCKPIT_SIX_TAB_MVP_FUNCTIONAL_MAP.md";
const newSpecPath = "docs/COCKPIT_PERSPECTIVE_IA_V0_1.md";

assert.equal(existsSync(oldSpecPath), true, "old six-tab functional map doc should exist");
assert.equal(existsSync(newSpecPath), true, "Perspective IA successor doc should exist");

const oldSpec = readFileSync(oldSpecPath, "utf8");
const newSpec = readFileSync(newSpecPath, "utf8");

assert.equal(
  oldSpec.includes("Superseded by `COCKPIT_PERSPECTIVE_IA_V0_1.md`"),
  true,
  "old six-tab functional map should be explicitly marked as superseded",
);
assert.equal(
  newSpec.includes("Overview / Work / Perspective / Bridge / Operator"),
  true,
  "Perspective IA doc should define the current five-tab order",
);
assert.equal(
  newSpec.includes("Ledger and Proof become Perspective basis/evidence sections"),
  true,
  "Perspective IA doc should explain Ledger/Proof migration",
);

runPerspectiveIaSmoke("cockpit-six-tab-functional-map-compat-perspective-ia");
