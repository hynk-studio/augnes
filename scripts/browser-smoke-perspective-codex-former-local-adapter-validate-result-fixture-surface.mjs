import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const browserReportFile =
  "reports/browser/2026-06-12-perspective-codex-former-local-adapter-validate-result-fixture-surface.md";
const routePath =
  "/cockpit/perspective/codex-former/local-adapter-validate-result-fixture";

assert.equal(existsSync(browserReportFile), true, `${browserReportFile} must exist`);

const report = readFileSync(browserReportFile, "utf8");
const normalizedReport = report.replace(/\s+/g, " ").trim();

for (const phrase of [
  "Perspective Codex Former Local Adapter Validate Result Fixture Surface Browser Validation",
  routePath,
  "route loads successfully",
  "No console warnings/errors",
  "No unexpected external traffic",
  "PASS scenario visible",
  "PASS with follow-up scenario visible",
  "BLOCKED scenario visible",
  "scenario switching works",
  "inbox filter all works",
  "inbox filter reviewable works",
  "inbox filter reviewable_with_follow_up works",
  "inbox filter blocked works",
  "item selection works",
  "expanded details render path/hash/authority fields",
  "safe links are availability text only",
  "PASS does not imply accepted/approved/product-ready/mergeable/Core decision",
  "PASS with follow-up remains review-only",
  "BLOCKED is not automated rejection",
  "No Accept/Approve/Promote/Reject/Merge/Deploy/Persist/Export/Run Codex/Call Provider controls",
  "Keyboard traversal covered scenario buttons, filter buttons, item selection, and details",
  "390px viewport had no horizontal overflow",
  "768px viewport had no horizontal overflow",
  "desktop viewport had no horizontal overflow",
  "route uses local fixture state only",
  "no clipboard automation",
  "PASS",
]) {
  assert(
    normalizedReport.includes(phrase),
    `browser report must include: ${phrase}`,
  );
}

console.log(
  "PASS browser:perspective-codex-former-local-adapter-validate-result-fixture-surface",
);
