#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const docsPath = "docs/EMPIRICAL_CALIBRATION_DATASET_V0_1.md";
const typePath = "types/empirical-calibration-dataset.ts";
const fixturePath = "fixtures/empirical-calibration-dataset.sample.v0.1.json";
const smokePath = "scripts/smoke-empirical-calibration-dataset-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const deterministicCrpfDocsPath = "docs/DETERMINISTIC_CRPF_VARIANT_REVIEW_V0_1.md";
const deterministicCrpfTypesPath = "types/deterministic-crpf-variant-review.ts";
const deterministicCrpfFixturePath =
  "fixtures/deterministic-crpf-variant-review.sample.v0.1.json";
const codexResultDocsPath = "docs/CODEX_RESULT_REPORT_INGESTION_V0_1.md";
const temporalHandoffDocsPath =
  "docs/TEMPORAL_HANDOFF_USEFULNESS_EXPERIMENT_PLAN_V0_1.md";
const productWriteTargetDocsPath = "docs/PRODUCT_WRITE_TARGET_CONTRACT_V0_1.md";
const authorityBoundaryDocsPath = "docs/AUTHORITY_BOUNDARY_REGRESSION_CI_V0_1.md";
const privacyGuardDocsPath = "docs/PRIVACY_REDACTION_RUNTIME_GUARD_V0_1.md";
const localDataPolicyDocsPath = "docs/LOCAL_DATA_EXPORT_IMPORT_POLICY_V0_1.md";

const fixtureVersion = "empirical_calibration_dataset.sample.v0.1";
const contractVersion = "empirical_calibration_dataset.v0.1";
const rowVersion = "empirical_calibration_dataset_row.v0.1";
const bundleVersion = "empirical_calibration_dataset_bundle.v0.1";
const scope = "project:augnes";
const packageScriptName = "smoke:empirical-calibration-dataset-v0-1";
const packageScriptValue =
  "node scripts/smoke-empirical-calibration-dataset-v0-1.mjs";

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
  "offline_diagnostic_only",
  "ready_for_future_operator_review",
  "blocked_private_or_raw_payload",
  "blocked_forbidden_authority",
  "rejected",
];

const candidateFamilies = [
  "manual_note_candidate",
  "provider_extraction_candidate",
  "retrieval_context_candidate",
  "feedback_to_rule_candidate",
  "codex_result_candidate",
  "temporal_handoff_candidate",
  "crpf_variant_candidate",
  "unknown",
];

const readinessLabels = [
  "low",
  "medium",
  "high",
  "needs_operator_review",
  "blocked",
  "unknown",
];

const handoffOutcomes = [
  "improved_missing_file_detection",
  "improved_missing_check_detection",
  "preserved_unresolved_tension",
  "reduced_overclaim",
  "no_observed_change",
  "worsened_handoff_quality",
  "inconclusive",
  "not_used",
];

const codexReviewOutcomes = [
  "accepted_as_review_cue",
  "requested_changes",
  "rejected_as_overclaim",
  "missing_validation",
  "missing_expected_files",
  "authority_boundary_issue",
  "privacy_boundary_issue",
  "inconclusive",
];

const notDoneClassifications = [
  "correctly_preserved",
  "incorrectly_claimed_done",
  "missing_from_report",
  "ambiguous",
  "not_applicable",
];

const laterReviewOutcomes = [
  "later_confirmed_useful",
  "later_corrected",
  "later_rejected",
  "later_superseded",
  "later_deferred",
  "later_needs_more_evidence",
  "unknown",
];

const reasonCodes = [
  "empirical_calibration_dataset_only",
  "offline_diagnostic_only",
  "calibration_training_disabled_by_default",
  "training_not_executed",
  "learning_not_executed",
  "rule_mutation_not_executed",
  "feedback_not_truth",
  "readiness_label_not_truth",
  "diagnostic_reason_code_not_truth",
  "validation_pass_not_truth",
  "validation_failure_not_rejection",
  "codex_result_not_proof",
  "handoff_outcome_not_approval",
  "later_review_outcome_not_truth",
  "candidate_not_fact",
  "candidate_not_proof",
  "candidate_not_accepted_evidence",
  "source_refs_required",
  "privacy_guard_required",
  "temporal_handoff_experiment_ref_present",
  "deterministic_crpf_variant_ref_present",
  "product_write_denied",
  "provider_call_not_executed",
  "prompt_not_sent",
  "source_fetch_not_executed",
  "retrieval_not_executed",
  "rag_answer_not_generated",
  "db_write_not_executed",
  "telemetry_not_ingested",
  "proof_not_created",
  "evidence_not_created",
  "promotion_not_executed",
  "durable_state_not_mutated",
  "formation_receipt_not_written",
  "codex_not_executed",
  "git_github_not_executed",
  "local_export_not_executed",
  "product_id_allocation_not_executed",
  "smoke_pass_not_truth",
  "ci_pass_not_truth",
  "raw_private_payload_blocked",
  "private_url_blocked",
  "local_private_path_blocked",
  "secret_like_pattern_blocked",
  "provider_thread_run_session_id_blocked",
];

const authorityAllowedTrueFields = [
  "empirical_calibration_dataset_contract_now",
  "contract_only",
  "fixture_only",
  "offline_diagnostic_only",
  "calibration_training_allowed_default_false",
  "caller_provided_fixture_only",
];

const authorityFalseFields = [
  "training_runtime_now",
  "automatic_learning_now",
  "rule_mutation_now",
  "prompt_mutation_now",
  "parser_mutation_now",
  "ranking_mutation_now",
  "surfacing_mutation_now",
  "telemetry_ingestion_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "source_fetch_now",
  "retrieval_execution_now",
  "rag_answer_generation_now",
  "db_query_or_write_now",
  "route_now",
  "ui_now",
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
  "readiness_label_is_truth",
  "diagnostic_reason_code_is_truth",
  "validation_pass_is_truth",
  "validation_failure_is_rejection",
  "codex_result_is_proof",
  "handoff_outcome_is_approval",
  "later_review_outcome_is_truth",
  "dataset_row_is_training_data",
  "dataset_row_is_proof",
  "dataset_row_is_accepted_evidence",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
];

const requiredDocsSections = [
  "## Purpose",
  "## Relationship to docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md",
  "## Relationship to Deterministic CRPF Variant Review",
  "## Relationship to Temporal Handoff Usefulness Experiment",
  "## Relationship to Codex Result Report Ingestion",
  "## Relationship to Candidate Lifecycle, Calibration Diagnostic, Feedback, Review Memory, and Validation Reports",
  "## Relationship to Privacy Redaction Runtime Guard",
  "## Relationship to Authority Boundary Regression CI",
  "## Relationship to Product Write Target Contract",
  "## Dataset Row Shape",
  "## Dataset Bundle Shape",
  "## Training-Disabled Policy",
  "## Offline Diagnostic Policy",
  "## Privacy/Redaction Policy",
  "## Non-Authority Policy",
  "## Authority Boundary",
  "## Fixture Policy",
  "## Verification Expectations",
  "## Deferred Work",
];

const docsExactPhrases = [
  "This slice is contract-only and fixture-only.",
  "This slice is offline diagnostic only.",
  "calibration_training_allowed is false by default.",
  "This slice does not execute training.",
  "This slice does not execute automatic learning.",
  "This slice does not mutate rules.",
  "This slice does not mutate prompts.",
  "This slice does not mutate parsers.",
  "This slice does not mutate ranking.",
  "This slice does not mutate surfacing.",
  "This slice does not ingest telemetry runtime data.",
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
  "Feedback is not truth.",
  "Readiness label is not truth.",
  "Diagnostic reason code is not truth.",
  "Validation pass is not truth.",
  "Validation failure is not automatic rejection.",
  "Codex result is not proof.",
  "Handoff outcome is not approval.",
  "Later review outcome is not truth.",
  "Dataset row is not proof.",
  "Dataset row is not accepted evidence.",
  "Dataset row is not training data unless a future explicit approval changes policy.",
  "Smoke/CI pass is not truth.",
  "The roadmap guide is not SSOT.",
];

const requiredTypeExports = [
  "EmpiricalCalibrationDatasetContractVersion",
  "EmpiricalCalibrationDatasetRowVersion",
  "EmpiricalCalibrationDatasetBundleVersion",
  "EmpiricalCalibrationDatasetScope",
  "EmpiricalCalibrationDatasetStatuses",
  "EmpiricalCalibrationCandidateFamilies",
  "EmpiricalCalibrationReadinessLabels",
  "EmpiricalCalibrationHandoffOutcomes",
  "EmpiricalCalibrationCodexReviewOutcomes",
  "EmpiricalCalibrationNotDoneClassifications",
  "EmpiricalCalibrationLaterReviewOutcomes",
  "EmpiricalCalibrationReasonCodes",
  "EmpiricalCalibrationAuthorityBoundary",
  "EmpiricalCalibrationDatasetRow",
  "EmpiricalCalibrationDatasetBundle",
  "EmpiricalCalibrationValidationFinding",
];

const requiredRowFields = [
  "row_id",
  "dataset_version",
  "scope",
  "candidate_ref",
  "candidate_family",
  "initial_readiness_label",
  "diagnostic_reason_codes",
  "lifecycle_status_ref",
  "feedback_event_refs",
  "handoff_used",
  "handoff_profile_ref",
  "handoff_outcome",
  "codex_result_report_ref",
  "codex_review_outcome",
  "not_done_classification",
  "validation_command_refs",
  "validation_skipped_refs",
  "validation_warning_refs",
  "validation_failure_refs",
  "validation_pass_refs",
  "later_review_outcome",
  "later_review_reason_codes",
  "expected_observed_delta_refs",
  "temporal_handoff_experiment_refs",
  "deterministic_crpf_variant_refs",
  "source_refs",
  "privacy_report",
  "calibration_training_allowed",
  "boundary_notes",
  "reason_codes",
  "authority_boundary",
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
  deterministicCrpfDocsPath,
  deterministicCrpfTypesPath,
  deterministicCrpfFixturePath,
  codexResultDocsPath,
  temporalHandoffDocsPath,
  productWriteTargetDocsPath,
  authorityBoundaryDocsPath,
  privacyGuardDocsPath,
  localDataPolicyDocsPath,
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
  roadmap.includes("empirical_calibration_dataset_v0_1"),
  "roadmap must contain empirical_calibration_dataset_v0_1",
);
assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue);
assert.ok(index.includes("Empirical Calibration Dataset v0.1"));
assert.ok(index.includes("docs/EMPIRICAL_CALIBRATION_DATASET_V0_1.md"));
assert.ok(index.includes("types/empirical-calibration-dataset.ts"));
assert.ok(index.includes("fixtures/empirical-calibration-dataset.sample.v0.1.json"));
assert.ok(index.includes("scripts/smoke-empirical-calibration-dataset-v0-1.mjs"));
assert.ok(index.includes("empirical_calibration_dataset_v0_1"));
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
  rowVersion,
  bundleVersion,
  scope,
  ...statuses,
  ...candidateFamilies,
  ...readinessLabels,
  ...handoffOutcomes,
  ...codexReviewOutcomes,
  ...notDoneClassifications,
  ...laterReviewOutcomes,
  ...reasonCodes,
  ...authorityAllowedTrueFields,
  ...authorityFalseFields,
]) {
  assert.ok(types.includes(value), `types must include ${value}`);
}

assert.equal(fixture.fixture_version, fixtureVersion);
assert.equal(fixture.contract_version, contractVersion);
assert.equal(fixture.row_version, rowVersion);
assert.equal(fixture.bundle_version, bundleVersion);
assert.equal(fixture.scope, scope);
assert.ok(fixture.dataset_bundle_example, "fixture must include dataset bundle");
assert.ok(Array.isArray(fixture.rows), "fixture must include rows");
assert.ok(
  fixture.blocked_private_or_raw_payload_example,
  "fixture must include blocked private/raw example",
);
assert.ok(
  fixture.blocked_forbidden_authority_example,
  "fixture must include blocked forbidden authority example",
);
assert.ok(fixture.training_disabled_example, "fixture must include training disabled example");
assert.ok(
  fixture.deterministic_repeatability_example,
  "fixture must include deterministic repeatability example",
);

assertAuthorityBoundary(fixture.authority_boundary_sample, "$.authority_boundary_sample");
assertAuthorityBoundary(
  fixture.dataset_bundle_example.authority_boundary,
  "$.dataset_bundle_example.authority_boundary",
);
assert.equal(fixture.dataset_bundle_example.bundle_version, bundleVersion);
assert.equal(fixture.dataset_bundle_example.contract_version, contractVersion);
assert.equal(fixture.dataset_bundle_example.row_version, rowVersion);
assert.equal(fixture.dataset_bundle_example.scope, scope);
assert.equal(fixture.dataset_bundle_example.status, "offline_diagnostic_only");
assert.equal(fixture.dataset_bundle_example.calibration_training_allowed_default, false);
assert.ok(
  Array.isArray(fixture.dataset_bundle_example.rows),
  "dataset bundle must contain rows",
);
assert.equal(
  fixture.dataset_bundle_example.row_count,
  fixture.dataset_bundle_example.rows.length,
  "dataset bundle row_count must match embedded rows",
);
assert.deepEqual(
  fixture.dataset_bundle_example.rows.map((row) => row.row_id),
  fixture.rows.map((row) => row.row_id),
  "top-level rows must match bundle rows by row_id and order",
);

assertCandidateFamilyCoverage(fixture.rows, "$.rows");
assertCandidateFamilyCoverage(fixture.dataset_bundle_example.rows, "$.dataset_bundle_example.rows");
assert.deepEqual(
  fixture.dataset_bundle_example.candidate_families_covered.sort(),
  [...candidateFamilies].sort(),
  "dataset bundle must list all candidate families",
);

for (const row of fixture.dataset_bundle_example.rows) {
  assertDatasetRow(row, `$.dataset_bundle_example.rows.${row.row_id}`);
}
for (const row of fixture.rows) {
  assertDatasetRow(row, `$.rows.${row.row_id}`);
}

for (const family of candidateFamilies) {
  assert.ok(
    fixture.row_examples_by_candidate_family?.[family],
    `row_examples_by_candidate_family must include ${family}`,
  );
  assert.equal(
    fixture.rows.some(
      (row) => row.row_id === fixture.row_examples_by_candidate_family[family],
    ),
    true,
    `row_examples_by_candidate_family.${family} must reference an existing row`,
  );
}

assert.ok(
  fixture.rows.some(
    (row) =>
      row.validation_command_refs.length > 0 &&
      row.validation_skipped_refs.length > 0 &&
      row.validation_warning_refs.length > 0 &&
      row.validation_failure_refs.length > 0 &&
      row.validation_pass_refs.length > 0,
  ),
  "rows must include validation command/skip/warning/failure/pass refs where relevant",
);
assert.ok(
  fixture.rows.some((row) => row.temporal_handoff_experiment_refs.length > 0),
  "rows must include temporal handoff experiment refs where relevant",
);
assert.ok(
  fixture.rows.some((row) => row.deterministic_crpf_variant_refs.length > 0),
  "rows must include deterministic CRPF variant refs where relevant",
);

assert.equal(
  fixture.blocked_private_or_raw_payload_example.status,
  "blocked_private_or_raw_payload",
);
assert.equal(
  fixture.blocked_forbidden_authority_example.status,
  "blocked_forbidden_authority",
);
assert.equal(
  fixture.blocked_forbidden_authority_example.authority_boundary.training_runtime_now,
  true,
  "blocked forbidden authority example should show forbidden training runtime claim",
);
assert.equal(fixture.training_disabled_example.calibration_training_allowed, false);
assert.equal(fixture.training_disabled_example.calibration_training_allowed_default, false);
assert.equal(fixture.training_disabled_example.safe_rows_checked, fixture.rows.length);

const repeatability = fixture.deterministic_repeatability_example;
assert.deepEqual(
  repeatability.first_row_order,
  repeatability.second_row_order,
  "same fixture input must preserve row order",
);
assert.equal(
  repeatability.first_fingerprint,
  repeatability.second_fingerprint,
  "same fixture input must preserve fingerprint",
);
assert.deepEqual(
  repeatability.first_row_order,
  fixture.rows.map((row) => row.row_id),
  "repeatability row order must match fixture rows",
);

assertSafeMarkerPlacement();
assertNoLiveLookingPrivateExamples();
assertNarrowSliceFileScope();
assertNoRuntimeCapabilityFiles();

assert.equal(
  packageJson.scripts?.["smoke:authority-boundary-regression-v0-1"],
  "node scripts/smoke-authority-boundary-regression-v0-1.mjs",
  "authority boundary regression smoke package script must not be weakened",
);
assert.equal(
  packageJson.scripts?.["smoke:deterministic-crpf-variant-review-v0-1"],
  "node scripts/smoke-deterministic-crpf-variant-review-v0-1.mjs",
  "deterministic CRPF variant review smoke must remain runnable",
);

console.log(
  JSON.stringify(
    {
      ok: true,
      smoke: "empirical-calibration-dataset-v0-1",
      contract_version: contractVersion,
      row_version: rowVersion,
      bundle_version: bundleVersion,
      rows: fixture.rows.length,
      candidate_families: candidateFamilies.length,
      calibration_training_allowed: false,
    },
    null,
    2,
  ),
);

function assertDatasetRow(row, label) {
  for (const field of requiredRowFields) {
    assert.ok(row[field] !== undefined, `${label} missing ${field}`);
  }
  assert.equal(row.dataset_version, contractVersion, `${label}.dataset_version`);
  assert.equal(row.scope, scope, `${label}.scope`);
  assert.ok(candidateFamilies.includes(row.candidate_family), `${label}.candidate_family`);
  assert.ok(
    readinessLabels.includes(row.initial_readiness_label),
    `${label}.initial_readiness_label`,
  );
  assert.ok(handoffOutcomes.includes(row.handoff_outcome), `${label}.handoff_outcome`);
  assert.ok(
    codexReviewOutcomes.includes(row.codex_review_outcome),
    `${label}.codex_review_outcome`,
  );
  assert.ok(
    notDoneClassifications.includes(row.not_done_classification),
    `${label}.not_done_classification`,
  );
  assert.ok(
    laterReviewOutcomes.includes(row.later_review_outcome),
    `${label}.later_review_outcome`,
  );
  assert.equal(
    row.calibration_training_allowed,
    false,
    `${label}.calibration_training_allowed must be false`,
  );
  assert.ok(row.source_refs.length > 0, `${label}.source_refs must not be empty`);
  assert.ok(
    row.diagnostic_reason_codes.length > 0,
    `${label}.diagnostic_reason_codes must not be empty`,
  );
  assert.ok(row.later_review_outcome, `${label}.later_review_outcome must exist`);
  assert.ok(row.not_done_classification, `${label}.not_done_classification must exist`);
  assert.ok(Array.isArray(row.validation_command_refs), `${label}.validation_command_refs`);
  assert.ok(Array.isArray(row.validation_skipped_refs), `${label}.validation_skipped_refs`);
  assert.ok(Array.isArray(row.validation_warning_refs), `${label}.validation_warning_refs`);
  assert.ok(Array.isArray(row.validation_failure_refs), `${label}.validation_failure_refs`);
  assert.ok(Array.isArray(row.validation_pass_refs), `${label}.validation_pass_refs`);
  assert.equal(
    row.privacy_report?.original_value_included,
    false,
    `${label}.privacy_report.original_value_included must be false`,
  );
  assertAuthorityBoundary(row.authority_boundary, `${label}.authority_boundary`);
}

function assertCandidateFamilyCoverage(rows, label) {
  assert.deepEqual(
    rows.map((row) => row.candidate_family).sort(),
    [...candidateFamilies].sort(),
    `${label} must cover every candidate family exactly once`,
  );
  assert.equal(
    new Set(rows.map((row) => row.candidate_family)).size,
    candidateFamilies.length,
    `${label} must not contain duplicate candidate families`,
  );
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

function assertSafeMarkerPlacement() {
  const markerPaths = [];
  visit(fixture, "$", (value, pathLabel) => {
    if (typeof value !== "string") {
      return;
    }
    for (const marker of safeFixtureMarkers) {
      if (value.includes(marker)) {
        markerPaths.push([marker, pathLabel]);
      }
    }
  });
  assert.ok(markerPaths.length > 0, "fixture must include blocked safe markers");
  for (const [marker, pathLabel] of markerPaths) {
    assert.ok(safeFixtureMarkers.includes(marker), `unknown safe marker ${marker}`);
    assert.ok(
      pathLabel.startsWith(
        "$.blocked_private_or_raw_payload_example.blocked_fixture_markers",
      ),
      `safe marker ${marker} must appear only inside blocked fixture markers`,
    );
  }
}

function assertNoLiveLookingPrivateExamples() {
  const sources = [
    [docsPath, docs],
    [typePath, types],
    [fixturePath, fixtureText],
    [smokePath, smokeSource],
  ];
  for (const [filePath, source] of sources) {
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
    assert.ok(existsSync(expectedPath), `expected slice file missing: ${expectedPath}`);
  }
  const unexpected = [];
  for (const filePath of walk(".")) {
    const normalized = filePath.replaceAll(path.sep, "/");
    if (
      /empirical[-_]calibration[-_]dataset/i.test(normalized) &&
      !expectedSliceFiles.includes(normalized)
    ) {
      unexpected.push(normalized);
    }
  }
  assert.deepEqual(
    unexpected,
    [],
    "slice must not add extra empirical-calibration-dataset files",
  );
}

function assertNoRuntimeCapabilityFiles() {
  const forbiddenRuntimeHits = [];
  for (const filePath of walk(".")) {
    const normalized = filePath.replaceAll(path.sep, "/");
    const isThisSlice = /empirical[-_]calibration[-_]dataset/i.test(normalized);
    if (!isThisSlice) {
      continue;
    }
    if (
      /(^|\/)app\/api\//.test(normalized) ||
      /(^|\/)components\//.test(normalized) ||
      /(^|\/)(?:db|migrations)\//.test(normalized) ||
      /(^|\/)lib\//.test(normalized) ||
      /(provider|retrieval|codex-execution|product-write|product-id|github-api|git-runtime|training-runtime|learning-runtime|telemetry-ingestion|rule-mutation)/i.test(
        normalized,
      )
    ) {
      forbiddenRuntimeHits.push(normalized);
    }
  }
  assert.deepEqual(
    forbiddenRuntimeHits,
    [],
    "slice must not add route/UI/DB/provider/retrieval/GitHub/Git/Codex/product-write/training runtime files",
  );
}

function visit(value, pathLabel, callback) {
  callback(value, pathLabel);
  if (Array.isArray(value)) {
    value.forEach((entry, index) => visit(entry, `${pathLabel}[${index}]`, callback));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      visit(entry, `${pathLabel}.${key}`, callback);
    }
  }
}

function walk(root) {
  const paths = [];
  for (const entry of readdirSync(root)) {
    if (
      entry === ".git" ||
      entry === "node_modules" ||
      entry === ".next" ||
      entry === "dist" ||
      entry === "build" ||
      entry === "coverage"
    ) {
      continue;
    }
    const fullPath = path.join(root, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      paths.push(...walk(fullPath));
    } else {
      paths.push(fullPath.replace(/^\.\//, ""));
    }
  }
  return paths;
}

function readFile(filePath) {
  return readFileSync(filePath, "utf8");
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}
