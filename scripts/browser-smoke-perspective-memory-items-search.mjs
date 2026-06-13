import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const browserReportFile =
  "reports/browser/2026-06-13-perspective-memory-items-search.md";
const routePath = "/cockpit/perspective/memory-items/search";

assert.equal(existsSync(browserReportFile), true, `${browserReportFile} must exist`);

const report = readFileSync(browserReportFile, "utf8");
const normalizedReport = report.replace(/\s+/g, " ").trim();

for (const phrase of [
  "Perspective Memory Items Search Browser Validation",
  routePath,
  "route loads successfully",
  "No console warnings/errors",
  "No unexpected external traffic beyond same-origin app/API routes",
  "search input visible",
  "filters visible",
  "read-only boundary visible",
  "search by title term returns item",
  "search by summary term returns item",
  "search by source boundary id returns item",
  "search by returned envelope hash returns item",
  "search by risk/carry-forward term returns item",
  "multi-token search works",
  "no-result query shows empty state",
  "clear search resets result list",
  "select result works",
  "selected item detail visible",
  "matched fields/snippets visible",
  "content title/summary visible",
  "source boundary trace visible",
  "availability visible",
  "authority boundary visible",
  "core_decision_created false visible",
  "automatic_runtime_injection_created false visible",
  "provider_model_call_created false visible",
  "github_mutation_created false visible",
  "search route has no enabled status mutation controls",
  "search route has no create memory item controls",
  "search route has no enabled Core/runtime/provider/GitHub controls",
  "refresh preserves persisted item results through API/SQLite",
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

console.log("PASS browser:perspective-memory-items-search");
