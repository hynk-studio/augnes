import assert from "node:assert/strict";

import {
  AUTOHUNT_RESULT_INTAKE_FIXED_FINGERPRINT,
  AUTOHUNT_RESULT_MAPPER_PROJECT_ID,
  AUTOHUNT_RESULT_MAPPER_RUN_ID,
  autohuntResultMapperInputFixture,
  canonicalAutohuntResultIntakeFixture,
} from "@/fixtures/vnext/protocol/run-receipt-autohunt-result-intake-v0-1";
import { computeAutohuntResultIntakeFingerprint } from "@/lib/autonomy/read-autohunt-result-intakes";
import {
  buildDeterministicIdempotencyKey,
  fingerprint,
  stripFingerprintPrefix,
} from "@/lib/research-candidate-review/shared-source-chain-guards";
import {
  mapAutohuntResultIntakeToRunReceiptV01,
  type AutohuntResultIntakeRunReceiptInputV01,
  type AutohuntResultIntakeRunReceiptMappingResultV01,
} from "@/lib/vnext/compat/run-receipt-from-autohunt-result-intake";
import { canonicalizeRunReceiptValueV01 } from "@/lib/vnext/run-receipt";
import type { AutohuntResultIntake } from "@/types/autohunt-result-intake";

const MAPPED_RECEIPT_ID = "run-receipt:59f2e07711bc445ec23202d8";
const MAPPED_IDEMPOTENCY_KEY =
  "sha256:74f7f53982c375cd4860674ee0eca02272c6adc921e94a67b333d72edc9890c2";
const MAPPED_FINGERPRINT =
  "sha256:ce639e409d692a2b095abb5fc7e2d792bf0165b0117f79eedd97e0ee3771c48d";

export interface AutohuntResultIntakeRunReceiptConformanceSummaryV01 {
  suite: "autohunt-result-intake-run-receipt-compat-v0.1";
  status: "passed";
  positive_fixture_count: number;
  blocked_invalid_fixture_count: number;
  source_intake_fingerprint: string;
  mapped_receipt_id: string;
  mapped_idempotency_key: string;
  mapped_fingerprint: string;
  observations_from_source_claims: 0;
  blocked_sources_produced_receipts: 0;
  deterministic_mapping: true;
  execution_status_non_promotion_checked: true;
  candidate_non_authority_checked: true;
}

export function runAutohuntResultIntakeRunReceiptConformanceV01():
  AutohuntResultIntakeRunReceiptConformanceSummaryV01 {
  assert.equal(
    computeAutohuntResultIntakeFingerprint(canonicalAutohuntResultIntakeFixture),
    AUTOHUNT_RESULT_INTAKE_FIXED_FINGERPRINT,
    "typed source fixture must remain byte-semantically consistent with current writer output",
  );
  const canonicalInput = autohuntResultMapperInputFixture(
    canonicalAutohuntResultIntakeFixture,
  );
  const canonicalResult = mapAutohuntResultIntakeToRunReceiptV01(
    deepFreeze(clone(canonicalInput)),
  );
  const receipt = mapped("canonical_writer_fixture", canonicalResult);
  assert.equal(receipt.receipt_id, MAPPED_RECEIPT_ID);
  assert.equal(receipt.idempotency_key, MAPPED_IDEMPOTENCY_KEY);
  assert.equal(receipt.integrity.fingerprint, MAPPED_FINGERPRINT);
  assert.equal(receipt.project_id, AUTOHUNT_RESULT_MAPPER_PROJECT_ID);
  assert.equal(receipt.run_id, AUTOHUNT_RESULT_MAPPER_RUN_ID);
  assert.notEqual(receipt.project_id, canonicalAutohuntResultIntakeFixture.scope);
  assert.equal(receipt.observations.length, 0);
  assert.equal(receipt.observer_refs.length, 0);
  assert.equal(receipt.trust_summary.direct_observations, 0);
  assert.equal(receipt.trust_summary.verified_external_observations, 0);
  assert.equal(receipt.reporter_ref.trust_class, "imported_unverified");
  assert.equal(receipt.execution.status, "unknown");
  assert.equal(receipt.execution.basis, "attested");
  assert.equal(receipt.verification.status, "passed");
  assert.equal(receipt.verification.basis, "attested");
  assert.ok(receipt.checks.every((check) => check.status === "passed" && check.basis === "attested" && check.required));
  assert.ok(receipt.changed_artifacts.every((artifact) => artifact.basis === "attested" && artifact.change_kind === "unknown" && artifact.before_hash === null && artifact.after_hash === null));
  assert.deepEqual(receipt.skipped_checks, []);
  assert.equal(receipt.model_invocations.length, 0);
  assert.equal(receipt.privacy_egress.egress_status, "unknown");
  assert.equal(receipt.cost_usage.cost_basis, "unknown");
  assert.equal(receipt.cost_usage.usage.basis, "unknown");
  assert.equal(receipt.authority_summary.receipt_is_accepted_evidence, false);
  assert.equal(receipt.authority_summary.authorizes_execution, false);
  assert.equal(receipt.authority_summary.authorizes_perspective_or_memory_mutation, false);
  assert.equal(receipt.authority_summary.closes_work, false);
  assert.ok(receipt.attestations.some((item) => item.attestation_kind === "source_validation_claim"));
  assert.ok(receipt.attestations.some((item) => item.attestation_kind === "source_row_count_claim"));

  const manual = mapped("manual_operator_report", mapScenario((source) => {
    source.structured_result_report.result_source = "manual_operator_report";
  }));
  assert.equal(manual.reporter_ref.trust_class, "user_declaration");
  assert.ok(manual.attestations.filter((item) => item.reporter_ref.ref_type === "manual_operator_result_report").every((item) => item.trust_class === "user_declaration"));
  assert.equal(manual.observations.length, 0);
  assert.equal(manual.execution.status, "unknown");
  assert.equal(JSON.stringify(manual).includes("human_identity"), false);

  const launcher = mapped("future_launcher_report", mapScenario((source) => {
    source.structured_result_report.result_source = "future_launcher_report";
  }));
  assert.equal(launcher.reporter_ref.trust_class, "host_attestation");
  assert.equal(launcher.execution.status, "unknown");
  assert.equal(launcher.model_invocations.length, 0);
  assert.equal(launcher.observations.length, 0);

  const failed = mapped("failed_check", mapScenario((source) => {
    const [failedCheck, ...passed] = source.expected_observed_delta_candidate.checks_delta.required_checks;
    source.structured_result_report.result_status = "completed_with_warnings";
    source.structured_result_report.checks_run = [failedCheck, ...passed];
    source.structured_result_report.checks_passed = passed;
    source.structured_result_report.checks_failed = [failedCheck];
    source.structured_result_report.warning_reasons = ["required_check_failed"];
  }));
  assert.equal(failed.verification.status, "failed");
  assert.equal(failed.verification.basis, "attested");
  assert.ok(failed.checks.some((check) => check.status === "failed" && check.basis === "attested"));
  assert.equal(failed.execution.status, "unknown");
  assert.equal(failed.authority_summary.closes_work, false);

  const skipped = mapped("skipped_required_check", mapScenario((source) => {
    const [skippedCheck, ...passed] = source.expected_observed_delta_candidate.checks_delta.required_checks;
    source.structured_result_report.result_status = "completed_with_warnings";
    source.structured_result_report.checks_run = passed;
    source.structured_result_report.checks_passed = passed;
    source.structured_result_report.checks_skipped = [skippedCheck];
    source.structured_result_report.warning_reasons = ["required_check_skipped"];
  }));
  assert.equal(skipped.verification.status, "partial");
  assert.deepEqual(skipped.skipped_checks, []);
  assert.ok(skipped.attestations.some((item) => item.attestation_kind === "reported_check_skipped"));
  assert.ok(skipped.gaps.some((item) => item.code === "required_check_reported_skipped"));

  const unknownCheck = mapped("run_check_unknown_outcome", mapScenario((source) => {
    const required = source.expected_observed_delta_candidate.checks_delta.required_checks;
    source.structured_result_report.checks_run = required;
    source.structured_result_report.checks_passed = required.slice(1);
  }));
  assert.equal(unknownCheck.verification.status, "partial");
  assert.ok(unknownCheck.checks.some((check) => check.status === "unknown"));

  const noChecks = mapped("no_checks_run", mapScenario((source) => {
    source.structured_result_report.checks_run = [];
    source.structured_result_report.checks_passed = [];
    source.expected_observed_delta_candidate.checks_delta.required_checks = [];
  }));
  assert.equal(noChecks.verification.status, "not_run");
  assert.deepEqual(noChecks.checks, []);

  for (const status of ["completed", "failed", "blocked", "skipped"] as const) {
    const statusReceipt = mapped(`result_status_${status}_not_promoted`, mapScenario((source) => {
      source.structured_result_report.result_status = status;
    }));
    assert.equal(statusReceipt.execution.status, "unknown");
    assert.ok(statusReceipt.attestations.some((item) => item.attestation_kind === "reported_result_status" && item.summary.includes(status)));
  }

  const alternateInput = clone(canonicalInput);
  alternateInput.project_id = "canonical-project-not-legacy-scope";
  const alternate = mapped("explicit_project_identity", mapAutohuntResultIntakeToRunReceiptV01(alternateInput));
  assert.equal(alternate.project_id, "canonical-project-not-legacy-scope");
  assert.notEqual(alternate.receipt_id, receipt.receipt_id);
  assert.ok(alternate.compatibility.external_refs.some((item) => item.ref_type === "legacy_scope" && item.external_id === "project:augnes"));

  const repeated = mapAutohuntResultIntakeToRunReceiptV01(deepFreeze(clone(canonicalInput)));
  assert.deepEqual(repeated, canonicalResult);
  assert.equal(canonicalizeRunReceiptValueV01(mapped("deterministic_repeat", repeated)), canonicalizeRunReceiptValueV01(receipt));
  const normalizedUnordered = clone(canonicalAutohuntResultIntakeFixture);
  normalizedUnordered.structured_result_report.checks_run.reverse();
  normalizedUnordered.structured_result_report.checks_passed.reverse();
  rebuildWriterSemantics(normalizedUnordered);
  assert.deepEqual(normalizedUnordered, canonicalAutohuntResultIntakeFixture, "writer-set collections must normalize deterministically before mapping");

  const malformedMappingInputs = [null, [], "invalid-input"];
  malformedMappingInputs.forEach((value, index) => noReceipt(`malformed_mapping_input_${index}`, mapAutohuntResultIntakeToRunReceiptV01(value), "invalid", "mapping_input_not_object"));
  const mappingInputCases = [
    ["unknown_mapper_field", "diagnostic_label", "value", "invalid", "mapping_input_unknown_field"],
    ["authority_mapper_field", "approval_granted", true, "blocked", "mapping_input_forbidden_semantic_field"],
  ] as const;
  for (const [name, field, value, status, code] of mappingInputCases) {
    const candidate = clone(canonicalInput) as unknown as Record<string, unknown>; candidate[field] = value;
    const result = mapAutohuntResultIntakeToRunReceiptV01(candidate); noReceipt(name, result, status, code);
    assert.equal(result.source_intake_fingerprint, null);
  }
  const missingSource = clone(canonicalInput) as unknown as Record<string, unknown>; delete missingSource.source_intake;
  noReceipt("missing_source_intake", mapAutohuntResultIntakeToRunReceiptV01(missingSource), "invalid", "source_intake_missing");
  const optionalRefCases = [
    ["malformed_optional_ref", "host_ref", [], "invalid", "external_ref_malformed"],
    ["unknown_optional_ref_field", "work_ref", { ...optionalRef(), diagnostic: "not-echoed" }, "invalid", "mapping_external_ref_unknown_field"],
    ["authority_optional_ref_field", "worker_ref", { ...optionalRef(), authorizes_execution: true }, "blocked", "mapping_external_ref_forbidden_semantic_field"],
  ] as const;
  for (const [name, field, value, status, code] of optionalRefCases) {
    const candidate = clone(canonicalInput) as unknown as Record<string, unknown>; candidate[field] = value;
    const result = mapAutohuntResultIntakeToRunReceiptV01(candidate); noReceipt(name, result, status, code); assert.equal(result.source_intake_fingerprint, null);
  }

  const sourceCases: Array<[string, (source: AutohuntResultIntake) => void, "blocked" | "invalid", string, boolean?]> = [
    ["kind_mismatch", (s) => setAny(s, "result_intake_kind", "other"), "invalid", "source_intake_kind_mismatch"],
    ["version_mismatch", (s) => setAny(s, "result_intake_version", "v9"), "invalid", "source_intake_version_mismatch"],
    ["scope_mismatch", (s) => setAny(s, "scope", "project:other"), "invalid", "source_scope_mismatch"],
    ["non_recorded_status", (s) => { s.result_intake_status = "blocked"; }, "blocked", "source_intake_status_not_mappable"],
    ["malformed_created_at", (s) => { s.created_at = "2026-07-10"; }, "invalid", "source_timestamp_invalid"],
    ["missing_intake_id", (s) => { s.result_intake_id = ""; }, "invalid", "source_string_malformed"],
    ["intake_fingerprint_mismatch", (s) => { s.result_intake_fingerprint = "fnv1a32_canonical_json_v0_1:ffffffff"; }, "invalid", "source_intake_fingerprint_mismatch", false],
    ["intake_id_binding_mismatch", (s) => { s.result_intake_id = "autohunt-result-intake:ffffffff"; }, "invalid", "source_intake_id_idempotency_mismatch"],
    ["validation_passed_false", (s) => { s.validation.passed = false; }, "blocked", "source_validation_flag_false"],
    ["validation_flag_false", (s) => { s.validation.raw_material_absent = false; }, "blocked", "source_validation_flag_false"],
    ["authority_opened", (s) => { setAny(s.authority_boundary, "can_start_runner", true); }, "blocked", "source_authority_boundary_invalid"],
    ["authority_unknown_field", (s) => { setAny(s.authority_boundary, "approval_granted", false); }, "blocked", "source_unknown_authority_or_raw_field"],
    ["persisted_raw_result", (s) => { setAny(s.persisted_material_boundary, "persists_raw_result_text", true); }, "blocked", "source_persisted_material_boundary_invalid"],
    ["persisted_secret", (s) => { setAny(s.persisted_material_boundary, "persists_secret_or_token", true); }, "blocked", "source_persisted_material_boundary_invalid"],
    ["report_raw_result", (s) => { setAny(s.structured_result_report, "raw_result_text_persisted", true); }, "blocked", "source_result_authority_or_raw_boundary_open"],
    ["target_only_false", (s) => { s.validation.target_only_write_proven = false; }, "blocked", "source_validation_flag_false"],
    ["non_target_changed", (s) => { s.row_count_write_summary.non_target_changed_table_count = 1; }, "blocked", "source_row_non_target_boundary_invalid"],
    ["row_arithmetic_mismatch", (s) => { s.row_count_write_summary.target_after_count = 2; }, "blocked", "source_row_target_arithmetic_mismatch"],
    ["report_fingerprint_mismatch", (s) => { s.structured_result_report.result_report_fingerprint = "fnv1a32_canonical_json_v0_1:ffffffff"; }, "invalid", "source_result_report_fingerprint_mismatch"],
    ["delta_fingerprint_mismatch", (s) => { s.expected_observed_delta_candidate.delta_fingerprint = "fnv1a32_canonical_json_v0_1:ffffffff"; }, "invalid", "source_delta_fingerprint_mismatch"],
    ["reuse_fingerprint_mismatch", (s) => { s.reuse_outcome_candidate.outcome_fingerprint = "fnv1a32_canonical_json_v0_1:ffffffff"; }, "invalid", "source_reuse_outcome_fingerprint_mismatch"],
    ["residual_fingerprint_mismatch", (s) => { s.residual_diagnostic_candidate.residual_fingerprint = "fnv1a32_canonical_json_v0_1:ffffffff"; }, "invalid", "source_residual_fingerprint_mismatch"],
    ["unsupported_result_source", (s) => setAny(s.structured_result_report, "result_source", "unsupported"), "invalid", "source_result_type_unknown"],
    ["unsupported_result_status", (s) => setAny(s.structured_result_report, "result_status", "unsupported"), "invalid", "source_result_status_unknown"],
    ...(["branch_created", "pr_created", "github_called", "codex_executed"] as const).map((field) => [`source_${field}_true`, (s: AutohuntResultIntake) => setAny(s.structured_result_report, field, true), "blocked", "source_result_authority_or_raw_boundary_open"] as [string, (source: AutohuntResultIntake) => void, "blocked", string]),
    ["changed_file_count_mismatch", (s) => { s.structured_result_report.changed_file_count = 2; }, "invalid", "source_changed_file_count_mismatch"],
    ["negative_budget", (s) => { s.structured_result_report.budget_used.iterations = -1; }, "invalid", "source_number_invalid"],
    ["non_finite_budget", (s) => { s.structured_result_report.budget_used.tool_calls = Number.POSITIVE_INFINITY; }, "invalid", "source_number_invalid"],
    ["passed_not_run", (s) => { s.structured_result_report.checks_run = []; }, "invalid", "source_passed_check_not_run"],
    ["failed_not_run", (s) => { s.structured_result_report.checks_failed = ["unrun-check"]; }, "invalid", "source_failed_check_not_run"],
    ["pass_fail_conflict", (s) => { s.structured_result_report.checks_failed = [s.structured_result_report.checks_passed[0]!]; }, "blocked", "source_check_pass_fail_conflict"],
    ["pass_skip_conflict", (s) => { s.structured_result_report.checks_skipped = [s.structured_result_report.checks_passed[0]!]; }, "blocked", "source_check_skip_conflict"],
    ["delta_checks_disagree", (s) => { s.expected_observed_delta_candidate.checks_delta.checks_passed = []; }, "invalid", "source_delta_checks_mismatch"],
    ["delta_files_disagree", (s) => { s.expected_observed_delta_candidate.files_delta.changed_files = []; }, "invalid", "source_delta_files_mismatch"],
    ["delta_budget_disagree", (s) => { s.expected_observed_delta_candidate.budget_delta.budget_used.iterations = 0; }, "invalid", "source_delta_budget_mismatch"],
    ["reuse_refs_disagree", (s) => { s.reuse_outcome_candidate.useful_refs = []; }, "invalid", "source_reuse_refs_mismatch"],
    ["unknown_residual_severity", (s) => setAny(s.residual_diagnostic_candidate, "severity", "critical"), "invalid", "source_residual_severity_unknown"],
    ["unknown_residual_category", (s) => setAny(s.residual_diagnostic_candidate, "residual_category", "unknown"), "invalid", "source_residual_category_unknown"],
    ["learning_required_false", (s) => setAny(s.learning_loop_summary, "reuse_outcome_required_satisfied", false), "blocked", "source_learning_loop_required_flag_false"],
  ];
  for (const [name, mutation, expected, code, resign = true] of sourceCases) {
    const source = clone(canonicalAutohuntResultIntakeFixture); mutation(source); if (resign) resignIntake(source);
    noReceipt(name, mapAutohuntResultIntakeToRunReceiptV01(autohuntResultMapperInputFixture(source)), expected, code);
  }

  const unsafeCases: Array<[string, (source: AutohuntResultIntake) => void, string]> = [
    ["private_url_warning", (s) => { s.structured_result_report.warning_reasons = ["https://example.invalid/private"]; }, "https://example.invalid/private"],
    ["secret_shaped_source_ref", (s) => { s.structured_result_report.useful_refs = ["token=abcdefghijk12345"]; }, "token=abcdefghijk12345"],
    ["absolute_changed_path", (s) => { s.structured_result_report.changed_files = ["/Users/example/private.ts"]; }, "/Users/example/private.ts"],
    ["parent_traversal", (s) => { s.structured_result_report.changed_files = ["../outside.ts"]; }, "../outside.ts"],
    ["windows_drive_relative", (s) => { s.structured_result_report.changed_files = ["C:outside.ts"]; }, "C:outside.ts"],
    ["unc_path", (s) => { s.structured_result_report.changed_files = ["\\\\server\\share\\private.ts"]; }, "\\\\server\\share\\private.ts"],
    ["non_symbolic_uri", (s) => { s.structured_result_report.changed_files = ["ssh://host/private.ts"]; }, "ssh://host/private.ts"],
    ["malformed_symbolic_artifact", (s) => { s.structured_result_report.changed_files = ["file-ref:"]; }, "file-ref:"],
    ["raw_prompt_unknown_field", (s) => { setAny(s, "raw_prompt", "unsafe-prompt-value"); }, "unsafe-prompt-value"],
    ["authority_unknown_attack", (s) => { setAny(s.structured_result_report, "approval_granted", "unsafe-authority-value"); }, "unsafe-authority-value"],
  ];
  for (const [name, mutation, unsafeValue] of unsafeCases) {
    const source = clone(canonicalAutohuntResultIntakeFixture); mutation(source); rebuildWriterSemantics(source);
    const result = mapAutohuntResultIntakeToRunReceiptV01(autohuntResultMapperInputFixture(source));
    assert.equal(result.receipt, null, `${name} must not produce a receipt`);
    assert.equal(result.status, "blocked", format(result));
    assert.equal(result.errors.some((item) => item.code === "source_intake_fingerprint_mismatch"), false, `${name} must be re-signed`);
    assert.doesNotMatch(format(result), new RegExp(escape(unsafeValue)), `${name} must not echo unsafe material`);
  }

  return {
    suite: "autohunt-result-intake-run-receipt-compat-v0.1",
    status: "passed",
    positive_fixture_count: 13,
    blocked_invalid_fixture_count: malformedMappingInputs.length + mappingInputCases.length + 1 + optionalRefCases.length + sourceCases.length + unsafeCases.length,
    source_intake_fingerprint: AUTOHUNT_RESULT_INTAKE_FIXED_FINGERPRINT,
    mapped_receipt_id: receipt.receipt_id,
    mapped_idempotency_key: receipt.idempotency_key,
    mapped_fingerprint: receipt.integrity.fingerprint,
    observations_from_source_claims: 0,
    blocked_sources_produced_receipts: 0,
    deterministic_mapping: true,
    execution_status_non_promotion_checked: true,
    candidate_non_authority_checked: true,
  };
}

function mapScenario(mutation: (source: AutohuntResultIntake) => void) {
  const source = clone(canonicalAutohuntResultIntakeFixture); mutation(source); rebuildWriterSemantics(source);
  return mapAutohuntResultIntakeToRunReceiptV01(autohuntResultMapperInputFixture(source));
}

function rebuildWriterSemantics(source: AutohuntResultIntake) {
  const report = source.structured_result_report;
  for (const field of ["checks_run", "checks_passed", "checks_failed", "checks_skipped", "changed_files", "expected_changed_file_globs", "blocker_reasons", "warning_reasons", "useful_refs", "stale_refs", "missing_refs", "noisy_refs"] as const) report[field] = sorted(report[field]);
  report.changed_file_count = new Set(report.changed_files).size;
  report.budget_used.changed_files = report.changed_file_count;
  const delta = source.expected_observed_delta_candidate;
  for (const field of ["checks_run", "checks_passed", "checks_failed", "checks_skipped"] as const) delta.checks_delta[field] = [...report[field]];
  delta.checks_delta.required_checks = sorted(delta.checks_delta.required_checks);
  delta.checks_delta.missing_required_checks = delta.checks_delta.required_checks.filter((check) => !report.checks_run.includes(check) && !report.checks_skipped.includes(check));
  delta.files_delta.expected_changed_file_globs = [...report.expected_changed_file_globs];
  delta.files_delta.changed_files = [...report.changed_files];
  delta.files_delta.changed_file_count = report.changed_file_count;
  delta.files_delta.max_changed_files = report.max_changed_files;
  delta.files_delta.file_count_within_limit = report.changed_file_count <= report.max_changed_files;
  delta.budget_delta.budget_used = { ...report.budget_used };
  delta.budget_delta.budget_within_contract = report.budget_used.iterations <= delta.budget_delta.max_iterations && report.budget_used.tool_calls <= delta.budget_delta.max_tool_calls && report.budget_used.codex_tasks <= delta.budget_delta.max_codex_tasks && report.budget_used.draft_prs <= delta.budget_delta.max_draft_prs && report.budget_used.changed_files <= delta.budget_delta.max_changed_files;
  delta.missed_expectations = sorted([
    ...delta.checks_delta.missing_required_checks.map((check) => `missing_required_check:${check}`),
    ...delta.checks_delta.required_checks.filter((check) => report.checks_skipped.includes(check)).map((check) => `skipped_required_check:${check}`),
    ...delta.checks_delta.required_checks.filter((check) => report.checks_failed.includes(check)).map((check) => `failed_required_check:${check}`),
  ]);
  delta.unexpected_observations = sorted([...report.blocker_reasons.map((value) => `blocker:${value}`), ...report.warning_reasons.map((value) => `warning:${value}`)]);
  delta.delta_status = ["blocked", "failed", "skipped"].includes(report.result_status) ? "blocked_or_failed" : delta.missed_expectations.some((value) => value.startsWith("missing_required_check") || value.startsWith("failed_required_check")) ? "major_delta" : delta.missed_expectations.length || delta.unexpected_observations.length ? "minor_delta" : "aligned";
  const reuse = source.reuse_outcome_candidate;
  reuse.useful_refs = sorted([source.source_execution_contract.contract_id, source.source_execution_contract.active_grant_id, source.source_execution_contract.ready_preflight_packet_id, source.source_execution_contract.operator_decision_id, ...report.useful_refs]);
  reuse.stale_refs = [...report.stale_refs]; reuse.missing_refs = [...report.missing_refs]; reuse.noisy_refs = [...report.noisy_refs];
  reuse.reused_context_fingerprint = fingerprint({ contract_fingerprint: source.source_execution_contract.contract_fingerprint, active_grant_fingerprint: source.source_execution_contract.active_grant_fingerprint, ready_preflight_packet_fingerprint: source.source_execution_contract.ready_preflight_packet_fingerprint, operator_decision_fingerprint: source.source_execution_contract.operator_decision_fingerprint, copy_export_preview_fingerprint: source.source_execution_contract.copy_export_preview_fingerprint });
  reuse.source_chain_helpfulness = reuse.missing_refs.length ? "missing" : reuse.stale_refs.length ? "stale" : reuse.noisy_refs.length ? "noisy" : !reuse.useful_refs.length ? "not_evaluated" : report.warning_reasons.length || report.checks_failed.length || report.checks_skipped.length ? "partially_helpful" : "helpful";
  const required = delta.checks_delta.required_checks;
  const residual = source.residual_diagnostic_candidate;
  residual.residual_category = required.some((check) => report.checks_failed.includes(check)) ? "check_failure" : required.some((check) => report.checks_skipped.includes(check)) ? "skipped_required_check" : !delta.budget_delta.budget_within_contract ? "budget_drift" : !delta.files_delta.file_count_within_limit ? "file_scope_drift" : report.blocker_reasons.length ? "unexpected_blocker" : delta.delta_status === "aligned" ? "no_residual" : "result_report_gap";
  residual.severity = ["check_failure", "budget_drift"].includes(residual.residual_category) ? "high" : ["skipped_required_check", "file_scope_drift", "unexpected_blocker"].includes(residual.residual_category) ? "medium" : residual.residual_category === "result_report_gap" ? "low" : "none";
  const failedRequired = required.filter((check) => report.checks_failed.includes(check));
  const skippedRequired = required.filter((check) => report.checks_skipped.includes(check));
  residual.residual_summary = residual.residual_category === "check_failure"
    ? `Required checks failed: ${failedRequired.join(", ")}`
    : residual.residual_category === "skipped_required_check"
      ? `Required checks were explicitly skipped: ${skippedRequired.join(", ")}`
      : residual.residual_category === "budget_drift"
        ? "Reported budget usage exceeded the supervised execution contract."
        : residual.residual_category === "file_scope_drift"
          ? "Reported changed file count exceeded the supervised execution contract."
          : residual.residual_category === "unexpected_blocker"
            ? `Result report included blockers: ${report.blocker_reasons.join(", ")}`
            : residual.residual_category === "result_report_gap"
              ? "Result report was recorded with minor expectation gaps for the next cycle."
              : "No residual diagnostic is required from this structured result report.";
  residual.recommended_next_work_class = ["check_failure", "skipped_required_check"].includes(residual.residual_category) ? "test_fix" : ["file_scope_drift", "budget_drift"].includes(residual.residual_category) ? "small_refactor" : ["unexpected_blocker", "result_report_gap"].includes(residual.residual_category) ? "residual_diagnostic_review" : "none";
  source.learning_loop_summary.ready_for_next_daily_autohunt_cycle = ["completed", "completed_with_warnings"].includes(report.result_status) && ["aligned", "minor_delta"].includes(delta.delta_status) && ["none", "low"].includes(residual.severity);
  source.validation.changed_file_count_within_contract = report.changed_file_count <= report.max_changed_files;
  source.validation.budget_within_contract = delta.budget_delta.budget_within_contract;
  source.validation.required_checks_accounted_for = required.every((check) => report.checks_run.includes(check) || report.checks_skipped.includes(check));
  resignNested(source); resignIdentity(source);
}

function resignNested(source: AutohuntResultIntake) {
  source.structured_result_report.result_report_fingerprint = fingerprint(without(source.structured_result_report, "result_report_fingerprint"));
  source.expected_observed_delta_candidate.delta_fingerprint = fingerprint(without(source.expected_observed_delta_candidate, "delta_fingerprint"));
  source.reuse_outcome_candidate.outcome_fingerprint = fingerprint(without(source.reuse_outcome_candidate, "outcome_fingerprint"));
  source.residual_diagnostic_candidate.residual_fingerprint = fingerprint(without(source.residual_diagnostic_candidate, "residual_fingerprint"));
}

function resignIdentity(source: AutohuntResultIntake) {
  source.idempotency_key = buildDeterministicIdempotencyKey({
    kind: source.result_intake_kind, version: source.result_intake_version,
    source: {
      source_execution_contract_fingerprint: source.source_execution_contract.contract_fingerprint,
      result_report_fingerprint: source.structured_result_report.result_report_fingerprint,
      checks_summary: { checks_run: source.structured_result_report.checks_run, checks_passed: source.structured_result_report.checks_passed, checks_failed: source.structured_result_report.checks_failed, checks_skipped: source.structured_result_report.checks_skipped },
      changed_file_summary: { changed_files: source.structured_result_report.changed_files, changed_file_count: source.structured_result_report.changed_file_count },
      delta_fingerprint: source.expected_observed_delta_candidate.delta_fingerprint,
      reuse_outcome_fingerprint: source.reuse_outcome_candidate.outcome_fingerprint,
      residual_fingerprint: source.residual_diagnostic_candidate.residual_fingerprint,
    },
  });
  source.result_intake_id = `autohunt-result-intake:${stripFingerprintPrefix(source.idempotency_key)}`;
  source.result_intake_fingerprint = computeAutohuntResultIntakeFingerprint(source);
}

function resignIntake(source: AutohuntResultIntake) { source.result_intake_fingerprint = computeAutohuntResultIntakeFingerprint(source); }
function without<T extends object>(value: T, field: keyof T) { const copy = { ...value }; delete copy[field]; return copy; }
function optionalRef() { return { ref_version: "external_ref.v0.1" as const, ref_type: "fixture_ref", external_id: "fixture:ref", trust_class: "imported_unverified" as const }; }
function mapped(name: string, result: AutohuntResultIntakeRunReceiptMappingResultV01) { assert.equal(result.status, "mapped", `${name}: ${format(result)}`); assert.ok(result.receipt, `${name} must produce a receipt`); return result.receipt; }
function noReceipt(name: string, result: AutohuntResultIntakeRunReceiptMappingResultV01, expected: "blocked" | "invalid", code: string) { assert.equal(result.status, expected, `${name}: ${format(result)}`); assert.equal(result.receipt, null); assert.ok(result.errors.some((item) => item.code === code), `${name} must report ${code}: ${format(result)}`); }
function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
function deepFreeze<T>(value: T): T { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; Object.values(value as Record<string, unknown>).forEach(deepFreeze); return Object.freeze(value); }
function sorted(values: string[]) { return [...new Set(values)].sort(); }
function setAny(value: object, field: string, next: unknown) { (value as Record<string, unknown>)[field] = next; }
function escape(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function format(value: unknown) { return JSON.stringify(value, null, 2); }
