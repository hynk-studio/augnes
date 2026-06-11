import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const browserReportFile =
  "reports/browser/2026-06-11-perspective-codex-former-local-adapter-snapshot-fixture-surface-hardening.md";
const routePath =
  "/cockpit/perspective/codex-former/local-adapter-snapshot-fixture";

assert.equal(existsSync(browserReportFile), true, `${browserReportFile} must exist`);

const report = readFileSync(browserReportFile, "utf8");
const normalizedReport = report.replace(/\s+/g, " ").trim();

for (const phrase of [
  "Perspective Codex Former Local Adapter Snapshot Fixture Surface Hardening Browser Validation",
  "Browser / tool used",
  routePath,
  "Route load observations",
  "Session Panel scenario observations",
  "Default scenario selector was prepared",
  "Switched to not_ready",
  "Switched to waiting",
  "Switched to prepared",
  "Prepared status/caveat/next action visible",
  "accepted state false visible",
  "review-only visible",
  "prepare_helper_executed operational provenance only visible",
  "Constellation unavailable visible",
  "validation unavailable visible",
  "returned candidate unavailable visible",
  "Inbox filter and selection observations",
  "all filter showed 3 items",
  "not_ready filter showed the not_ready item",
  "waiting filter included the waiting and prepared items",
  "prepared filter showed only the prepared item",
  "selected prepared item shows reviewability waiting",
  "selected prepared item shows not reviewable",
  "selected prepared item shows candidate count 0",
  "selected prepared item shows blocked count 0",
  "reviewable count 0 visible",
  "no anchors or controls for unavailable safe links",
  "Integration Readiness observations",
  "ready_for_ui_implementation was framed as implementation readiness only",
  "Denylist/action-control observations",
  "denylist terms only in policy section",
  "0 forbidden action buttons/links/aria-labels",
  "Keyboard traversal observations",
  "Tab traversal reached scenario selector",
  "Tab traversal reached inbox filters",
  "Tab traversal reached item selection",
  "Tab traversal reached details/summary controls",
  "390px viewport had no horizontal overflow",
  "768px viewport had no horizontal overflow",
  "desktop width had no horizontal overflow",
  "No console warnings/errors",
  "No provider/model/GitHub/Codex/OpenAI/external traffic was observed",
  "No fetch/XMLHttpRequest route behavior observed",
  "No localStorage/sessionStorage/clipboard path was exercised",
  "No raw prompt/source/packet/private marker text",
  "PASS",
]) {
  assert(
    normalizedReport.includes(phrase),
    `browser report must include: ${phrase}`,
  );
}

console.log(
  "PASS browser:perspective-codex-former-local-adapter-snapshot-fixture-surface-hardening",
);
