import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const browserReportFile =
  "reports/browser/2026-06-13-perspective-memory-items-review-workspace.md";
const routePath = "/cockpit/perspective/memory-items/review";

assert.equal(existsSync(browserReportFile), true, `${browserReportFile} must exist`);

const report = readFileSync(browserReportFile, "utf8");
const normalizedReport = report.replace(/\s+/g, " ").trim();

for (const phrase of [
  "Perspective Memory Items Review Workspace Browser Validation",
  routePath,
  "route loads successfully",
  "No console warnings/errors",
  "No unexpected external traffic beyond same-origin app/API routes",
  "read-only boundary visible",
  "item list visible",
  "select item works",
  "selected count updates",
  "review packet panel visible",
  "status_counts visible",
  "validation_result_counts visible",
  "content summary visible",
  "source/evidence refs visible",
  "risk notes visible",
  "unresolved tensions visible",
  "carry-forward questions visible",
  "relationship summary visible",
  "review guidance visible",
  "selected item detail visible",
  "clear selection works",
  "select all visible works",
  "filters work",
  "refresh preserves persisted items through API/SQLite",
  "no status mutation controls",
  "no create memory item controls",
  "no boundary creation controls",
  "no enabled Core/runtime/provider/GitHub controls",
  "core_decision_created false visible",
  "automatic_runtime_injection_created false visible",
  "provider_model_call_created false visible",
  "github_mutation_created false visible",
  "390px viewport had no horizontal overflow",
  "768px viewport had no horizontal overflow",
  "desktop viewport had no horizontal overflow",
  "no clipboard automation",
  "no raw returned envelope/private/provider/token/browser/source/candidate material visible outside returned envelope textarea",
]) {
  assert(
    normalizedReport.includes(phrase),
    `browser report must include: ${phrase}`,
  );
}

console.log("PASS browser:perspective-memory-items-review-workspace");
