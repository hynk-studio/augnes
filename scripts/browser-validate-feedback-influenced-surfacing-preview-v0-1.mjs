#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const panelPath = "components/feedback-influenced-surfacing-preview-panel.tsx";
const fixturePath = "fixtures/feedback-influenced-surfacing-preview.sample.v0.1.json";
const docsPath = "docs/FEEDBACK_INFLUENCED_SURFACING_PREVIEW_V0_1.md";

const panel = readFileSync(panelPath, "utf8");
const fixtureText = readFileSync(fixturePath, "utf8");
const fixture = JSON.parse(fixtureText);
const docs = readFileSync(docsPath, "utf8");

const requiredLabels = [
  "Feedback influenced surfacing is preview-only",
  "Advisory display hints only",
  "No candidate is deleted",
  "No candidate is promoted",
  "No durable state mutation",
  "Product-write remains parked",
];

for (const label of requiredLabels) {
  assert.ok(panel.includes(label), `${panelPath} missing required label: ${label}`);
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
  "Apply",
  "Product write executed",
  "product_write_executed: true",
]) {
  assert.ok(!panel.includes(forbidden), `${panelPath} includes forbidden marker ${forbidden}`);
}

assert.ok(
  docs.includes("390px viewport") || fixtureText.includes("390px viewport"),
  "docs or fixture must include 390px viewport readiness wording",
);

for (const item of fixture.expected_result.items) {
  assert.equal(item.advisory_only, true, `${item.candidate_ref}.advisory_only`);
  assert.equal(item.deletes_candidate, false, `${item.candidate_ref}.deletes_candidate`);
  assert.equal(
    item.hides_candidate_silently,
    false,
    `${item.candidate_ref}.hides_candidate_silently`,
  );
  assert.equal(item.promotes_candidate, false, `${item.candidate_ref}.promotes_candidate`);
  assert.equal(item.mutates_rules, false, `${item.candidate_ref}.mutates_rules`);
  assert.equal(item.mutates_parser, false, `${item.candidate_ref}.mutates_parser`);
  assert.equal(
    item.mutates_durable_state,
    false,
    `${item.candidate_ref}.mutates_durable_state`,
  );
  assert.equal(
    item.product_write_executed,
    false,
    `${item.candidate_ref}.product_write_executed`,
  );
}

console.log(
  JSON.stringify(
    {
      ok: true,
      validation: "browser:feedback-influenced-surfacing-preview-v0-1",
      browser_automation: "skipped",
      reason:
        "browser automation was skipped because no mounted page/browser harness exists for this preview-only UI slice",
      static_checks: [
        "required labels",
        "no false affordance controls",
        "no network markers",
        "no persistence markers",
        "390px viewport readiness wording",
        "fixture no-mutation boundaries",
      ],
    },
    null,
    2,
  ),
);
