import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const browserReportFile =
  "reports/browser/2026-06-11-perspective-codex-former-capture-review-inbox-fixture-surface.md";
const routePath =
  "/cockpit/perspective/codex-former/capture-review-inbox-fixture";

assert.equal(existsSync(browserReportFile), true, `${browserReportFile} must exist`);

const report = readFileSync(browserReportFile, "utf8");
const normalizedReport = report.replace(/\s+/g, " ").trim();

for (const phrase of [
  "Perspective Codex Former Capture Review Inbox Fixture Surface Browser Validation",
  routePath,
  "Empty inbox mode rendered",
  "Pending preparation item rendered",
  "Waiting for candidate item rendered",
  "PASS with follow-up item rendered",
  "BLOCKED item rendered",
  "Filter/group switching worked",
  "Selected PASS item",
  "Selected BLOCKED item",
  "Selected Pending item",
  "Selected Waiting item",
  "Inbox Header appeared",
  "Filter / Group Bar appeared",
  "Review Item List appeared",
  "Selected Item Summary appeared",
  "Warning / Blocking Triage appeared",
  "Authority Boundary Box appeared",
  "Safe Next Actions appeared",
  "Empty / Invalid State appeared in empty mode",
  "Session Panel link affordance appeared",
  "PASS item had read-only Constellation Preview handoff",
  "BLOCKED/Pending/Waiting had no usable Constellation handoff",
  "No accepted-state implication",
  "No approve/promote/reject controls",
  "No executable prepare/validate/Codex/GitHub/DB controls",
  "At most two badges per item",
  "Warning and blocked indicators were not color-only",
  "Keyboard traversal and focus basics",
  "390px viewport had no horizontal overflow",
  "No raw unsafe/private markers appeared in page text",
  "No console warnings/errors",
  "No provider/model/GitHub/Codex/OpenAI/external traffic was observed",
  "No localStorage/sessionStorage/clipboard path was exercised",
  "PASS",
]) {
  assert(
    normalizedReport.includes(phrase),
    `browser report must include: ${phrase}`,
  );
}

console.log(
  "PASS browser:perspective-codex-former-capture-review-inbox-fixture-surface",
);
