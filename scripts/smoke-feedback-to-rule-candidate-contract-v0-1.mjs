import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

const docPath = "docs/FEEDBACK_TO_RULE_CANDIDATE_CONTRACT_V0_1.md";
const fixturePath =
  "fixtures/research-candidate-review.feedback-to-rule-candidate-contract.sample.v0.1.json";
const typePath = "types/feedback-to-rule-candidate.ts";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const packageScriptName = "smoke:feedback-to-rule-candidate-contract-v0-1";
const packageScriptValue =
  "node scripts/smoke-feedback-to-rule-candidate-contract-v0-1.mjs";
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

for (const filePath of [docPath, fixturePath, typePath, packagePath, indexPath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const doc = readFile(docPath);
const fixture = readJson(fixturePath);
const typeSource = readFile(typePath);
const packageJson = readJson(packagePath);
const indexDoc = readFile(indexPath);

assert.equal(
  fixture.fixture_version,
  "feedback_to_rule_candidate_contract.sample.v0.1",
);
assert.equal(fixture.bundle_version, bundleVersion);
assert.equal(fixture.candidate_version, candidateVersion);
assert.equal(fixture.scope, "project:augnes");
assert.equal(fixture.status, contractStatus);
assert.equal(fixture.expected_bundle.status, contractStatus);

assertTypeContract();
assertBundle(fixture.expected_bundle);
assertFixtureCoverage();
assertFingerprint(fixture.expected_bundle);
assertDocCoverage();
assertNoForbiddenPositiveAuthorityGrants(doc);
assertSecretRedaction();
assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
assert.ok(indexDoc.includes(docPath), "index must point to contract doc");
assertIndexBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "feedback-to-rule-candidate-contract-v0-1",
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

function assertTypeContract() {
  for (const requiredText of [
    "export type FeedbackToRuleCandidateVersion",
    "\"feedback_to_rule_candidate.v0.1\"",
    "export type FeedbackToRuleCandidateScope",
    "\"project:augnes\"",
    "export type FeedbackToRuleCandidateStatus",
    "\"candidate_contract_only\"",
    "export type FeedbackToRuleAffectedSurface",
    "export type FeedbackToRuleFeedbackPatternKind",
    "export type FeedbackToRuleCandidateReviewStatus",
    "export type FeedbackToRuleRiskLevel",
    "export type FeedbackToRuleCandidateReasonCode",
    "export interface FeedbackToRuleAuthorityBoundary",
    "export interface FeedbackToRuleSourceFeedbackRef",
    "export interface FeedbackToRuleCandidate",
    "export interface FeedbackToRuleCandidateBundle",
    "export interface FeedbackToRuleCandidateValidationResult",
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

  for (const candidate of bundle.candidates) {
    assert.equal(candidate.candidate_version, candidateVersion);
    assert.equal(candidate.scope, "project:augnes");
    assert.equal(candidate.status, contractStatus);
    assert.ok(candidate.candidate_id, "candidate_id must be present");
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
    for (const field of [
      "feedback_event_refs",
      "source_feedback_refs",
      "reason_codes",
      "boundary_notes",
    ]) {
      assert.ok(Array.isArray(candidate[field]), `${candidate.candidate_id}.${field}`);
    }
    for (const field of [
      "observed_pattern",
      "proposed_rule_change",
      "expected_benefit",
      "risk_note",
    ]) {
      assert.ok(candidate[field], `${candidate.candidate_id}.${field} must be present`);
    }
    for (const reasonCode of candidate.reason_codes) {
      assert.ok(
        reasonCodes.has(reasonCode),
        `${candidate.candidate_id} reason code ${reasonCode} must be controlled`,
      );
    }
    for (const feedbackRef of candidate.source_feedback_refs) {
      assert.ok(feedbackRef.feedback_event_ref, "feedback_event_ref must be present");
      assert.ok(feedbackRef.event_type, "event_type must be present");
      assert.ok(Array.isArray(feedbackRef.source_ref_ids), "source_ref_ids must be array");
      assert.ok(
        ["not_needed", "redacted", "blocked_secret_like_pattern"].includes(
          feedbackRef.redaction_status,
        ),
        "redaction_status must be controlled",
      );
    }
    const feedbackEventRefs = uniqueSorted(candidate.feedback_event_refs);
    const sourceFeedbackEventRefs = uniqueSorted(
      candidate.source_feedback_refs.map((ref) => ref.feedback_event_ref),
    );
    assert.deepEqual(
      sourceFeedbackEventRefs,
      feedbackEventRefs,
      `${candidate.candidate_id} source_feedback_refs must match feedback_event_refs`,
    );
    if (candidate.feedback_pattern_kind.startsWith("repeated_")) {
      assert.ok(
        feedbackEventRefs.length >= 2,
        `${candidate.candidate_id} repeated pattern requires at least two distinct feedback_event_refs`,
      );
      assert.ok(
        candidate.source_feedback_refs.length >= 2,
        `${candidate.candidate_id} repeated pattern requires at least two source_feedback_refs`,
      );
    }
    assertAuthorityBoundary(candidate.authority_boundary, candidate.candidate_id);
    if (candidate.review_status === "accepted_for_future_pr") {
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
  }

  const repeatedInvalidation = bundle.candidates.find(
    (candidate) => candidate.candidate_id === "feedback-rule-logical-invalidation-001",
  );
  assert.ok(repeatedInvalidation, "repeated invalidation candidate must exist");
  assert.ok(
    uniqueSorted(repeatedInvalidation.feedback_event_refs).length >= 2,
    "repeated invalidation candidate must have at least two feedback_event_refs",
  );
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

function assertAuthorityBoundary(boundary, label) {
  assert.equal(boundary.candidate_only, true, `${label}.candidate_only must be true`);
  for (const field of forbiddenAuthorityFields) {
    assert.equal(boundary[field], false, `${label}.${field} must be false`);
  }
}

function assertFingerprint(bundle) {
  assert.ok(bundle.bundle_fingerprint, "bundle_fingerprint must be non-empty");
  assert.equal(
    createBundleFingerprint(bundle),
    bundle.bundle_fingerprint,
    "bundle_fingerprint must match deterministic hash",
  );
}

function assertSecretRedaction() {
  const candidateRefs = fixture.expected_bundle.candidates.flatMap(
    (candidate) => candidate.source_feedback_refs,
  );
  const redactedRefs = candidateRefs.filter((ref) =>
    JSON.stringify(ref).match(/OPENAI_API_KEY=|ghp_|sk-/),
  );
  assert.ok(redactedRefs.length > 0, "fixture must include secret-like redaction refs");
  for (const ref of redactedRefs) {
    assert.ok(
      ["redacted", "blocked_secret_like_pattern"].includes(ref.redaction_status),
      `${ref.feedback_event_ref} must be redacted or blocked`,
    );
  }

  const publicSafePayload = JSON.stringify({
    sample_feedback_events: fixture.sample_feedback_events,
    expected_bundle: fixture.expected_bundle,
  });
  for (const forbiddenPattern of [
    /OPENAI_API_KEY=(?!REDACTED)[A-Za-z0-9_./+=-]+/,
    /ghp_(?!REDACTED)[A-Za-z0-9_]+/,
    /sk-(?!REDACTED)[A-Za-z0-9_]+/,
    /\bpassword:/i,
    /\bsecret:/i,
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/i,
  ]) {
    assert.doesNotMatch(
      publicSafePayload,
      forbiddenPattern,
      `fixture must not contain ${forbiddenPattern}`,
    );
  }
}

function assertDocCoverage() {
  for (const requiredText of [
    "Feedback-to-Rule Candidate is candidate-only.",
    "It implements Phase 1.4 from the integrated development roadmap guide v0.2.",
    "Feedback is operator signal, not truth.",
    "Rule candidate is not rule mutation.",
    "accepted_for_future_pr is not PR creation authority.",
    "proposed_rule_change is review text, not execution.",
    "It does not change parser behavior.",
    "It does not change lifecycle behavior.",
    "It does not change calibration behavior.",
    "It does not change logical claim shape behavior.",
    "It does not create proof/evidence.",
    "It does not promote Perspective.",
    "It does not mutate durable Perspective state.",
    "It does not mutate work.",
    "It does not execute Codex.",
    "It does not call GitHub.",
    "It does not create a branch or PR.",
    "It does not call provider/OpenAI.",
    "It does not fetch sources.",
    "It does not execute retrieval/RAG.",
    "It does not export Git Ledger packets.",
    "It does not write product records.",
    "Product-write remains parked by #686.",
    "Secret-like operator notes must be blocked or redacted.",
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
      indexDoc.includes("candidate-contract-only"),
    "index must mention roadmap guide v0.2 and candidate-contract-only boundary",
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

function createBundleFingerprint(bundle) {
  const { bundle_fingerprint: _fingerprint, ...hashInput } = bundle;
  return createHash("sha256").update(canonicalJson(hashInput)).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function uniqueSorted(values) {
  return Array.from(new Set(values)).sort();
}

function readJson(filePath) {
  return JSON.parse(readFile(filePath));
}

function readFile(filePath) {
  return readFileSync(filePath, "utf8");
}
