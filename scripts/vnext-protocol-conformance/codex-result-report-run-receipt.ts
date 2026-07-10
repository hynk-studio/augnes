import assert from "node:assert/strict";

import legacyFixture from "@/fixtures/codex-result-report-ingestion.sample.v0.1.json";
import {
  CODEX_RESULT_MAPPER_PROJECT_ID,
  CODEX_RESULT_MAPPER_RUN_ID,
  codexResultMapperInputFixture,
} from "@/fixtures/vnext/protocol/run-receipt-codex-result-report-v0-1";
import {
  CodexResultReportInputVersionV01,
  CodexResultReportIngestionScopeV01,
  createCodexResultReportFingerprintV01,
  normalizeCodexResultReportV01,
  type CodexResultReportIngestionRecordV01,
  type CodexResultReportInputV01,
} from "@/lib/dogfooding/codex-result-report-normalizer";
import {
  mapCodexResultReportRecordToRunReceiptV01,
  validateCodexResultReportRecordForRunReceiptV01,
  type CodexResultReportRunReceiptInputV01,
  type CodexResultReportRunReceiptMappingResultV01,
} from "@/lib/vnext/compat/run-receipt-from-codex-result-report";
import { canonicalizeRunReceiptValueV01 } from "@/lib/vnext/run-receipt";

const LEGACY_FIXED_FINGERPRINT =
  "sha256:85db515845f9512f3542e1e5e6f3b6e786c5d3d82ca365c509f863917be7d77b";
const MAPPED_RECEIPT_ID = "run-receipt:b5122120a1a997a69ff6b703";
const MAPPED_IDEMPOTENCY_KEY =
  "sha256:115764af9ded4e331a86c111644d2552d24ee8e3e0cae7b1c14b5a9ad3b3a32a";
const MAPPED_FINGERPRINT =
  "sha256:4fddb2a3f8c82d6650d18f2bc942ff6efd4973d17e3fde1e3ca2646d8648588f";

export interface CodexResultReportRunReceiptConformanceSummaryV01 {
  suite: "codex-result-report-run-receipt-compat-v0.1";
  status: "passed";
  positive_fixture_count: number;
  blocked_invalid_fixture_count: number;
  semantic_non_promotion_case_count: number;
  source_record_fingerprint: string;
  mapped_receipt_id: string;
  mapped_idempotency_key: string;
  mapped_fingerprint: string;
  direct_observations_from_legacy_fields: 0;
  verified_external_observations_from_legacy_fields: 0;
  check_pass_inferred: false;
  blocked_sources_produced_receipts: 0;
  deterministic_mapping: true;
  explicit_project_identity_checked: true;
  source_validation_checked: true;
}

export function runCodexResultReportRunReceiptConformanceV01():
  CodexResultReportRunReceiptConformanceSummaryV01 {
  const canonicalRecord = normalizeCodexResultReportV01(
    legacyFixture.safe_input_example,
  );
  assert.equal(canonicalRecord.report_fingerprint, LEGACY_FIXED_FINGERPRINT);
  const canonicalSourceValidation =
    validateCodexResultReportRecordForRunReceiptV01(canonicalRecord);
  assert.equal(
    canonicalSourceValidation.status,
    "valid",
    format(canonicalSourceValidation),
  );

  const canonicalInput = codexResultMapperInputFixture(canonicalRecord);
  const canonicalResult = mapCodexResultReportRecordToRunReceiptV01(
    deepFreeze(clone(canonicalInput)),
  );
  const receipt = requireMapped("canonical_safe_legacy_fixture", canonicalResult);
  assert.equal(receipt.receipt_id, MAPPED_RECEIPT_ID);
  assert.equal(receipt.idempotency_key, MAPPED_IDEMPOTENCY_KEY);
  assert.equal(receipt.integrity.fingerprint, MAPPED_FINGERPRINT);
  assert.equal(receipt.workspace_id, canonicalInput.workspace_id);
  assert.equal(receipt.project_id, canonicalInput.project_id);
  assert.equal(receipt.run_id, canonicalInput.run_id);
  assert.notEqual(receipt.project_id, canonicalRecord.scope);
  assert.equal(receipt.observations.length, 0);
  assert.equal(receipt.observer_refs.length, 0);
  assert.equal(receipt.trust_summary.direct_observations, 0);
  assert.equal(receipt.trust_summary.verified_external_observations, 0);
  assert.ok(
    receipt.attestations.every(
      (item) => item.trust_class === "imported_unverified",
    ),
  );
  assert.equal(receipt.execution.status, "unknown");
  assert.equal(receipt.execution.basis, "attested");
  assert.equal(receipt.verification.status, "unknown");
  assert.equal(receipt.verification.basis, "attested");
  assert.deepEqual(receipt.verification.required_check_ids, []);
  assert.ok(receipt.changed_artifacts.every((item) => item.basis === "attested"));
  assert.ok(
    receipt.changed_artifacts.every(
      (item) =>
        item.change_kind === "unknown" &&
        item.before_hash === null &&
        item.after_hash === null,
    ),
  );
  assert.equal(
    receipt.changed_artifacts.length,
    new Set(canonicalRecord.changed_file_refs).size,
    "overlapping observed/changed file claims must not duplicate changed artifacts",
  );
  assert.equal(
    receipt.artifact_refs.length,
    new Set([
      ...canonicalRecord.observed_file_refs,
      ...canonicalRecord.changed_file_refs,
    ]).size,
    "file refs shared across legacy collections must deduplicate",
  );
  assert.ok(
    receipt.checks.every(
      (item) =>
        item.required === false &&
        item.status === "unknown" &&
        item.basis === "attested",
    ),
  );
  assert.deepEqual(receipt.skipped_checks, []);
  assert.ok(
    receipt.attestations.some(
      (item) => item.attestation_kind === "skipped_check_claim",
    ),
  );
  assert.equal(receipt.privacy_egress.egress_status, "unknown");
  assert.equal(receipt.privacy_egress.basis, "unknown");
  assert.equal(receipt.cost_usage.cost_basis, "unknown");
  assert.equal(receipt.cost_usage.cost_amount, null);
  assert.equal(receipt.cost_usage.usage.basis, "unknown");
  assert.equal(receipt.model_invocations.length, 0);
  assert.equal(receipt.authority_summary.receipt_is_approval, false);
  assert.equal(receipt.authority_summary.receipt_is_proof, false);
  assert.equal(receipt.authority_summary.receipt_is_accepted_evidence, false);
  assert.equal(receipt.authority_summary.closes_work, false);
  assert.ok(
    receipt.compatibility.external_refs.some(
      (ref) =>
        ref.ref_type === "legacy_scope" &&
        ref.external_id === CodexResultReportIngestionScopeV01,
    ),
  );

  const minimalRecord = normalizeCodexResultReportV01(minimalInput());
  assert.equal(minimalRecord.status, "candidate_only");
  const minimalReceipt = requireMapped(
    "minimal_candidate_only",
    mapCodexResultReportRecordToRunReceiptV01(
      codexResultMapperInputFixture(minimalRecord),
    ),
  );
  assert.equal(
    minimalReceipt.warnings.some(
      (item) => item.code === "legacy_operator_review_required",
    ),
    false,
  );

  const reviewRecord = normalizeCodexResultReportV01({
    ...minimalInput(),
    report_id: "codex-result-report:needs-review-fixture",
    known_warnings: ["warning-ref:operator-review-needed"],
  });
  assert.equal(reviewRecord.status, "needs_operator_review");
  const reviewReceipt = requireMapped(
    "needs_operator_review",
    mapCodexResultReportRecordToRunReceiptV01(
      codexResultMapperInputFixture(reviewRecord),
    ),
  );
  assert.ok(
    reviewReceipt.warnings.some(
      (item) => item.code === "legacy_operator_review_required",
    ),
  );
  assert.equal(reviewReceipt.execution.status, "unknown");
  assert.equal(reviewReceipt.verification.status, "unknown");
  assert.equal(reviewReceipt.authority_summary.closes_work, false);

  const alternateProjectInput = codexResultMapperInputFixture(canonicalRecord);
  alternateProjectInput.project_id = "canonical-project-not-legacy-scope";
  const alternateProjectReceipt = requireMapped(
    "explicit_project_identity_independence",
    mapCodexResultReportRecordToRunReceiptV01(alternateProjectInput),
  );
  assert.equal(
    alternateProjectReceipt.project_id,
    "canonical-project-not-legacy-scope",
  );
  assert.notEqual(alternateProjectReceipt.receipt_id, receipt.receipt_id);
  assert.ok(
    alternateProjectReceipt.compatibility.external_refs.some(
      (ref) => ref.external_id === CodexResultReportIngestionScopeV01,
    ),
  );

  const repeatedResult = mapCodexResultReportRecordToRunReceiptV01(
    deepFreeze(clone(canonicalInput)),
  );
  assert.deepEqual(repeatedResult, canonicalResult);
  const repeated = requireMapped(
    "deterministic_repeat",
    repeatedResult,
  );
  assert.equal(
    canonicalizeRunReceiptValueV01(repeated),
    canonicalizeRunReceiptValueV01(receipt),
  );
  const reorderedRawInput = clone(legacyFixture.safe_input_example);
  for (const field of [
    "observed_files",
    "validation_commands",
    "known_warnings",
    "changed_files_summary",
    "source_refs",
  ] as const) {
    reorderedRawInput[field].reverse();
  }
  const reorderedRecord = normalizeCodexResultReportV01(reorderedRawInput);
  assert.equal(reorderedRecord.report_fingerprint, LEGACY_FIXED_FINGERPRINT);
  const reorderedReceipt = requireMapped(
    "semantically_unordered_source_arrays",
    mapCodexResultReportRecordToRunReceiptV01(
      codexResultMapperInputFixture(reorderedRecord),
    ),
  );
  assert.deepEqual(reorderedReceipt, receipt);

  const blockedPrivate = normalizeCodexResultReportV01(
    legacyFixture.blocked_private_or_raw_payload_example.input,
  );
  const blockedAuthority = normalizeCodexResultReportV01(
    legacyFixture.blocked_forbidden_authority_example.input,
  );
  const rejected = normalizeCodexResultReportV01(
    legacyFixture.malformed_public_safe_examples[0].input,
  );
  const sourceCases: Array<{
    name: string;
    source: CodexResultReportIngestionRecordV01;
    expected: "blocked" | "invalid";
    code: string;
  }> = [
    sourceCase("blocked_private_or_raw_payload", blockedPrivate, "blocked", "source_status_not_mappable"),
    sourceCase("blocked_forbidden_authority", blockedAuthority, "blocked", "source_status_not_mappable"),
    sourceCase("rejected_source_status", rejected, "blocked", "source_status_not_mappable"),
    sourceCase("source_fingerprint_mismatch", mutate(canonicalRecord, (value) => {
      value.report_fingerprint = "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
    }), "invalid", "source_fingerprint_mismatch", false),
    sourceCase("source_record_version_mismatch", mutate(canonicalRecord, (value) => {
      (value as unknown as Record<string, unknown>).record_version = "codex_result_report_ingestion_record.v9";
    }), "invalid", "source_record_version_mismatch"),
    sourceCase("source_scope_mismatch", mutate(canonicalRecord, (value) => {
      (value as unknown as Record<string, unknown>).scope = "project:other";
    }), "invalid", "source_scope_mismatch"),
    sourceCase("malformed_source_reported_at", mutate(canonicalRecord, (value) => {
      value.reported_at = "2026-07-10";
    }), "invalid", "source_timestamp_invalid"),
    sourceCase("tampered_legacy_authority_boundary", mutate(canonicalRecord, (value) => {
      (value.authority_boundary as unknown as Record<string, unknown>).report_is_truth = true;
    }), "blocked", "source_authority_boundary_invalid"),
    sourceCase("unknown_authority_grant_field", mutate(canonicalRecord, (value) => {
      (value.authority_boundary as unknown as Record<string, unknown>).approval_granted = true;
    }), "blocked", "source_unknown_authority_field"),
    sourceCase("legacy_privacy_report_not_passed", mutate(canonicalRecord, (value) => {
      value.privacy_report.status = "blocked_private_or_raw_payload";
    }), "blocked", "source_privacy_not_passed"),
    sourceCase("absolute_local_path", mutate(canonicalRecord, (value) => {
      value.observed_file_refs.push("/Users/example/private-file.ts");
    }), "blocked", "source_absolute_local_path_forbidden"),
    sourceCase("secret_shaped_source_value", mutate(canonicalRecord, (value) => {
      value.known_warning_refs.push("token=abcdefghijk12345");
    }), "blocked", "secret_shaped_material"),
    sourceCase("raw_prompt_field", mutate(canonicalRecord, (value) => {
      (value as unknown as Record<string, unknown>).raw_prompt = "forbidden payload";
    }), "blocked", "raw_prompt_shaped_field"),
    sourceCase("malformed_review_cue", mutate(canonicalRecord, (value) => {
      (value.review_cues[0] as unknown as Record<string, unknown>).source_refs = "not-an-array";
    }), "invalid", "source_array_malformed"),
    sourceCase("malformed_source_array", mutate(canonicalRecord, (value) => {
      (value as unknown as Record<string, unknown>).observed_check_refs = "not-an-array";
    }), "invalid", "source_array_malformed"),
    sourceCase("unsupported_source_report_kind", mutate(canonicalRecord, (value) => {
      (value as unknown as Record<string, unknown>).report_kind = "unsupported_kind";
    }), "invalid", "source_report_kind_unsupported"),
    sourceCase("direct_observation_object_injection", mutate(canonicalRecord, (value) => {
      (value.observed_file_refs as unknown[]).push({
        observation_id: "forged-observation",
        trust_class: "direct_local_observation",
      });
    }), "invalid", "source_string_array_malformed"),
  ];
  for (const testCase of sourceCases) {
    assertNoReceipt(
      testCase.name,
      mapCodexResultReportRecordToRunReceiptV01(
        codexResultMapperInputFixture(testCase.source),
      ),
      testCase.expected,
      testCase.code,
    );
  }

  const inputCases: Array<{
    name: string;
    mutate: (input: CodexResultReportRunReceiptInputV01) => void;
    code: string;
  }> = [
    { name: "missing_explicit_workspace_id", mutate: (value) => { value.workspace_id = ""; }, code: "workspace_id_missing" },
    { name: "missing_explicit_project_id", mutate: (value) => { value.project_id = ""; }, code: "project_id_missing" },
    { name: "missing_explicit_run_id", mutate: (value) => { value.run_id = ""; }, code: "run_id_missing" },
    { name: "missing_explicit_recorded_at", mutate: (value) => { value.recorded_at = ""; }, code: "recorded_at_invalid" },
    { name: "missing_explicit_data_classification", mutate: (value) => {
      (value as unknown as Record<string, unknown>).data_classification = undefined;
    }, code: "data_classification_invalid" },
  ];
  for (const testCase of inputCases) {
    const invalidInput = clone(canonicalInput);
    testCase.mutate(invalidInput);
    assertNoReceipt(
      testCase.name,
      mapCodexResultReportRecordToRunReceiptV01(invalidInput),
      "invalid",
      testCase.code,
    );
  }

  const passTextRecord = normalizeCodexResultReportV01({
    ...minimalInput(),
    report_id: "codex-result-report:status-passed-text",
    observed_checks: ["check-ref:claimed status:passed"],
  });
  const passTextReceipt = requireMapped(
    "status_passed_text_not_promoted",
    mapCodexResultReportRecordToRunReceiptV01(
      codexResultMapperInputFixture(passTextRecord),
    ),
  );
  assert.equal(passTextReceipt.checks.length, 1);
  assert.equal(passTextReceipt.checks[0]?.status, "unknown");
  assert.equal(passTextReceipt.verification.status, "unknown");
  assert.equal(passTextReceipt.observations.length, 0);

  const directNameRecord = normalizeCodexResultReportV01({
    ...minimalInput(),
    report_id: "codex-result-report:direct-observation-name",
    observed_files: ["direct_local_observation:src/example.ts"],
  });
  const directNameReceipt = requireMapped(
    "direct_observation_name_not_promoted",
    mapCodexResultReportRecordToRunReceiptV01(
      codexResultMapperInputFixture(directNameRecord),
    ),
  );
  assert.equal(directNameReceipt.observations.length, 0);
  assert.equal(directNameReceipt.trust_summary.direct_observations, 0);

  assert.equal(CODEX_RESULT_MAPPER_PROJECT_ID, receipt.project_id);
  assert.equal(CODEX_RESULT_MAPPER_RUN_ID, receipt.run_id);
  return {
    suite: "codex-result-report-run-receipt-compat-v0.1",
    status: "passed",
    positive_fixture_count: 5,
    blocked_invalid_fixture_count: sourceCases.length + inputCases.length,
    semantic_non_promotion_case_count: 2,
    source_record_fingerprint: canonicalRecord.report_fingerprint,
    mapped_receipt_id: receipt.receipt_id,
    mapped_idempotency_key: receipt.idempotency_key,
    mapped_fingerprint: receipt.integrity.fingerprint,
    direct_observations_from_legacy_fields: 0,
    verified_external_observations_from_legacy_fields: 0,
    check_pass_inferred: false,
    blocked_sources_produced_receipts: 0,
    deterministic_mapping: true,
    explicit_project_identity_checked: true,
    source_validation_checked: true,
  };
}

function minimalInput(): CodexResultReportInputV01 {
  return {
    input_version: CodexResultReportInputVersionV01,
    scope: CodexResultReportIngestionScopeV01,
    report_id: "codex-result-report:minimal-candidate",
    report_kind: "unknown",
    reported_at: "2026-07-10T08:00:00.000Z",
    operator_actor_ref: "operator-ref:fixture-reviewer",
    codex_claimed_summary: "Minimal candidate-only compatibility source.",
  };
}

function sourceCase(
  name: string,
  source: CodexResultReportIngestionRecordV01,
  expected: "blocked" | "invalid",
  code: string,
  resign = true,
) {
  if (resign && !source.status.startsWith("blocked_") && source.status !== "rejected") {
    source.report_fingerprint = createCodexResultReportFingerprintV01(source);
  }
  return { name, source, expected, code };
}

function mutate(
  source: CodexResultReportIngestionRecordV01,
  mutation: (value: CodexResultReportIngestionRecordV01) => void,
) {
  const result = clone(source);
  mutation(result);
  return result;
}

function requireMapped(
  name: string,
  result: CodexResultReportRunReceiptMappingResultV01,
) {
  assert.equal(result.status, "mapped", `${name}: ${format(result)}`);
  assert.ok(result.receipt, `${name} must produce a receipt`);
  return result.receipt;
}

function assertNoReceipt(
  name: string,
  result: CodexResultReportRunReceiptMappingResultV01,
  expected: "blocked" | "invalid",
  code: string,
) {
  assert.equal(result.status, expected, `${name}: ${format(result)}`);
  assert.equal(result.receipt, null, `${name} must not produce a receipt`);
  assert.ok(
    result.errors.some((issue) => issue.code === code),
    `${name} must report ${code}: ${format(result)}`,
  );
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value as Record<string, unknown>).forEach(deepFreeze);
  return Object.freeze(value);
}

function format(value: unknown) {
  return JSON.stringify(value, null, 2);
}
