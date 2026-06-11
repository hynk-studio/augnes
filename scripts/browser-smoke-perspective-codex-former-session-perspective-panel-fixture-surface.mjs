import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const browserReportFile =
  "reports/browser/2026-06-11-perspective-codex-former-session-perspective-panel-fixture-surface.md";
const routePath =
  "/cockpit/perspective/codex-former/session-perspective-panel-fixture";

assert.equal(existsSync(browserReportFile), true, `${browserReportFile} must exist`);

const report = readFileSync(browserReportFile, "utf8");
const normalizedReport = report.replace(/\s+/g, " ").trim();

for (const phrase of [
  "Perspective Codex Former Session Perspective Panel Fixture Surface Browser Validation",
  routePath,
  "Not prepared scenario rendered",
  "Waiting for candidate scenario rendered",
  "PASS with follow-up scenario rendered",
  "BLOCKED scenario rendered",
  "Switching between all four scenarios worked",
  "Session Header appeared",
  "Formation Timeline appeared",
  "Status Card appeared",
  "Evidence / Provenance Strip appeared",
  "Warning / Blocking Summary appeared",
  "Authority Boundary Box appeared",
  "Action Guidance appeared",
  "Constellation Handoff Preview appeared",
  "PASS scenario had read-only Constellation handoff available",
  "BLOCKED scenario had no usable handoff",
  "Not prepared and Waiting scenarios showed Not ready handoff",
  "No accepted-state implication in any scenario",
  "No executable prepare/validate/Codex/GitHub/DB controls",
  "Warning and blocked indicators were not color-only",
  "Keyboard traversal and focus basics worked",
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
  "PASS browser:perspective-codex-former-session-perspective-panel-fixture-surface",
);
