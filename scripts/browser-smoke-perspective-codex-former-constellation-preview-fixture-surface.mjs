import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const browserReportFile =
  "reports/browser/2026-06-11-perspective-codex-former-constellation-preview-fixture-surface.md";
const routePath =
  "/cockpit/perspective/codex-former/constellation-preview-fixture";

assert.equal(existsSync(browserReportFile), true, `${browserReportFile} must exist`);

const report = readFileSync(browserReportFile, "utf8");
const normalizedReport = report.replace(/\s+/g, " ").trim();

for (const phrase of [
  "Perspective Codex Former Constellation Preview Fixture Surface Browser Validation",
  routePath,
  "PASS fixture default view rendered",
  "BLOCKED fixture view rendered",
  "Summary Strip appeared",
  "Graph Canvas appeared",
  "Warning Panel appeared",
  "Authority Lens existed and was collapsed by default",
  "Authority Lens expanded",
  "Node detail selected",
  "Edge detail selected",
  "Legend appeared",
  "No accepted-state implication in PASS view",
  "BLOCKED view did not show review_candidate / worker_guidance / next_action as usable material",
  "At most two badges per node",
  "Blocked and warning indicators were not color-only",
  "No raw unsafe/private markers appeared in page text",
  "No provider/model/GitHub/Codex/OpenAI/external traffic was observed",
  "PASS",
]) {
  assert(
    normalizedReport.includes(phrase),
    `browser report must include: ${phrase}`,
  );
}

console.log(
  "PASS browser:perspective-codex-former-constellation-preview-fixture-surface",
);
