import { openDatabase } from "@/lib/db";
import type { AutonomyDelegationGrantDbLike } from "@/lib/autonomy/read-autonomy-delegation-grants";
import {
  buildAutohuntResultIntakeAuthorityBoundary,
  computeAutohuntResultIntakeFingerprint,
  ensureAutohuntResultIntakeSchema,
  parseAutohuntResultIntakeRow,
} from "@/lib/autonomy/read-autohunt-result-intakes";
import {
  computeAutohuntSupervisedExecutionContractFingerprint,
} from "@/lib/autonomy/read-autohunt-supervised-execution-contracts";
import {
  assertAllFalseBoundary,
  buildDeterministicIdempotencyKey,
  containsForbiddenRawMaterial,
  findForbiddenRawMaterialFields,
  fingerprint,
  isTargetOnlyRowCountWrite,
  requiredStringFieldsPresent,
  stableJson,
  STABLE_FINGERPRINT_ALGORITHM as FINGERPRINT_ALGORITHM,
  stripFingerprintPrefix,
  summarizeTargetOnlyRowCountWrite,
} from "@/lib/research-candidate-review/shared-source-chain-guards";
import { AUTONOMY_DELEGATION_GRANT_TABLE } from "@/types/autonomy-delegation-grant";
import { AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE } from "@/types/autohunt-work-queue-candidate";
import { AUTOHUNT_PREFLIGHT_PACKET_TABLE } from "@/types/autohunt-preflight-packet";
import { AUTOHUNT_HANDOFF_PLAN_PREVIEW_TABLE } from "@/types/autohunt-handoff-plan-preview";
import { AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_TABLE } from "@/types/autohunt-handoff-plan-operator-review-decision";
import { AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_TABLE } from "@/types/autohunt-supervised-execution-contract";
import type {
  AutohuntSupervisedExecutionContract,
  AutohuntSupervisedExecutionLaunchEnvelope,
} from "@/types/autohunt-supervised-execution-contract";
import {
  AUTOHUNT_RESULT_INTAKE_KIND,
  AUTOHUNT_RESULT_INTAKE_TABLE,
  AUTOHUNT_RESULT_INTAKE_VERSION,
  AUTOHUNT_RESULT_REPORT_SOURCES,
  AUTOHUNT_RESULT_REPORT_STATUSES,
  type AutohuntExpectedObservedDeltaCandidate,
  type AutohuntLearningLoopSummary,
  type AutohuntResidualDiagnosticCandidate,
  type AutohuntResultIntake,
  type AutohuntResultIntakeInput,
  type AutohuntResultIntakePersistedMaterialBoundary,
  type AutohuntResultIntakeRowCountWriteSummary,
  type AutohuntResultIntakeSourceExecutionContract,
  type AutohuntResultIntakeValidation,
  type AutohuntResultIntakeWriteResult,
  type AutohuntResultReportSource,
  type AutohuntResultReportStatus,
  type AutohuntReuseOutcomeCandidate,
  type AutohuntStructuredResultReport,
  type AutohuntStructuredResultReportInput,
} from "@/types/autohunt-result-intake";
import { RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_PROTECTED_ROW_COUNT_TABLES } from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-result";

export interface WriteAutohuntResultIntakeOptions {
  db?: AutonomyDelegationGrantDbLike;
  now?: string;
}

type RowCountSnapshot = Record<string, number>;

type NormalizedResultIntakeInput = {
  scope: "project:augnes";
  source_execution_contract: AutohuntSupervisedExecutionContract;
  source_execution_contract_summary: AutohuntResultIntakeSourceExecutionContract;
  structured_result_report: AutohuntStructuredResultReport;
  expected_observed_delta_candidate: AutohuntExpectedObservedDeltaCandidate;
  reuse_outcome_candidate: AutohuntReuseOutcomeCandidate;
  residual_diagnostic_candidate: AutohuntResidualDiagnosticCandidate;
  learning_loop_summary: AutohuntLearningLoopSummary;
  authority_boundary: ReturnType<typeof buildAutohuntResultIntakeAuthorityBoundary>;
  persisted_material_boundary: AutohuntResultIntakePersistedMaterialBoundary;
  raw_material_probe: unknown;
};

const NON_TARGET_ROW_COUNT_TABLES = [
  AUTONOMY_DELEGATION_GRANT_TABLE,
  AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE,
  AUTOHUNT_PREFLIGHT_PACKET_TABLE,
  AUTOHUNT_HANDOFF_PLAN_PREVIEW_TABLE,
  AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_TABLE,
  AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_TABLE,
  ...RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_PROTECTED_ROW_COUNT_TABLES,
] as const;

const TARGET_AND_NON_TARGET_TABLES = [
  AUTOHUNT_RESULT_INTAKE_TABLE,
  ...NON_TARGET_ROW_COUNT_TABLES,
] as const;

const SAFE_RAW_MATERIAL_KEYS = new Set([
  "structured_result_report",
  "dry_run_fixture_report",
  "result_report_id",
  "result_report_fingerprint",
  "result_report_missing",
  "result_report_invalid",
  "raw_result_text_persisted",
  "raw_material_absent",
  "raw_material_persisted",
  "persists_result_summary",
  "persists_raw_result_text",
  "persists_raw_prompt_text",
  "persists_raw_copy_text",
  "persists_raw_pr_body",
  "persists_raw_operator_note",
  "persists_raw_source_payload",
  "persists_secret_or_token",
  "persists_url_or_env_value",
]);

const UNSAFE_EXTERNAL_AUTHORITY_KEYS = new Set([
  "branch_created",
  "pr_created",
  "github_called",
  "codex_executed",
  "merge",
  "merged",
  "deploy",
  "deployed",
  "provider_called",
  "openai_called",
  "source_fetched",
  "sources_fetched",
  "retrieval_run",
  "memory_written",
  "proof_written",
  "evidence_written",
]);

export function writeAutohuntResultIntake(
  input: AutohuntResultIntakeInput,
  options: WriteAutohuntResultIntakeOptions = {},
): AutohuntResultIntakeWriteResult {
  const sourceContract = input.source_execution_contract ?? null;
  const validationRefusalReasons = validateAutohuntResultIntakeInput(input);
  if (validationRefusalReasons.length > 0 || !sourceContract) {
    return createRefusedResult(validationRefusalReasons);
  }

  const normalizedInput = normalizeResultIntakeInput(input, sourceContract);
  const validation = buildResultIntakeValidation(normalizedInput);
  if (!validation.passed) {
    return createRefusedResult(refusalReasonsFromValidation(validation));
  }

  const idempotencyKey = computeIdempotencyKey(normalizedInput);
  const db = options.db ?? openDatabase();
  const shouldClose = !options.db && hasClose(db);

  try {
    ensureAutohuntResultIntakeSchema(db);
    const existingRow = db
      .prepare(
        `
          SELECT *
          FROM ${AUTOHUNT_RESULT_INTAKE_TABLE}
          WHERE idempotency_key = ?
        `,
      )
      .get(idempotencyKey);

    if (existingRow) {
      const existingIntake = parseAutohuntResultIntakeRow(existingRow as never);
      if (
        existingIntake &&
        existingIntake.result_intake_fingerprint ===
          computeAutohuntResultIntakeFingerprint(existingIntake)
      ) {
        return createAcceptedResult({
          result_status: "duplicate_replayed",
          result_intake: existingIntake,
          result_intake_record_written: false,
          duplicate_replayed: true,
        });
      }
      return createRefusedResult([
        "idempotency_conflict_existing_autohunt_result_intake_fingerprint_mismatch",
      ]);
    }

    db.exec("BEGIN IMMEDIATE");
    try {
      const beforeCounts = captureRowCounts(db);
      const expectedWriteSummary = buildRowCountWriteSummary({
        beforeCounts,
        afterCounts: {
          ...beforeCounts,
          [AUTOHUNT_RESULT_INTAKE_TABLE]:
            beforeCounts[AUTOHUNT_RESULT_INTAKE_TABLE] + 1,
        },
      });
      const resultIntake = buildResultIntakeRecord({
        input: normalizedInput,
        validation,
        idempotencyKey,
        createdAt: options.now ?? new Date().toISOString(),
        rowCountWriteSummary: expectedWriteSummary,
      });

      insertResultIntakeRecord(db, resultIntake);

      const afterCounts = captureRowCounts(db);
      const actualWriteSummary = buildRowCountWriteSummary({
        beforeCounts,
        afterCounts,
      });
      if (!isTargetOnlyRowCountWrite(actualWriteSummary)) {
        db.exec("ROLLBACK");
        return createRefusedResult([
          "target_only_autohunt_result_intake_row_count_proof_failed",
        ]);
      }

      db.exec("COMMIT");
      return createAcceptedResult({
        result_status: "written",
        result_intake: resultIntake,
        result_intake_record_written: true,
        duplicate_replayed: false,
      });
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  } finally {
    if (shouldClose) {
      db.close();
    }
  }
}

export function validateAutohuntResultIntakeInput(
  input: AutohuntResultIntakeInput,
): string[] {
  const refusalReasons: string[] = [];
  if (input.scope !== "project:augnes") {
    refusalReasons.push("scope_invalid");
  }
  const sourceContract = input.source_execution_contract ?? null;
  if (!sourceContract) {
    refusalReasons.push("source_execution_contract_missing");
  } else {
    refusalReasons.push(...validateSourceExecutionContract(sourceContract));
  }
  const reportInput = input.structured_result_report ?? input.dry_run_fixture_report ?? null;
  if (!reportInput) {
    refusalReasons.push("result_report_missing");
  } else {
    refusalReasons.push(...validateReportInputShape(reportInput));
  }
  refusalReasons.push(...validateRawMaterialBoundary(input));
  return [...new Set(refusalReasons)];
}

function normalizeResultIntakeInput(
  input: AutohuntResultIntakeInput,
  sourceContract: AutohuntSupervisedExecutionContract,
): NormalizedResultIntakeInput {
  const reportInput = input.structured_result_report ?? input.dry_run_fixture_report;
  const structuredResultReport = normalizeStructuredResultReport(
    reportInput,
    sourceContract,
  );
  const sourceExecutionContractSummary =
    summarizeSourceExecutionContract(sourceContract);
  const expectedObservedDeltaCandidate =
    buildExpectedObservedDeltaCandidate(sourceContract, structuredResultReport);
  const reuseOutcomeCandidate = buildReuseOutcomeCandidate(
    sourceExecutionContractSummary,
    structuredResultReport,
  );
  const residualDiagnosticCandidate = buildResidualDiagnosticCandidate(
    sourceContract,
    structuredResultReport,
    expectedObservedDeltaCandidate,
  );
  const learningLoopSummary = buildLearningLoopSummary({
    structuredResultReport,
    expectedObservedDeltaCandidate,
    residualDiagnosticCandidate,
  });

  return {
    scope: "project:augnes",
    source_execution_contract: sourceContract,
    source_execution_contract_summary: sourceExecutionContractSummary,
    structured_result_report: structuredResultReport,
    expected_observed_delta_candidate: expectedObservedDeltaCandidate,
    reuse_outcome_candidate: reuseOutcomeCandidate,
    residual_diagnostic_candidate: residualDiagnosticCandidate,
    learning_loop_summary: learningLoopSummary,
    authority_boundary: buildAutohuntResultIntakeAuthorityBoundary(),
    persisted_material_boundary: createPersistedMaterialBoundary(),
    raw_material_probe: input.raw_material_probe,
  };
}

function buildResultIntakeRecord({
  input,
  validation,
  idempotencyKey,
  createdAt,
  rowCountWriteSummary,
}: {
  input: NormalizedResultIntakeInput;
  validation: AutohuntResultIntakeValidation;
  idempotencyKey: string;
  createdAt: string;
  rowCountWriteSummary: AutohuntResultIntakeRowCountWriteSummary;
}): AutohuntResultIntake {
  const resultIntakeId = `autohunt-result-intake:${stripFingerprintPrefix(
    idempotencyKey,
  )}`;
  const intakeWithoutFingerprint: Omit<
    AutohuntResultIntake,
    "result_intake_fingerprint"
  > = {
    result_intake_kind: AUTOHUNT_RESULT_INTAKE_KIND,
    result_intake_version: AUTOHUNT_RESULT_INTAKE_VERSION,
    result_intake_id: resultIntakeId,
    scope: input.scope,
    created_at: createdAt,
    result_intake_status: "result_intake_recorded",
    source_execution_contract: input.source_execution_contract_summary,
    structured_result_report: input.structured_result_report,
    expected_observed_delta_candidate:
      input.expected_observed_delta_candidate,
    reuse_outcome_candidate: input.reuse_outcome_candidate,
    residual_diagnostic_candidate: input.residual_diagnostic_candidate,
    learning_loop_summary: input.learning_loop_summary,
    authority_boundary: input.authority_boundary,
    persisted_material_boundary: input.persisted_material_boundary,
    validation,
    row_count_write_summary: rowCountWriteSummary,
    idempotency_key: idempotencyKey,
  };

  return {
    ...intakeWithoutFingerprint,
    result_intake_fingerprint:
      computeAutohuntResultIntakeFingerprint(intakeWithoutFingerprint),
  };
}

function insertResultIntakeRecord(
  db: AutonomyDelegationGrantDbLike,
  intake: AutohuntResultIntake,
) {
  db.prepare(
    `
      INSERT INTO ${AUTOHUNT_RESULT_INTAKE_TABLE} (
        result_intake_id,
        created_at,
        scope,
        result_intake_status,
        source_execution_contract_id,
        source_execution_contract_fingerprint,
        source_execution_contract_status,
        source_readiness_gate_fingerprint,
        active_grant_id,
        active_grant_fingerprint,
        ready_preflight_packet_id,
        ready_preflight_packet_fingerprint,
        operator_decision_id,
        operator_decision_fingerprint,
        copy_export_preview_fingerprint,
        result_report_id,
        result_report_fingerprint,
        result_status,
        idempotency_key,
        structured_result_report_json,
        expected_observed_delta_candidate_json,
        reuse_outcome_candidate_json,
        residual_diagnostic_candidate_json,
        learning_loop_summary_json,
        authority_boundary_json,
        persisted_material_boundary_json,
        validation_json,
        row_count_write_summary_json,
        result_intake_fingerprint
      )
      VALUES (
        @result_intake_id,
        @created_at,
        @scope,
        @result_intake_status,
        @source_execution_contract_id,
        @source_execution_contract_fingerprint,
        @source_execution_contract_status,
        @source_readiness_gate_fingerprint,
        @active_grant_id,
        @active_grant_fingerprint,
        @ready_preflight_packet_id,
        @ready_preflight_packet_fingerprint,
        @operator_decision_id,
        @operator_decision_fingerprint,
        @copy_export_preview_fingerprint,
        @result_report_id,
        @result_report_fingerprint,
        @result_status,
        @idempotency_key,
        @structured_result_report_json,
        @expected_observed_delta_candidate_json,
        @reuse_outcome_candidate_json,
        @residual_diagnostic_candidate_json,
        @learning_loop_summary_json,
        @authority_boundary_json,
        @persisted_material_boundary_json,
        @validation_json,
        @row_count_write_summary_json,
        @result_intake_fingerprint
      )
    `,
  ).run({
    result_intake_id: intake.result_intake_id,
    created_at: intake.created_at,
    scope: intake.scope,
    result_intake_status: intake.result_intake_status,
    source_execution_contract_id:
      intake.source_execution_contract.contract_id,
    source_execution_contract_fingerprint:
      intake.source_execution_contract.contract_fingerprint,
    source_execution_contract_status:
      intake.source_execution_contract.contract_status,
    source_readiness_gate_fingerprint:
      intake.source_execution_contract.source_readiness_gate_fingerprint,
    active_grant_id: intake.source_execution_contract.active_grant_id,
    active_grant_fingerprint:
      intake.source_execution_contract.active_grant_fingerprint,
    ready_preflight_packet_id:
      intake.source_execution_contract.ready_preflight_packet_id,
    ready_preflight_packet_fingerprint:
      intake.source_execution_contract.ready_preflight_packet_fingerprint,
    operator_decision_id:
      intake.source_execution_contract.operator_decision_id,
    operator_decision_fingerprint:
      intake.source_execution_contract.operator_decision_fingerprint,
    copy_export_preview_fingerprint:
      intake.source_execution_contract.copy_export_preview_fingerprint,
    result_report_id: intake.structured_result_report.result_report_id,
    result_report_fingerprint:
      intake.structured_result_report.result_report_fingerprint,
    result_status: intake.structured_result_report.result_status,
    idempotency_key: intake.idempotency_key,
    structured_result_report_json: stableJson(
      intake.structured_result_report,
    ),
    expected_observed_delta_candidate_json: stableJson(
      intake.expected_observed_delta_candidate,
    ),
    reuse_outcome_candidate_json: stableJson(
      intake.reuse_outcome_candidate,
    ),
    residual_diagnostic_candidate_json: stableJson(
      intake.residual_diagnostic_candidate,
    ),
    learning_loop_summary_json: stableJson(intake.learning_loop_summary),
    authority_boundary_json: stableJson(intake.authority_boundary),
    persisted_material_boundary_json: stableJson(
      intake.persisted_material_boundary,
    ),
    validation_json: stableJson(intake.validation),
    row_count_write_summary_json: stableJson(intake.row_count_write_summary),
    result_intake_fingerprint: intake.result_intake_fingerprint,
  });
}

function validateSourceExecutionContract(
  contract: AutohuntSupervisedExecutionContract,
) {
  const refusalReasons: string[] = [];
  if (contract.contract_status !== "ready_for_future_limited_launcher") {
    refusalReasons.push("source_execution_contract_not_ready");
  }
  if (
    contract.contract_fingerprint !==
    computeAutohuntSupervisedExecutionContractFingerprint(contract)
  ) {
    refusalReasons.push("source_execution_contract_fingerprint_mismatch");
  }
  if (contract.validation.passed !== true) {
    refusalReasons.push("source_execution_contract_validation_not_passed");
  }
  if (
    contract.launch_guard_result.launch_now_allowed !== false ||
    contract.launch_guard_result.execution_started !== false ||
    contract.launch_guard_result.codex_executed !== false ||
    contract.launch_guard_result.github_called !== false ||
    contract.launch_guard_result.branch_or_pr_created !== false
  ) {
    refusalReasons.push("source_execution_contract_launch_guard_not_passive");
  }
  if (
    contract.launch_envelope.required_result_intake !== true ||
    contract.launch_envelope.required_expected_observed_delta !== true ||
    contract.launch_envelope.required_reuse_outcome !== true ||
    contract.launch_envelope.required_residual_diagnostic !== true
  ) {
    refusalReasons.push("source_execution_contract_learning_hooks_missing");
  }
  if (
    assertAllFalseBoundary(
      contract.authority_boundary,
      "autohunt_result_intake_source_contract_authority_boundary",
    ).passed !== true
  ) {
    refusalReasons.push("authority_boundary_not_all_false");
  }
  if (!hasRequiredSourceContractFields(contract)) {
    refusalReasons.push("source_execution_contract_binding_missing");
  }
  return refusalReasons;
}

function validateReportInputShape(input: AutohuntStructuredResultReportInput) {
  const refusalReasons: string[] = [];
  if (
    input.result_source &&
    !AUTOHUNT_RESULT_REPORT_SOURCES.includes(
      input.result_source as AutohuntResultReportSource,
    )
  ) {
    refusalReasons.push("result_report_invalid");
  }
  if (
    input.result_status &&
    !AUTOHUNT_RESULT_REPORT_STATUSES.includes(
      input.result_status as AutohuntResultReportStatus,
    )
  ) {
    refusalReasons.push("result_report_invalid");
  }
  if (unsafeExternalAuthorityClaimsPresent(input)) {
    refusalReasons.push("result_report_external_authority_claimed");
  }
  return refusalReasons;
}

function buildResultIntakeValidation(
  input: NormalizedResultIntakeInput,
): AutohuntResultIntakeValidation {
  const sourceContract = input.source_execution_contract;
  const sourceExecutionContractReady =
    sourceContract.contract_status === "ready_for_future_limited_launcher" &&
    sourceContract.validation.passed === true;
  const sourceExecutionContractFingerprintVerified =
    sourceContract.contract_fingerprint ===
    computeAutohuntSupervisedExecutionContractFingerprint(sourceContract);
  const launchGuardNoExecution =
    sourceContract.launch_guard_result.launch_now_allowed === false &&
    sourceContract.launch_guard_result.execution_started === false &&
    sourceContract.launch_guard_result.codex_executed === false &&
    sourceContract.launch_guard_result.github_called === false &&
    sourceContract.launch_guard_result.branch_or_pr_created === false;
  const requiredLearningHooksPresent =
    sourceContract.launch_envelope.required_result_intake === true &&
    sourceContract.launch_envelope.required_expected_observed_delta === true &&
    sourceContract.launch_envelope.required_reuse_outcome === true &&
    sourceContract.launch_envelope.required_residual_diagnostic === true;
  const resultReportPresent = Boolean(
    input.structured_result_report.result_report_id &&
      input.structured_result_report.result_report_fingerprint,
  );
  const resultReportValid = isStructuredResultReportValid(
    input.structured_result_report,
  );
  const resultReportExternalAuthorityAbsent =
    input.structured_result_report.branch_created === false &&
    input.structured_result_report.pr_created === false &&
    input.structured_result_report.github_called === false &&
    input.structured_result_report.codex_executed === false;
  const changedFileCountWithinContract =
    input.structured_result_report.changed_file_count <=
    sourceContract.launch_envelope.max_changed_files;
  const budgetWithinContract = isBudgetUsedWithinEnvelope(
    input.structured_result_report.budget_used,
    sourceContract.launch_envelope,
  );
  const requiredChecksAccountedForFlag = requiredChecksAccountedFor(
    sourceContract.launch_envelope.required_checks,
    input.structured_result_report,
  );
  const authorityBoundaryAllFalse =
    assertAllFalseBoundary(
      input.authority_boundary,
      "autohunt_result_intake_authority_boundary",
    ).passed &&
    assertAllFalseBoundary(
      sourceContract.authority_boundary,
      "autohunt_result_intake_source_contract_authority_boundary",
    ).passed;
  const persistedMaterialBoundarySafe =
    input.persisted_material_boundary.persists_source_fingerprints === true &&
    input.persisted_material_boundary.persists_result_summary === true &&
    input.persisted_material_boundary.persists_raw_result_text === false &&
    input.persisted_material_boundary.persists_raw_prompt_text === false &&
    input.persisted_material_boundary.persists_raw_pr_body === false &&
    input.persisted_material_boundary.persists_raw_operator_note === false &&
    input.persisted_material_boundary.persists_raw_source_payload === false &&
    input.persisted_material_boundary.persists_secret_or_token === false &&
    input.persisted_material_boundary.persists_url_or_env_value === false;
  const rawMaterialAbsent =
    isRawMaterialAbsent(input.raw_material_probe) &&
    isRawMaterialAbsent(input.structured_result_report) &&
    isRawMaterialAbsent(sourceContract);

  const passed =
    sourceExecutionContractReady &&
    sourceExecutionContractFingerprintVerified &&
    launchGuardNoExecution &&
    requiredLearningHooksPresent &&
    resultReportPresent &&
    resultReportValid &&
    resultReportExternalAuthorityAbsent &&
    changedFileCountWithinContract &&
    budgetWithinContract &&
    requiredChecksAccountedForFlag &&
    authorityBoundaryAllFalse &&
    persistedMaterialBoundarySafe &&
    rawMaterialAbsent;

  return {
    passed,
    fingerprint_algorithm: FINGERPRINT_ALGORITHM,
    source_execution_contract_ready: sourceExecutionContractReady,
    source_execution_contract_fingerprint_verified:
      sourceExecutionContractFingerprintVerified,
    launch_guard_no_execution: launchGuardNoExecution,
    required_learning_hooks_present: requiredLearningHooksPresent,
    result_report_present: resultReportPresent,
    result_report_valid: resultReportValid,
    result_report_external_authority_absent:
      resultReportExternalAuthorityAbsent,
    changed_file_count_within_contract: changedFileCountWithinContract,
    budget_within_contract: budgetWithinContract,
    required_checks_accounted_for: requiredChecksAccountedForFlag,
    authority_boundary_all_false: authorityBoundaryAllFalse,
    persisted_material_boundary_safe: persistedMaterialBoundarySafe,
    raw_material_absent: rawMaterialAbsent,
    target_only_write_proven: true,
  };
}

function refusalReasonsFromValidation(validation: AutohuntResultIntakeValidation) {
  return [
    !validation.source_execution_contract_ready
      ? "source_execution_contract_not_ready"
      : null,
    !validation.source_execution_contract_fingerprint_verified
      ? "source_execution_contract_fingerprint_mismatch"
      : null,
    !validation.launch_guard_no_execution
      ? "source_execution_contract_launch_guard_not_passive"
      : null,
    !validation.required_learning_hooks_present
      ? "source_execution_contract_learning_hooks_missing"
      : null,
    !validation.result_report_present ? "result_report_missing" : null,
    !validation.result_report_valid ? "result_report_invalid" : null,
    !validation.result_report_external_authority_absent
      ? "result_report_external_authority_claimed"
      : null,
    !validation.changed_file_count_within_contract
      ? "changed_file_count_exceeds_contract"
      : null,
    !validation.budget_within_contract ? "budget_overrun" : null,
    !validation.required_checks_accounted_for
      ? "checks_failed_or_missing"
      : null,
    !validation.authority_boundary_all_false
      ? "authority_boundary_not_all_false"
      : null,
    !validation.persisted_material_boundary_safe
      ? "persisted_material_boundary_unsafe"
      : null,
    !validation.raw_material_absent ? "raw_material_fields_present" : null,
  ].filter((reason): reason is string => Boolean(reason));
}

function normalizeStructuredResultReport(
  input: AutohuntStructuredResultReportInput | null | undefined,
  contract: AutohuntSupervisedExecutionContract,
): AutohuntStructuredResultReport {
  const checksRun = uniqueStrings(input?.checks_run ?? []);
  const checksPassed = uniqueStrings(input?.checks_passed ?? []);
  const checksFailed = uniqueStrings(input?.checks_failed ?? []);
  const checksSkipped = uniqueStrings(input?.checks_skipped ?? []);
  const changedFiles = uniqueStrings(input?.changed_files ?? []);
  const changedFileCount =
    typeof input?.changed_file_count === "number"
      ? input.changed_file_count
      : changedFiles.length;
  const maxChangedFiles =
    typeof input?.max_changed_files === "number"
      ? input.max_changed_files
      : contract.launch_envelope.max_changed_files;
  const resultSource =
    AUTOHUNT_RESULT_REPORT_SOURCES.includes(
      input?.result_source as AutohuntResultReportSource,
    )
      ? (input?.result_source as AutohuntResultReportSource)
      : "dry_run_fixture_report";
  const resultStatus =
    AUTOHUNT_RESULT_REPORT_STATUSES.includes(
      input?.result_status as AutohuntResultReportStatus,
    )
      ? (input?.result_status as AutohuntResultReportStatus)
      : "completed";
  const budgetUsed = normalizeBudgetUsed(input?.budget_used);
  const reportWithoutFingerprint: Omit<
    AutohuntStructuredResultReport,
    "result_report_fingerprint"
  > = {
    result_report_id: input?.result_report_id ?? "",
    result_source: resultSource,
    result_status: resultStatus,
    source_contract_launch_mode: contract.launch_envelope.launch_mode,
    branch_created: false,
    pr_created: false,
    github_called: false,
    codex_executed: false,
    checks_run: checksRun,
    checks_passed: checksPassed,
    checks_failed: checksFailed,
    checks_skipped: checksSkipped,
    changed_files: changedFiles,
    changed_file_count: changedFileCount,
    expected_changed_file_globs: uniqueStrings(
      input?.expected_changed_file_globs ??
        contract.launch_envelope.allowed_file_globs,
    ),
    max_changed_files: maxChangedFiles,
    budget_used: budgetUsed,
    blocker_reasons: uniqueStrings(input?.blocker_reasons ?? []),
    warning_reasons: uniqueStrings(input?.warning_reasons ?? []),
    useful_refs: uniqueStrings(input?.useful_refs ?? []),
    stale_refs: uniqueStrings(input?.stale_refs ?? []),
    missing_refs: uniqueStrings(input?.missing_refs ?? []),
    noisy_refs: uniqueStrings(input?.noisy_refs ?? []),
    raw_result_text_persisted: false,
  };
  const resultReportId =
    reportWithoutFingerprint.result_report_id ||
    `autohunt-result-report:${stripFingerprintPrefix(
      fingerprint(reportWithoutFingerprint),
    )}`;
  const reportWithId = {
    ...reportWithoutFingerprint,
    result_report_id: resultReportId,
  };
  const resultReportFingerprint = fingerprint(reportWithId);

  return {
    ...reportWithId,
    result_report_fingerprint:
      input?.result_report_fingerprint ?? resultReportFingerprint,
  };
}

function buildExpectedObservedDeltaCandidate(
  contract: AutohuntSupervisedExecutionContract,
  report: AutohuntStructuredResultReport,
): AutohuntExpectedObservedDeltaCandidate {
  const requiredChecks = contract.launch_envelope.required_checks;
  const missingRequiredChecks = requiredChecks.filter(
    (check) =>
      !report.checks_run.includes(check) && !report.checks_skipped.includes(check),
  );
  const skippedRequiredChecks = requiredChecks.filter((check) =>
    report.checks_skipped.includes(check),
  );
  const failedRequiredChecks = requiredChecks.filter((check) =>
    report.checks_failed.includes(check),
  );
  const matchedExpectations = [
    report.branch_created === false ? "branch_not_created" : null,
    report.pr_created === false ? "pr_not_created" : null,
    report.github_called === false ? "github_not_called" : null,
    report.codex_executed === false ? "codex_not_executed" : null,
    report.changed_file_count <= contract.launch_envelope.max_changed_files
      ? "changed_file_count_within_contract"
      : null,
    isBudgetUsedWithinEnvelope(report.budget_used, contract.launch_envelope)
      ? "budget_within_contract"
      : null,
  ].filter((item): item is string => Boolean(item));
  const missedExpectations = uniqueStrings([
    ...missingRequiredChecks.map((check) => `missing_required_check:${check}`),
    ...skippedRequiredChecks.map((check) => `skipped_required_check:${check}`),
    ...failedRequiredChecks.map((check) => `failed_required_check:${check}`),
  ]);
  const unexpectedObservations = uniqueStrings([
    ...report.blocker_reasons.map((reason) => `blocker:${reason}`),
    ...report.warning_reasons.map((reason) => `warning:${reason}`),
  ]);
  const deltaWithoutFingerprint: Omit<
    AutohuntExpectedObservedDeltaCandidate,
    "delta_fingerprint"
  > = {
    delta_kind: "autohunt_expected_observed_delta_candidate",
    expected_summary: `Expected safe supervised handoff result under contract ${contract.contract_id} with ${requiredChecks.length} required checks and max ${contract.launch_envelope.max_changed_files} changed files.`,
    observed_summary: `Observed ${report.result_status} report ${report.result_report_id} with ${report.checks_passed.length} passed, ${report.checks_failed.length} failed, ${report.checks_skipped.length} skipped checks, and ${report.changed_file_count} changed files.`,
    matched_expectations: matchedExpectations,
    missed_expectations: missedExpectations,
    unexpected_observations: unexpectedObservations,
    checks_delta: {
      required_checks: requiredChecks,
      checks_run: report.checks_run,
      checks_passed: report.checks_passed,
      checks_failed: report.checks_failed,
      checks_skipped: report.checks_skipped,
      missing_required_checks: missingRequiredChecks,
    },
    files_delta: {
      expected_changed_file_globs: report.expected_changed_file_globs,
      changed_files: report.changed_files,
      changed_file_count: report.changed_file_count,
      max_changed_files: report.max_changed_files,
      file_count_within_limit:
        report.changed_file_count <= contract.launch_envelope.max_changed_files,
    },
    budget_delta: {
      budget_used: report.budget_used,
      max_iterations: contract.launch_envelope.max_iterations,
      max_tool_calls: contract.launch_envelope.max_tool_calls,
      max_codex_tasks: contract.launch_envelope.max_codex_tasks,
      max_draft_prs: contract.launch_envelope.max_draft_prs,
      max_changed_files: contract.launch_envelope.max_changed_files,
      budget_within_contract: isBudgetUsedWithinEnvelope(
        report.budget_used,
        contract.launch_envelope,
      ),
    },
    delta_status: computeDeltaStatus({
      report,
      missedExpectations,
      unexpectedObservations,
    }),
  };
  return {
    ...deltaWithoutFingerprint,
    delta_fingerprint: fingerprint(deltaWithoutFingerprint),
  };
}

function buildReuseOutcomeCandidate(
  sourceContract: AutohuntResultIntakeSourceExecutionContract,
  report: AutohuntStructuredResultReport,
): AutohuntReuseOutcomeCandidate {
  const usefulRefs = uniqueStrings([
    sourceContract.contract_id,
    sourceContract.active_grant_id,
    sourceContract.ready_preflight_packet_id,
    sourceContract.operator_decision_id,
    ...report.useful_refs,
  ]);
  const staleRefs = uniqueStrings(report.stale_refs);
  const missingRefs = uniqueStrings(report.missing_refs);
  const noisyRefs = uniqueStrings(report.noisy_refs);
  const outcomeWithoutFingerprint: Omit<
    AutohuntReuseOutcomeCandidate,
    "outcome_fingerprint"
  > = {
    reuse_outcome_kind: "autohunt_reuse_outcome_candidate",
    source_chain_helpfulness: computeReuseHelpfulness({
      report,
      usefulRefs,
      staleRefs,
      missingRefs,
      noisyRefs,
    }),
    useful_refs: usefulRefs,
    stale_refs: staleRefs,
    missing_refs: missingRefs,
    noisy_refs: noisyRefs,
    reused_context_fingerprint: fingerprint({
      contract_fingerprint: sourceContract.contract_fingerprint,
      active_grant_fingerprint: sourceContract.active_grant_fingerprint,
      ready_preflight_packet_fingerprint:
        sourceContract.ready_preflight_packet_fingerprint,
      operator_decision_fingerprint:
        sourceContract.operator_decision_fingerprint,
      copy_export_preview_fingerprint:
        sourceContract.copy_export_preview_fingerprint,
    }),
  };
  return {
    ...outcomeWithoutFingerprint,
    outcome_fingerprint: fingerprint(outcomeWithoutFingerprint),
  };
}

function buildResidualDiagnosticCandidate(
  contract: AutohuntSupervisedExecutionContract,
  report: AutohuntStructuredResultReport,
  delta: AutohuntExpectedObservedDeltaCandidate,
): AutohuntResidualDiagnosticCandidate {
  const skippedRequiredChecks = contract.launch_envelope.required_checks.filter(
    (check) => report.checks_skipped.includes(check),
  );
  const failedRequiredChecks = contract.launch_envelope.required_checks.filter(
    (check) => report.checks_failed.includes(check),
  );
  const category =
    failedRequiredChecks.length > 0
      ? "check_failure"
      : skippedRequiredChecks.length > 0
        ? "skipped_required_check"
        : !delta.budget_delta.budget_within_contract
          ? "budget_drift"
          : !delta.files_delta.file_count_within_limit
            ? "file_scope_drift"
            : report.blocker_reasons.length > 0
              ? "unexpected_blocker"
              : delta.delta_status === "aligned"
                ? "no_residual"
                : "result_report_gap";
  const severity =
    category === "check_failure" || category === "budget_drift"
      ? "high"
      : category === "skipped_required_check" ||
          category === "file_scope_drift" ||
          category === "unexpected_blocker"
        ? "medium"
        : category === "result_report_gap"
          ? "low"
          : "none";
  const residualWithoutFingerprint: Omit<
    AutohuntResidualDiagnosticCandidate,
    "residual_fingerprint"
  > = {
    residual_kind: "autohunt_residual_diagnostic_candidate",
    severity,
    residual_category: category,
    residual_summary: residualSummary({
      category,
      failedRequiredChecks,
      skippedRequiredChecks,
      report,
    }),
    recommended_next_work_class: recommendedNextWorkClass(category),
  };
  return {
    ...residualWithoutFingerprint,
    residual_fingerprint: fingerprint(residualWithoutFingerprint),
  };
}

function buildLearningLoopSummary({
  structuredResultReport,
  expectedObservedDeltaCandidate,
  residualDiagnosticCandidate,
}: {
  structuredResultReport: AutohuntStructuredResultReport;
  expectedObservedDeltaCandidate: AutohuntExpectedObservedDeltaCandidate;
  residualDiagnosticCandidate: AutohuntResidualDiagnosticCandidate;
}): AutohuntLearningLoopSummary {
  return {
    result_intake_required_satisfied: true,
    expected_observed_delta_required_satisfied: true,
    reuse_outcome_required_satisfied: true,
    residual_diagnostic_required_satisfied: true,
    ready_for_next_daily_autohunt_cycle:
      ["completed", "completed_with_warnings"].includes(
        structuredResultReport.result_status,
      ) &&
      ["aligned", "minor_delta"].includes(
        expectedObservedDeltaCandidate.delta_status,
      ) &&
      ["none", "low"].includes(residualDiagnosticCandidate.severity),
  };
}

function summarizeSourceExecutionContract(
  contract: AutohuntSupervisedExecutionContract,
): AutohuntResultIntakeSourceExecutionContract {
  return {
    contract_id: contract.contract_id,
    contract_fingerprint: contract.contract_fingerprint,
    contract_status: contract.contract_status,
    launch_mode: contract.launch_envelope.launch_mode,
    source_readiness_gate_fingerprint:
      contract.source_readiness_gate.gate_fingerprint,
    active_grant_id: contract.source_readiness_gate.active_grant_id,
    active_grant_fingerprint:
      contract.source_readiness_gate.active_grant_fingerprint,
    ready_preflight_packet_id:
      contract.source_readiness_gate.ready_preflight_packet_id,
    ready_preflight_packet_fingerprint:
      contract.source_readiness_gate.ready_preflight_packet_fingerprint,
    operator_decision_id: contract.source_readiness_gate.operator_decision_id,
    operator_decision_fingerprint:
      contract.source_readiness_gate.operator_decision_fingerprint,
    copy_export_preview_fingerprint:
      contract.source_readiness_gate.copy_export_preview_fingerprint,
  };
}

function computeIdempotencyKey(input: NormalizedResultIntakeInput) {
  return buildDeterministicIdempotencyKey({
    kind: AUTOHUNT_RESULT_INTAKE_KIND,
    version: AUTOHUNT_RESULT_INTAKE_VERSION,
    source: {
      source_execution_contract_fingerprint:
        input.source_execution_contract.contract_fingerprint,
      result_report_fingerprint:
        input.structured_result_report.result_report_fingerprint,
      checks_summary: {
        checks_run: input.structured_result_report.checks_run,
        checks_passed: input.structured_result_report.checks_passed,
        checks_failed: input.structured_result_report.checks_failed,
        checks_skipped: input.structured_result_report.checks_skipped,
      },
      changed_file_summary: {
        changed_files: input.structured_result_report.changed_files,
        changed_file_count:
          input.structured_result_report.changed_file_count,
      },
      delta_fingerprint:
        input.expected_observed_delta_candidate.delta_fingerprint,
      reuse_outcome_fingerprint:
        input.reuse_outcome_candidate.outcome_fingerprint,
      residual_fingerprint:
        input.residual_diagnostic_candidate.residual_fingerprint,
    },
  });
}

function computeDeltaStatus({
  report,
  missedExpectations,
  unexpectedObservations,
}: {
  report: AutohuntStructuredResultReport;
  missedExpectations: string[];
  unexpectedObservations: string[];
}) {
  if (["blocked", "failed", "skipped"].includes(report.result_status)) {
    return "blocked_or_failed";
  }
  if (
    missedExpectations.some(
      (reason) =>
        reason.startsWith("missing_required_check") ||
        reason.startsWith("failed_required_check"),
    )
  ) {
    return "major_delta";
  }
  if (missedExpectations.length > 0 || unexpectedObservations.length > 0) {
    return "minor_delta";
  }
  return "aligned";
}

function computeReuseHelpfulness({
  report,
  usefulRefs,
  staleRefs,
  missingRefs,
  noisyRefs,
}: {
  report: AutohuntStructuredResultReport;
  usefulRefs: string[];
  staleRefs: string[];
  missingRefs: string[];
  noisyRefs: string[];
}) {
  if (missingRefs.length > 0) return "missing";
  if (staleRefs.length > 0) return "stale";
  if (noisyRefs.length > 0) return "noisy";
  if (usefulRefs.length === 0) return "not_evaluated";
  if (
    report.warning_reasons.length > 0 ||
    report.checks_failed.length > 0 ||
    report.checks_skipped.length > 0
  ) {
    return "partially_helpful";
  }
  return "helpful";
}

function residualSummary({
  category,
  failedRequiredChecks,
  skippedRequiredChecks,
  report,
}: {
  category: string;
  failedRequiredChecks: string[];
  skippedRequiredChecks: string[];
  report: AutohuntStructuredResultReport;
}) {
  if (category === "check_failure") {
    return `Required checks failed: ${failedRequiredChecks.join(", ")}`;
  }
  if (category === "skipped_required_check") {
    return `Required checks were explicitly skipped: ${skippedRequiredChecks.join(", ")}`;
  }
  if (category === "budget_drift") {
    return "Reported budget usage exceeded the supervised execution contract.";
  }
  if (category === "file_scope_drift") {
    return "Reported changed file count exceeded the supervised execution contract.";
  }
  if (category === "unexpected_blocker") {
    return `Result report included blockers: ${report.blocker_reasons.join(", ")}`;
  }
  if (category === "result_report_gap") {
    return "Result report was recorded with minor expectation gaps for the next cycle.";
  }
  return "No residual diagnostic is required from this structured result report.";
}

function recommendedNextWorkClass(category: string) {
  if (category === "check_failure" || category === "skipped_required_check") {
    return "test_fix";
  }
  if (category === "file_scope_drift" || category === "budget_drift") {
    return "small_refactor";
  }
  if (category === "unexpected_blocker" || category === "result_report_gap") {
    return "residual_diagnostic_review";
  }
  return "none";
}

function validateRawMaterialBoundary(input: AutohuntResultIntakeInput) {
  const scrubbed = scrubForRawMaterialScan(input);
  const refusalReasons: string[] = [];
  if (
    findForbiddenRawMaterialFields(scrubbed).length > 0 ||
    containsForbiddenRawMaterial(scrubbed)
  ) {
    refusalReasons.push("raw_material_fields_present");
  }
  if (findUnsafeStringMaterial(scrubbed).length > 0) {
    refusalReasons.push("unsafe_string_material_present");
  }
  return refusalReasons;
}

function hasRequiredSourceContractFields(
  contract: AutohuntSupervisedExecutionContract,
) {
  const source = contract.source_readiness_gate;
  return requiredStringFieldsPresent(
    {
      contract_id: contract.contract_id,
      contract_fingerprint: contract.contract_fingerprint,
      source_readiness_gate_fingerprint: source.gate_fingerprint,
      active_grant_id: source.active_grant_id,
      active_grant_fingerprint: source.active_grant_fingerprint,
      ready_preflight_packet_id: source.ready_preflight_packet_id,
      ready_preflight_packet_fingerprint:
        source.ready_preflight_packet_fingerprint,
      operator_decision_id: source.operator_decision_id,
      operator_decision_fingerprint: source.operator_decision_fingerprint,
      copy_export_preview_fingerprint:
        source.copy_export_preview_fingerprint,
    },
    [
      "contract_id",
      "contract_fingerprint",
      "source_readiness_gate_fingerprint",
      "active_grant_id",
      "active_grant_fingerprint",
      "ready_preflight_packet_id",
      "ready_preflight_packet_fingerprint",
      "operator_decision_id",
      "operator_decision_fingerprint",
      "copy_export_preview_fingerprint",
    ],
  ).passed;
}

function isStructuredResultReportValid(report: AutohuntStructuredResultReport) {
  const expectedFingerprint = computeResultReportFingerprint(report);
  return (
    Boolean(report.result_report_id) &&
    report.result_report_fingerprint === expectedFingerprint &&
    AUTOHUNT_RESULT_REPORT_SOURCES.includes(report.result_source) &&
    AUTOHUNT_RESULT_REPORT_STATUSES.includes(report.result_status) &&
    report.changed_file_count === report.changed_files.length &&
    report.changed_file_count >= 0 &&
    report.max_changed_files >= 0 &&
    report.raw_result_text_persisted === false
  );
}

function computeResultReportFingerprint(report: AutohuntStructuredResultReport) {
  const {
    result_report_fingerprint: _resultReportFingerprint,
    ...fingerprintSource
  } = report;
  return fingerprint(fingerprintSource);
}

function isBudgetUsedWithinEnvelope(
  budgetUsed: AutohuntStructuredResultReport["budget_used"],
  envelope: AutohuntSupervisedExecutionLaunchEnvelope,
) {
  return (
    budgetUsed.iterations <= envelope.max_iterations &&
    budgetUsed.tool_calls <= envelope.max_tool_calls &&
    budgetUsed.codex_tasks <= envelope.max_codex_tasks &&
    budgetUsed.draft_prs <= envelope.max_draft_prs &&
    budgetUsed.changed_files <= envelope.max_changed_files &&
    Object.values(budgetUsed).every(
      (value) => typeof value === "number" && Number.isFinite(value) && value >= 0,
    )
  );
}

function requiredChecksAccountedFor(
  requiredChecks: string[],
  report: AutohuntStructuredResultReport,
) {
  return requiredChecks.every(
    (check) =>
      report.checks_run.includes(check) || report.checks_skipped.includes(check),
  );
}

function normalizeBudgetUsed(
  input: AutohuntStructuredResultReportInput["budget_used"],
) {
  return {
    iterations: numberOrDefault(input?.iterations, 0),
    tool_calls: numberOrDefault(input?.tool_calls, 0),
    codex_tasks: numberOrDefault(input?.codex_tasks, 0),
    draft_prs: numberOrDefault(input?.draft_prs, 0),
    changed_files: numberOrDefault(input?.changed_files, 0),
  };
}

function numberOrDefault(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return [
    ...new Set(values.filter((value): value is string => Boolean(value?.trim()))),
  ].sort();
}

function createPersistedMaterialBoundary(): AutohuntResultIntakePersistedMaterialBoundary {
  return {
    persists_source_fingerprints: true,
    persists_result_summary: true,
    persists_raw_result_text: false,
    persists_raw_prompt_text: false,
    persists_raw_pr_body: false,
    persists_raw_operator_note: false,
    persists_raw_source_payload: false,
    persists_secret_or_token: false,
    persists_url_or_env_value: false,
  };
}

function captureRowCounts(db: AutonomyDelegationGrantDbLike): RowCountSnapshot {
  return Object.fromEntries(
    TARGET_AND_NON_TARGET_TABLES.map((tableName) => [
      tableName,
      countRowsIfTableExists(db, tableName),
    ]),
  );
}

function buildRowCountWriteSummary({
  beforeCounts,
  afterCounts,
}: {
  beforeCounts: RowCountSnapshot;
  afterCounts: RowCountSnapshot;
}): AutohuntResultIntakeRowCountWriteSummary {
  return summarizeTargetOnlyRowCountWrite({
    targetTable: AUTOHUNT_RESULT_INTAKE_TABLE,
    tableNames: TARGET_AND_NON_TARGET_TABLES,
    beforeCounts,
    afterCounts,
    expectedTargetDelta: 1,
  }) as AutohuntResultIntakeRowCountWriteSummary;
}

function countRowsIfTableExists(
  db: AutonomyDelegationGrantDbLike,
  tableName: string,
) {
  const table = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name = ?
      `,
    )
    .get(tableName);
  if (!table) return 0;
  const row = db
    .prepare(`SELECT COUNT(*) AS count FROM ${tableName}`)
    .get() as { count: number };
  return row.count;
}

function unsafeExternalAuthorityClaimsPresent(value: unknown): boolean {
  if (value === null || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(unsafeExternalAuthorityClaimsPresent);
  return Object.entries(value as Record<string, unknown>).some(
    ([key, nestedValue]) => {
      const normalizedKey = key.toLowerCase();
      if (
        UNSAFE_EXTERNAL_AUTHORITY_KEYS.has(normalizedKey) &&
        nestedValue === true
      ) {
        return true;
      }
      return unsafeExternalAuthorityClaimsPresent(nestedValue);
    },
  );
}

function isRawMaterialAbsent(value: unknown) {
  if (value === null || typeof value === "undefined") return true;
  const scrubbed = scrubForRawMaterialScan(value);
  return (
    findForbiddenRawMaterialFields(scrubbed).length === 0 &&
    !containsForbiddenRawMaterial(scrubbed) &&
    findUnsafeStringMaterial(scrubbed).length === 0
  );
}

function scrubForRawMaterialScan(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(scrubForRawMaterialScan);
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(
      ([key, nestedValue], index) => [
        SAFE_RAW_MATERIAL_KEYS.has(key)
          ? `safe_field_${index}`
          : key,
        scrubForRawMaterialScan(nestedValue),
      ],
    ),
  );
}

function findUnsafeStringMaterial(value: unknown, path: string[] = []): string[] {
  if (typeof value === "string") {
    return isUnsafeStringMaterial(value) ? [path.join(".")] : [];
  }
  if (value === null || typeof value !== "object") return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      findUnsafeStringMaterial(item, [...path, String(index)]),
    );
  }
  return Object.entries(value as Record<string, unknown>).flatMap(
    ([key, nestedValue]) => findUnsafeStringMaterial(nestedValue, [...path, key]),
  );
}

function isUnsafeStringMaterial(value: string) {
  return (
    /https?:\/\//i.test(value) ||
    /\b[A-Z][A-Z0-9_]{2,}\s*=\s*\S+/.test(value) ||
    /\b(sk-[A-Za-z0-9_-]{8,}|gh[pousr]_[A-Za-z0-9_]{8,}|AKIA[0-9A-Z]{16})\b/.test(
      value,
    ) ||
    /BEGIN [A-Z ]*PRIVATE KEY/.test(value) ||
    /\b(api[_-]?key|token|secret|password)\s*[:=]\s*\S+/i.test(value)
  );
}

function createAcceptedResult({
  result_status,
  result_intake,
  result_intake_record_written,
  duplicate_replayed,
}: Pick<
  AutohuntResultIntakeWriteResult,
  | "result_status"
  | "result_intake"
  | "result_intake_record_written"
  | "duplicate_replayed"
>): AutohuntResultIntakeWriteResult {
  return {
    ok: true,
    result_status,
    refusal_reasons: [],
    result_intake,
    duplicate_replayed,
    result_intake_record_written,
    row_count_write_summary: result_intake?.row_count_write_summary ?? null,
    ...noExecutionWriteResultFlags(),
  };
}

function createRefusedResult(
  refusalReasons: string[],
): AutohuntResultIntakeWriteResult {
  return {
    ok: false,
    result_status: "refused",
    refusal_reasons:
      refusalReasons.length > 0 ? [...new Set(refusalReasons)] : ["refused"],
    result_intake: null,
    duplicate_replayed: false,
    result_intake_record_written: false,
    row_count_write_summary: null,
    ...noExecutionWriteResultFlags(),
  };
}

function noExecutionWriteResultFlags() {
  return {
    execution_started: false,
    codex_executed: false,
    github_called: false,
    branch_or_pr_created: false,
    can_start_runner: false,
    can_schedule_runner: false,
    can_execute_codex: false,
    can_call_github: false,
    can_create_branch_or_pr: false,
    can_merge: false,
    can_deploy: false,
    can_publish_external: false,
    can_call_provider_or_openai: false,
    can_fetch_sources: false,
    can_run_retrieval: false,
    can_write_memory: false,
    can_promote_perspective: false,
    can_mutate_cwp: false,
    can_mutate_work: false,
    can_write_proof_or_evidence: false,
    can_auto_apply_delta: false,
    raw_material_persisted: false,
  } as const;
}

function hasClose(
  db: AutonomyDelegationGrantDbLike,
): db is AutonomyDelegationGrantDbLike & { close(): void } {
  return typeof (db as { close?: unknown }).close === "function";
}
