#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const aggregationDocsPath = "docs/FEEDBACK_EVENT_AGGREGATION_RUNTIME_V0_1.md";
const docsPath = "docs/FEEDBACK_CONTROLS_EXPANSION_V0_1.md";
const controlsPath = "components/feedback-event-expanded-controls.tsx";
const auditPanelPath = "components/agent-perspective-substrate-folded-audit-panel.tsx";
const expandedAuditPanelPath = "components/feedback-controls-expanded-audit-panel.tsx";
const fixturePath = "fixtures/feedback-controls-expanded.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const controlKinds = [
  "dismiss_preview",
  "pin_preview",
  "correct_preview",
  "invalidate_preview",
  "needs_more_evidence",
  "scope_overreach",
  "not_relevant_now",
  "mark_useful",
  "mark_wrong",
];

const forbiddenFixtureMarkers = [
  "/Users/",
  "/home/",
  "file://",
  "sk-",
  "ghp_",
  "OPENAI_API_KEY",
  "GITHUB_TOKEN",
  "password:",
  "secret:",
  "private key",
  "raw provider output",
  "raw retrieval output",
  "raw feedback payload",
  "raw control payload",
  "raw conversation",
  "hidden reasoning",
  "raw DB row",
  "raw_db_row",
  "browser dump",
  "raw browser dump",
  "raw source body",
  "actual prompt:",
  "provider response:",
  "actual query:",
  "embedding vector:",
  "vector index dump:",
];

const allowedFixturePlaceholders = new Set([
  "raw feedback control payload blocked by fixture",
  "secret-like feedback control input blocked by fixture",
]);

const docsExactPhrases = [
  "Product-write remains parked by #686.",
  "Feedback Controls Expansion is local UI intent only.",
  "Feedback controls do not persist feedback.",
  "Feedback controls do not write DB.",
  "Feedback controls do not call routes.",
  "Feedback controls do not mutate candidates.",
  "Feedback controls do not delete candidates.",
  "Feedback controls do not promote candidates.",
  "Feedback controls do not mutate rules.",
  "Feedback controls do not mutate parser behavior.",
  "Feedback controls do not mutate durable Perspective state.",
  "Feedback controls do not product-write.",
  "Feedback is not truth.",
  "Feedback is not proof.",
  "Feedback is not evidence.",
  "Feedback is not promotion readiness.",
  "Destructive-looking actions require local confirmation.",
  "Correction requires bounded operator note summary.",
  "Needs-more-evidence creates review cue intent only.",
  "Scope-overreach creates rule failure candidate intent only.",
  "Audit panel is read-only.",
  "Aggregation is advisory only.",
  "Rule failure candidates are review aids.",
  "Feedback Controls Expansion adds local UI intent controls and optional audit summaries.",
  "It preserves the existing Agent Perspective Substrate folded audit panel contract.",
  "It does not replace existing folded preview fixture behavior.",
  "Existing Cockpit default panel remains fixture-backed.",
  "roadmap guide is not SSOT",
];

const forbiddenPositiveAuthorityGrants = [
  "feedback_write_now: true",
  "candidate_mutation_now: true",
  "rule_mutation_now: true",
  "parser_mutation_now: true",
  "promotion_execution_now: true",
  "durable_state_write_now: true",
  "durable_state_apply_now: true",
  "formation_receipt_write_now: true",
  "promotion_decision_record_write_now: true",
  "proof_or_evidence_record_now: true",
  "claim_or_evidence_write_now: true",
  "product_write_now: true",
  "product_id_allocation_now: true",
  "db_query_or_write_now: true",
  "provider_openai_call_now: true",
  "prompt_sent_now: true",
  "retrieval_execution_now: true",
  "rag_answer_generation_now: true",
  "git_ledger_export_now: true",
  "github_automation_authority: true",
  "feedback_is_truth: true",
  "feedback_is_proof: true",
  "feedback_is_evidence: true",
  "feedback_is_promotion_readiness: true",
];

const componentForbiddenPatterns = [
  /fetch\s*\(/,
  /\bPOST\b/,
  /\/api\//,
  /\blocalStorage\b/,
  /\bsessionStorage\b/,
  /\bNextResponse\b/,
  /\bDatabase\b/,
  /\bOpenAI\b/,
];

function readText(path) {
  return readFileSync(path, "utf8");
}

function readJson(path) {
  return JSON.parse(readText(path));
}

function assertIncludes(haystack, needle, label) {
  assert.ok(haystack.includes(needle), `${label} missing required text: ${needle}`);
}

function assertNotIncludes(haystack, needle, label) {
  assert.ok(!haystack.includes(needle), `${label} unexpectedly includes: ${needle}`);
}

function assertNoForbiddenFixtureMarkers(serializedFixture) {
  for (const marker of forbiddenFixtureMarkers) {
    if (allowedFixturePlaceholders.has(marker)) continue;
    assertNotIncludes(serializedFixture, marker, "fixture");
  }
}

function assertAuthorityBoundaryFalse(boundary, label) {
  const falseFields = [
    "feedback_write_now",
    "feedback_persistence_now",
    "db_query_or_write_now",
    "candidate_mutation_now",
    "candidate_deletion_now",
    "promotion_execution_now",
    "rule_mutation_now",
    "parser_mutation_now",
    "durable_state_write_now",
    "durable_state_apply_now",
    "formation_receipt_write_now",
    "proof_or_evidence_record_now",
    "claim_or_evidence_write_now",
    "product_write_now",
    "product_id_allocation_now",
    "provider_openai_call_now",
    "prompt_sent_now",
    "retrieval_execution_now",
    "rag_answer_generation_now",
    "source_fetch_now",
    "git_ledger_export_now",
    "codex_execution_authority",
    "github_automation_authority",
    "feedback_is_truth",
    "feedback_is_proof",
    "feedback_is_evidence",
    "feedback_is_promotion_readiness",
    "product_write_authority",
  ];
  for (const field of falseFields) {
    assert.equal(boundary[field], false, `${label}.${field} must be false`);
  }
}

const roadmap = readText(roadmapPath);
const aggregationDocs = readText(aggregationDocsPath);
const docs = readText(docsPath);
const controls = readText(controlsPath);
const auditPanel = readText(auditPanelPath);
const expandedAuditPanel = readText(expandedAuditPanelPath);
const fixture = readJson(fixturePath);
const fixtureText = readText(fixturePath);
const packageJson = readJson(packagePath);
const index = readText(indexPath);

assertIncludes(roadmap, "feedback_controls_expansion_v0_1", roadmapPath);
assertIncludes(
  aggregationDocs,
  "Feedback Event Aggregation Runtime is advisory only.",
  aggregationDocsPath,
);

assert.equal(fixture.fixture_version, "feedback_controls_expanded.sample.v0.1");
assert.equal(fixture.feedback_control_version, "feedback_controls_expansion.v0.1");
assert.equal(fixture.scope, "project:augnes");
assert.equal(fixture.as_of, "2026-06-26T00:00:00.000Z");
assert.deepEqual(fixture.source_fixture_refs, [
  "fixtures/feedback-event-aggregation-runtime.sample.v0.1.json",
  "fixtures/research-candidate-review.feedback-to-rule-candidate.sample.v0.1.json",
]);

assert.equal(
  packageJson.scripts["smoke:feedback-controls-expanded-v0-1"],
  "node scripts/smoke-feedback-controls-expanded-v0-1.mjs",
);

for (const path of [
  docsPath,
  controlsPath,
  auditPanelPath,
  expandedAuditPanelPath,
  fixturePath,
  "scripts/smoke-feedback-controls-expanded-v0-1.mjs",
  "scripts/browser-validate-feedback-controls-expanded-v0-1.mjs",
]) {
  assertIncludes(index, path, indexPath);
}

assertIncludes(index, "local UI intent only", indexPath);
assertIncludes(index, "Feedback is not truth", indexPath);
assertIncludes(index, "Product-write remains parked by #686.", indexPath);
for (const forbidden of [
  "feedback write route was added",
  "feedback persistence was added",
  "DB write was added",
  "candidate mutation was added",
  "rule mutation was added",
  "parser mutation was added",
  "state mutation was added",
  "proof/evidence writes were added",
  "product-write was added",
]) {
  assertNotIncludes(index, forbidden, indexPath);
}

for (const phrase of docsExactPhrases) {
  assertIncludes(docs, phrase, docsPath);
}

for (const [source, label] of [
  [docs, docsPath],
  [index, indexPath],
  [controls, controlsPath],
  [auditPanel, auditPanelPath],
  [expandedAuditPanel, expandedAuditPanelPath],
]) {
  for (const forbidden of forbiddenPositiveAuthorityGrants) {
    assertNotIncludes(source, forbidden, label);
  }
}

for (const phrase of [
  "Feedback controls are local intent only",
  "No feedback is persisted",
  "Feedback is not truth",
  "No candidate mutation",
  "Product-write remains parked",
]) {
  assertIncludes(controls, phrase, controlsPath);
}

for (const phrase of [
  "Audit panel is read-only",
  "Aggregation is advisory only",
  "Rule failure candidates are review aids",
  "No durable state mutation",
  "Product-write remains parked",
]) {
  assertIncludes(expandedAuditPanel, phrase, expandedAuditPanelPath);
}

for (const [source, label] of [
  [controls, controlsPath],
  [expandedAuditPanel, expandedAuditPanelPath],
]) {
  for (const pattern of componentForbiddenPatterns) {
    assert.ok(!pattern.test(source), `${label} matched forbidden pattern ${pattern}`);
  }
}
assert.ok(!/\bfs\b/.test(controls), `${controlsPath} must not reference fs`);
assert.ok(!/\bfs\b/.test(expandedAuditPanel), `${expandedAuditPanelPath} must not reference fs`);

for (const legacyRequired of [
  "agent-perspective-substrate-preview.sample.v0.1.json",
  "FeedbackEventControls",
  "FeedbackEventStoreListPanel",
  "preview?: AgentPerspectiveSubstratePreview",
  "fixturePath?: string",
  "DEFAULT_FIXTURE_PATH",
  "folded_sections",
  "surfacing_cards",
  "rule_groups",
  "source_coverage_preview",
  "FeedbackEventStoreListPanel",
  "folded-by-default",
  "useState<Set<string>>",
  "Inspect preview",
]) {
  assertIncludes(auditPanel, legacyRequired, auditPanelPath);
}
for (const expandedRequired of [
  "FeedbackControlsExpandedAuditPanel",
  "feedbackIntents?: FeedbackControlsExpandedIntentSummary[]",
  "feedbackAggregates?: FeedbackControlsExpandedAggregateSummary[]",
  "ruleFailureCandidates?: FeedbackControlsExpandedRuleFailureCandidateSummary[]",
]) {
  assertIncludes(auditPanel, expandedRequired, auditPanelPath);
}

for (const controlKind of controlKinds) {
  assertIncludes(controls, controlKind, controlsPath);
  assert.ok(
    fixture.expected_controls.some((control) => control.control_kind === controlKind),
    `fixture expected_controls missing ${controlKind}`,
  );
  assert.ok(
    fixture.expected_payloads.some((payload) => payload.control_kind === controlKind),
    `fixture expected_payloads missing ${controlKind}`,
  );
}

for (const controlKind of [
  "dismiss_preview",
  "invalidate_preview",
  "mark_wrong",
]) {
  assertIncludes(controls, controlKind, controlsPath);
  assert.ok(
    /destructiveControlKinds/.test(controls) && /pendingConfirmation/.test(controls),
    `${controlsPath} must have destructive confirmation state/path`,
  );
  const fixtureControl = fixture.expected_controls.find(
    (control) => control.control_kind === controlKind,
  );
  assert.equal(
    fixtureControl.destructive_confirmation_required,
    true,
    `${controlKind} must require confirmation in fixture`,
  );
}

assertIncludes(controls, "correctionNoteSummary", controlsPath);
assertIncludes(controls, "Bounded correction note summary", controlsPath);
assertIncludes(controls, "note required", controlsPath);
assert.equal(
  fixture.expected_controls.find((control) => control.control_kind === "correct_preview")
    .bounded_operator_note_summary_required,
  true,
);
assert.equal(
  fixture.expected_controls.find((control) => control.control_kind === "needs_more_evidence")
    .review_cue_intent_only,
  true,
);
assert.equal(
  fixture.expected_controls.find((control) => control.control_kind === "scope_overreach")
    .rule_failure_candidate_intent_only,
  true,
);

for (const field of [
  "persists_feedback: false",
  "mutates_candidate: false",
  "deletes_candidate: false",
  "promotes_candidate: false",
  "mutates_rules: false",
  "mutates_parser: false",
  "mutates_durable_state: false",
  "product_write_executed: false",
  "advisory_only: true",
]) {
  assertIncludes(controls, field, controlsPath);
}
assertIncludes(controls, "onFeedbackIntent?.(payload)", controlsPath);

const firstPayloadBoundary = fixture.expected_payloads[0].authority_boundary;
assertAuthorityBoundaryFalse(firstPayloadBoundary, "fixture.expected_payloads[0].authority_boundary");
assertAuthorityBoundaryFalse(
  fixture.expected_panel_props.authorityBoundary,
  "fixture.expected_panel_props.authorityBoundary",
);

for (const payload of fixture.expected_payloads) {
  assert.equal(payload.public_safe, true, `${payload.control_kind}.public_safe`);
  assert.equal(payload.advisory_only, true, `${payload.control_kind}.advisory_only`);
  assert.equal(payload.persists_feedback, false, `${payload.control_kind}.persists_feedback`);
  assert.equal(payload.mutates_candidate, false, `${payload.control_kind}.mutates_candidate`);
  assert.equal(payload.deletes_candidate, false, `${payload.control_kind}.deletes_candidate`);
  assert.equal(payload.promotes_candidate, false, `${payload.control_kind}.promotes_candidate`);
  assert.equal(payload.mutates_rules, false, `${payload.control_kind}.mutates_rules`);
  assert.equal(payload.mutates_parser, false, `${payload.control_kind}.mutates_parser`);
  assert.equal(
    payload.mutates_durable_state,
    false,
    `${payload.control_kind}.mutates_durable_state`,
  );
  assert.equal(
    payload.product_write_executed,
    false,
    `${payload.control_kind}.product_write_executed`,
  );
}

for (const label of fixture.expected_static_labels) {
  const found =
    controls.includes(label) ||
    auditPanel.includes(label) ||
    expandedAuditPanel.includes(label);
  assert.ok(found, `expected static label missing from components: ${label}`);
}

assert.equal(
  fixture.expected_panel_props.feedbackIntents[0].persists_feedback,
  false,
  "panel intent summary remains no persistence",
);
assert.equal(
  fixture.expected_panel_props.feedbackIntents[0].mutates_candidate,
  false,
  "panel intent summary remains no candidate mutation",
);
assert.equal(
  fixture.expected_panel_props.feedbackIntents[0].product_write_executed,
  false,
  "panel intent summary remains no product-write",
);
assert.equal(
  fixture.expected_legacy_folded_audit_panel_compatibility.default_fixture_ref,
  "fixtures/agent-perspective-substrate-preview.sample.v0.1.json",
);
for (const [field, value] of Object.entries(
  fixture.expected_legacy_folded_audit_panel_compatibility,
)) {
  if (typeof value === "boolean") {
    assert.equal(value, true, `fixture compatibility.${field} must be true`);
  }
}

assertNoForbiddenFixtureMarkers(fixtureText);

console.log(
  JSON.stringify(
    {
      ok: true,
      smoke: "feedback-controls-expanded-v0-1",
      controls: controlKinds.length,
      fixture: fixturePath,
    },
    null,
    2,
  ),
);
