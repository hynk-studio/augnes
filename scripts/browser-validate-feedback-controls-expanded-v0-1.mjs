#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const controlsPath = "components/feedback-event-expanded-controls.tsx";
const auditPanelPath = "components/agent-perspective-substrate-folded-audit-panel.tsx";
const fixturePath = "fixtures/feedback-controls-expanded.sample.v0.1.json";

const controls = readFileSync(controlsPath, "utf8");
const auditPanel = readFileSync(auditPanelPath, "utf8");
const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));

const requiredLabels = [
  "Feedback controls are local intent only",
  "No feedback is persisted",
  "Feedback is not truth",
  "No candidate mutation",
  "Product-write remains parked",
  "Audit panel is read-only",
  "Aggregation is advisory only",
  "Rule failure candidates are review aids",
  "No durable state mutation",
];

for (const label of requiredLabels) {
  assert.ok(
    controls.includes(label) || auditPanel.includes(label),
    `required UI label missing from static sources: ${label}`,
  );
}

for (const controlKind of ["dismiss_preview", "invalidate_preview", "mark_wrong"]) {
  assert.ok(controls.includes(controlKind), `missing destructive-looking control ${controlKind}`);
}
assert.ok(
  controls.includes("destructiveControlKinds") && controls.includes("pendingConfirmation"),
  "destructive-looking actions must have a local confirmation path",
);
assert.ok(
  controls.includes("Bounded correction note summary") &&
    controls.includes("correctionNoteSummary") &&
    controls.includes("note required"),
  "correction intent must require a bounded operator note summary",
);

for (const forbidden of [
  "fetch(",
  "/api/",
  "POST",
  "localStorage",
  "sessionStorage",
  "NextResponse",
  "Database",
  "OpenAI",
]) {
  assert.ok(!controls.includes(forbidden), `${controlsPath} includes forbidden marker ${forbidden}`);
  assert.ok(!auditPanel.includes(forbidden), `${auditPanelPath} includes forbidden marker ${forbidden}`);
}

for (const payload of fixture.expected_payloads) {
  assert.equal(payload.public_safe, true, `${payload.control_kind}.public_safe`);
  assert.equal(payload.advisory_only, true, `${payload.control_kind}.advisory_only`);
  assert.equal(payload.persists_feedback, false, `${payload.control_kind}.persists_feedback`);
  assert.equal(payload.mutates_candidate, false, `${payload.control_kind}.mutates_candidate`);
  assert.equal(payload.deletes_candidate, false, `${payload.control_kind}.deletes_candidate`);
  assert.equal(payload.promotes_candidate, false, `${payload.control_kind}.promotes_candidate`);
  assert.equal(payload.mutates_rules, false, `${payload.control_kind}.mutates_rules`);
  assert.equal(payload.mutates_parser, false, `${payload.control_kind}.mutates_parser`);
  assert.equal(payload.mutates_durable_state, false, `${payload.control_kind}.mutates_durable_state`);
  assert.equal(payload.product_write_executed, false, `${payload.control_kind}.product_write_executed`);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      validation: "browser:feedback-controls-expanded-v0-1",
      browser_automation: "skipped",
      reason: "no mounted page/browser harness exists for this UI-only slice",
      static_checks: [
        "required labels",
        "destructive confirmation path",
        "correction note path",
        "no network or persistence markers",
        "fixture payload no-mutation boundaries",
      ],
    },
    null,
    2,
  ),
);
