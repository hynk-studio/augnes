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
  "Load PASS envelope fixture works",
  "Run local validation returns PASS",
  "Load PASS with follow-up envelope fixture works",
  "Run local validation returns PASS with follow-up",
  "Load BLOCKED envelope fixture works",
  "Run local validation returns BLOCKED",
  "malformed pasted envelope returns visible blocked reasons",
  "validation source says real_local_validate_execution",
  "Preview fixture result remains secondary",
  "candidate actions can be selected",
  "localStorage draft updates validation_result_state",
  "localStorage draft survives refresh for bounded metadata",
  "Clear local draft removes saved state",
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
