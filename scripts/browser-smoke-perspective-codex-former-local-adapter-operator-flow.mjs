import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const browserReportFile =
  "reports/browser/2026-06-12-perspective-codex-former-local-adapter-operator-flow.md";
const routePath =
  "/cockpit/perspective/codex-former/local-adapter-operator-flow";

assert.equal(existsSync(browserReportFile), true, `${browserReportFile} must exist`);

const report = readFileSync(browserReportFile, "utf8");
const normalizedReport = report.replace(/\s+/g, " ").trim();

for (const phrase of [
  "Perspective Codex Former Local Adapter Operator Flow Browser Validation",
  routePath,
  "route loads successfully",
  "No console warnings/errors",
  "No unexpected external traffic",
  "source/prepare panel visible",
  "copy-for-Codex panel visible",
  "copy-for-Codex panel includes bounded Codex-ready task/context/contract packet",
  "returned envelope textarea visible",
  "Codex Returned Envelope Intake panel visible",
  "Refresh intake list visible",
  "latest available returned envelope ref visible",
  "returned envelope hash, size, and modified timestamp visible",
  "Load latest Codex return + validate works",
  "intake validation returns PASS with follow-up",
  "intake validation source says real_local_validate_execution",
  "candidate draft creation remains explicit after intake validation",
  "returned envelope intake path safety boundary visible",
  "intake automation only loads and validates returned envelope",
  "Load PASS envelope fixture works",
  "Run local validation returns PASS",
  "Select Mark as perspective candidate",
  "Create local perspective candidate draft",
  "draft appears in local candidate draft list",
  "Queue selected candidate draft for perspective-memory review",
  "queue item id visible",
  "local-only queue boundary visible",
  "Open local memory review queue route reference visible",
  "Draft id visible in list",
  "local_status visible in list",
  "authority boundary visible in list",
  "refresh restores local candidate draft list",
  "Load PASS with follow-up envelope fixture works",
  "Run local validation returns PASS with follow-up",
  "create second draft from PASS with follow-up",
  "queue PASS with follow-up draft with warning caveat visible",
  "list shows two drafts",
  "warning counts visible for PASS with follow-up draft",
  "Load BLOCKED envelope fixture works",
  "Run local validation returns BLOCKED",
  "Mark as perspective candidate unavailable",
  "Reject as memory candidate can create local rejection draft",
  "list shows rejection draft",
  "rejected_memory_candidate is not queue-eligible for memory write review",
  "Supersede previous candidate requires previous draft ref",
  "supersede draft appears with supersedes_draft_id",
  "select draft from list works",
  "clear selected draft removes only that draft",
  "clear all drafts removes list",
  "editing returned envelope after draft creation marks drafts stale/current correctly",
  "malformed pasted envelope returns visible blocked reasons",
  "validation source says real_local_validate_execution",
  "Preview fixture result remains secondary",
  "candidate actions can be selected",
  "BLOCKED local validation resets selected local action to keep_review_only",
  "malformed local validation resets selected local action to keep_review_only",
  "refresh after BLOCKED does not restore stale accept_as_perspective_candidate",
  "refresh after malformed does not restore stale accept_as_perspective_candidate",
  "refresh after BLOCKED rejection draft restores rejected_memory_candidate without stale accept action",
  "localStorage draft updates validation_result_state",
  "localStorage candidate draft list restores separately from operator draft metadata",
  "localStorage memory review queue restores separately from operator draft metadata",
  "localStorage draft survives refresh for bounded metadata",
  "Clear local draft does not clear candidate draft list",
  "Clear local candidate draft list does not clear memory review queue",
  "no automatic clipboard behavior",
  "no provider/model/Codex SDK/GitHub/DB/network behavior",
  "no accepted state/review decision/Core decision behavior",
  "390px viewport had no horizontal overflow",
  "768px viewport had no horizontal overflow",
  "desktop viewport had no horizontal overflow",
  "no raw private/provider/token/browser/source/candidate material visible outside the returned envelope textarea",
]) {
  assert(
    normalizedReport.includes(phrase),
    `browser report must include: ${phrase}`,
  );
}

console.log(
  "PASS browser:perspective-codex-former-local-adapter-operator-flow",
);
