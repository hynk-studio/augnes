import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const browserReportFile =
  "reports/browser/2026-06-11-perspective-codex-former-local-adapter-snapshot-fixture-surface.md";
const routePath =
  "/cockpit/perspective/codex-former/local-adapter-snapshot-fixture";

assert.equal(existsSync(browserReportFile), true, `${browserReportFile} must exist`);

const report = readFileSync(browserReportFile, "utf8");
const normalizedReport = report.replace(/\s+/g, " ").trim();

for (const phrase of [
  "Perspective Codex Former Local Adapter Snapshot Fixture Surface Browser Validation",
  routePath,
  "Session Panel Preview visible",
  "Capture Review Inbox Preview visible",
  "Integration Readiness visible",
  "Default Session Panel scenario was prepared",
  "Switched Session Panel scenario to not_ready",
  "Switched Session Panel scenario to waiting",
  "Switched Session Panel scenario to prepared",
  "Prepared status says Prepared, waiting for Codex return",
  "Manual Codex return has not been captured",
  "separate user-started Codex session",
  "exactly one candidate envelope",
  "Constellation available false",
  "validation available false",
  "returned candidate available false",
  "accepted state false",
  "review-only visible",
  "prepare_helper_executed shown as operational provenance only",
  "Inbox all filter showed 3 items",
  "not_ready filter showed the not_ready item",
  "waiting filter showed waiting and prepared items",
  "prepared filter showed the prepared item",
  "Selecting prepared item worked",
  "prepared item reviewability is waiting",
  "prepared candidate_count 0",
  "prepared blocked_reason_count 0",
  "reviewable count 0",
  "No actual Accept/Approve/Promote/Reject/Merge/Deploy/Validate/Run Codex button/control",
  "Denylist terms appeared only in the policy section",
  "No PASS/BLOCKED status implication",
  "No Constellation link/action for prepared",
  "No raw prompt/source/packet/private marker text",
  "Keyboard traversal basics",
  "390px viewport had no horizontal overflow",
  "No console errors/warnings",
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
  "PASS browser:perspective-codex-former-local-adapter-snapshot-fixture-surface",
);
