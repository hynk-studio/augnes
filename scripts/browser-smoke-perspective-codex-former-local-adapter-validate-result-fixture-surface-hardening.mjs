import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const browserReportFile =
  "reports/browser/2026-06-12-perspective-codex-former-local-adapter-validate-result-fixture-surface-hardening.md";
const routePath =
  "/cockpit/perspective/codex-former/local-adapter-validate-result-fixture";

assert.equal(existsSync(browserReportFile), true, `${browserReportFile} must exist`);

const report = readFileSync(browserReportFile, "utf8");
const normalizedReport = report.replace(/\s+/g, " ").trim();

for (const phrase of [
  "Perspective Codex Former Local Adapter Validate Result Fixture Surface Hardening Browser Validation",
  routePath,
  "npm run dev -- -H 127.0.0.1 -p 3000",
  "route loads successfully",
  "No console warnings/errors",
  "No unexpected external traffic",
  "PASS scenario visible",
  "PASS with follow-up scenario visible",
  "BLOCKED scenario visible",
  "scenario switching works",
  "default scenario is PASS with follow-up",
  "inbox filter all works",
  "inbox filter reviewable works",
  "inbox filter reviewable_with_follow_up works",
  "inbox filter blocked works",
  "item selection works",
  "default selected item is PASS with follow-up",
  "validation_summary_path",
  "validation_summary_hash",
  "source_input_hash",
  "prepare_execution_summary_hash",
  "returned_envelope_hash",
  "false/non-authorizing",
  "safe links are availability text only",
  "no anchor links are present",
  "no forbidden executable controls",
  "PASS does not imply accepted/approved/product-ready/mergeable/Core decision",
  "PASS with follow-up remains review-only",
  "BLOCKED is not automated rejection",
  "keyboard/focus evidence",
  "synthetic Tab limitation",
  "native focusable-order evidence",
  "390px viewport has no horizontal overflow",
  "768px viewport has no horizontal overflow",
  "1280px desktop viewport has no horizontal overflow",
  "route uses local fixture state only",
  "no URL mutation",
  "no clipboard automation",
  "no provider/model/Codex/GitHub/network/DB behavior",
  "no localStorage/sessionStorage/indexedDB/cookie behavior",
  "forbidden-controls check",
  "safe-link non-navigation check",
  "authority boundary observations",
  "privacy/raw-material visibility check",
  "Skipped Checks",
  "PASS",
]) {
  assert(
    normalizedReport.includes(phrase),
    `browser report must include: ${phrase}`,
  );
}

console.log(
  "PASS browser:perspective-codex-former-local-adapter-validate-result-fixture-surface-hardening",
);
