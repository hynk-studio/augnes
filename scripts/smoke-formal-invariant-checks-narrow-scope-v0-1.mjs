#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const docsPath = "docs/FORMAL_INVARIANT_CHECKS_NARROW_SCOPE_V0_1.md";
const typePath = "types/formal-invariant-checks-narrow-scope.ts";
const fixturePath =
  "fixtures/formal-invariant-checks-narrow-scope.sample.v0.1.json";
const smokePath =
  "scripts/smoke-formal-invariant-checks-narrow-scope-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const empiricalCalibrationDocsPath = "docs/EMPIRICAL_CALIBRATION_DATASET_V0_1.md";
const deterministicCrpfDocsPath = "docs/DETERMINISTIC_CRPF_VARIANT_REVIEW_V0_1.md";
const productWriteTargetDocsPath = "docs/PRODUCT_WRITE_TARGET_CONTRACT_V0_1.md";
const githubActuationDocsPath = "docs/GITHUB_ACTUATION_CONTRACT_V0_1.md";
const authorityBoundaryDocsPath = "docs/AUTHORITY_BOUNDARY_REGRESSION_CI_V0_1.md";
const privacyGuardDocsPath = "docs/PRIVACY_REDACTION_RUNTIME_GUARD_V0_1.md";
const localDataPolicyDocsPath = "docs/LOCAL_DATA_EXPORT_IMPORT_POLICY_V0_1.md";
const codexResultDocsPath = "docs/CODEX_RESULT_REPORT_INGESTION_V0_1.md";
const temporalHandoffDocsPath =
  "docs/TEMPORAL_HANDOFF_USEFULNESS_EXPERIMENT_PLAN_V0_1.md";
const gitLedgerBuilderDocsPath =
  "docs/GIT_LEDGER_EXPORT_DETERMINISTIC_BUILDER_V0_1.md";
const gitLedgerReadonlyDocsPath = "docs/GIT_LEDGER_EXPORT_READONLY_PREVIEW_V0_1.md";
const localGitLedgerExportDocsPath = "docs/LOCAL_GIT_LEDGER_EXPORT_V0_1.md";
const targetAgentPacketProfilesDocsPath =
  "docs/TARGET_AGENT_AI_CONTEXT_PACKET_PROFILES_V0_1.md";

const fixtureVersion = "formal_invariant_checks_narrow_scope.sample.v0.1";
const contractVersion = "formal_invariant_checks_narrow_scope.v0.1";
const specVersion = "formal_invariant_spec.v0.1";
const caseVersion = "formal_invariant_case.v0.1";
const bundleVersion = "formal_invariant_bundle.v0.1";
const validationFindingVersion = "formal_invariant_validation_finding.v0.1";
const scope = "project:augnes";
const packageScriptName = "smoke:formal-invariant-checks-narrow-scope-v0-1";
const packageScriptValue =
  "node scripts/smoke-formal-invariant-checks-narrow-scope-v0-1.mjs";

const expectedSliceFiles = [
  docsPath,
  typePath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
];

const statuses = [
  "contract_only",
  "fixture_only",
  "static_invariant_smoke_only",
  "ready_for_future_operator_review",
  "blocked_forbidden_authority",
  "blocked_private_or_raw_payload",
  "rejected",
];

const invariantKinds = [
  "candidate_not_proof",
  "provider_output_not_evidence",
  "retrieval_result_not_promotion",
  "codex_result_not_state",
  "dataset_row_not_training_data",
  "feedback_not_truth",
  "layout_coordinate_not_authority",
  "git_ref_not_authority",
  "github_pr_not_core_decision",
  "ci_pass_not_truth",
  "smoke_pass_not_truth",
  "git_ledger_packet_not_commit",
  "product_write_gate_required",
  "product_id_allocation_disabled",
  "private_identifier_not_canonical_label",
];

const invariantSurfaces = [
  "route_contract",
  "type_contract",
  "fixture_contract",
  "smoke_script",
  "docs_boundary",
  "authority_boundary",
  "product_write_target_contract",
  "github_actuation_contract",
  "git_ledger_contract",
  "empirical_calibration_dataset",
  "deterministic_crpf_variant_review",
  "codex_result_report_ingestion",
  "temporal_handoff_experiment",
  "privacy_redaction_guard",
  "local_data_export_policy",
  "unknown",
];

const checkModes = [
  "static_text_match",
  "authority_boundary_field_check",
  "fixture_negative_case",
  "fixture_positive_boundary_case",
  "type_surface_check",
  "route_refusal_contract_check",
  "no_runtime_file_scope_check",
];

const expectedResults = [
  "allowed_boundary_statement",
  "blocked_positive_authority_claim",
  "refused_route_payload",
  "forbidden_authority_false",
  "required_prerequisite_present",
  "non_authority_phrase_present",
  "no_runtime_capability_present",
];

const failureSeverities = ["info", "warning", "blocking", "critical"];

const reasonCodes = [
  "formal_invariant_checks_narrow_scope_only",
  "static_smoke_only",
  "theorem_prover_runtime_not_added",
  "natural_language_claim_proving_forbidden",
  "route_refusal_contract_only",
  "authority_boundary_required",
  "candidate_not_proof",
  "provider_output_not_evidence",
  "retrieval_result_not_promotion",
  "codex_result_not_state",
  "dataset_row_not_training_data",
  "feedback_not_truth",
  "layout_coordinate_not_authority",
  "git_ref_not_authority",
  "github_pr_not_core_decision",
  "ci_pass_not_truth",
  "smoke_pass_not_truth",
  "git_ledger_packet_not_commit",
  "git_ledger_packet_not_proof",
  "git_ledger_packet_not_product_write",
  "product_write_gate_required",
  "product_write_remains_parked",
  "product_write_denied",
  "product_id_allocation_disabled",
  "private_identifier_not_canonical_label",
  "source_refs_required",
  "promotion_decision_required",
  "formation_receipt_required",
  "explicit_operator_approval_required",
  "audit_trail_required",
  "rollback_policy_required",
  "idempotency_key_required",
  "preview_to_write_diff_required",
  "privacy_guard_required",
  "provider_call_not_executed",
  "prompt_not_sent",
  "source_fetch_not_executed",
  "retrieval_not_executed",
  "rag_answer_not_generated",
  "db_write_not_executed",
  "proof_not_created",
  "evidence_not_created",
  "promotion_not_executed",
  "durable_state_not_mutated",
  "formation_receipt_not_written",
  "git_github_not_executed",
  "codex_not_executed",
  "product_id_allocation_not_executed",
  "local_export_not_executed",
  "local_import_not_executed",
  "raw_private_payload_blocked",
  "private_url_blocked",
  "local_private_path_blocked",
  "secret_like_pattern_blocked",
  "provider_thread_run_session_id_blocked",
];

const authorityAllowedTrueFields = [
  "formal_invariant_checks_contract_now",
  "contract_only",
  "fixture_only",
  "static_invariant_smoke_only",
  "narrow_scope_only",
  "caller_provided_fixture_only",
];

const authorityFalseFields = [
  "theorem_prover_runtime_now",
  "lean_dependency_added_now",
  "natural_language_claim_proving_now",
  "runtime_route_check_now",
  "runtime_state_mutation_now",
  "db_query_or_write_now",
  "route_now",
  "ui_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "source_fetch_now",
  "retrieval_execution_now",
  "rag_answer_generation_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "promotion_execution_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "formation_receipt_write_now",
  "git_ledger_export_runtime_now",
  "git_write_now",
  "github_api_call_now",
  "repository_file_write_now",
  "local_file_export_now",
  "local_file_import_now",
  "codex_execution_now",
  "codex_execution_authority",
  "github_automation_authority",
  "product_write_now",
  "product_write_runtime_now",
  "product_write_adapter_enabled_now",
  "product_id_allocation_now",
  "product_persistence_now",
  "product_write_authority",
  "invariant_pass_is_truth",
  "invariant_pass_is_proof",
  "invariant_pass_is_approval",
  "invariant_pass_is_promotion",
  "invariant_pass_is_durable_state",
  "invariant_pass_is_product_write_authority",
  "invariant_pass_is_merge_authority",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
];

const requiredDocsSections = [
  "## Purpose",
  "## Relationship to docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md",
  "## Relationship to Authority Boundary Regression CI",
  "## Relationship to Privacy Redaction Runtime Guard",
  "## Relationship to Product Write Target Contract",
  "## Relationship to GitHub Actuation Contract",
  "## Relationship to Git Ledger / Local Export",
  "## Relationship to Empirical Calibration Dataset",
  "## Relationship to Deterministic CRPF Variant Review",
  "## Relationship to Codex Result Report Ingestion and Temporal Handoff",
  "## Invariant Scope",
  "## What is Intentionally Not Formalized",
  "## Positive Boundary Cases",
  "## Negative Forbidden Claim Cases",
  "## Route Refusal Contract Cases",
  "## Product-Write Gate Cases",
  "## Privacy Identifier Cases",
  "## Authority Boundary",
  "## Fixture Policy",
  "## Verification Expectations",
  "## Deferred Work",
];

const docsExactPhrases = [
  "This slice is contract-only and fixture-only.",
  "This slice is static invariant smoke only.",
  "This slice is narrow scope only.",
  "This slice does not add theorem prover runtime.",
  "This slice does not add Lean dependency.",
  "This slice does not prove arbitrary natural-language claims.",
  "This slice does not call providers.",
  "This slice does not send prompts.",
  "This slice does not fetch sources.",
  "This slice does not execute retrieval/RAG.",
  "This slice does not query/write DB.",
  "This slice does not add routes or UI.",
  "This slice does not create proof/evidence.",
  "This slice does not write claim/evidence records.",
  "This slice does not promote Perspective.",
  "This slice does not write/apply durable Perspective state.",
  "This slice does not write Formation Receipts.",
  "This slice does not execute Git Ledger export runtime.",
  "This slice does not execute Git or call GitHub.",
  "This slice does not execute Codex.",
  "This slice does not export/import files.",
  "This slice does not product-write.",
  "This slice does not allocate product IDs.",
  "Product-write remains parked by #686.",
  "Invariant pass is not truth.",
  "Invariant pass is not proof.",
  "Invariant pass is not approval.",
  "Invariant pass is not promotion.",
  "Invariant pass is not durable state.",
  "Invariant pass is not product-write authority.",
  "Invariant pass is not merge authority.",
  "Smoke/CI pass is not truth.",
  "The roadmap guide is not SSOT.",
];

const requiredTypeExports = [
  "FormalInvariantChecksNarrowScopeContractVersion",
  "FormalInvariantSpecVersion",
  "FormalInvariantCaseVersion",
  "FormalInvariantBundleVersion",
  "FormalInvariantScope",
  "FormalInvariantStatuses",
  "FormalInvariantKinds",
  "FormalInvariantSurfaces",
  "FormalInvariantCheckModes",
  "FormalInvariantExpectedResults",
  "FormalInvariantFailureSeverities",
  "FormalInvariantReasonCodes",
  "FormalInvariantAuthorityBoundary",
  "FormalInvariantSpec",
  "FormalInvariantPositiveCase",
  "FormalInvariantNegativeCase",
  "FormalInvariantBundle",
  "FormalInvariantValidationFinding",
];

const requiredSpecFields = [
  "spec_version",
  "contract_version",
  "scope",
  "invariant_id",
  "invariant_kind",
  "invariant_surface",
  "check_mode",
  "expected_result",
  "failure_severity",
  "public_safe_statement",
  "reason_codes",
  "authority_boundary",
];

const requiredPositiveCaseFields = [
  "case_version",
  "scope",
  "case_id",
  "invariant_kind",
  "surface",
  "check_mode",
  "expected_result",
  "expected_allowed",
  "statement",
  "reason_codes",
  "authority_boundary",
];

const requiredNegativeCaseFields = [
  "case_version",
  "scope",
  "case_id",
  "invariant_kind",
  "surface",
  "check_mode",
  "expected_result",
  "expected_blocked",
  "statement_segments",
  "public_safe_summary",
  "reason_codes",
  "authority_boundary",
];

const productWriteGatePrerequisites = [
  "product_write_reentry_review_ref",
  "product_write_target_contract_ref",
  "promotion_decision_ref",
  "formation_receipt_ref",
  "explicit_operator_approval_ref",
  "source_refs",
  "audit_trail_ref",
  "idempotency_key_ref",
  "rollback_policy_ref",
  "preview_to_write_diff_ref",
];

const safeFixtureMarkers = [
  "SAFE_MARKER_PRIVATE_URL",
  "SAFE_MARKER_LOCAL_PRIVATE_PATH",
  "SAFE_MARKER_SECRET_TOKEN",
  "SAFE_MARKER_RAW_SOURCE_BODY",
  "SAFE_MARKER_RAW_PROVIDER_OUTPUT",
  "SAFE_MARKER_RAW_RETRIEVAL_OUTPUT",
  "SAFE_MARKER_PROVIDER_THREAD_ID",
  "SAFE_MARKER_RAW_CONVERSATION",
  "SAFE_MARKER_HIDDEN_REASONING",
  "SAFE_MARKER_RAW_DB_ROW",
  "SAFE_MARKER_RAW_DIFF",
  "SAFE_MARKER_TELEMETRY_DUMP",
];

const liveLookingPrivatePatterns = [
  /\bhttps?:\/\//,
  /\bfile:\/\//,
  /\/Users\//,
  /\/home\//,
  /\bsk-[A-Za-z0-9_-]{8,}\b/,
  /\bghp_[A-Za-z0-9_]{8,}\b/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\b(thread|run|session|resp|file)_[A-Za-z0-9]{16,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{8,}\b/,
];

for (const requiredPath of [
  docsPath,
  typePath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
  roadmapPath,
  empiricalCalibrationDocsPath,
  deterministicCrpfDocsPath,
  productWriteTargetDocsPath,
  githubActuationDocsPath,
  authorityBoundaryDocsPath,
  privacyGuardDocsPath,
  localDataPolicyDocsPath,
  codexResultDocsPath,
  temporalHandoffDocsPath,
  gitLedgerBuilderDocsPath,
  gitLedgerReadonlyDocsPath,
  localGitLedgerExportDocsPath,
  targetAgentPacketProfilesDocsPath,
]) {
  assert.ok(existsSync(requiredPath), `required path missing: ${requiredPath}`);
}

const docs = readFile(docsPath);
const docsNormalized = normalizeWhitespace(docs);
const types = readFile(typePath);
const fixtureText = readFile(fixturePath);
const smokeSource = readFile(smokePath);
const packageJson = JSON.parse(readFile(packagePath));
const index = readFile(indexPath);
const roadmap = readFile(roadmapPath);
const fixture = JSON.parse(fixtureText);

assert.ok(
  roadmap.includes("formal_invariant_checks_narrow_scope_v0_1"),
  "roadmap must contain formal_invariant_checks_narrow_scope_v0_1",
);
assert.ok(
  roadmap.includes("target_agent_ai_context_packet_profiles_v0_1"),
  "roadmap must already contain target_agent_ai_context_packet_profiles_v0_1",
);
assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue);
assert.ok(index.includes("Formal Invariant Checks Narrow Scope v0.1"));
assert.ok(index.includes(docsPath));
assert.ok(index.includes(typePath));
assert.ok(index.includes(fixturePath));
assert.ok(index.includes(smokePath));
assert.ok(index.includes("formal_invariant_checks_narrow_scope_v0_1"));
assert.ok(index.includes("Product-write remains parked by #686."));

for (const section of requiredDocsSections) {
  assert.ok(docs.includes(section), `docs must include section: ${section}`);
}
for (const phrase of docsExactPhrases) {
  assert.ok(
    docsNormalized.includes(normalizeWhitespace(phrase)),
    `docs must include phrase: ${phrase}`,
  );
}

for (const exportedName of requiredTypeExports) {
  assert.ok(types.includes(exportedName), `types must include ${exportedName}`);
}
for (const value of [
  contractVersion,
  specVersion,
  caseVersion,
  bundleVersion,
  validationFindingVersion,
  scope,
  ...statuses,
  ...invariantKinds,
  ...invariantSurfaces,
  ...checkModes,
  ...expectedResults,
  ...failureSeverities,
  ...reasonCodes,
  ...authorityAllowedTrueFields,
  ...authorityFalseFields,
]) {
  assert.ok(types.includes(value), `types must include ${value}`);
}

assert.equal(fixture.fixture_version, fixtureVersion);
assert.equal(fixture.contract_version, contractVersion);
assert.equal(fixture.invariant_spec_version, specVersion);
assert.equal(fixture.invariant_case_version, caseVersion);
assert.equal(fixture.bundle_version, bundleVersion);
assert.equal(fixture.scope, scope);
assert.ok(fixture.invariant_bundle_example, "fixture must include invariant bundle");
assert.ok(Array.isArray(fixture.invariant_specs), "fixture must include invariant specs");
assert.ok(
  Array.isArray(fixture.positive_boundary_cases),
  "fixture must include positive boundary cases",
);
assert.ok(
  Array.isArray(fixture.negative_forbidden_claim_cases),
  "fixture must include negative forbidden claim cases",
);
assert.ok(
  Array.isArray(fixture.route_refusal_contract_cases),
  "fixture must include route refusal contract cases",
);
assert.ok(
  Array.isArray(fixture.product_write_gate_cases),
  "fixture must include product-write gate cases",
);
assert.ok(
  Array.isArray(fixture.privacy_identifier_cases),
  "fixture must include privacy identifier cases",
);
assert.ok(
  fixture.blocked_private_or_raw_payload_example,
  "fixture must include blocked private/raw example",
);
assert.ok(
  fixture.blocked_forbidden_authority_example,
  "fixture must include blocked forbidden authority example",
);
assert.ok(
  fixture.deterministic_repeatability_example,
  "fixture must include deterministic repeatability example",
);

assertAuthorityBoundary(fixture.authority_boundary_sample, "$.authority_boundary_sample");
assertBundle(fixture.invariant_bundle_example, "$.invariant_bundle_example");
assertInvariantKindSet(fixture.invariant_specs, "fixture.invariant_specs");
assertInvariantKindSet(
  fixture.invariant_bundle_example.invariant_specs,
  "fixture.invariant_bundle_example.invariant_specs",
);
assert.deepEqual(
  fixture.invariant_bundle_example.invariant_specs.map((spec) => spec.invariant_id),
  fixture.invariant_specs.map((spec) => spec.invariant_id),
  "bundle specs must match top-level specs by id and order",
);
for (const spec of fixture.invariant_specs) {
  assertSpec(spec, `$.invariant_specs.${spec.invariant_kind}`);
}
for (const spec of fixture.invariant_bundle_example.invariant_specs) {
  assertSpec(spec, `$.invariant_bundle_example.invariant_specs.${spec.invariant_kind}`);
}

assertPositiveBoundaryCases(fixture.positive_boundary_cases, "$.positive_boundary_cases");
assertPositiveBoundaryCases(
  fixture.invariant_bundle_example.positive_boundary_cases,
  "$.invariant_bundle_example.positive_boundary_cases",
);
assertNegativeForbiddenCases(
  fixture.negative_forbidden_claim_cases,
  "$.negative_forbidden_claim_cases",
);
assertNegativeForbiddenCases(
  fixture.invariant_bundle_example.negative_forbidden_claim_cases,
  "$.invariant_bundle_example.negative_forbidden_claim_cases",
);
assertRouteRefusalCases(fixture.route_refusal_contract_cases, "$.route_refusal_contract_cases");
assertRouteRefusalCases(
  fixture.invariant_bundle_example.route_refusal_contract_cases,
  "$.invariant_bundle_example.route_refusal_contract_cases",
);
assertProductWriteGateCases(
  fixture.product_write_gate_cases,
  "$.product_write_gate_cases",
);
assertProductWriteGateCases(
  fixture.invariant_bundle_example.product_write_gate_cases,
  "$.invariant_bundle_example.product_write_gate_cases",
);
assertPrivacyIdentifierCases(
  fixture.privacy_identifier_cases,
  "$.privacy_identifier_cases",
);
assertPrivacyIdentifierCases(
  fixture.invariant_bundle_example.privacy_identifier_cases,
  "$.invariant_bundle_example.privacy_identifier_cases",
);

assert.equal(
  fixture.blocked_private_or_raw_payload_example.status,
  "blocked_private_or_raw_payload",
);
assert.equal(
  fixture.blocked_private_or_raw_payload_example.finding.finding_version,
  validationFindingVersion,
);
assert.equal(
  fixture.blocked_private_or_raw_payload_example.finding.original_value_included,
  false,
);
assert.equal(
  fixture.blocked_forbidden_authority_example.status,
  "blocked_forbidden_authority",
);
assert.equal(
  fixture.blocked_forbidden_authority_example.finding.finding_version,
  validationFindingVersion,
);
assert.equal(
  fixture.blocked_forbidden_authority_example.finding.original_value_included,
  false,
);
assert.equal(
  fixture.blocked_forbidden_authority_example.authority_boundary
    .theorem_prover_runtime_now,
  true,
  "blocked forbidden authority example must demonstrate the blocked field",
);

const repeatability = fixture.deterministic_repeatability_example;
assert.deepEqual(
  repeatability.first_invariant_order,
  repeatability.second_invariant_order,
  "same fixture input must preserve invariant id order",
);
assert.equal(
  repeatability.first_fingerprint,
  repeatability.second_fingerprint,
  "same fixture input must preserve fingerprint",
);
assert.deepEqual(
  repeatability.first_invariant_order,
  fixture.invariant_specs.map((spec) => spec.invariant_id),
  "repeatability order must match invariant spec order",
);

assertSafeMarkerPlacement();
assertNoLiveLookingPrivateExamples();
assertNarrowSliceFileScope();
assertNoRuntimeCapabilityFiles();
assertNoLeanRuntimeFilesOrPackageDependency();

assert.equal(
  packageJson.scripts?.["smoke:authority-boundary-regression-v0-1"],
  "node scripts/smoke-authority-boundary-regression-v0-1.mjs",
  "authority boundary regression smoke package script must not be weakened",
);
assert.equal(
  packageJson.scripts?.["smoke:empirical-calibration-dataset-v0-1"],
  "node scripts/smoke-empirical-calibration-dataset-v0-1.mjs",
  "empirical calibration dataset smoke package script must remain runnable",
);

console.log(
  JSON.stringify(
    {
      ok: true,
      smoke: "formal-invariant-checks-narrow-scope-v0-1",
      contract_version: contractVersion,
      invariant_specs: fixture.invariant_specs.length,
      positive_boundary_cases: fixture.positive_boundary_cases.length,
      negative_forbidden_claim_cases:
        fixture.negative_forbidden_claim_cases.length,
    },
    null,
    2,
  ),
);

function readFile(filePath) {
  return readFileSync(filePath, "utf8");
}

function normalizeWhitespace(value) {
  return String(value).replace(/\s+/g, " ").trim();
}

function assertAuthorityBoundary(boundary, label) {
  assert.ok(boundary && typeof boundary === "object", `${label} must be an object`);
  for (const field of authorityAllowedTrueFields) {
    assert.equal(boundary[field], true, `${label}.${field} must be true`);
  }
  for (const field of authorityFalseFields) {
    assert.equal(boundary[field], false, `${label}.${field} must be false`);
  }
}

function assertBundle(bundle, label) {
  assert.equal(bundle.bundle_version, bundleVersion, `${label}.bundle_version`);
  assert.equal(bundle.contract_version, contractVersion, `${label}.contract_version`);
  assert.equal(bundle.spec_version, specVersion, `${label}.spec_version`);
  assert.equal(bundle.case_version, caseVersion, `${label}.case_version`);
  assert.equal(bundle.scope, scope, `${label}.scope`);
  assert.equal(
    bundle.status,
    "static_invariant_smoke_only",
    `${label}.status must be static invariant smoke only`,
  );
  assert.ok(bundle.bundle_id, `${label}.bundle_id must be present`);
  assert.ok(bundle.deterministic_fingerprint, `${label}.fingerprint must be present`);
  assert.ok(Array.isArray(bundle.boundary_notes), `${label}.boundary_notes`);
  assert.ok(Array.isArray(bundle.reason_codes), `${label}.reason_codes`);
  for (const reasonCode of [
    "formal_invariant_checks_narrow_scope_only",
    "static_smoke_only",
    "product_write_remains_parked",
    "privacy_guard_required",
  ]) {
    assert.ok(
      bundle.reason_codes.includes(reasonCode),
      `${label}.reason_codes must include ${reasonCode}`,
    );
  }
  assertAuthorityBoundary(bundle.authority_boundary, `${label}.authority_boundary`);
}

function assertInvariantKindSet(items, label) {
  assert.ok(Array.isArray(items), `${label} must be an array`);
  assert.deepEqual(
    items.map((item) => item.invariant_kind).sort(),
    [...invariantKinds].sort(),
    `${label} must contain all required invariant kinds exactly once`,
  );
  assert.equal(
    new Set(items.map((item) => item.invariant_kind)).size,
    invariantKinds.length,
    `${label} must not contain duplicate invariant kinds`,
  );
}

function assertSpec(spec, label) {
  for (const field of requiredSpecFields) {
    assert.ok(spec[field] !== undefined, `${label} missing ${field}`);
  }
  assert.equal(spec.spec_version, specVersion, `${label}.spec_version`);
  assert.equal(spec.contract_version, contractVersion, `${label}.contract_version`);
  assert.equal(spec.scope, scope, `${label}.scope`);
  assert.ok(invariantKinds.includes(spec.invariant_kind), `${label}.invariant_kind`);
  assert.ok(
    invariantSurfaces.includes(spec.invariant_surface),
    `${label}.invariant_surface`,
  );
  assert.ok(checkModes.includes(spec.check_mode), `${label}.check_mode`);
  assert.ok(expectedResults.includes(spec.expected_result), `${label}.expected_result`);
  assert.ok(
    failureSeverities.includes(spec.failure_severity),
    `${label}.failure_severity`,
  );
  assert.ok(spec.public_safe_statement, `${label}.public_safe_statement`);
  for (const reasonCode of spec.reason_codes) {
    assert.ok(reasonCodes.includes(reasonCode), `${label}.reason_code ${reasonCode}`);
  }
  assertAuthorityBoundary(spec.authority_boundary, `${label}.authority_boundary`);
}

function assertPositiveBoundaryCases(cases, label) {
  assert.ok(Array.isArray(cases), `${label} must be an array`);
  assert.ok(cases.length >= 12, `${label} must include positive boundary cases`);
  for (const testCase of cases) {
    for (const field of requiredPositiveCaseFields) {
      assert.ok(testCase[field] !== undefined, `${label}.${testCase.case_id}.${field}`);
    }
    assert.equal(testCase.case_version, caseVersion, `${label}.${testCase.case_id}`);
    assert.equal(testCase.scope, scope, `${label}.${testCase.case_id}.scope`);
    assert.equal(testCase.expected_allowed, true, `${label}.${testCase.case_id}`);
    assert.equal(
      testCase.expected_result,
      "allowed_boundary_statement",
      `${label}.${testCase.case_id}.expected_result`,
    );
    assertAllowedBoundaryStatement(testCase.statement, `${label}.${testCase.case_id}`);
    assertAuthorityBoundary(
      testCase.authority_boundary,
      `${label}.${testCase.case_id}.authority_boundary`,
    );
  }
}

function assertNegativeForbiddenCases(cases, label) {
  assert.ok(Array.isArray(cases), `${label} must be an array`);
  assert.ok(cases.length >= 12, `${label} must include negative forbidden cases`);
  for (const testCase of cases) {
    for (const field of requiredNegativeCaseFields) {
      assert.ok(testCase[field] !== undefined, `${label}.${testCase.case_id}.${field}`);
    }
    assert.equal(testCase.case_version, caseVersion, `${label}.${testCase.case_id}`);
    assert.equal(testCase.scope, scope, `${label}.${testCase.case_id}.scope`);
    assert.equal(testCase.expected_blocked, true, `${label}.${testCase.case_id}`);
    assert.equal(
      testCase.expected_result,
      "blocked_positive_authority_claim",
      `${label}.${testCase.case_id}.expected_result`,
    );
    assert.ok(
      Array.isArray(testCase.statement_segments) &&
        testCase.statement_segments.length >= 2,
      `${label}.${testCase.case_id}.statement_segments must be segmented`,
    );
    assert.ok(
      classifySegmentedForbiddenCase(testCase),
      `${label}.${testCase.case_id} must be blocked by narrow classifier`,
    );
    assertAuthorityBoundary(
      testCase.authority_boundary,
      `${label}.${testCase.case_id}.authority_boundary`,
    );
  }
}

function assertRouteRefusalCases(cases, label) {
  assert.ok(Array.isArray(cases), `${label} must be an array`);
  const routeKinds = new Set(cases.map((testCase) => testCase.invariant_kind));
  for (const invariantKind of [
    "candidate_not_proof",
    "provider_output_not_evidence",
    "retrieval_result_not_promotion",
    "codex_result_not_state",
    "dataset_row_not_training_data",
    "feedback_not_truth",
    "layout_coordinate_not_authority",
    "git_ref_not_authority",
    "github_pr_not_core_decision",
    "git_ledger_packet_not_commit",
    "private_identifier_not_canonical_label",
  ]) {
    assert.ok(routeKinds.has(invariantKind), `${label} must include ${invariantKind}`);
  }
  for (const testCase of cases) {
    assert.equal(testCase.case_version, caseVersion, `${label}.${testCase.case_id}`);
    assert.equal(testCase.scope, scope, `${label}.${testCase.case_id}.scope`);
    assert.equal(
      testCase.expected_result,
      "refused_route_payload",
      `${label}.${testCase.case_id}.expected_result`,
    );
    assertAuthorityBoundary(
      testCase.authority_boundary,
      `${label}.${testCase.case_id}.authority_boundary`,
    );
  }
}

function assertProductWriteGateCases(cases, label) {
  assert.ok(Array.isArray(cases) && cases.length > 0, `${label} must be non-empty`);
  for (const testCase of cases) {
    assert.equal(
      testCase.invariant_kind,
      "product_write_gate_required",
      `${label}.${testCase.case_id}.invariant_kind`,
    );
    assert.equal(
      testCase.expected_result,
      "required_prerequisite_present",
      `${label}.${testCase.case_id}.expected_result`,
    );
    assert.deepEqual(
      testCase.required_prerequisites,
      productWriteGatePrerequisites,
      `${label}.${testCase.case_id} must require all product-write gate prerequisites`,
    );
    for (const reasonCode of [
      "promotion_decision_required",
      "formation_receipt_required",
      "explicit_operator_approval_required",
      "source_refs_required",
      "audit_trail_required",
      "idempotency_key_required",
      "rollback_policy_required",
      "preview_to_write_diff_required",
    ]) {
      assert.ok(
        testCase.reason_codes.includes(reasonCode),
        `${label}.${testCase.case_id}.reason_codes must include ${reasonCode}`,
      );
    }
    assertAuthorityBoundary(
      testCase.authority_boundary,
      `${label}.${testCase.case_id}.authority_boundary`,
    );
  }
}

function assertPrivacyIdentifierCases(cases, label) {
  assert.ok(Array.isArray(cases) && cases.length > 0, `${label} must be non-empty`);
  for (const testCase of cases) {
    assert.equal(
      testCase.invariant_kind,
      "private_identifier_not_canonical_label",
      `${label}.${testCase.case_id}.invariant_kind`,
    );
    assert.ok(
      testCase.reason_codes.includes("privacy_guard_required"),
      `${label}.${testCase.case_id} must require privacy guard`,
    );
    assertAllowedBoundaryStatement(testCase.statement, `${label}.${testCase.case_id}`);
    assertAuthorityBoundary(
      testCase.authority_boundary,
      `${label}.${testCase.case_id}.authority_boundary`,
    );
  }
}

function assertAllowedBoundaryStatement(statement, label) {
  const normalized = normalizeCaseText(statement);
  const allowed =
    /\bnot\b/.test(normalized) ||
    /\bcannot\b/.test(normalized) ||
    /\brequires?\b/.test(normalized) ||
    /\bremains parked\b/.test(normalized) ||
    /\bdisabled\b/.test(normalized);
  assert.equal(allowed, true, `${label} must be a local boundary statement`);
  assert.equal(
    classifyStatementText(normalized),
    false,
    `${label} must not classify as a positive authority claim`,
  );
}

function classifySegmentedForbiddenCase(testCase) {
  const reconstructed = normalizeCaseText(testCase.statement_segments.join(""));
  assert.equal(
    /\bnot\b|\bcannot\b|\bremains parked\b/.test(reconstructed),
    false,
    `${testCase.case_id} must not rely on local negation`,
  );
  return classifyStatementText(reconstructed, testCase.invariant_kind);
}

function classifyStatementText(normalizedText, expectedKind) {
  if (/\bnot\b|\bcannot\b|\bremains parked\b|\brequires?\b|\bdisabled\b/.test(normalizedText)) {
    return false;
  }
  const checks = [
    {
      kind: "candidate_not_proof",
      all: ["candidate", "proof"],
    },
    {
      kind: "provider_output_not_evidence",
      all: ["provider output", "accepted evidence"],
    },
    {
      kind: "retrieval_result_not_promotion",
      all: ["retrieval result", "promotes", "perspective state"],
    },
    {
      kind: "codex_result_not_state",
      all: ["codex result", "durable state"],
    },
    {
      kind: "dataset_row_not_training_data",
      all: ["dataset row", "training data"],
    },
    {
      kind: "feedback_not_truth",
      all: ["feedback", "truth"],
    },
    {
      kind: "git_ref_not_authority",
      all: ["git ref", "authority"],
    },
    {
      kind: "github_pr_not_core_decision",
      all: ["github pr", "core decision"],
    },
    {
      kind: "ci_pass_not_truth",
      all: ["ci pass", "proof"],
    },
    {
      kind: "smoke_pass_not_truth",
      all: ["smoke pass", "proof"],
    },
    {
      kind: "git_ledger_packet_not_commit",
      all: ["git ledger packet", "commit"],
    },
    {
      kind: "product_write_gate_required",
      all: ["product-write", "available", "without reentry"],
    },
  ];
  const candidates = expectedKind
    ? checks.filter((check) => check.kind === expectedKind)
    : checks;
  return candidates.some((check) =>
    check.all.every((fragment) => normalizedText.includes(fragment)),
  );
}

function normalizeCaseText(value) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[{}()[\]"'`<>]/g, " ");
}

function assertSafeMarkerPlacement() {
  const pathsByMarker = [];
  walkJson(fixture, "$", (value, jsonPath) => {
    if (typeof value !== "string") {
      return;
    }
    for (const marker of safeFixtureMarkers) {
      if (value.includes(marker)) {
        pathsByMarker.push({ marker, jsonPath });
      }
    }
  });
  const allowedMarkerPathPrefix =
    "$.blocked_private_or_raw_payload_example.blocked_fixture_markers";
  assert.ok(pathsByMarker.length > 0, "fixture must include safe blocked markers");
  for (const { marker, jsonPath } of pathsByMarker) {
    assert.ok(
      jsonPath.startsWith(allowedMarkerPathPrefix),
      `${marker} may appear only inside blocked private/raw fixture markers; found ${jsonPath}`,
    );
  }
  for (const marker of safeFixtureMarkers) {
    assert.ok(
      fixture.blocked_private_or_raw_payload_example.blocked_fixture_markers.includes(
        marker,
      ),
      `blocked private/raw example must include ${marker}`,
    );
  }
}

function assertNoLiveLookingPrivateExamples() {
  const newSliceSources = [
    [docsPath, docs],
    [typePath, types],
    [fixturePath, fixtureText],
    [smokePath, smokeSource],
  ];
  for (const [filePath, source] of newSliceSources) {
    for (const pattern of liveLookingPrivatePatterns) {
      assert.ok(
        !pattern.test(source),
        `${filePath} must not include live-looking private/provider/secret examples: ${pattern}`,
      );
    }
  }
}

function assertNarrowSliceFileScope() {
  for (const expectedPath of expectedSliceFiles) {
    assert.ok(existsSync(expectedPath), `expected slice file must exist: ${expectedPath}`);
  }
  const unexpected = [];
  for (const filePath of walk(".")) {
    if (
      /formal[-_]invariant[-_]checks[-_]narrow[-_]scope/i.test(filePath) &&
      !expectedSliceFiles.includes(filePath)
    ) {
      unexpected.push(filePath);
    }
  }
  assert.deepEqual(
    unexpected.sort(),
    [],
    "formal invariant checks slice files must stay in the expected file set",
  );
}

function assertNoRuntimeCapabilityFiles() {
  const forbiddenRuntimePaths = [
    /^app\/api\//,
    /^components\/.*formal.*invariant/i,
    /^lib\/authority-boundary\/formal-invariant-checks-narrow-scope\.ts$/,
    /^lib\/.*formal.*invariant/i,
    /^db\//,
    /^migrations\//,
  ];
  const unexpected = [];
  for (const filePath of walk(".")) {
    const normalized = filePath.replaceAll(path.sep, "/");
    if (expectedSliceFiles.includes(normalized)) {
      continue;
    }
    if (
      /formal[-_]invariant[-_]checks[-_]narrow[-_]scope/i.test(normalized) &&
      forbiddenRuntimePaths.some((pattern) => pattern.test(normalized))
    ) {
      unexpected.push(normalized);
    }
  }
  assert.deepEqual(
    unexpected.sort(),
    [],
    "no runtime, route, UI, DB, provider, retrieval, Git/GitHub, Codex, product-write, or product ID allocation files may be added",
  );
}

function assertNoLeanRuntimeFilesOrPackageDependency() {
  assert.equal(
    packageJson.dependencies?.lean,
    undefined,
    "package dependencies must not add Lean",
  );
  assert.equal(
    packageJson.devDependencies?.lean,
    undefined,
    "package devDependencies must not add Lean",
  );
  for (const [scriptName, scriptValue] of Object.entries(packageJson.scripts ?? {})) {
    if (scriptName === packageScriptName) {
      continue;
    }
    assert.ok(
      !/\blean\b|lean-toolchain|lakefile/i.test(scriptValue),
      `package script must not add Lean execution: ${scriptName}`,
    );
  }
  const leanFiles = walk(".").filter((filePath) =>
    /(^|\/)(lean-toolchain|lakefile\.toml)$|\.lean$/i.test(filePath),
  );
  assert.deepEqual(leanFiles, [], "no Lean dependency or Lean build config may be added");
}

function walkJson(value, jsonPath, visitor) {
  visitor(value, jsonPath);
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walkJson(entry, `${jsonPath}.${index}`, visitor));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      walkJson(entry, `${jsonPath}.${key}`, visitor);
    }
  }
}

function walk(root) {
  const paths = [];
  for (const entry of readdirSync(root)) {
    const fullPath = path.join(root, entry);
    const normalized = fullPath.replaceAll(path.sep, "/");
    if (
      /(^|\/)(node_modules|\.next|\.git|dist|build|coverage|out|\.turbo|\.tmp|tmp)$/.test(
        normalized,
      )
    ) {
      continue;
    }
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      paths.push(...walk(fullPath));
      continue;
    }
    paths.push(normalized);
  }
  return paths;
}
