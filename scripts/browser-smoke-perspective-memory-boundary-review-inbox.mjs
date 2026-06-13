import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const browserReportFile =
  "reports/browser/2026-06-13-perspective-memory-boundary-review-inbox.md";
const routePath = "/cockpit/perspective/memory-boundary-review-inbox";

assert.equal(existsSync(browserReportFile), true, `${browserReportFile} must exist`);

const report = readFileSync(browserReportFile, "utf8");
const normalizedReport = report.replace(/\s+/g, " ").trim();

for (const phrase of [
  "Perspective Memory Boundary Review Inbox Browser Validation",
  routePath,
  "route loads successfully",
  "No console warnings/errors",
  "No unexpected external traffic beyond same-origin app/API routes",
  "persisted record count visible",
  "record list visible",
  "select record works",
  "record detail visible",
  "proposed_memory_payload visible",
  "proposal_diff_summary visible",
  "checklist_gate_summary visible",
  "user_confirmation visible",
  "authority_boundary visible",
  "can_create_accepted_memory false visible",
  "can_create_core_decision false visible",
  "can_auto_promote false visible",
  "filters work",
  "status update to locally_reviewing_boundary_record works",
  "status update to kept_for_later works",
  "status update to retracted_before_memory_write works",
  "refresh still shows persisted record through API/SQLite",
  "link back to local queue route visible",
  "operator flow route link visible",
  "390px viewport had no horizontal overflow",
  "768px viewport had no horizontal overflow",
  "desktop viewport had no horizontal overflow",
  "no clipboard automation",
  "no provider/model/Codex SDK/GitHub/network behavior except same-origin app/API routes",
  "no accepted memory/review decision/Core decision behavior",
  "no enabled Write to memory / Commit memory / Accept memory / Send to Core controls",
  "no raw returned envelope/private/provider/token/browser/source/candidate material visible outside returned envelope textarea",
]) {
  assert(
    normalizedReport.includes(phrase),
    `browser report must include: ${phrase}`,
  );
}

console.log("PASS browser:perspective-memory-boundary-review-inbox");
