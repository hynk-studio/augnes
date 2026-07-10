import {
  buildAutohuntResultIntakeAuthorityBoundary,
  computeAutohuntResultIntakeFingerprint,
} from "@/lib/autonomy/read-autohunt-result-intakes";
import {
  buildDeterministicIdempotencyKey,
  fingerprint,
  stableJson,
  STABLE_FINGERPRINT_ALGORITHM,
  stripFingerprintPrefix,
} from "@/lib/research-candidate-review/shared-source-chain-guards";
import { classifyLegacyResultArtifactRefV01 } from "@/lib/vnext/compat/legacy-result-mapping-primitives";
import {
  isProtocolRecordV01,
  parseStrictIsoTimestampV01,
  protocolStringValueV01,
  type ProtocolJsonRecordV01,
} from "@/lib/vnext/protocol-primitives";
import {
  AUTOHUNT_EXPECTED_OBSERVED_DELTA_STATUSES,
  AUTOHUNT_RESIDUAL_DIAGNOSTIC_CATEGORIES,
  AUTOHUNT_RESIDUAL_DIAGNOSTIC_SEVERITIES,
  AUTOHUNT_RESULT_INTAKE_KIND,
  AUTOHUNT_RESULT_INTAKE_STATUSES,
  AUTOHUNT_RESULT_INTAKE_TABLE,
  AUTOHUNT_RESULT_INTAKE_VERSION,
  AUTOHUNT_RESULT_REPORT_SOURCES,
  AUTOHUNT_RESULT_REPORT_STATUSES,
  AUTOHUNT_REUSE_OUTCOME_HELPFULNESS,
  type AutohuntResultIntake,
  type AutohuntResultIntakeStatus,
  type AutohuntResultReportSource,
  type AutohuntResultReportStatus,
} from "@/types/autohunt-result-intake";
import {
  AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_STATUSES,
  AUTOHUNT_SUPERVISED_EXECUTION_LAUNCH_MODES,
} from "@/types/autohunt-supervised-execution-contract";

export interface AutohuntResultIntakeRunReceiptMappingIssueV01 {
  severity: "error" | "warning";
  code: string;
  path: string | null;
  message: string;
}

export interface AutohuntResultIntakeSourceValidationV01 {
  status: "valid" | "invalid" | "blocked";
  normalized_source_intake_status: AutohuntResultIntakeStatus | null;
  source_result_report_status: AutohuntResultReportStatus | null;
  source_result_type: AutohuntResultReportSource | null;
  source_intake_fingerprint: string | null;
  errors: AutohuntResultIntakeRunReceiptMappingIssueV01[];
  warnings: AutohuntResultIntakeRunReceiptMappingIssueV01[];
}

type Acc = {
  errors: AutohuntResultIntakeRunReceiptMappingIssueV01[];
  warnings: AutohuntResultIntakeRunReceiptMappingIssueV01[];
  blocked: boolean;
};

const keys = {
  root: set("result_intake_kind result_intake_version result_intake_id scope created_at result_intake_status source_execution_contract structured_result_report expected_observed_delta_candidate reuse_outcome_candidate residual_diagnostic_candidate learning_loop_summary authority_boundary persisted_material_boundary validation row_count_write_summary idempotency_key result_intake_fingerprint"),
  contract: set("contract_id contract_fingerprint contract_status launch_mode source_readiness_gate_fingerprint active_grant_id active_grant_fingerprint ready_preflight_packet_id ready_preflight_packet_fingerprint operator_decision_id operator_decision_fingerprint copy_export_preview_fingerprint"),
  report: set("result_report_id result_report_fingerprint result_source result_status source_contract_launch_mode branch_created pr_created github_called codex_executed checks_run checks_passed checks_failed checks_skipped changed_files changed_file_count expected_changed_file_globs max_changed_files budget_used blocker_reasons warning_reasons useful_refs stale_refs missing_refs noisy_refs raw_result_text_persisted"),
  budget: set("iterations tool_calls codex_tasks draft_prs changed_files"),
  delta: set("delta_kind expected_summary observed_summary matched_expectations missed_expectations unexpected_observations checks_delta files_delta budget_delta delta_status delta_fingerprint"),
  checksDelta: set("required_checks checks_run checks_passed checks_failed checks_skipped missing_required_checks"),
  filesDelta: set("expected_changed_file_globs changed_files changed_file_count max_changed_files file_count_within_limit"),
  budgetDelta: set("budget_used max_iterations max_tool_calls max_codex_tasks max_draft_prs max_changed_files budget_within_contract"),
  reuse: set("reuse_outcome_kind source_chain_helpfulness useful_refs stale_refs missing_refs noisy_refs reused_context_fingerprint outcome_fingerprint"),
  residual: set("residual_kind severity residual_category residual_summary recommended_next_work_class residual_fingerprint"),
  learning: set("result_intake_required_satisfied expected_observed_delta_required_satisfied reuse_outcome_required_satisfied residual_diagnostic_required_satisfied ready_for_next_daily_autohunt_cycle"),
  persisted: set("persists_source_fingerprints persists_result_summary persists_raw_result_text persists_raw_prompt_text persists_raw_pr_body persists_raw_operator_note persists_raw_source_payload persists_secret_or_token persists_url_or_env_value"),
  validation: set("passed fingerprint_algorithm source_execution_contract_ready source_execution_contract_fingerprint_verified launch_guard_no_execution required_learning_hooks_present result_report_present result_report_valid result_report_external_authority_absent changed_file_count_within_contract budget_within_contract required_checks_accounted_for authority_boundary_all_false persisted_material_boundary_safe raw_material_absent target_only_write_proven"),
  rows: set("target_table_name target_before_count target_after_count target_delta target_table_changed expected_target_delta target_delta_matches_expected non_target_table_count non_target_changed_table_count all_non_target_row_counts_unchanged rows"),
  row: set("table_name before_count after_count delta changed"),
};

const authorityPattern = /(?:approv|authori[sz]|accepted.?evidence|canonical.?state|state.?(?:appl|commit|mutat|write|accept|reject)|work.?(?:clos|complet)|publish|merge|semantic.?commit|durable.?transition|proof)/i;
const forbiddenRawPattern = /(?:^|_)(?:raw_(?:prompt|transcript|provider_output|terminal_log|source_payload)|prompt_text|transcript|hidden_reasoning|chain_of_thought|terminal_log|stdout|stderr|environment_dump|private_key|api_key|access_token|refresh_token|password|credentials?|secret|token)(?:_|$)/i;
const allowedRawFields = new Set([
  "raw_result_text_persisted",
  "persists_raw_result_text",
  "persists_raw_prompt_text",
  "persists_raw_pr_body",
  "persists_raw_operator_note",
  "persists_raw_source_payload",
  "persists_secret_or_token",
]);
const allowedAuthorityFields = new Set([
  ...Object.keys(buildAutohuntResultIntakeAuthorityBoundary()),
  "authority_boundary",
  "authority_boundary_all_false",
  "result_report_external_authority_absent",
  "recommended_next_work_class",
]);

export function validateAutohuntResultIntakeForRunReceiptV01(
  input: unknown,
): AutohuntResultIntakeSourceValidationV01 {
  const acc: Acc = { errors: [], warnings: [], blocked: false };
  scanUnsafe(input, "$", acc);
  if (!isProtocolRecordV01(input)) {
    fail(acc, "source_intake_not_object", "$", "AutohuntResultIntake must be an object.");
    return output(acc, null, null, null, null);
  }
  unknown(input, keys.root, "$", acc);
  exact(input.result_intake_kind, AUTOHUNT_RESULT_INTAKE_KIND, "$.result_intake_kind", "source_intake_kind_mismatch", acc);
  exact(input.result_intake_version, AUTOHUNT_RESULT_INTAKE_VERSION, "$.result_intake_version", "source_intake_version_mismatch", acc);
  exact(input.scope, "project:augnes", "$.scope", "source_scope_mismatch", acc);
  const intakeStatus = enumValue(input.result_intake_status, AUTOHUNT_RESULT_INTAKE_STATUSES, "$.result_intake_status", "source_intake_status_unknown", acc) as AutohuntResultIntakeStatus | null;
  const intakeId = required(input.result_intake_id, "$.result_intake_id", acc);
  timestamp(input.created_at, "$.created_at", acc);
  const idempotency = required(input.idempotency_key, "$.idempotency_key", acc);
  const intakeFingerprint = required(input.result_intake_fingerprint, "$.result_intake_fingerprint", acc);
  if (intakeStatus && intakeStatus !== "result_intake_recorded") {
    fail(acc, "source_intake_status_not_mappable", "$.result_intake_status", "Only a recorded result intake may produce a RunReceipt.", true);
  }
  if (!legacyFingerprint(idempotency)) fail(acc, "source_idempotency_key_malformed", "$.idempotency_key", "Expected the current legacy fingerprint format.");
  if (intakeId && idempotency && intakeId !== `autohunt-result-intake:${stripFingerprintPrefix(idempotency)}`) {
    fail(acc, "source_intake_id_idempotency_mismatch", "$.result_intake_id", "Result intake identity is inconsistent with its idempotency binding.");
  }

  const contract = object(input.source_execution_contract, "$.source_execution_contract", acc);
  if (contract) validateContract(contract, acc);
  const report = object(input.structured_result_report, "$.structured_result_report", acc);
  const resultStatus = report
    ? (enumValue(report.result_status, AUTOHUNT_RESULT_REPORT_STATUSES, "$.structured_result_report.result_status", "source_result_status_unknown", acc) as AutohuntResultReportStatus | null)
    : null;
  const resultType = report
    ? (enumValue(report.result_source, AUTOHUNT_RESULT_REPORT_SOURCES, "$.structured_result_report.result_source", "source_result_type_unknown", acc) as AutohuntResultReportSource | null)
    : null;
  if (report) validateReport(report, contract, acc);
  const delta = object(input.expected_observed_delta_candidate, "$.expected_observed_delta_candidate", acc);
  if (delta && report) validateDelta(delta, report, acc);
  const reuse = object(input.reuse_outcome_candidate, "$.reuse_outcome_candidate", acc);
  if (reuse && report && contract) validateReuse(reuse, report, contract, acc);
  const residual = object(input.residual_diagnostic_candidate, "$.residual_diagnostic_candidate", acc);
  if (residual && report && delta) validateResidual(residual, report, delta, acc);
  if (legacyFingerprint(idempotency) && contract && report && delta && reuse && residual) {
    const expectedIdempotency = buildDeterministicIdempotencyKey({
      kind: AUTOHUNT_RESULT_INTAKE_KIND,
      version: AUTOHUNT_RESULT_INTAKE_VERSION,
      source: {
        source_execution_contract_fingerprint: contract.contract_fingerprint,
        result_report_fingerprint: report.result_report_fingerprint,
        checks_summary: {
          checks_run: report.checks_run,
          checks_passed: report.checks_passed,
          checks_failed: report.checks_failed,
          checks_skipped: report.checks_skipped,
        },
        changed_file_summary: {
          changed_files: report.changed_files,
          changed_file_count: report.changed_file_count,
        },
        delta_fingerprint: delta.delta_fingerprint,
        reuse_outcome_fingerprint: reuse.outcome_fingerprint,
        residual_fingerprint: residual.residual_fingerprint,
      },
    });
    if (idempotency !== expectedIdempotency) {
      fail(acc, "source_idempotency_key_mismatch", "$.idempotency_key", "Source idempotency key is inconsistent with current writer semantics.");
    }
  }
  const learning = object(input.learning_loop_summary, "$.learning_loop_summary", acc);
  if (learning) validateLearning(learning, resultStatus, delta, residual, acc);
  validateClosedObject(input.authority_boundary, "$.authority_boundary", buildAutohuntResultIntakeAuthorityBoundary(), acc, "source_authority_boundary_invalid", true);
  validateClosedObject(input.persisted_material_boundary, "$.persisted_material_boundary", {
    persists_source_fingerprints: true, persists_result_summary: true,
    persists_raw_result_text: false, persists_raw_prompt_text: false,
    persists_raw_pr_body: false, persists_raw_operator_note: false,
    persists_raw_source_payload: false, persists_secret_or_token: false,
    persists_url_or_env_value: false,
  }, acc, "source_persisted_material_boundary_invalid", true);
  const validation = object(input.validation, "$.validation", acc);
  if (validation) validateValidation(validation, acc);
  const rowSummary = object(input.row_count_write_summary, "$.row_count_write_summary", acc);
  if (rowSummary) validateRows(rowSummary, acc);

  if (intakeFingerprint && !legacyFingerprint(intakeFingerprint)) {
    fail(acc, "source_intake_fingerprint_malformed", "$.result_intake_fingerprint", "Expected the current legacy fingerprint format.");
  } else if (intakeFingerprint && intakeFingerprint !== computeAutohuntResultIntakeFingerprint(input as unknown as AutohuntResultIntake)) {
    fail(acc, "source_intake_fingerprint_mismatch", "$.result_intake_fingerprint", "Source intake fingerprint does not match the current exported helper.");
  }
  return output(acc, intakeStatus, resultStatus, resultType, intakeFingerprint);
}

function validateContract(value: ProtocolJsonRecordV01, acc: Acc) {
  unknown(value, keys.contract, "$.source_execution_contract", acc);
  for (const field of ["contract_id", "contract_fingerprint", "source_readiness_gate_fingerprint", "active_grant_id", "active_grant_fingerprint", "ready_preflight_packet_id", "ready_preflight_packet_fingerprint", "operator_decision_id", "operator_decision_fingerprint", "copy_export_preview_fingerprint"]) required(value[field], `$.source_execution_contract.${field}`, acc);
  const status = enumValue(value.contract_status, AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_STATUSES, "$.source_execution_contract.contract_status", "source_contract_status_unknown", acc);
  enumValue(value.launch_mode, AUTOHUNT_SUPERVISED_EXECUTION_LAUNCH_MODES, "$.source_execution_contract.launch_mode", "source_launch_mode_unknown", acc);
  if (status && status !== "ready_for_future_limited_launcher") fail(acc, "source_contract_not_ready", "$.source_execution_contract.contract_status", "Source execution contract is not ready.", true);
  for (const field of Object.keys(value).filter((field) => field.includes("fingerprint"))) if (!legacyFingerprint(protocolStringValueV01(value[field]))) fail(acc, "source_contract_fingerprint_malformed", `$.source_execution_contract.${field}`, "Expected the current legacy fingerprint format.");
}

function validateReport(value: ProtocolJsonRecordV01, contract: ProtocolJsonRecordV01 | null, acc: Acc) {
  const path = "$.structured_result_report";
  unknown(value, keys.report, path, acc);
  required(value.result_report_id, `${path}.result_report_id`, acc);
  enumValue(value.result_source, AUTOHUNT_RESULT_REPORT_SOURCES, `${path}.result_source`, "source_result_type_unknown", acc);
  enumValue(value.result_status, AUTOHUNT_RESULT_REPORT_STATUSES, `${path}.result_status`, "source_result_status_unknown", acc);
  enumValue(value.source_contract_launch_mode, AUTOHUNT_SUPERVISED_EXECUTION_LAUNCH_MODES, `${path}.source_contract_launch_mode`, "source_launch_mode_unknown", acc);
  if (contract && value.source_contract_launch_mode !== contract.launch_mode) fail(acc, "source_report_launch_mode_mismatch", `${path}.source_contract_launch_mode`, "Result-report launch mode must match the source contract.");
  for (const field of ["branch_created", "pr_created", "github_called", "codex_executed", "raw_result_text_persisted"]) if (value[field] !== false) fail(acc, "source_result_authority_or_raw_boundary_open", `${path}.${field}`, "Source result authority and raw-material flags must remain false.", true);
  const collections = Object.fromEntries(["checks_run", "checks_passed", "checks_failed", "checks_skipped", "changed_files", "expected_changed_file_globs", "blocker_reasons", "warning_reasons", "useful_refs", "stale_refs", "missing_refs", "noisy_refs"].map((field) => [field, strings(value[field], `${path}.${field}`, acc)]));
  const run = new Set(collections.checks_run); const passed = new Set(collections.checks_passed); const failed = new Set(collections.checks_failed); const skipped = new Set(collections.checks_skipped);
  for (const check of passed) if (!run.has(check)) fail(acc, "source_passed_check_not_run", `${path}.checks_passed`, "Every passed check must be included in checks_run.");
  for (const check of failed) if (!run.has(check)) fail(acc, "source_failed_check_not_run", `${path}.checks_failed`, "Every failed check must be included in checks_run.");
  if (intersects(passed, failed)) fail(acc, "source_check_pass_fail_conflict", path, "A check cannot be both passed and failed.", true);
  if (intersects(skipped, passed) || intersects(skipped, failed) || intersects(skipped, run)) fail(acc, "source_check_skip_conflict", path, "A skipped check cannot also be run, passed, or failed.", true);
  collections.changed_files.forEach((item, index) => {
    if (classifyLegacyResultArtifactRefV01(item) === "blocked") fail(acc, "source_artifact_ref_unsafe", `${path}.changed_files[${index}]`, "Changed artifact reference is unsafe or malformed.", true);
  });
  const changedCount = nonnegative(value.changed_file_count, `${path}.changed_file_count`, acc);
  const maxChanged = nonnegative(value.max_changed_files, `${path}.max_changed_files`, acc);
  if (changedCount !== new Set(collections.changed_files).size) fail(acc, "source_changed_file_count_mismatch", `${path}.changed_file_count`, "Changed-file count must equal the deduplicated collection length.");
  if (changedCount !== null && maxChanged !== null && maxChanged < changedCount) fail(acc, "source_changed_file_limit_inconsistent", `${path}.max_changed_files`, "Changed-file limit cannot be below the reported count.");
  const budget = object(value.budget_used, `${path}.budget_used`, acc);
  if (budget) {
    validateBudget(budget, `${path}.budget_used`, acc);
    if (changedCount !== null && budget.changed_files !== changedCount) fail(acc, "source_budget_changed_files_mismatch", `${path}.budget_used.changed_files`, "Budget changed-files count must match the structured report.");
  }
  verifyFingerprint(value, "result_report_fingerprint", `${path}.result_report_fingerprint`, "source_result_report_fingerprint", acc);
}

function validateDelta(value: ProtocolJsonRecordV01, report: ProtocolJsonRecordV01, acc: Acc) {
  const path = "$.expected_observed_delta_candidate";
  unknown(value, keys.delta, path, acc); exact(value.delta_kind, "autohunt_expected_observed_delta_candidate", `${path}.delta_kind`, "source_delta_kind_mismatch", acc);
  for (const field of ["expected_summary", "observed_summary"]) bounded(value[field], `${path}.${field}`, acc, 1000);
  const matchedExpectations = strings(value.matched_expectations, `${path}.matched_expectations`, acc);
  const missedExpectations = strings(value.missed_expectations, `${path}.missed_expectations`, acc);
  const unexpectedObservations = strings(value.unexpected_observations, `${path}.unexpected_observations`, acc);
  const deltaStatus = enumValue(value.delta_status, AUTOHUNT_EXPECTED_OBSERVED_DELTA_STATUSES, `${path}.delta_status`, "source_delta_status_unknown", acc);
  const checks = object(value.checks_delta, `${path}.checks_delta`, acc);
  let requiredChecks: string[] = [];
  let expectedMissing: string[] = [];
  if (checks) {
    unknown(checks, keys.checksDelta, `${path}.checks_delta`, acc);
    requiredChecks = strings(checks.required_checks, `${path}.checks_delta.required_checks`, acc);
    for (const field of ["checks_run", "checks_passed", "checks_failed", "checks_skipped"]) {
      const candidate = strings(checks[field], `${path}.checks_delta.${field}`, acc);
      if (!sameSet(candidate, report[field])) fail(acc, "source_delta_checks_mismatch", `${path}.checks_delta.${field}`, "Checks delta must match the structured report.");
    }
    expectedMissing = requiredChecks.filter((check) => !asStrings(report.checks_run).includes(check) && !asStrings(report.checks_skipped).includes(check));
    if (!sameSet(strings(checks.missing_required_checks, `${path}.checks_delta.missing_required_checks`, acc), expectedMissing)) fail(acc, "source_delta_missing_checks_incoherent", `${path}.checks_delta.missing_required_checks`, "Missing required checks are incoherent with reported checks.");
  }
  const files = object(value.files_delta, `${path}.files_delta`, acc);
  if (files) {
    unknown(files, keys.filesDelta, `${path}.files_delta`, acc);
    for (const field of ["expected_changed_file_globs", "changed_files"]) if (!sameSet(strings(files[field], `${path}.files_delta.${field}`, acc), report[field])) fail(acc, "source_delta_files_mismatch", `${path}.files_delta.${field}`, "Files delta must match the structured report.");
    for (const field of ["changed_file_count", "max_changed_files"]) if (files[field] !== report[field]) fail(acc, "source_delta_file_count_mismatch", `${path}.files_delta.${field}`, "Files delta counts must match the structured report.");
    const within = Number(files.changed_file_count) <= Number(files.max_changed_files);
    if (files.file_count_within_limit !== within) fail(acc, "source_delta_file_limit_incoherent", `${path}.files_delta.file_count_within_limit`, "File-count limit claim is incoherent.");
  }
  const budget = object(value.budget_delta, `${path}.budget_delta`, acc);
  let budgetWithinContract = false;
  if (budget) {
    unknown(budget, keys.budgetDelta, `${path}.budget_delta`, acc);
    const used = object(budget.budget_used, `${path}.budget_delta.budget_used`, acc);
    if (used) { validateBudget(used, `${path}.budget_delta.budget_used`, acc); if (stableJson(used) !== stableJson(report.budget_used)) fail(acc, "source_delta_budget_mismatch", `${path}.budget_delta.budget_used`, "Budget delta must match the structured report."); }
    const pairs = [["iterations", "max_iterations"], ["tool_calls", "max_tool_calls"], ["codex_tasks", "max_codex_tasks"], ["draft_prs", "max_draft_prs"], ["changed_files", "max_changed_files"]] as const;
    pairs.forEach(([, maximum]) => nonnegative(budget[maximum], `${path}.budget_delta.${maximum}`, acc));
    if (budget.max_changed_files !== report.max_changed_files) fail(acc, "source_delta_budget_file_limit_mismatch", `${path}.budget_delta.max_changed_files`, "Budget changed-file limit must match the structured report.");
    budgetWithinContract = used ? pairs.every(([field, maximum]) => Number(used[field]) <= Number(budget[maximum])) : false;
    if (budget.budget_within_contract !== budgetWithinContract) fail(acc, "source_delta_budget_limit_incoherent", `${path}.budget_delta.budget_within_contract`, "Budget-within-contract claim is incoherent.");
  }
  const expectedMatched = [
    report.branch_created === false ? "branch_not_created" : null,
    report.pr_created === false ? "pr_not_created" : null,
    report.github_called === false ? "github_not_called" : null,
    report.codex_executed === false ? "codex_not_executed" : null,
    Number(report.changed_file_count) <= Number(report.max_changed_files) ? "changed_file_count_within_contract" : null,
    budgetWithinContract ? "budget_within_contract" : null,
  ].filter((item): item is string => item !== null);
  const expectedMissed = [
    ...expectedMissing.map((check) => `missing_required_check:${check}`),
    ...requiredChecks.filter((check) => asStrings(report.checks_skipped).includes(check)).map((check) => `skipped_required_check:${check}`),
    ...requiredChecks.filter((check) => asStrings(report.checks_failed).includes(check)).map((check) => `failed_required_check:${check}`),
  ];
  const expectedUnexpected = [
    ...asStrings(report.blocker_reasons).map((reason) => `blocker:${reason}`),
    ...asStrings(report.warning_reasons).map((reason) => `warning:${reason}`),
  ];
  const expectedStatus = ["blocked", "failed", "skipped"].includes(String(report.result_status))
    ? "blocked_or_failed"
    : expectedMissing.length > 0 || requiredChecks.some((check) => asStrings(report.checks_failed).includes(check))
      ? "major_delta"
      : expectedMissed.length > 0 || expectedUnexpected.length > 0
        ? "minor_delta"
        : "aligned";
  if (!sameSet(matchedExpectations, expectedMatched)) fail(acc, "source_delta_matched_expectations_incoherent", `${path}.matched_expectations`, "Matched expectations are inconsistent with current writer semantics.");
  if (!sameSet(missedExpectations, expectedMissed)) fail(acc, "source_delta_missed_expectations_incoherent", `${path}.missed_expectations`, "Missed expectations are inconsistent with current writer semantics.");
  if (!sameSet(unexpectedObservations, expectedUnexpected)) fail(acc, "source_delta_unexpected_observations_incoherent", `${path}.unexpected_observations`, "Unexpected observations are inconsistent with current writer semantics.");
  if (deltaStatus && deltaStatus !== expectedStatus) fail(acc, "source_delta_status_incoherent", `${path}.delta_status`, "Delta status is inconsistent with current writer semantics.");
  verifyFingerprint(value, "delta_fingerprint", `${path}.delta_fingerprint`, "source_delta_fingerprint", acc);
}

function validateReuse(value: ProtocolJsonRecordV01, report: ProtocolJsonRecordV01, contract: ProtocolJsonRecordV01, acc: Acc) {
  const path = "$.reuse_outcome_candidate";
  unknown(value, keys.reuse, path, acc); exact(value.reuse_outcome_kind, "autohunt_reuse_outcome_candidate", `${path}.reuse_outcome_kind`, "source_reuse_kind_mismatch", acc);
  const helpfulness = enumValue(value.source_chain_helpfulness, AUTOHUNT_REUSE_OUTCOME_HELPFULNESS, `${path}.source_chain_helpfulness`, "source_reuse_helpfulness_unknown", acc);
  const expectedUseful = [contract.contract_id, contract.active_grant_id, contract.ready_preflight_packet_id, contract.operator_decision_id, ...asStrings(report.useful_refs)];
  const refs: Record<string, string[]> = {};
  for (const field of ["useful_refs", "stale_refs", "missing_refs", "noisy_refs"]) {
    const expected = field === "useful_refs" ? expectedUseful : asStrings(report[field]);
    refs[field] = strings(value[field], `${path}.${field}`, acc);
    if (!sameSet(refs[field]!, expected)) fail(acc, "source_reuse_refs_mismatch", `${path}.${field}`, "Reuse candidate references must match current writer semantics.");
  }
  const expectedHelpfulness = refs.missing_refs!.length > 0
    ? "missing"
    : refs.stale_refs!.length > 0
      ? "stale"
      : refs.noisy_refs!.length > 0
        ? "noisy"
        : refs.useful_refs!.length === 0
          ? "not_evaluated"
          : asStrings(report.warning_reasons).length > 0 || asStrings(report.checks_failed).length > 0 || asStrings(report.checks_skipped).length > 0
            ? "partially_helpful"
            : "helpful";
  if (helpfulness && helpfulness !== expectedHelpfulness) fail(acc, "source_reuse_helpfulness_incoherent", `${path}.source_chain_helpfulness`, "Reuse helpfulness is inconsistent with current writer semantics.");
  const reused = required(value.reused_context_fingerprint, `${path}.reused_context_fingerprint`, acc);
  const expectedReused = fingerprint({ contract_fingerprint: contract.contract_fingerprint, active_grant_fingerprint: contract.active_grant_fingerprint, ready_preflight_packet_fingerprint: contract.ready_preflight_packet_fingerprint, operator_decision_fingerprint: contract.operator_decision_fingerprint, copy_export_preview_fingerprint: contract.copy_export_preview_fingerprint });
  if (reused && reused !== expectedReused) fail(acc, "source_reused_context_fingerprint_mismatch", `${path}.reused_context_fingerprint`, "Reused-context fingerprint is inconsistent with source lineage.");
  verifyFingerprint(value, "outcome_fingerprint", `${path}.outcome_fingerprint`, "source_reuse_outcome_fingerprint", acc);
}

function validateResidual(value: ProtocolJsonRecordV01, report: ProtocolJsonRecordV01, delta: ProtocolJsonRecordV01, acc: Acc) {
  const path = "$.residual_diagnostic_candidate";
  unknown(value, keys.residual, path, acc); exact(value.residual_kind, "autohunt_residual_diagnostic_candidate", `${path}.residual_kind`, "source_residual_kind_mismatch", acc);
  const severity = enumValue(value.severity, AUTOHUNT_RESIDUAL_DIAGNOSTIC_SEVERITIES, `${path}.severity`, "source_residual_severity_unknown", acc);
  const category = enumValue(value.residual_category, AUTOHUNT_RESIDUAL_DIAGNOSTIC_CATEGORIES, `${path}.residual_category`, "source_residual_category_unknown", acc);
  bounded(value.residual_summary, `${path}.residual_summary`, acc, 1000); bounded(value.recommended_next_work_class, `${path}.recommended_next_work_class`, acc);
  const required = asStrings((delta.checks_delta as ProtocolJsonRecordV01 | undefined)?.required_checks);
  const expectedCategory = required.some((check) => asStrings(report.checks_failed).includes(check)) ? "check_failure" : required.some((check) => asStrings(report.checks_skipped).includes(check)) ? "skipped_required_check" : (delta.budget_delta as ProtocolJsonRecordV01 | undefined)?.budget_within_contract === false ? "budget_drift" : (delta.files_delta as ProtocolJsonRecordV01 | undefined)?.file_count_within_limit === false ? "file_scope_drift" : asStrings(report.blocker_reasons).length ? "unexpected_blocker" : delta.delta_status === "aligned" ? "no_residual" : "result_report_gap";
  const expectedSeverity = ["check_failure", "budget_drift"].includes(expectedCategory) ? "high" : ["skipped_required_check", "file_scope_drift", "unexpected_blocker"].includes(expectedCategory) ? "medium" : expectedCategory === "result_report_gap" ? "low" : "none";
  const expectedNextWorkClass = ["check_failure", "skipped_required_check"].includes(expectedCategory) ? "test_fix" : ["file_scope_drift", "budget_drift"].includes(expectedCategory) ? "small_refactor" : ["unexpected_blocker", "result_report_gap"].includes(expectedCategory) ? "residual_diagnostic_review" : "none";
  if (category && category !== expectedCategory) fail(acc, "source_residual_category_incoherent", `${path}.residual_category`, "Residual category is inconsistent with the structured report.");
  if (severity && severity !== expectedSeverity) fail(acc, "source_residual_severity_incoherent", `${path}.severity`, "Residual severity is inconsistent with its category.");
  if (value.recommended_next_work_class !== expectedNextWorkClass) fail(acc, "source_residual_next_work_class_incoherent", `${path}.recommended_next_work_class`, "Recommended next-work class is inconsistent with current writer semantics.");
  verifyFingerprint(value, "residual_fingerprint", `${path}.residual_fingerprint`, "source_residual_fingerprint", acc);
}

function validateLearning(value: ProtocolJsonRecordV01, status: string | null, delta: ProtocolJsonRecordV01 | null, residual: ProtocolJsonRecordV01 | null, acc: Acc) {
  const path = "$.learning_loop_summary"; unknown(value, keys.learning, path, acc);
  for (const field of ["result_intake_required_satisfied", "expected_observed_delta_required_satisfied", "reuse_outcome_required_satisfied", "residual_diagnostic_required_satisfied"]) if (value[field] !== true) fail(acc, "source_learning_loop_required_flag_false", `${path}.${field}`, "All required learning-loop hooks must remain satisfied.", true);
  if (typeof value.ready_for_next_daily_autohunt_cycle !== "boolean") fail(acc, "source_learning_loop_readiness_malformed", `${path}.ready_for_next_daily_autohunt_cycle`, "Learning-loop readiness must be boolean.");
  const expected = ["completed", "completed_with_warnings"].includes(status ?? "") && ["aligned", "minor_delta"].includes(String(delta?.delta_status)) && ["none", "low"].includes(String(residual?.severity));
  if (typeof value.ready_for_next_daily_autohunt_cycle === "boolean" && value.ready_for_next_daily_autohunt_cycle !== expected) fail(acc, "source_learning_loop_readiness_incoherent", `${path}.ready_for_next_daily_autohunt_cycle`, "Learning-loop readiness is inconsistent with current writer semantics.");
}

function validateValidation(value: ProtocolJsonRecordV01, acc: Acc) {
  const path = "$.validation"; unknown(value, keys.validation, path, acc);
  if (value.fingerprint_algorithm !== STABLE_FINGERPRINT_ALGORITHM) fail(acc, "source_validation_fingerprint_algorithm_unknown", `${path}.fingerprint_algorithm`, "Source validation uses an unknown fingerprint algorithm.");
  for (const field of [...keys.validation].filter((field) => field !== "fingerprint_algorithm")) if (value[field] !== true) fail(acc, "source_validation_flag_false", `${path}.${field}`, "All current source validation flags must be true.", true);
}

function validateRows(value: ProtocolJsonRecordV01, acc: Acc) {
  const path = "$.row_count_write_summary"; unknown(value, keys.rows, path, acc);
  exact(value.target_table_name, AUTOHUNT_RESULT_INTAKE_TABLE, `${path}.target_table_name`, "source_row_target_mismatch", acc);
  const numeric = ["target_before_count", "target_after_count", "target_delta", "expected_target_delta", "non_target_table_count", "non_target_changed_table_count"];
  numeric.forEach((field) => nonnegative(value[field], `${path}.${field}`, acc));
  if (Number(value.target_after_count) - Number(value.target_before_count) !== value.target_delta || value.target_delta !== 1 || value.expected_target_delta !== 1 || value.target_table_changed !== true || value.target_delta_matches_expected !== true) fail(acc, "source_row_target_arithmetic_mismatch", path, "Target row-count summary is incoherent.", true);
  const rows = array(value.rows, `${path}.rows`, acc); const seen = new Set<string>(); let targetCount = 0; let changedNonTarget = 0;
  let targetEntryMismatch = false;
  rows.forEach((candidate, index) => {
    const rowPath = `${path}.rows[${index}]`; const row = object(candidate, rowPath, acc); if (!row) return; unknown(row, keys.row, rowPath, acc);
    const name = required(row.table_name, `${rowPath}.table_name`, acc); if (name && seen.has(name)) fail(acc, "source_row_duplicate_table", `${rowPath}.table_name`, "Row-count table names must be unique."); if (name) seen.add(name);
    const before = nonnegative(row.before_count, `${rowPath}.before_count`, acc); const after = nonnegative(row.after_count, `${rowPath}.after_count`, acc); const delta = typeof row.delta === "number" && Number.isFinite(row.delta) ? row.delta : null;
    if (delta === null) fail(acc, "source_row_delta_malformed", `${rowPath}.delta`, "Row delta must be finite.");
    if (before !== null && after !== null && delta !== null && after - before !== delta) fail(acc, "source_row_arithmetic_mismatch", rowPath, "Row-count arithmetic is incoherent.", true);
    if (typeof row.changed !== "boolean" || row.changed !== (delta !== 0)) fail(acc, "source_row_changed_flag_mismatch", `${rowPath}.changed`, "Row changed flag is incoherent.", true);
    if (name === AUTOHUNT_RESULT_INTAKE_TABLE) {
      targetCount += 1;
      targetEntryMismatch ||= row.before_count !== value.target_before_count || row.after_count !== value.target_after_count || row.delta !== value.target_delta || row.changed !== value.target_table_changed;
    } else if (delta !== 0 || row.changed === true) changedNonTarget += 1;
  });
  if (targetEntryMismatch) fail(acc, "source_row_target_entry_mismatch", path, "Target row entry must match the top-level row-count summary.", true);
  if (targetCount !== 1 || Number(value.non_target_table_count) !== rows.length - 1 || changedNonTarget !== 0 || value.non_target_changed_table_count !== 0 || value.all_non_target_row_counts_unchanged !== true) fail(acc, "source_row_non_target_boundary_invalid", path, "Target-only row-count boundary is not closed.", true);
}

function validateBudget(value: ProtocolJsonRecordV01, path: string, acc: Acc) { unknown(value, keys.budget, path, acc); [...keys.budget].forEach((field) => nonnegative(value[field], `${path}.${field}`, acc)); }

function validateClosedObject(value: unknown, path: string, expected: Record<string, unknown>, acc: Acc, code: string, blocked: boolean) {
  const record = object(value, path, acc); if (!record) return; unknown(record, new Set(Object.keys(expected)), path, acc);
  for (const [field, expectedValue] of Object.entries(expected)) if (record[field] !== expectedValue) fail(acc, code, `${path}.${field}`, "Source boundary differs from the closed v0.1 contract.", blocked);
}

function verifyFingerprint(value: ProtocolJsonRecordV01, field: string, path: string, code: string, acc: Acc) {
  const actual = required(value[field], path, acc); const { [field]: _ignored, ...source } = value;
  if (actual && !legacyFingerprint(actual)) fail(acc, `${code}_malformed`, path, "Expected the current legacy fingerprint format.");
  else if (actual && actual !== fingerprint(source)) fail(acc, `${code}_mismatch`, path, "Nested fingerprint does not match current legacy semantics.");
}

function scanUnsafe(value: unknown, path: string, acc: Acc) {
  if (typeof value === "string") {
    if (/\bhttps?:\/\/[^\s"'<>]+/i.test(value) || /^(?:file:\/\/|\/(?!\/)|~[\\/]|[A-Za-z]:[\\/]|\\\\)/.test(value) || /(?:OPENAI_API_KEY|GITHUB_TOKEN)\s*=/i.test(value) || /\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{8,}|ghp_[A-Za-z0-9_]{8,}|github_pat_[A-Za-z0-9_]{8,})\b/.test(value) || /BEGIN (?:OPENSSH |RSA |EC |)PRIVATE KEY/i.test(value) || /\b(?:token|secret|password|credential|api[_-]?key)\s*[=:]\s*\S{8,}/i.test(value)) fail(acc, "source_unsafe_material", path, "Source contains unsafe material.", true);
    return;
  }
  if (Array.isArray(value)) { value.forEach((item, index) => scanUnsafe(item, `${path}[${index}]`, acc)); return; }
  if (!isProtocolRecordV01(value)) return;
  for (const [field, child] of Object.entries(value)) {
    if (forbiddenRawPattern.test(field) && !allowedRawFields.has(field)) fail(acc, "source_forbidden_raw_field", `${path}.${field}`, "Source contains a forbidden raw-material field.", true);
    if (authorityPattern.test(field) && !allowedAuthorityFields.has(field)) fail(acc, "source_unknown_authority_or_raw_field", `${path}.${field}`, "Unknown source field attempts a forbidden semantic.", true);
    scanUnsafe(child, `${path}.${field}`, acc);
  }
}

function unknown(value: ProtocolJsonRecordV01, allowed: ReadonlySet<string>, path: string, acc: Acc) { for (const field of Object.keys(value)) if (!allowed.has(field)) { const blocked = authorityPattern.test(field) || forbiddenRawPattern.test(field); fail(acc, blocked ? "source_unknown_authority_or_raw_field" : "source_unknown_field", `${path}.${field}`, blocked ? "Unknown source field attempts a forbidden semantic." : "Field is outside the source v0.1 contract.", blocked); } }
function object(value: unknown, path: string, acc: Acc) { if (isProtocolRecordV01(value)) return value; fail(acc, "source_object_malformed", path, "Expected an object."); return null; }
function array(value: unknown, path: string, acc: Acc) { if (Array.isArray(value)) { if (value.length > 200) fail(acc, "source_array_too_large", path, "Source array exceeds the v0.1 bound."); return value; } fail(acc, "source_array_malformed", path, "Expected an array."); return []; }
function strings(value: unknown, path: string, acc: Acc) { const result: string[] = []; array(value, path, acc).forEach((item, index) => { const text = bounded(item, `${path}[${index}]`, acc); if (text) result.push(text); }); return result; }
function bounded(value: unknown, path: string, acc: Acc, max = 240) { const text = protocolStringValueV01(value); if (!text || text.length > max || /[\u0000-\u001f\u007f]/.test(text)) { fail(acc, "source_string_malformed", path, "Expected a bounded non-empty string."); return null; } return text; }
function required(value: unknown, path: string, acc: Acc) { return bounded(value, path, acc, 1000); }
function timestamp(value: unknown, path: string, acc: Acc) { if (parseStrictIsoTimestampV01(value) === null) fail(acc, "source_timestamp_invalid", path, "Expected a strict ISO-8601 timestamp with timezone."); }
function nonnegative(value: unknown, path: string, acc: Acc) { if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || !Number.isInteger(value)) { fail(acc, "source_number_invalid", path, "Expected a finite non-negative integer."); return null; } return value; }
function exact(value: unknown, expected: unknown, path: string, code: string, acc: Acc) { if (value !== expected) fail(acc, code, path, "Value does not match the source v0.1 contract."); }
function enumValue(value: unknown, allowed: readonly string[], path: string, code: string, acc: Acc) { const text = protocolStringValueV01(value); if (!text || !allowed.includes(text)) { fail(acc, code, path, "Expected a known source v0.1 value."); return null; } return text; }
function fail(acc: Acc, code: string, path: string | null, message: string, blocked = false) { acc.errors.push({ severity: "error", code, path, message }); if (blocked) acc.blocked = true; }
function output(acc: Acc, intake: AutohuntResultIntakeStatus | null, status: AutohuntResultReportStatus | null, type: AutohuntResultReportSource | null, fingerprintValue: string | null): AutohuntResultIntakeSourceValidationV01 { return { status: acc.errors.length === 0 ? "valid" : acc.blocked ? "blocked" : "invalid", normalized_source_intake_status: intake, source_result_report_status: status, source_result_type: type, source_intake_fingerprint: fingerprintValue, errors: acc.errors, warnings: acc.warnings }; }
function set(value: string) { return new Set(value.split(" ")); }
function legacyFingerprint(value: string | null) { return Boolean(value && new RegExp(`^${STABLE_FINGERPRINT_ALGORITHM}:[a-f0-9]{8}$`).test(value)); }
function asStrings(value: unknown) { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; }
function sameSet(left: string[], right: unknown) { return stableJson([...new Set(left)].sort()) === stableJson([...new Set(asStrings(right))].sort()); }
function intersects(left: Set<string>, right: Set<string>) { return [...left].some((item) => right.has(item)); }
