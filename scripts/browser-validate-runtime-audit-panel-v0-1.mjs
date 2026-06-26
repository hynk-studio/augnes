#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const componentPath = "components/runtime-audit-panel.tsx";
const fixturePath = "fixtures/runtime-audit-panel.sample.v0.1.json";
const docsPath = "docs/RUNTIME_AUDIT_PANEL_V0_1.md";

const component = readFileSync(componentPath, "utf8");
const fixtureText = readFileSync(fixturePath, "utf8");
const fixture = JSON.parse(fixtureText);
const docs = readFileSync(docsPath, "utf8");

const requiredLabels = [
  "Runtime Audit Panel is read-only",
  "Audit is a review cue, not truth",
  "Verification is not proof",
  "No state mutation",
  "No product write",
  "Product-write remains parked",
];

for (const label of requiredLabels) {
  assert.ok(component.includes(label), `${componentPath} missing required label: ${label}`);
}

for (const forbidden of [
  "fetch(",
  "/api/",
  "POST",
  "localStorage",
  "sessionStorage",
  "NextResponse",
  "Database",
  "OpenAI",
  "provider",
  "<button",
  "Save",
  "Apply",
  "Promote",
  "Delete",
  "Product write executed",
  "product_write_now: true",
]) {
  assert.ok(!component.includes(forbidden), `${componentPath} includes forbidden marker ${forbidden}`);
}

assert.ok(
  docs.includes("390px viewport") || fixtureText.includes("390px viewport"),
  "docs or fixture must include 390px viewport readiness wording",
);

assert.equal(fixture.expected_model.status, "built");
assert.equal(fixture.expected_empty_model.status, "empty");

for (const item of fixture.expected_model.all_items) {
  assert.equal(item.public_safe, true, `${item.item_id}.public_safe`);
  assert.equal(item.authority_boundary.runtime_audit_persistence_now, false);
  assert.equal(item.authority_boundary.audit_write_route_now, false);
  assert.equal(item.authority_boundary.audit_read_route_now, false);
  assert.equal(item.authority_boundary.db_query_or_write_now, false);
  assert.equal(item.authority_boundary.route_call_now, false);
  assert.equal(item.authority_boundary.fetch_now, false);
  assert.equal(item.authority_boundary.durable_state_write_now, false);
  assert.equal(item.authority_boundary.product_write_now, false);
  assert.equal(item.authority_boundary.proof_or_evidence_record_now, false);
  assert.equal(item.authority_boundary.audit_is_truth, false);
  assert.equal(item.authority_boundary.audit_is_proof, false);
  assert.equal(item.authority_boundary.audit_is_authority, false);
  assert.equal(item.authority_boundary.verification_is_truth, false);
  assert.equal(item.authority_boundary.product_write_authority, false);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      validation: "browser:runtime-audit-panel-v0-1",
      browser_automation: "skipped",
      reason:
        "browser automation was skipped because no mounted page/browser harness exists for this read-only audit panel slice",
      static_checks: [
        "required labels",
        "no false affordance controls",
        "no network markers",
        "no persistence markers",
        "390px viewport readiness wording",
        "fixture no-authority boundaries",
      ],
    },
    null,
    2,
  ),
);
