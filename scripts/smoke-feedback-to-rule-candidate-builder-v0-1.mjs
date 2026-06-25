import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const docPath = "docs/FEEDBACK_TO_RULE_CANDIDATE_BUILDER_V0_1.md";
const fixturePath =
  "fixtures/research-candidate-review.feedback-to-rule-candidate-builder.sample.v0.1.json";
const typePath = "types/feedback-to-rule-candidate.ts";
const helperPath = "lib/research-candidate-review/feedback-to-rule-candidate.ts";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const packageScriptName = "smoke:feedback-to-rule-candidate-builder-v0-1";
const packageScriptValue =
  "node scripts/smoke-feedback-to-rule-candidate-builder-v0-1.mjs";
const candidateVersion = "feedback_to_rule_candidate.v0.1";
const bundleVersion = "feedback_to_rule_candidate_bundle.v0.1";
const contractStatus = "candidate_contract_only";

const affectedSurfaces = new Set([
  "manual_note_parser",
  "research_candidate_review",
  "research_candidate_lifecycle_read_model",
  "research_candidate_calibration_diagnostic",
  "logical_claim_shape_preview",
  "perspective_geometry_digest",
  "agent_perspective_substrate",
  "ai_context_packet",
  "codex_handoff_draft",
  "feedback_event_store",
  "foundation_status_review",
  "unknown",
]);

const feedbackPatternKinds = new Set([
  "repeated_dismissal",
  "repeated_pin",
  "repeated_correction",
  "repeated_invalidation",
  "needs_more_evidence_pattern",
  "scope_overreach_pattern",
  "missing_source_pattern",
  "overclaim_risk_pattern",
  "logical_structure_gap_pattern",
  "handoff_not_done_pattern",
  "authority_boundary_confusion",
  "other",
]);

const reviewStatuses = new Set([
  "candidate_only",
  "needs_review",
  "rejected",
  "accepted_for_future_pr",
  "superseded",
]);

const riskLevels = new Set(["low", "medium", "high"]);

const reasonCodes = new Set([
  "feedback_refs_present",
  "feedback_refs_missing",
  "source_refs_present",
  "source_refs_missing",
  "operator_note_redacted",
  "secret_like_pattern_blocked",
  "affected_surface_supported",
  "affected_surface_unknown",
  "pattern_kind_supported",
  "proposed_change_present",
  "proposed_change_missing",
  "authority_boundary_preserved",
  "rule_mutation_not_executed",
  "future_pr_not_created",
  "candidate_only_not_truth",
  "accepted_for_future_pr_not_pr_authority",
]);

const forbiddenAuthorityFields = [
  "rule_mutation_executed_now",
  "future_pr_created_now",
  "source_of_truth",
  "proof_or_evidence_record",
  "perspective_promotion",
  "durable_perspective_state",
  "work_mutation",
  "execution_authority",
  "codex_execution_authority",
  "github_automation_authority",
  "provider_openai_authority",
  "source_fetch_authority",
  "retrieval_rag_authority",
  "git_ledger_export_authority",
  "product_write_authority",
  "product_id_allocation_authority",
];

for (const filePath of [docPath, fixturePath, typePath, helperPath, packagePath, indexPath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const doc = readFile(docPath);
const fixture = readJson(fixturePath);
const typeSource = readFile(typePath);
const helperSource = readFile(helperPath);
const packageJson = readJson(packagePath);
const indexDoc = readFile(indexPath);
const helper = await import(pathToFileURL(helperPath).href);

assert.equal(fixture.fixture_version, "feedback_to_rule_candidate_builder.sample.v0.1");
assert.equal(fixture.bundle_version, bundleVersion);
assert.equal(fixture.candidate_version, candidateVersion);
assert.equal(fixture.scope, "project:augnes");
assert.equal(fixture.status, contractStatus);
assert.equal(fixture.expected_bundle.status, contractStatus);

assertTypeCoverage();
const helperOutput = helper.buildFeedbackToRuleCandidateBundle({
  scope: fixture.scope,
  as_of: fixture.as_of,
  source_fixture_refs: fixture.source_fixture_refs,
  feedback_events: fixture.input_preview.feedback_events,
  candidate_overrides: fixture.input_preview.candidate_overrides,
});
assert.deepEqual(helperOutput, fixture.expected_bundle, "helper output must match fixture");

const validationResult = helper.validateFeedbackToRuleCandidateBundle(
  fixture.expected_bundle,
);
assert.deepEqual(validationResult, { passed: true, failure_codes: [] });
assert.equal(
  helper.createFeedbackToRuleCandidateBundleFingerprint(fixture.expected_bundle),
  fixture.expected_bundle.bundle_fingerprint,
  "bundle fingerprint must match helper hash",
);

assertBundle(fixture.expected_bundle);
assertFixtureCoverage();
assertSecretRedaction();
assertOutputTextSafety();
assertHelperSourceBoundary();
assertDocCoverage();
assertNoForbiddenPositiveAuthorityGrants(doc);
assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
assert.ok(indexDoc.includes(docPath), "index must point to builder doc");
assertIndexBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "feedback-to-rule-candidate-builder-v0-1",
      final_status: "pass",
      bundle_version: fixture.bundle_version,
      candidate_version: fixture.candidate_version,
      status: fixture.status,
      candidates: fixture.expected_bundle.candidates.length,
      bundle_fingerprint: fixture.expected_bundle.bundle_fingerprint,
    },
    null,
    2,
  ),
);

function assertTypeCoverage() {
  for (const requiredText of [
    "export interface FeedbackToRuleRawFeedbackEvent",
    "export interface FeedbackToRuleCandidateOverride",
    "export interface FeedbackToRuleCandidateBuilderInput",
    "candidate_contract_only",
    "feedback_to_rule_candidate.v0.1",
    "feedback_to_rule_candidate_bundle.v0.1",
  ]) {
    assert.ok(typeSource.includes(requiredText), `type file must include ${requiredText}`);
  }
}

function assertBundle(bundle) {
  assert.equal(bundle.bundle_version, bundleVersion);
  assert.equal(bundle.scope, "project:augnes");
  assert.equal(bundle.status, contractStatus);
  assert.ok(Array.isArray(bundle.candidates), "candidates must be an array");
  assert.ok(bundle.candidates.length > 0, "expected_bundle.candidates must be non-empty");
  assertAuthorityBoundary(bundle.authority_boundary, "bundle");

  const seenCandidateIds = new Set();
  for (const candidate of bundle.candidates) {
    assert.equal(candidate.candidate_version, candidateVersion);
    assert.equal(candidate.scope, "project:augnes");
    assert.equal(candidate.status, contractStatus);
    assert.ok(candidate.candidate_id, "candidate_id must be present");
    assert.ok(!seenCandidateIds.has(candidate.candidate_id), "candidate_id must be unique");
    seenCandidateIds.add(candidate.candidate_id);
    assert.ok(
      affectedSurfaces.has(candidate.affected_surface),
      `${candidate.candidate_id} affected_surface must be controlled`,
    );
    assert.ok(
      feedbackPatternKinds.has(candidate.feedback_pattern_kind),
      `${candidate.candidate_id} feedback_pattern_kind must be controlled`,
    );
    assert.ok(
      reviewStatuses.has(candidate.review_status),
      `${candidate.candidate_id} review_status must be controlled`,
    );
    assert.ok(
      riskLevels.has(candidate.risk_level),
      `${candidate.candidate_id} risk_level must be controlled`,
    );
    for (const reasonCode of candidate.reason_codes) {
      assert.ok(
        reasonCodes.has(reasonCode),
        `${candidate.candidate_id} reason code ${reasonCode} must be controlled`,
      );
    }
    for (const field of [
      "observed_pattern",
      "proposed_rule_change",
      "expected_benefit",
      "risk_note",
    ]) {
      assert.ok(candidate[field], `${candidate.candidate_id}.${field} must be present`);
    }
    assertAuthorityBoundary(candidate.authority_boundary, candidate.candidate_id);
    assertRepeatedSemantics(candidate);
    assertSourceFeedbackSet(candidate);
    assertAcceptedForFuturePrBoundary(candidate);
  }
}

function assertFixtureCoverage() {
  const candidates = fixture.expected_bundle.candidates;
  const surfaces = new Set(candidates.map((candidate) => candidate.affected_surface));
  for (const surface of [
    "research_candidate_lifecycle_read_model",
    "research_candidate_calibration_diagnostic",
    "logical_claim_shape_preview",
    "ai_context_packet",
    "codex_handoff_draft",
    "unknown",
  ]) {
    assert.ok(surfaces.has(surface), `affected surfaces must include ${surface}`);
  }

  const patterns = new Set(candidates.map((candidate) => candidate.feedback_pattern_kind));
  for (const patternKind of [
    "repeated_correction",
    "repeated_invalidation",
    "needs_more_evidence_pattern",
    "scope_overreach_pattern",
    "missing_source_pattern",
    "authority_boundary_confusion",
  ]) {
    assert.ok(patterns.has(patternKind), `pattern kinds must include ${patternKind}`);
  }

  const statuses = new Set(candidates.map((candidate) => candidate.review_status));
  for (const status of [
    "candidate_only",
    "needs_review",
    "rejected",
    "accepted_for_future_pr",
  ]) {
    assert.ok(statuses.has(status), `review statuses must include ${status}`);
  }

  const risks = new Set(candidates.map((candidate) => candidate.risk_level));
  for (const riskLevel of ["low", "medium", "high"]) {
    assert.ok(risks.has(riskLevel), `risk levels must include ${riskLevel}`);
  }

  const allReasonCodes = new Set(candidates.flatMap((candidate) => candidate.reason_codes));
  for (const reasonCode of [
    "feedback_refs_present",
    "source_refs_present",
    "source_refs_missing",
    "operator_note_redacted",
    "secret_like_pattern_blocked",
    "affected_surface_supported",
    "affected_surface_unknown",
    "pattern_kind_supported",
    "proposed_change_present",
    "authority_boundary_preserved",
    "rule_mutation_not_executed",
    "future_pr_not_created",
    "candidate_only_not_truth",
    "accepted_for_future_pr_not_pr_authority",
  ]) {
    assert.ok(allReasonCodes.has(reasonCode), `reason codes must include ${reasonCode}`);
  }
}

function assertRepeatedSemantics(candidate) {
  if (!candidate.feedback_pattern_kind.startsWith("repeated_")) return;
  assert.ok(
    uniqueSorted(candidate.feedback_event_refs).length >= 2,
    `${candidate.candidate_id} repeated pattern needs two distinct feedback_event_refs`,
  );
  assert.ok(
    candidate.source_feedback_refs.length >= 2,
    `${candidate.candidate_id} repeated pattern needs two source_feedback_refs`,
  );
}

function assertSourceFeedbackSet(candidate) {
  assert.deepEqual(
    uniqueSorted(candidate.source_feedback_refs.map((ref) => ref.feedback_event_ref)),
    uniqueSorted(candidate.feedback_event_refs),
    `${candidate.candidate_id} source_feedback_refs must match feedback_event_refs`,
  );
}

function assertAcceptedForFuturePrBoundary(candidate) {
  if (candidate.review_status !== "accepted_for_future_pr") return;
  for (const reasonCode of [
    "future_pr_not_created",
    "accepted_for_future_pr_not_pr_authority",
    "rule_mutation_not_executed",
  ]) {
    assert.ok(
      candidate.reason_codes.includes(reasonCode),
      `${candidate.candidate_id} accepted candidate must include ${reasonCode}`,
    );
  }
  assert.equal(candidate.authority_boundary.future_pr_created_now, false);
  assert.equal(candidate.authority_boundary.github_automation_authority, false);
}

function assertSecretRedaction() {
  const secretLikeInputEvents = fixture.input_preview.feedback_events.filter((event) =>
    /OPENAI_API_KEY=|GITHUB_TOKEN=|ghp_|sk-|password:|secret:|-----BEGIN [A-Z ]*PRIVATE KEY-----/i.test(
      `${event.operator_note ?? ""} ${event.operator_note_summary ?? ""}`,
    ),
  );
  assert.ok(secretLikeInputEvents.length >= 2, "fixture must include secret-like input events");
  const sourceFeedbackRefs = fixture.expected_bundle.candidates.flatMap(
    (candidate) => candidate.source_feedback_refs,
  );
  for (const event of secretLikeInputEvents) {
    const ref = sourceFeedbackRefs.find((sourceRef) => sourceRef.feedback_event_ref === event.event_id);
    assert.ok(ref, `${event.event_id} must have a source feedback ref`);
    assert.ok(
      ["redacted", "blocked_secret_like_pattern"].includes(ref.redaction_status),
      `${event.event_id} must be redacted or blocked`,
    );
  }
}

function assertOutputTextSafety() {
  for (const candidate of fixture.expected_bundle.candidates) {
    const textPayload = [
      candidate.candidate_id,
      candidate.observed_pattern,
      candidate.proposed_rule_change,
      candidate.expected_benefit,
      candidate.risk_note,
      ...candidate.boundary_notes,
      ...candidate.source_feedback_refs.map((ref) => ref.operator_note_summary ?? ""),
    ].join("\n");
    for (const forbiddenPattern of [
      /OPENAI_API_KEY=(?!REDACTED)[A-Za-z0-9_./+=-]+/,
      /ghp_(?!REDACTED)[A-Za-z0-9_]+/,
      /sk-(?!REDACTED)[A-Za-z0-9_]+/,
      /\bpassword:/i,
      /\bsecret:/i,
      /-----BEGIN [A-Z ]*PRIVATE KEY-----/i,
      /rule was applied/i,
      /PR was created/i,
      /branch was created/i,
      /proof created/i,
      /evidence record created/i,
      /perspective promoted/i,
      /state committed/i,
      /product write/i,
      /\btruth\b/i,
      /automatic mutation/i,
    ]) {
      assert.doesNotMatch(textPayload, forbiddenPattern, `${candidate.candidate_id}`);
    }
  }
}

function assertHelperSourceBoundary() {
  for (const forbiddenText of [
    "readFileSync",
    "writeFileSync",
    "fetch(",
    "XMLHttpRequest",
    "WebSocket",
    "new OpenAI",
    "better-sqlite3",
    "sqlite",
    "db.prepare",
    "child_process",
    "exec(",
    "spawn(",
    "createPullRequest",
    "createBranch",
    "git commit",
  ]) {
    assert.ok(
      !helperSource.includes(forbiddenText),
      `helper source must not include ${forbiddenText}`,
    );
  }
}

function assertAuthorityBoundary(boundary, label) {
  assert.equal(boundary.candidate_only, true, `${label}.candidate_only must be true`);
  for (const field of forbiddenAuthorityFields) {
    assert.equal(boundary[field], false, `${label}.${field} must be false`);
  }
}

function assertDocCoverage() {
  for (const requiredText of [
    "Feedback-to-Rule Candidate Builder is deterministic and candidate-only.",
    "It implements the builder follow-up from Phase 1.4 of the integrated development roadmap guide v0.2.",
    "It follows the #765 Feedback-to-Rule Candidate Contract.",
    "Feedback is operator signal, not truth.",
    "Rule candidate is not rule mutation.",
    "accepted_for_future_pr is not PR creation authority.",
    "proposed_rule_change is review text, not execution.",
    "The builder does not change parser behavior.",
    "The builder does not change lifecycle behavior.",
    "The builder does not change calibration behavior.",
    "The builder does not change logical claim shape behavior.",
    "The builder does not create proof/evidence.",
    "The builder does not promote Perspective.",
    "The builder does not mutate durable Perspective state.",
    "The builder does not mutate work.",
    "The builder does not execute Codex.",
    "The builder does not call GitHub.",
    "The builder does not create a branch or PR.",
    "The builder does not call provider/OpenAI.",
    "The builder does not fetch sources.",
    "The builder does not execute retrieval/RAG.",
    "The builder does not export Git Ledger packets.",
    "The builder does not write product records.",
    "Product-write remains parked by #686.",
    "Secret-like operator notes must be blocked or redacted.",
    "repeated_* patterns require at least two distinct feedback events.",
    "integrated development roadmap guide v0.2",
    "background inputs already integrated into the roadmap guide",
  ]) {
    assert.ok(doc.includes(requiredText), `doc must include ${requiredText}`);
  }
}

function assertNoForbiddenPositiveAuthorityGrants(source) {
  for (const field of forbiddenAuthorityFields) {
    assert.ok(
      !source.includes(`${field}: true`),
      `doc must not include positive authority grant ${field}: true`,
    );
  }
}

function assertIndexBoundary() {
  assert.ok(
    indexDoc.includes("integrated roadmap guide v0.2") &&
      indexDoc.includes("candidate-only deterministic builder"),
    "index must mention roadmap guide v0.2 and candidate-only deterministic builder",
  );
  for (const forbiddenPattern of [
    /runtime DB write was added/i,
    /route was added/i,
    /UI was added/i,
    /provider runtime was added/i,
    /retrieval runtime was added/i,
    /promotion was added/i,
    /rule mutation was added/i,
    /Codex execution was added/i,
    /GitHub automation was added/i,
    /Git Ledger export was added/i,
    /product write was added/i,
    /product ID allocation was added/i,
  ]) {
    assert.doesNotMatch(indexDoc, forbiddenPattern);
  }
}

function readJson(filePath) {
  return JSON.parse(readFile(filePath));
}

function readFile(filePath) {
  return readFileSync(filePath, "utf8");
}

function uniqueSorted(values) {
  return Array.from(new Set(values)).sort();
}
