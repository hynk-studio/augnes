import { openDatabase } from "@/lib/db";
import type { AutonomyDelegationGrantDbLike } from "@/lib/autonomy/read-autonomy-delegation-grants";
import {
  computeAutohuntSupervisedExecutionContractFingerprint,
  ensureAutohuntSupervisedExecutionContractSchema,
  parseAutohuntSupervisedExecutionContractRow,
  buildAutohuntSupervisedExecutionContractAuthorityBoundary,
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
import type { AutohuntExecutionReadinessGate } from "@/types/autohunt-execution-readiness-gate";
import {
  AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_KIND,
  AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_TABLE,
  AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_VERSION,
  AUTOHUNT_SUPERVISED_EXECUTION_LAUNCHER_MAY,
  AUTOHUNT_SUPERVISED_EXECUTION_LAUNCHER_MUST_NOT,
  AUTOHUNT_SUPERVISED_EXECUTION_LAUNCH_MODES,
  type AutohuntSupervisedExecutionContract,
  type AutohuntSupervisedExecutionContractInput,
  type AutohuntSupervisedExecutionContractSourceReadinessGate,
  type AutohuntSupervisedExecutionContractWriteResult,
  type AutohuntSupervisedExecutionFreshnessContract,
  type AutohuntSupervisedExecutionLaunchEnvelope,
  type AutohuntSupervisedExecutionLaunchGuardChecks,
  type AutohuntSupervisedExecutionPersistedMaterialBoundary,
  type AutohuntSupervisedExecutionRowCountWriteSummary,
  type AutohuntSupervisedExecutionValidation,
} from "@/types/autohunt-supervised-execution-contract";
import { RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_PROTECTED_ROW_COUNT_TABLES } from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-result";

export interface WriteAutohuntSupervisedExecutionContractOptions {
  db?: AutonomyDelegationGrantDbLike;
  now?: string;
}

type RowCountSnapshot = Record<string, number>;

const REQUIRED_FUTURE_REQUIREMENTS = [
  "explicit_user_reconfirmation_required",
  "fresh_grant_required",
  "fresh_preflight_required",
  "fresh_operator_approval_required",
  "result_intake_required",
  "expected_observed_delta_required",
  "reuse_outcome_required",
  "residual_diagnostic_required",
] as const;

const NON_TARGET_ROW_COUNT_TABLES = [
  AUTONOMY_DELEGATION_GRANT_TABLE,
  AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE,
  AUTOHUNT_PREFLIGHT_PACKET_TABLE,
  AUTOHUNT_HANDOFF_PLAN_PREVIEW_TABLE,
  AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_TABLE,
  ...RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_PROTECTED_ROW_COUNT_TABLES,
] as const;

const TARGET_AND_NON_TARGET_TABLES = [
  AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_TABLE,
  ...NON_TARGET_ROW_COUNT_TABLES,
] as const;

const SAFE_RAW_MATERIAL_BOUNDARY_KEYS = new Set([
  "raw_material_absent",
  "raw_material_persisted",
  "raw_material_persisted_any",
  "raw_prompt_text_persisted",
  "raw_copy_text_persisted",
  "raw_pr_body_persisted",
  "raw_operator_note_persisted",
  "raw_source_payload_persisted",
  "persists_raw_prompt_text",
  "persists_raw_copy_text",
  "persists_raw_pr_body",
  "persists_raw_operator_note",
  "persists_raw_source_payload",
  "persists_secret_or_token",
  "persists_url_or_env_value",
  "secret_or_token_persisted",
  "url_or_env_value_persisted",
  "expected_result_report_sections",
]);

export function writeAutohuntSupervisedExecutionContract(
  input: AutohuntSupervisedExecutionContractInput,
  options: WriteAutohuntSupervisedExecutionContractOptions = {},
): AutohuntSupervisedExecutionContractWriteResult {
  const sourceReadinessGate = input.source_readiness_gate ?? null;
  const validationRefusalReasons =
    validateAutohuntSupervisedExecutionContractInput(input);
  if (validationRefusalReasons.length > 0 || !sourceReadinessGate) {
    return createRefusedResult(validationRefusalReasons);
  }

  const normalizedInput = normalizeExecutionContractInput(
    input,
    sourceReadinessGate,
  );
  const validation = buildExecutionContractValidation(normalizedInput);
  if (!validation.passed) {
    return createRefusedResult(refusalReasonsFromValidation(validation));
  }

  const idempotencyKey = computeIdempotencyKey(normalizedInput);
  const db = options.db ?? openDatabase();
  const shouldClose = !options.db && hasClose(db);

  try {
    ensureAutohuntSupervisedExecutionContractSchema(db);
    const existingRow = db
      .prepare(
        `
          SELECT *
          FROM ${AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_TABLE}
          WHERE idempotency_key = ?
        `,
      )
      .get(idempotencyKey);

    if (existingRow) {
      const existingContract =
        parseAutohuntSupervisedExecutionContractRow(existingRow as never);
      if (
        existingContract &&
        existingContract.contract_fingerprint ===
          computeAutohuntSupervisedExecutionContractFingerprint(
            existingContract,
          )
      ) {
        return createAcceptedResult({
          result_status: "duplicate_replayed",
          contract: existingContract,
          contract_record_written: false,
          duplicate_replayed: true,
        });
      }
      return createRefusedResult([
        "idempotency_conflict_existing_supervised_execution_contract_fingerprint_mismatch",
      ]);
    }

    db.exec("BEGIN IMMEDIATE");
    try {
      const beforeCounts = captureRowCounts(db);
      const expectedWriteSummary = buildRowCountWriteSummary({
        beforeCounts,
        afterCounts: {
          ...beforeCounts,
          [AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_TABLE]:
            beforeCounts[AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_TABLE] + 1,
        },
      });
      const contract = buildContractRecord({
        input: normalizedInput,
        validation,
        idempotencyKey,
        createdAt: options.now ?? new Date().toISOString(),
        rowCountWriteSummary: expectedWriteSummary,
      });

      insertContractRecord(db, contract);

      const afterCounts = captureRowCounts(db);
      const actualWriteSummary = buildRowCountWriteSummary({
        beforeCounts,
        afterCounts,
      });
      if (!isTargetOnlyRowCountWrite(actualWriteSummary)) {
        db.exec("ROLLBACK");
        return createRefusedResult([
          "target_only_autohunt_supervised_execution_contract_row_count_proof_failed",
        ]);
      }

      db.exec("COMMIT");
      return createAcceptedResult({
        result_status: "written",
        contract,
        contract_record_written: true,
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

export function validateAutohuntSupervisedExecutionContractInput(
  input: AutohuntSupervisedExecutionContractInput,
): string[] {
  const refusalReasons: string[] = [];
  if (input.scope !== "project:augnes") {
    refusalReasons.push("scope_invalid");
  }
  const sourceReadinessGate = input.source_readiness_gate ?? null;
  if (!sourceReadinessGate) {
    refusalReasons.push("source_readiness_gate_missing");
  } else {
    refusalReasons.push(...validateSourceReadinessGate(sourceReadinessGate));
  }
  if (!isValidLaunchMode(input.launch_mode ?? input.launch_envelope?.launch_mode ?? null)) {
    refusalReasons.push("launch_mode_invalid");
  }
  refusalReasons.push(...validateRawMaterialBoundary(input));
  return [...new Set(refusalReasons)];
}

type NormalizedExecutionContractInput = {
  scope: "project:augnes";
  source_gate: AutohuntExecutionReadinessGate;
  source_readiness_gate: AutohuntSupervisedExecutionContractSourceReadinessGate;
  freshness_contract: AutohuntSupervisedExecutionFreshnessContract;
  launch_envelope: AutohuntSupervisedExecutionLaunchEnvelope;
  launch_guard_checks: AutohuntSupervisedExecutionLaunchGuardChecks;
  authority_boundary: ReturnType<
    typeof buildAutohuntSupervisedExecutionContractAuthorityBoundary
  >;
  persisted_material_boundary: AutohuntSupervisedExecutionPersistedMaterialBoundary;
};

function normalizeExecutionContractInput(
  input: AutohuntSupervisedExecutionContractInput,
  sourceGate: AutohuntExecutionReadinessGate,
): NormalizedExecutionContractInput {
  const launchMode = normalizeLaunchMode(
    input.launch_mode ?? input.launch_envelope?.launch_mode ?? null,
  );
  const freshnessContract = normalizeFreshnessContract(
    input.freshness_contract,
  );
  const launchEnvelope = normalizeLaunchEnvelope({
    input: input.launch_envelope,
    launchMode,
  });
  const authorityBoundary = buildAutohuntSupervisedExecutionContractAuthorityBoundary();
  const persistedMaterialBoundary = createPersistedMaterialBoundary();
  const launchGuardChecks = buildLaunchGuardChecks({
    sourceGate,
    freshnessContract,
    launchEnvelope,
    authorityBoundary,
    persistedMaterialBoundary,
    rawMaterialProbe: input.raw_material_probe,
  });

  return {
    scope: "project:augnes",
    source_gate: sourceGate,
    source_readiness_gate: summarizeSourceReadinessGate(sourceGate),
    freshness_contract: freshnessContract,
    launch_envelope: launchEnvelope,
    launch_guard_checks: launchGuardChecks,
    authority_boundary: authorityBoundary,
    persisted_material_boundary: persistedMaterialBoundary,
  };
}

function buildContractRecord({
  input,
  validation,
  idempotencyKey,
  createdAt,
  rowCountWriteSummary,
}: {
  input: NormalizedExecutionContractInput;
  validation: AutohuntSupervisedExecutionValidation;
  idempotencyKey: string;
  createdAt: string;
  rowCountWriteSummary: AutohuntSupervisedExecutionRowCountWriteSummary;
}): AutohuntSupervisedExecutionContract {
  const contractId = `autohunt-supervised-execution-contract:${stripFingerprintPrefix(
    idempotencyKey,
  )}`;
  const contractWithoutFingerprint: Omit<
    AutohuntSupervisedExecutionContract,
    "contract_fingerprint"
  > = {
    execution_contract_kind: AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_KIND,
    execution_contract_version:
      AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_VERSION,
    contract_id: contractId,
    scope: input.scope,
    created_at: createdAt,
    contract_status: "ready_for_future_limited_launcher",
    source_readiness_gate: input.source_readiness_gate,
    freshness_contract: input.freshness_contract,
    launch_envelope: input.launch_envelope,
    launcher_may: [...AUTOHUNT_SUPERVISED_EXECUTION_LAUNCHER_MAY],
    launcher_must_not: [...AUTOHUNT_SUPERVISED_EXECUTION_LAUNCHER_MUST_NOT],
    launch_guard_checks: input.launch_guard_checks,
    launch_guard_result: {
      launch_guard_status: "launch_contract_ready",
      launch_now_allowed: false,
      launcher_design_allowed: true,
      execution_started: false,
      codex_executed: false,
      github_called: false,
      branch_or_pr_created: false,
    },
    authority_boundary: input.authority_boundary,
    persisted_material_boundary: input.persisted_material_boundary,
    validation,
    row_count_write_summary: rowCountWriteSummary,
    idempotency_key: idempotencyKey,
  };

  return {
    ...contractWithoutFingerprint,
    contract_fingerprint:
      computeAutohuntSupervisedExecutionContractFingerprint(
        contractWithoutFingerprint,
      ),
  };
}

function insertContractRecord(
  db: AutonomyDelegationGrantDbLike,
  contract: AutohuntSupervisedExecutionContract,
) {
  db.prepare(
    `
      INSERT INTO ${AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_TABLE} (
        contract_id,
        created_at,
        scope,
        contract_status,
        source_readiness_gate_fingerprint,
        active_grant_id,
        active_grant_fingerprint,
        latest_queued_candidate_id,
        latest_queued_candidate_fingerprint,
        ready_preflight_packet_id,
        ready_preflight_packet_fingerprint,
        handoff_plan_id,
        handoff_plan_fingerprint,
        operator_decision_id,
        operator_decision_fingerprint,
        copy_export_preview_fingerprint,
        launch_mode,
        idempotency_key,
        freshness_contract_json,
        launch_envelope_json,
        launcher_may_json,
        launcher_must_not_json,
        launch_guard_checks_json,
        launch_guard_result_json,
        authority_boundary_json,
        persisted_material_boundary_json,
        validation_json,
        row_count_write_summary_json,
        contract_fingerprint
      )
      VALUES (
        @contract_id,
        @created_at,
        @scope,
        @contract_status,
        @source_readiness_gate_fingerprint,
        @active_grant_id,
        @active_grant_fingerprint,
        @latest_queued_candidate_id,
        @latest_queued_candidate_fingerprint,
        @ready_preflight_packet_id,
        @ready_preflight_packet_fingerprint,
        @handoff_plan_id,
        @handoff_plan_fingerprint,
        @operator_decision_id,
        @operator_decision_fingerprint,
        @copy_export_preview_fingerprint,
        @launch_mode,
        @idempotency_key,
        @freshness_contract_json,
        @launch_envelope_json,
        @launcher_may_json,
        @launcher_must_not_json,
        @launch_guard_checks_json,
        @launch_guard_result_json,
        @authority_boundary_json,
        @persisted_material_boundary_json,
        @validation_json,
        @row_count_write_summary_json,
        @contract_fingerprint
      )
    `,
  ).run({
    contract_id: contract.contract_id,
    created_at: contract.created_at,
    scope: contract.scope,
    contract_status: contract.contract_status,
    source_readiness_gate_fingerprint:
      contract.source_readiness_gate.gate_fingerprint,
    active_grant_id: contract.source_readiness_gate.active_grant_id,
    active_grant_fingerprint:
      contract.source_readiness_gate.active_grant_fingerprint,
    latest_queued_candidate_id:
      contract.source_readiness_gate.latest_queued_candidate_id,
    latest_queued_candidate_fingerprint:
      contract.source_readiness_gate.latest_queued_candidate_fingerprint,
    ready_preflight_packet_id:
      contract.source_readiness_gate.ready_preflight_packet_id,
    ready_preflight_packet_fingerprint:
      contract.source_readiness_gate.ready_preflight_packet_fingerprint,
    handoff_plan_id: contract.source_readiness_gate.handoff_plan_id,
    handoff_plan_fingerprint:
      contract.source_readiness_gate.handoff_plan_fingerprint,
    operator_decision_id: contract.source_readiness_gate.operator_decision_id,
    operator_decision_fingerprint:
      contract.source_readiness_gate.operator_decision_fingerprint,
    copy_export_preview_fingerprint:
      contract.source_readiness_gate.copy_export_preview_fingerprint,
    launch_mode: contract.launch_envelope.launch_mode,
    idempotency_key: contract.idempotency_key,
    freshness_contract_json: stableJson(contract.freshness_contract),
    launch_envelope_json: stableJson(contract.launch_envelope),
    launcher_may_json: stableJson(contract.launcher_may),
    launcher_must_not_json: stableJson(contract.launcher_must_not),
    launch_guard_checks_json: stableJson(contract.launch_guard_checks),
    launch_guard_result_json: stableJson(contract.launch_guard_result),
    authority_boundary_json: stableJson(contract.authority_boundary),
    persisted_material_boundary_json: stableJson(
      contract.persisted_material_boundary,
    ),
    validation_json: stableJson(contract.validation),
    row_count_write_summary_json: stableJson(
      contract.row_count_write_summary,
    ),
    contract_fingerprint: contract.contract_fingerprint,
  });
}

function validateSourceReadinessGate(gate: AutohuntExecutionReadinessGate) {
  const refusalReasons: string[] = [];
  if (
    gate.readiness_status !==
    "ready_for_future_supervised_execution_design"
  ) {
    refusalReasons.push("source_readiness_gate_not_ready");
  }
  if (gate.gate_fingerprint !== computeReadinessGateFingerprint(gate)) {
    refusalReasons.push("source_readiness_gate_fingerprint_mismatch");
  }
  if (gate.readiness_checks.checks_passed !== true) {
    refusalReasons.push("source_readiness_gate_checks_not_passed");
  }
  if (!hasRequiredSourceChainFields(gate)) {
    refusalReasons.push("source_chain_fingerprints_missing");
  }
  for (const requirement of REQUIRED_FUTURE_REQUIREMENTS) {
    if (!gate.future_execution_design_requirements.includes(requirement)) {
      refusalReasons.push(`future_execution_requirement_missing_${requirement}`);
    }
  }
  if (
    assertAllFalseBoundary(
      gate.authority_boundary,
      "autohunt_execution_readiness_gate_authority_boundary",
    ).passed !== true
  ) {
    refusalReasons.push("authority_boundary_not_all_false");
  }
  return refusalReasons;
}

function buildExecutionContractValidation(
  input: NormalizedExecutionContractInput,
): AutohuntSupervisedExecutionValidation {
  const checks = input.launch_guard_checks;
  const persistedMaterialBoundarySafe =
    input.persisted_material_boundary.persists_source_fingerprints === true &&
    input.persisted_material_boundary.persists_launch_policy === true &&
    input.persisted_material_boundary.persists_raw_prompt_text === false &&
    input.persisted_material_boundary.persists_raw_copy_text === false &&
    input.persisted_material_boundary.persists_raw_pr_body === false &&
    input.persisted_material_boundary.persists_raw_operator_note === false &&
    input.persisted_material_boundary.persists_raw_source_payload === false &&
    input.persisted_material_boundary.persists_secret_or_token === false &&
    input.persisted_material_boundary.persists_url_or_env_value === false;
  const passed =
    checks.passed &&
    persistedMaterialBoundarySafe;

  return {
    passed,
    fingerprint_algorithm: FINGERPRINT_ALGORITHM,
    readiness_gate_ready: checks.readiness_gate_ready,
    source_chain_fingerprints_present: checks.source_chain_fingerprints_present,
    future_execution_requirements_present:
      REQUIRED_FUTURE_REQUIREMENTS.every((requirement) =>
        input.source_gate.future_execution_design_requirements.includes(
          requirement,
        ),
      ),
    freshness_policy_present: checks.freshness_policy_present,
    budget_present: checks.budget_present,
    budget_within_bounds: checks.budget_within_bounds,
    stop_conditions_present: checks.stop_conditions_present,
    required_result_intake_present: checks.result_intake_required,
    required_expected_observed_delta_present:
      checks.expected_observed_delta_required,
    required_reuse_outcome_present: checks.reuse_outcome_required,
    required_residual_diagnostic_present:
      checks.residual_diagnostic_required,
    authority_boundary_all_false: checks.authority_boundaries_all_false,
    persisted_material_boundary_safe: persistedMaterialBoundarySafe,
    raw_material_absent: checks.raw_material_absent,
    target_only_write_proven: true,
  };
}

function buildLaunchGuardChecks({
  sourceGate,
  freshnessContract,
  launchEnvelope,
  authorityBoundary,
  persistedMaterialBoundary,
  rawMaterialProbe,
}: {
  sourceGate: AutohuntExecutionReadinessGate;
  freshnessContract: AutohuntSupervisedExecutionFreshnessContract;
  launchEnvelope: AutohuntSupervisedExecutionLaunchEnvelope;
  authorityBoundary: ReturnType<
    typeof buildAutohuntSupervisedExecutionContractAuthorityBoundary
  >;
  persistedMaterialBoundary: AutohuntSupervisedExecutionPersistedMaterialBoundary;
  rawMaterialProbe: unknown;
}): AutohuntSupervisedExecutionLaunchGuardChecks {
  const readinessGateReady =
    sourceGate.readiness_status ===
      "ready_for_future_supervised_execution_design" &&
    sourceGate.readiness_checks.checks_passed === true &&
    sourceGate.gate_fingerprint === computeReadinessGateFingerprint(sourceGate);
  const sourceChainFingerprintsPresent = hasRequiredSourceChainFields(sourceGate);
  const freshnessPolicyPresent =
    freshnessContract.grant_must_be_refreshed_before_launch === true &&
    freshnessContract.preflight_must_be_refreshed_before_launch === true &&
    freshnessContract.operator_approval_must_be_refreshed_before_launch ===
      true &&
    isFiniteNonNegativeNumber(freshnessContract.max_contract_age_minutes) &&
    isFiniteNonNegativeNumber(freshnessContract.current_contract_age_minutes) &&
    freshnessContract.freshness_status === "fresh";
  const operatorReconfirmationRequired =
    sourceGate.future_execution_design_requirements.includes(
      "explicit_user_reconfirmation_required",
    ) &&
    sourceGate.future_execution_design_requirements.includes(
      "fresh_operator_approval_required",
    ) &&
    freshnessContract.operator_approval_must_be_refreshed_before_launch === true;
  const budgetPresent = isBudgetPresent(launchEnvelope);
  const budgetWithinBounds = isBudgetWithinBounds(launchEnvelope);
  const stopConditionsPresent =
    launchEnvelope.required_stop_conditions.includes("manual_stop_requested") &&
    launchEnvelope.required_stop_conditions.includes(
      "authority_boundary_unclear",
    );
  const resultIntakeRequired =
    launchEnvelope.required_result_intake === true &&
    sourceGate.future_execution_design_requirements.includes(
      "result_intake_required",
    );
  const expectedObservedDeltaRequired =
    launchEnvelope.required_expected_observed_delta === true &&
    sourceGate.future_execution_design_requirements.includes(
      "expected_observed_delta_required",
    );
  const reuseOutcomeRequired =
    launchEnvelope.required_reuse_outcome === true &&
    sourceGate.future_execution_design_requirements.includes(
      "reuse_outcome_required",
    );
  const residualDiagnosticRequired =
    launchEnvelope.required_residual_diagnostic === true &&
    sourceGate.future_execution_design_requirements.includes(
      "residual_diagnostic_required",
    );
  const authorityBoundariesAllFalse =
    assertAllFalseBoundary(
      authorityBoundary,
      "autohunt_supervised_execution_contract_authority_boundary",
    ).passed &&
    assertAllFalseBoundary(
      sourceGate.authority_boundary,
      "autohunt_supervised_execution_contract_source_gate_authority_boundary",
    ).passed;
  const rawMaterialAbsent =
    isRawMaterialAbsent(rawMaterialProbe) &&
    isRawMaterialAbsent(sourceGate) &&
    persistedMaterialBoundary.persists_raw_prompt_text === false &&
    persistedMaterialBoundary.persists_raw_copy_text === false &&
    persistedMaterialBoundary.persists_raw_pr_body === false &&
    persistedMaterialBoundary.persists_raw_operator_note === false &&
    persistedMaterialBoundary.persists_raw_source_payload === false &&
    persistedMaterialBoundary.persists_secret_or_token === false &&
    persistedMaterialBoundary.persists_url_or_env_value === false;

  const blockerReasons = [
    !readinessGateReady ? "source_readiness_gate_not_ready" : null,
    !sourceChainFingerprintsPresent ? "source_chain_fingerprints_missing" : null,
    !freshnessPolicyPresent ? "freshness_required" : null,
    !operatorReconfirmationRequired ? "operator_reconfirmation_required" : null,
    !budgetPresent ? "budget_missing" : null,
    budgetPresent && !budgetWithinBounds ? "budget_invalid" : null,
    !stopConditionsPresent ? "stop_condition_missing" : null,
    !resultIntakeRequired ? "result_intake_required_missing" : null,
    !expectedObservedDeltaRequired
      ? "expected_observed_delta_required_missing"
      : null,
    !reuseOutcomeRequired ? "reuse_outcome_required_missing" : null,
    !residualDiagnosticRequired ? "residual_diagnostic_required_missing" : null,
    !authorityBoundariesAllFalse ? "authority_boundary_not_all_false" : null,
    !rawMaterialAbsent ? "raw_material_fields_present" : null,
  ].filter((reason): reason is string => Boolean(reason));

  return {
    readiness_gate_ready: readinessGateReady,
    source_chain_fingerprints_present: sourceChainFingerprintsPresent,
    freshness_policy_present: freshnessPolicyPresent,
    operator_reconfirmation_required: operatorReconfirmationRequired,
    budget_present: budgetPresent,
    budget_within_bounds: budgetWithinBounds,
    stop_conditions_present: stopConditionsPresent,
    result_intake_required: resultIntakeRequired,
    expected_observed_delta_required: expectedObservedDeltaRequired,
    reuse_outcome_required: reuseOutcomeRequired,
    residual_diagnostic_required: residualDiagnosticRequired,
    authority_boundaries_all_false: authorityBoundariesAllFalse,
    raw_material_absent: rawMaterialAbsent,
    passed: blockerReasons.length === 0,
    blocker_reasons: blockerReasons,
    warning_reasons: [
      "launch_now_allowed_false_by_contract",
      "future_launcher_requires_separate_authority",
    ],
  };
}

function refusalReasonsFromValidation(
  validation: AutohuntSupervisedExecutionValidation,
) {
  return [
    !validation.readiness_gate_ready ? "source_readiness_gate_not_ready" : null,
    !validation.source_chain_fingerprints_present
      ? "source_chain_fingerprints_missing"
      : null,
    !validation.future_execution_requirements_present
      ? "future_execution_requirements_missing"
      : null,
    !validation.freshness_policy_present ? "freshness_required" : null,
    !validation.budget_present ? "budget_missing" : null,
    !validation.budget_within_bounds ? "budget_invalid" : null,
    !validation.stop_conditions_present ? "stop_condition_missing" : null,
    !validation.required_result_intake_present
      ? "result_intake_required_missing"
      : null,
    !validation.required_expected_observed_delta_present
      ? "expected_observed_delta_required_missing"
      : null,
    !validation.required_reuse_outcome_present
      ? "reuse_outcome_required_missing"
      : null,
    !validation.required_residual_diagnostic_present
      ? "residual_diagnostic_required_missing"
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

function summarizeSourceReadinessGate(
  gate: AutohuntExecutionReadinessGate,
): AutohuntSupervisedExecutionContractSourceReadinessGate {
  const summary = gate.source_chain_summary;
  return {
    gate_fingerprint: gate.gate_fingerprint,
    readiness_status: gate.readiness_status,
    active_grant_id: summary.active_grant_id ?? "",
    active_grant_fingerprint: summary.active_grant_fingerprint ?? "",
    latest_queued_candidate_id: summary.latest_queued_candidate_id ?? "",
    latest_queued_candidate_fingerprint:
      summary.latest_queued_candidate_fingerprint ?? "",
    ready_preflight_packet_id: summary.ready_preflight_packet_id ?? "",
    ready_preflight_packet_fingerprint:
      summary.ready_preflight_packet_fingerprint ?? "",
    handoff_plan_id: summary.handoff_plan_id ?? "",
    handoff_plan_fingerprint: summary.handoff_plan_fingerprint ?? "",
    operator_decision_id: summary.operator_decision_id ?? "",
    operator_decision_fingerprint:
      summary.operator_decision_fingerprint ?? "",
    copy_export_preview_fingerprint:
      summary.copy_export_preview_fingerprint ?? "",
  };
}

function normalizeFreshnessContract(
  input:
    | Partial<AutohuntSupervisedExecutionFreshnessContract>
    | null
    | undefined,
): AutohuntSupervisedExecutionFreshnessContract {
  const inputRecord = input as Record<string, unknown> | null | undefined;
  const maxContractAgeMinutes =
    typeof input?.max_contract_age_minutes === "number"
      ? input.max_contract_age_minutes
      : 1440;
  const currentContractAgeMinutes =
    typeof input?.current_contract_age_minutes === "number"
      ? input.current_contract_age_minutes
      : 0;
  const freshnessStatus =
    !isFiniteNonNegativeNumber(maxContractAgeMinutes) ||
    !isFiniteNonNegativeNumber(currentContractAgeMinutes)
      ? "unknown"
      : currentContractAgeMinutes > maxContractAgeMinutes
        ? "stale"
        : "fresh";

  return {
    grant_must_be_refreshed_before_launch:
      inputRecord?.grant_must_be_refreshed_before_launch === false
        ? false as never
        : true,
    preflight_must_be_refreshed_before_launch:
      inputRecord?.preflight_must_be_refreshed_before_launch === false
        ? false as never
        : true,
    operator_approval_must_be_refreshed_before_launch:
      inputRecord?.operator_approval_must_be_refreshed_before_launch === false
        ? false as never
        : true,
    max_contract_age_minutes: maxContractAgeMinutes,
    current_contract_age_minutes: currentContractAgeMinutes,
    freshness_status: freshnessStatus,
  };
}

function normalizeLaunchEnvelope({
  input,
  launchMode,
}: {
  input: Partial<AutohuntSupervisedExecutionLaunchEnvelope> | null | undefined;
  launchMode: AutohuntSupervisedExecutionLaunchEnvelope["launch_mode"];
}): AutohuntSupervisedExecutionLaunchEnvelope {
  const inputRecord = input as Record<string, unknown> | null | undefined;
  return {
    launch_mode: launchMode,
    max_candidates: numberOrDefault(input?.max_candidates, 1),
    max_iterations: numberOrDefault(input?.max_iterations, 1),
    max_tool_calls: numberOrDefault(input?.max_tool_calls, 20),
    max_codex_tasks: numberOrDefault(
      input?.max_codex_tasks,
      launchMode === "supervised_codex_handoff_only" ? 1 : 0,
    ),
    max_draft_prs: numberOrDefault(input?.max_draft_prs, 0),
    max_changed_files: numberOrDefault(input?.max_changed_files, 4),
    allowed_file_globs: uniqueStrings(input?.allowed_file_globs ?? [
      "components/**",
      "lib/**",
      "scripts/**",
      "types/**",
      "package.json",
    ]),
    forbidden_file_globs: uniqueStrings(input?.forbidden_file_globs ?? [
      "app/api/**",
      "docs/**",
      "lib/db/**",
    ]),
    required_checks: uniqueStrings(input?.required_checks ?? [
      "npm run typecheck",
      "npm run smoke:autohunt-execution-readiness-gate-v0-1",
    ]),
    required_stop_conditions: uniqueStrings(
      input?.required_stop_conditions ?? [
        "manual_stop_requested",
        "authority_boundary_unclear",
        "budget_exhausted",
        "forbidden_action_requested",
      ],
    ),
    required_result_intake:
      inputRecord?.required_result_intake === false ? false as never : true,
    required_expected_observed_delta:
      inputRecord?.required_expected_observed_delta === false
        ? false as never
        : true,
    required_reuse_outcome:
      inputRecord?.required_reuse_outcome === false ? false as never : true,
    required_residual_diagnostic:
      inputRecord?.required_residual_diagnostic === false
        ? false as never
        : true,
  };
}

function computeIdempotencyKey(input: NormalizedExecutionContractInput) {
  return buildDeterministicIdempotencyKey({
    kind: AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_KIND,
    version: AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_VERSION,
    source: {
      readiness_gate_fingerprint:
        input.source_readiness_gate.gate_fingerprint,
      active_grant_fingerprint:
        input.source_readiness_gate.active_grant_fingerprint,
      ready_preflight_packet_fingerprint:
        input.source_readiness_gate.ready_preflight_packet_fingerprint,
      operator_decision_fingerprint:
        input.source_readiness_gate.operator_decision_fingerprint,
      copy_export_preview_fingerprint:
        input.source_readiness_gate.copy_export_preview_fingerprint,
      launch_mode: input.launch_envelope.launch_mode,
      launch_envelope: input.launch_envelope,
    },
  });
}

function validateRawMaterialBoundary(
  input: AutohuntSupervisedExecutionContractInput,
) {
  const scrubbed = stripAllowedBoundaryFlagKeys(input);
  const forbiddenFields = findForbiddenRawMaterialFields(scrubbed);
  const refusalReasons: string[] = [];
  if (forbiddenFields.length > 0 || containsForbiddenRawMaterial(scrubbed)) {
    refusalReasons.push("raw_material_fields_present");
  }
  if (findUnsafeStringMaterial(scrubbed).length > 0) {
    refusalReasons.push("unsafe_string_material_present");
  }
  return refusalReasons;
}

function hasRequiredSourceChainFields(gate: AutohuntExecutionReadinessGate) {
  const summary = gate.source_chain_summary;
  return requiredStringFieldsPresent(
    {
      gate_fingerprint: gate.gate_fingerprint,
      active_grant_id: summary.active_grant_id,
      active_grant_fingerprint: summary.active_grant_fingerprint,
      latest_queued_candidate_id: summary.latest_queued_candidate_id,
      latest_queued_candidate_fingerprint:
        summary.latest_queued_candidate_fingerprint,
      ready_preflight_packet_id: summary.ready_preflight_packet_id,
      ready_preflight_packet_fingerprint:
        summary.ready_preflight_packet_fingerprint,
      handoff_plan_id: summary.handoff_plan_id,
      handoff_plan_fingerprint: summary.handoff_plan_fingerprint,
      operator_decision_id: summary.operator_decision_id,
      operator_decision_fingerprint: summary.operator_decision_fingerprint,
      copy_export_preview_fingerprint: summary.copy_export_preview_fingerprint,
    },
    [
      "gate_fingerprint",
      "active_grant_id",
      "active_grant_fingerprint",
      "latest_queued_candidate_id",
      "latest_queued_candidate_fingerprint",
      "ready_preflight_packet_id",
      "ready_preflight_packet_fingerprint",
      "handoff_plan_id",
      "handoff_plan_fingerprint",
      "operator_decision_id",
      "operator_decision_fingerprint",
      "copy_export_preview_fingerprint",
    ],
  ).passed;
}

function computeReadinessGateFingerprint(gate: AutohuntExecutionReadinessGate) {
  const { gate_fingerprint: _gateFingerprint, ...fingerprintSource } = gate;
  return fingerprint(fingerprintSource);
}

function createPersistedMaterialBoundary(): AutohuntSupervisedExecutionPersistedMaterialBoundary {
  return {
    persists_source_fingerprints: true,
    persists_launch_policy: true,
    persists_raw_prompt_text: false,
    persists_raw_copy_text: false,
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
}): AutohuntSupervisedExecutionRowCountWriteSummary {
  return summarizeTargetOnlyRowCountWrite({
    targetTable: AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_TABLE,
    tableNames: TARGET_AND_NON_TARGET_TABLES,
    beforeCounts,
    afterCounts,
    expectedTargetDelta: 1,
  }) as AutohuntSupervisedExecutionRowCountWriteSummary;
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

function isBudgetPresent(
  envelope: AutohuntSupervisedExecutionLaunchEnvelope,
) {
  return [
    envelope.max_candidates,
    envelope.max_iterations,
    envelope.max_tool_calls,
    envelope.max_codex_tasks,
    envelope.max_draft_prs,
    envelope.max_changed_files,
  ].every((value) => typeof value === "number" && Number.isFinite(value));
}

function isBudgetWithinBounds(
  envelope: AutohuntSupervisedExecutionLaunchEnvelope,
) {
  return (
    envelope.max_candidates > 0 &&
    envelope.max_candidates <= 20 &&
    envelope.max_iterations > 0 &&
    envelope.max_iterations <= 50 &&
    envelope.max_tool_calls > 0 &&
    envelope.max_tool_calls <= 500 &&
    envelope.max_codex_tasks >= 0 &&
    envelope.max_codex_tasks <= 10 &&
    envelope.max_draft_prs >= 0 &&
    envelope.max_draft_prs <= 10 &&
    envelope.max_changed_files >= 0 &&
    envelope.max_changed_files <= 100 &&
    envelope.allowed_file_globs.length > 0 &&
    envelope.forbidden_file_globs.length > 0 &&
    envelope.required_checks.length > 0
  );
}

function isRawMaterialAbsent(value: unknown) {
  if (value === null || typeof value === "undefined") return true;
  const scrubbed = stripAllowedBoundaryFlagKeys(value);
  return (
    findForbiddenRawMaterialFields(scrubbed).length === 0 &&
    !containsForbiddenRawMaterial(scrubbed) &&
    findUnsafeStringMaterial(scrubbed).length === 0
  );
}

function stripAllowedBoundaryFlagKeys(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(stripAllowedBoundaryFlagKeys);
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !SAFE_RAW_MATERIAL_BOUNDARY_KEYS.has(key))
      .map(([key, nestedValue]) => [
        key,
        stripAllowedBoundaryFlagKeys(nestedValue),
      ]),
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
  contract,
  contract_record_written,
  duplicate_replayed,
}: {
  result_status: "written" | "duplicate_replayed";
  contract: AutohuntSupervisedExecutionContract;
  contract_record_written: boolean;
  duplicate_replayed: boolean;
}): AutohuntSupervisedExecutionContractWriteResult {
  return {
    ok: true,
    result_status,
    refusal_reasons: [],
    contract,
    duplicate_replayed,
    contract_record_written,
    row_count_write_summary: contract.row_count_write_summary,
    launch_now_allowed: false,
    execution_started: false,
    codex_executed: false,
    github_called: false,
    branch_or_pr_created: false,
    ...createNoRunAuthorityFlags(),
    raw_material_persisted: false,
  };
}

function createRefusedResult(
  refusalReasons: string[],
): AutohuntSupervisedExecutionContractWriteResult {
  return {
    ok: false,
    result_status: "refused",
    refusal_reasons: [
      ...new Set(refusalReasons.length > 0 ? refusalReasons : ["refused"]),
    ],
    contract: null,
    duplicate_replayed: false,
    contract_record_written: false,
    row_count_write_summary: null,
    launch_now_allowed: false,
    execution_started: false,
    codex_executed: false,
    github_called: false,
    branch_or_pr_created: false,
    ...createNoRunAuthorityFlags(),
    raw_material_persisted: false,
  };
}

function createNoRunAuthorityFlags() {
  return {
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
  } as const;
}

function isValidLaunchMode(value: unknown) {
  return (
    value === null ||
    typeof value === "undefined" ||
    (typeof value === "string" &&
      (AUTOHUNT_SUPERVISED_EXECUTION_LAUNCH_MODES as readonly string[]).includes(
        value,
      ))
  );
}

function normalizeLaunchMode(
  value: string | null | undefined,
): AutohuntSupervisedExecutionLaunchEnvelope["launch_mode"] {
  if (
    typeof value === "string" &&
    (AUTOHUNT_SUPERVISED_EXECUTION_LAUNCH_MODES as readonly string[]).includes(
      value,
    )
  ) {
    return value as AutohuntSupervisedExecutionLaunchEnvelope["launch_mode"];
  }
  return "supervised_codex_handoff_only";
}

function numberOrDefault(value: unknown, fallback: number) {
  return typeof value === "number" ? value : fallback;
}

function isFiniteNonNegativeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function normalizeStringArray(values: readonly string[] | undefined) {
  return [
    ...new Set((values ?? []).map((value) => value.trim()).filter(Boolean)),
  ].sort();
}

function uniqueStrings(values: readonly string[]) {
  return normalizeStringArray(values);
}

function hasClose(
  db: AutonomyDelegationGrantDbLike,
): db is AutonomyDelegationGrantDbLike & { close(): void } {
  return typeof (db as { close?: unknown }).close === "function";
}
