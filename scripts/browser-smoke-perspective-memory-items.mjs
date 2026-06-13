import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const browserReportFile =
  "reports/browser/2026-06-13-perspective-memory-items.md";
const routePath = "/cockpit/perspective/memory-items";

assert.equal(existsSync(browserReportFile), true, `${browserReportFile} must exist`);

const report = readFileSync(browserReportFile, "utf8");
const normalizedReport = report.replace(/\s+/g, " ").trim();

for (const phrase of [
  "Perspective Memory Items Browser Validation",
  routePath,
  "route loads successfully",
  "No console warnings/errors",
  "No unexpected external traffic beyond same-origin app/API routes",
  "persisted item count visible",
  "item list visible",
  "select item works",
  "item detail visible",
  "content title/summary visible",
  "source boundary id visible",
  "source refs/hashes visible",
  "risk notes visible",
  "unresolved tensions visible",
  "carry-forward questions visible",
  "acceptance visible",
  "source_boundary_snapshot visible",
  "availability visible",
  "authority boundary visible",
  "core_decision_created false visible",
  "automatic_runtime_injection_created false visible",
  "provider_model_call_created false visible",
  "filters work",
  "status update to reviewing works",
  "status update to retracted works",
  "status update to superseded works",
  "status update to deprecated works",
  "status update back to accepted works",
  "refresh still shows persisted item through API/SQLite",
  "link back to boundary inbox visible",
  "link back to local queue route visible",
  "link to operator flow visible",
  "link to read-only search route visible",
  "link to review workspace visible",
  "390px viewport had no horizontal overflow",
  "768px viewport had no horizontal overflow",
  "desktop viewport had no horizontal overflow",
  "no clipboard automation",
  "no provider/model/Codex SDK/GitHub/network behavior except same-origin app/API routes",
  "no Core decision behavior",
  "no automatic runtime injection behavior",
  "no raw returned envelope/private/provider/token/browser/source/candidate material visible outside returned envelope textarea",
]) {
  assert(
    normalizedReport.includes(phrase),
    `browser report must include: ${phrase}`,
  );
}

console.log("PASS browser:perspective-memory-items");
