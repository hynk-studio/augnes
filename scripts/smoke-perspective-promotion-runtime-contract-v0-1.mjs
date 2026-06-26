import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const ragContextDocPath = "docs/RAG_CONTEXT_PREVIEW_V0_1.md";
const docPath = "docs/PERSPECTIVE_PROMOTION_RUNTIME_V0_1.md";
const typePath = "types/perspective-promotion-runtime-contract.ts";
const fixturePath = "fixtures/perspective-promotion-runtime-contract.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const contractVersion = "perspective_promotion_runtime_contract.v0.1";
const decisionVersion = "perspective_promotion_decision.v0.1";
const basisVersion = "perspective_promotion_basis.v0.1";
const gateReportVersion = "perspective_promotion_gate_report.v0.1";
const bundleVersion = "perspective_promotion_contract_bundle.v0.1";
const scope = "project:augnes";

const requiredDecisionKinds = [
  "promote",
  "reject",
  "defer",
  "request_more_evidence",
  "supersede",
  "split_delta",
  "merge_with_existing",
  "unknown",
];

const requiredDecisionStatuses = [
  "contract_only",
  "candidate_only",
  "eligible_for_future_operator_decision",
  "blocked_missing_review_record",
  "blocked_missing_source_refs",
  "blocked_missing_basis_candidates",
  "blocked_unresolved_tension_policy",
  "blocked_knowledge_gap_policy",
  "blocked_private_or_raw_payload",
  "blocked_forbidden_authority",
  "rejected",
];

const requiredBasisKinds = [
  "review_record",
  "claim_candidate",
  "evidence_candidate",
  "perspective_delta_candidate",
  "source_ref",
  "rag_context_preview",
  "retrieval_candidate",
  "provider_candidate_output_ref",
  "formation_receipt_policy_ref",
  "unresolved_tension_ref",
  "knowledge_gap_ref",
  "feedback_ref",
  "manual_operator_note_summary",
  "unknown",
];

const requiredTensionPolicies = [
  "preserve_unresolved",
  "resolve_with_basis",
  "defer_to_future_review",
  "block_until_resolved",
  "unknown",
];

const requiredKnowledgeGapPolicies = [
  "preserve_gap",
  "close_with_basis",
  "defer_to_future_review",
  "block_until_closed",
  "unknown",
];

const requiredFormationReceiptPolicies = [
  "required_before_state_apply",
  "deferred_until_runtime_slice",
  "blocked_missing_receipt_policy",
  "unknown",
];

const requiredReviewReadiness = [
  "not_ready",
  "needs_operator_review",
  "ready_for_future_operator_decision",
  "blocked",
];

const requiredPrivacyClasses = [
  "public_safe_refs_only",
  "private_ref_only",
  "blocked_raw_private_payload",
  "blocked_secret_like_payload",
];

const requiredRedactionStatuses = [
  "not_needed",
  "redacted",
  "blocked_secret_like_pattern",
  "blocked_raw_payload",
  "blocked_private_location",
];

const requiredReasonCodes = [
  "roadmap_file_present",
  "rag_context_preview_ref_present",
  "review_record_ref_present",
  "review_record_ref_missing",
  "source_ref_present",
  "source_ref_missing",
  "claim_candidate_ref_present",
  "claim_candidate_ref_missing",
  "evidence_candidate_ref_present",
  "evidence_candidate_ref_missing",
  "perspective_delta_candidate_ref_present",
  "perspective_delta_candidate_ref_missing",
  "basis_candidate_ref_present",
  "basis_candidate_ref_missing",
  "unresolved_tension_present",
  "unresolved_tension_policy_present",
  "unresolved_tension_policy_missing",
  "knowledge_gap_present",
  "knowledge_gap_policy_present",
  "knowledge_gap_policy_missing",
  "formation_receipt_policy_present",
  "formation_receipt_policy_missing",
  "operator_actor_present",
  "operator_actor_missing",
  "explicit_user_action_required",
  "future_operator_decision_only",
  "promotion_not_executed",
  "decision_store_not_written",
  "formation_receipt_not_written",
  "durable_state_not_applied",
  "proof_not_created",
  "evidence_not_created",
  "claim_evidence_not_written",
  "product_write_denied",
  "provider_output_not_truth",
  "retrieval_result_not_evidence",
  "rag_context_preview_not_truth",
  "feedback_not_truth",
  "codex_result_not_authority",
  "ci_pass_not_proof",
  "smoke_pass_not_proof",
  "pr_body_not_authority",
  "git_ref_not_authority",
  "raw_payload_blocked",
  "secret_like_pattern_blocked",
  "private_location_blocked",
  "provider_call_not_executed",
  "prompt_not_sent",
  "retrieval_not_executed",
  "rag_answer_not_generated",
  "source_fetch_not_executed",
  "file_read_not_executed",
  "db_query_not_executed",
  "db_write_not_executed",
  "git_ledger_export_not_executed",
];

const requiredDocPhrases = [
  "Product-write remains parked by #686.",
  "Perspective Promotion Runtime Contract is contract-only.",
  "It defines future human-reviewed promotion decision boundaries.",
  "It does not execute promotion.",
  "It does not write promotion decisions.",
  "It does not create Formation Receipts.",
  "It does not apply durable Perspective state.",
  "It does not create proof/evidence.",
  "It does not write claim/evidence records.",
  "It does not product-write.",
  "Explicit user action is required for any future promotion.",
  "Provider output cannot promote Perspective.",
  "Retrieval result cannot promote Perspective.",
  "RAG Context Preview cannot promote Perspective.",
  "Feedback cannot promote Perspective.",
  "Codex result cannot promote Perspective.",
  "CI pass is not proof.",
  "Smoke pass is not proof.",
  "PR body is not authority.",
  "Git ref is not authority.",
  "Candidate is not fact.",
  "Candidate is not proof.",
  "Candidate is not accepted evidence.",
  "Review memory is not durable Perspective state.",
  "Formation Receipt is required before durable state apply.",
  "Durable state apply is deferred.",
  "Source refs are lineage pointers, not proof.",
  "Source refs must be public-safe symbolic refs.",
  "Unresolved tensions must be preserved or handled explicitly.",
  "Knowledge gaps must be preserved, deferred, or closed explicitly.",
  "roadmap guide is not SSOT",
  typePath,
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
  "raw promotion payload",
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

const allowedFixturePlaceholders = [
  "raw promotion payload blocked by contract fixture",
  "secret-like promotion input blocked by contract fixture",
];

const forbiddenPositiveAuthorityGrants = [
  "promotion_runtime_now: true",
  "promotion_decision_record_write_now: true",
  "promotion_route_now: true",
  "promotion_store_now: true",
  "formation_receipt_write_now: true",
  "durable_perspective_state_apply_now: true",
  "proof_or_evidence_record_now: true",
  "claim_or_evidence_write_now: true",
  "product_write_now: true",
  "product_id_allocation_now: true",
  "work_mutation_now: true",
  "db_query_or_write_now: true",
  "source_fetch_now: true",
  "local_file_read_now: true",
  "repository_file_read_now: true",
  "uploaded_file_read_now: true",
  "provider_openai_call_now: true",
  "prompt_sent_now: true",
  "retrieval_execution_now: true",
  "rag_answer_generation_now: true",
  "embedding_created_now: true",
  "vector_search_now: true",
  "git_ledger_export_now: true",
  "codex_execution_authority: true",
  "github_automation_authority: true",
  "source_of_truth: true",
  "candidate_is_fact: true",
  "candidate_is_proof: true",
  "candidate_is_accepted_evidence: true",
  "provider_output_is_truth: true",
  "retrieval_result_is_evidence: true",
  "rag_context_is_truth: true",
  "feedback_is_truth: true",
  "ci_pass_is_proof: true",
  "smoke_pass_is_proof: true",
  "pr_body_is_authority: true",
  "git_ref_is_authority: true",
];

const forbiddenAuthorityFields = [
  "promotion_runtime_now",
  "promotion_decision_record_write_now",
  "promotion_route_now",
  "promotion_store_now",
  "formation_receipt_write_now",
  "durable_perspective_state_apply_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "product_write_now",
  "product_id_allocation_now",
  "work_mutation_now",
  "db_query_or_write_now",
  "source_fetch_now",
  "local_file_read_now",
  "repository_file_read_now",
  "uploaded_file_read_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "retrieval_execution_now",
  "rag_answer_generation_now",
  "embedding_created_now",
  "vector_search_now",
  "git_ledger_export_now",
  "codex_execution_authority",
  "github_automation_authority",
  "source_of_truth",
  "candidate_is_fact",
  "candidate_is_proof",
  "candidate_is_accepted_evidence",
  "provider_output_is_truth",
  "retrieval_result_is_evidence",
  "rag_context_is_truth",
  "feedback_is_truth",
  "ci_pass_is_proof",
  "smoke_pass_is_proof",
  "pr_body_is_authority",
  "git_ref_is_authority",
];

const roadmapText = readText(roadmapPath);
const ragContextDocText = readText(ragContextDocPath);
const docText = readText(docPath);
const typeText = readText(typePath);
const fixtureText = readText(fixturePath);
const packageJson = JSON.parse(readText(packagePath));
const indexText = readText(indexPath);
const fixture = JSON.parse(fixtureText);
const bundle = fixture.expected_bundle;

assertIncludes(
  roadmapText,
  "perspective_promotion_runtime_contract_v0_1",
  "roadmap contains perspective_promotion_runtime_contract_v0_1",
);
assertIncludes(
  ragContextDocText,
  "RAG Context Preview is preview-only.",
  "RAG Context Preview doc exists and contains preview-only phrase",
);

assert.equal(fixture.fixture_version, "perspective_promotion_runtime_contract.sample.v0.1");
assert.equal(fixture.contract_version, contractVersion);
assert.equal(fixture.decision_version, decisionVersion);
assert.equal(fixture.basis_version, basisVersion);
assert.equal(fixture.gate_report_version, gateReportVersion);
assert.equal(fixture.bundle_version, bundleVersion);
assert.equal(fixture.scope, scope);
assert.equal(fixture.status, "contract_only");
assert.equal(fixture.as_of, "2026-06-26T00:00:00.000Z");
assert.equal(fixture.roadmap_ref, roadmapPath);

assert.equal(bundle.status, "contract_only");
assert.equal(bundle.contract_version, contractVersion);
assert.equal(bundle.scope, scope);
assert(Array.isArray(bundle.gate_reports) && bundle.gate_reports.length > 0, "gate reports are non-empty");
assert(
  Array.isArray(bundle.decision_contracts) && bundle.decision_contracts.length > 0,
  "decision contracts are non-empty",
);

assertCountCovers(bundle.decision_kind_counts, requiredDecisionKinds, "decision kind coverage");
assertCountCovers(bundle.decision_status_counts, requiredDecisionStatuses, "decision status coverage");
assertCountCovers(bundle.basis_kind_counts, requiredBasisKinds, "basis kind coverage");
assertCountCovers(bundle.tension_policy_counts, requiredTensionPolicies, "tension policy coverage");
assertCountCovers(bundle.knowledge_gap_policy_counts, requiredKnowledgeGapPolicies, "knowledge gap policy coverage");
assertCountCovers(
  bundle.formation_receipt_policy_counts,
  requiredFormationReceiptPolicies,
  "formation receipt policy coverage",
);
assertCountCovers(bundle.review_readiness_counts, requiredReviewReadiness, "review readiness coverage");
assertCountCovers(bundle.privacy_class_counts, requiredPrivacyClasses, "privacy class coverage");
assertCountCovers(bundle.redaction_status_counts, requiredRedactionStatuses, "redaction status coverage");
assertArrayCovers(
  [...fixture.reason_code_coverage, ...bundle.reason_codes, typeText, fixtureText],
  requiredReasonCodes,
  "reason code coverage",
);

const eligibleFuturePromote = bundle.decision_contracts.find(
  (decision) =>
    decision.decision_kind === "promote" &&
    decision.decision_status === "eligible_for_future_operator_decision",
);
assert(eligibleFuturePromote, "eligible future promote decision exists");
assert.equal(eligibleFuturePromote.explicit_user_action_required, true);
assert.equal(eligibleFuturePromote.future_operator_decision_only, true);
assert(eligibleFuturePromote.review_record_ref.length > 0, "eligible promote has review record ref");
assert(
  eligibleFuturePromote.basis_refs.some((basis) => basis.source_refs.length > 0),
  "eligible promote has source refs through basis refs",
);
assert(eligibleFuturePromote.basis_claim_candidate_refs.length > 0, "eligible promote has claim candidates");
assert(eligibleFuturePromote.basis_evidence_candidate_refs.length > 0, "eligible promote has evidence candidates");
assert(eligibleFuturePromote.perspective_delta_candidate_refs.length > 0, "eligible promote has delta candidates");
assert.equal(eligibleFuturePromote.formation_receipt_policy, "required_before_state_apply");

assertDecisionStatusExists("blocked_missing_review_record");
assertDecisionStatusExists("blocked_missing_source_refs");
assertDecisionStatusExists("blocked_missing_basis_candidates");
assertDecisionStatusExists("blocked_unresolved_tension_policy");
assertDecisionStatusExists("blocked_knowledge_gap_policy");
assertDecisionStatusExists("blocked_private_or_raw_payload");
assertDecisionStatusExists("blocked_forbidden_authority");

assertBasisKindExists("rag_context_preview");
assertBasisKindExists("retrieval_candidate");
assertBasisKindExists("provider_candidate_output_ref");
assertBasisKindExists("feedback_ref");
assertBasisKindExists("manual_operator_note_summary");
assertBasisKindExists("unresolved_tension_ref");
assertBasisKindExists("knowledge_gap_ref");

for (const report of bundle.gate_reports) {
  assert.equal(report.gate_report_version, gateReportVersion);
  assert.equal(report.contract_version, contractVersion);
  assert.equal(report.scope, scope);
  assertAuthorityBoundary(report.authority_boundary, `gate report ${report.gate_report_id}`);
}

for (const decision of bundle.decision_contracts) {
  assert.equal(decision.decision_version, decisionVersion);
  assert.equal(decision.contract_version, contractVersion);
  assert.equal(decision.scope, scope);
  assert.equal(decision.explicit_user_action_required, true);
  assert.equal(decision.future_operator_decision_only, true);
  assert.equal(decision.promotion_executed, false);
  assert.equal(decision.decision_store_written, false);
  assert.equal(decision.formation_receipt_written, false);
  assert.equal(decision.durable_state_applied, false);
  assert.equal(decision.proof_or_evidence_created, false);
  assert.equal(decision.claim_or_evidence_written, false);
  assert.equal(decision.product_write_executed, false);
  assertAuthorityBoundary(decision.authority_boundary, `decision ${decision.promotion_decision_id}`);
  for (const basis of decision.basis_refs) assertBasisShape(basis);
}

assertAuthorityBoundary(bundle.authority_boundary, "bundle");
assert.equal(
  bundle.bundle_fingerprint,
  fingerprintWithoutField(bundle, "bundle_fingerprint"),
  "bundle_fingerprint is deterministic canonical sha256",
);

assert.equal(
  packageJson.scripts["smoke:perspective-promotion-runtime-contract-v0-1"],
  "node scripts/smoke-perspective-promotion-runtime-contract-v0-1.mjs",
);

assertIndexCoverage();
assertFixturePrivacy();
assertDocs();

console.log(
  JSON.stringify(
    {
      smoke: "perspective-promotion-runtime-contract-v0-1",
      final_status: "pass",
      contract_version: contractVersion,
      status: "contract_only",
      gate_reports: bundle.gate_reports.length,
      decision_contracts: bundle.decision_contracts.length,
      bundle_fingerprint: bundle.bundle_fingerprint,
    },
    null,
    2,
  ),
);

function assertDecisionStatusExists(status) {
  assert(
    bundle.decision_contracts.some((decision) => decision.decision_status === status),
    `decision status exists: ${status}`,
  );
}

function assertBasisKindExists(kind) {
  assert(
    bundle.gate_reports
      .flatMap((report) => report.basis_refs)
      .concat(bundle.decision_contracts.flatMap((decision) => decision.basis_refs))
      .some((basis) => basis.basis_kind === kind),
    `basis kind exists: ${kind}`,
  );
}

function assertBasisShape(basis) {
  assert.equal(basis.basis_version, basisVersion);
  assert.equal(basis.scope, scope);
  assert(typeof basis.basis_id === "string" && basis.basis_id.length > 0);
  assert(requiredBasisKinds.includes(basis.basis_kind), `basis kind valid: ${basis.basis_kind}`);
  assert(typeof basis.basis_ref === "string");
  for (const key of [
    "source_refs",
    "candidate_refs",
    "review_record_refs",
    "rag_context_preview_refs",
    "retrieval_candidate_refs",
    "provider_candidate_refs",
    "feedback_refs",
    "reason_codes",
  ]) {
    assert(Array.isArray(basis[key]), `basis ${key} is array`);
  }
}

function assertAuthorityBoundary(boundary, label) {
  assert(boundary && typeof boundary === "object", `${label} authority boundary exists`);
  assert.equal(boundary.contract_only, true, `${label} contract_only true`);
  for (const field of forbiddenAuthorityFields) {
    assert.equal(boundary[field], false, `${label} ${field} false`);
  }
}

function assertIndexCoverage() {
  for (const pointer of [
    docPath,
    typePath,
    fixturePath,
    "scripts/smoke-perspective-promotion-runtime-contract-v0-1.mjs",
  ]) {
    assertIncludes(indexText, pointer, `index points to ${pointer}`);
  }
  const indexBlock = extractIndexBlock(indexText, "Perspective Promotion Runtime Contract v0.1");
  assertIncludes(indexBlock, "contract-only", "index mentions contract-only");
  assertIncludes(indexBlock, "future human-reviewed promotion", "index mentions future human-reviewed promotion");
  for (const forbiddenImplication of [
    "promotion runtime was added",
    "decision store was added",
    "Formation Receipt write was added",
    "durable state apply was added",
    "proof/evidence write was added",
    "product write was added",
    "Git Ledger export was added",
    "GitHub automation was added",
  ]) {
    assert(!indexBlock.includes(forbiddenImplication), `index must not imply ${forbiddenImplication}`);
  }
}

function assertFixturePrivacy() {
  const sanitized = allowedFixturePlaceholders.reduce(
    (text, placeholder) => text.split(placeholder).join(""),
    fixtureText,
  );
  for (const marker of forbiddenFixtureMarkers) {
    assert(!sanitized.includes(marker), `fixture must not contain forbidden marker ${marker}`);
  }
}

function assertDocs() {
  for (const phrase of requiredDocPhrases) assertIncludes(docText, phrase, `doc contains ${phrase}`);
  for (const grant of forbiddenPositiveAuthorityGrants) {
    assert(!docText.includes(grant), `doc must not contain ${grant}`);
  }
}

function assertCountCovers(counts, expected, label) {
  for (const value of expected) {
    assert(Number(counts[value]) > 0, `${label} includes ${value}`);
  }
}

function assertArrayCovers(actual, expected, label) {
  const text = Array.isArray(actual) ? actual.join("\\n") : String(actual);
  for (const value of expected) assertIncludes(text, value, `${label} includes ${value}`);
}

function fingerprintWithoutField(value, field) {
  const clone = { ...value };
  delete clone[field];
  return createHash("sha256").update(JSON.stringify(canonicalJson(clone))).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return value.map(canonicalJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalJson(value[key])]),
    );
  }
  return value;
}

function extractIndexBlock(text, heading) {
  const start = text.indexOf(`- ${heading}:`);
  assert(start >= 0, `index block exists for ${heading}`);
  const after = text.slice(start + 2);
  const next = after.search(/\\n- [^\\n]+:/);
  return next >= 0 ? after.slice(0, next) : after;
}

function assertIncludes(text, needle, message) {
  assert(text.includes(needle), message);
}

function readText(path) {
  return readFileSync(path, "utf8");
}
