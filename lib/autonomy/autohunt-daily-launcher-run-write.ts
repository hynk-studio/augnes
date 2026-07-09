import { openDatabase } from "@/lib/db";
import type { AutonomyDelegationGrantDbLike } from "@/lib/autonomy/read-autonomy-delegation-grants";
import {
  buildAutohuntDailyLauncherRunAuthorityBoundary,
  computeAutohuntDailyLauncherRunFingerprint,
  ensureAutohuntDailyLauncherRunSchema,
  parseAutohuntDailyLauncherRunRow,
} from "@/lib/autonomy/read-autohunt-daily-launcher-runs";
import { writeAutohuntResultIntake } from "@/lib/autonomy/autohunt-result-intake-write";
import { ensureAutohuntResultIntakeSchema } from "@/lib/autonomy/read-autohunt-result-intakes";
import {
  getAutohuntWorkTargetModeOption,
  isAutohuntWorkTargetMode,
  normalizeAutohuntWorkTargetMode,
} from "@/lib/autonomy/autohunt-work-target-mode-options";
import {
  computeAutohuntSupervisedExecutionContractFingerprint,
} from "@/lib/autonomy/read-autohunt-supervised-execution-contracts";
import {
  assertAllFalseBoundary,
  buildDeterministicIdempotencyKey,
  containsForbiddenRawMaterial,
  findForbiddenRawMaterialFields,
  fingerprint,
  requiredStringFieldsPresent,
  stableJson,
  STABLE_FINGERPRINT_ALGORITHM as FINGERPRINT_ALGORITHM,
  stripFingerprintPrefix,
  uniqueStrings,
} from "@/lib/research-candidate-review/shared-source-chain-guards";
import { AUTONOMY_DELEGATION_GRANT_TABLE } from "@/types/autonomy-delegation-grant";
import { AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE } from "@/types/autohunt-work-queue-candidate";
import { AUTOHUNT_PREFLIGHT_PACKET_TABLE } from "@/types/autohunt-preflight-packet";
import { AUTOHUNT_HANDOFF_PLAN_PREVIEW_TABLE } from "@/types/autohunt-handoff-plan-preview";
import { AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_TABLE } from "@/types/autohunt-handoff-plan-operator-review-decision";
import { AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_TABLE } from "@/types/autohunt-supervised-execution-contract";
import type { AutohuntSupervisedExecutionContract } from "@/types/autohunt-supervised-execution-contract";
import { AUTOHUNT_RESULT_INTAKE_TABLE } from "@/types/autohunt-result-intake";
import type {
  AutohuntResultIntake,
  AutohuntStructuredResultReportInput,
} from "@/types/autohunt-result-intake";
import {
  AUTOHUNT_DAILY_LAUNCHER_RUN_KIND,
  AUTOHUNT_DAILY_LAUNCHER_RUN_MODES,
  AUTOHUNT_DAILY_LAUNCHER_RUN_TABLE,
  AUTOHUNT_DAILY_LAUNCHER_RUN_VERSION,
  type AutohuntDailyLauncherHandoffPacket,
  type AutohuntDailyLauncherLinkedResultIntake,
  type AutohuntDailyLauncherRun,
  type AutohuntDailyLauncherRunConfirmation,
  type AutohuntDailyLauncherRunInput,
  type AutohuntDailyLauncherRunMode,
  type AutohuntDailyLauncherRunPersistedMaterialBoundary,
  type AutohuntDailyLauncherRunRowCountWriteSummary,
  type AutohuntDailyLauncherRunSourceExecutionContract,
  type AutohuntDailyLauncherRunValidation,
  type AutohuntDailyLauncherRunWriteResult,
} from "@/types/autohunt-daily-launcher-run";
import type { AutohuntWorkTargetMode } from "@/types/autohunt-work-target-mode";
import { RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_PROTECTED_ROW_COUNT_TABLES } from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-result";

export interface WriteAutohuntDailyLauncherRunOptions {
  db?: AutonomyDelegationGrantDbLike;
  now?: string;
}

type RowCountSnapshot = Record<string, number>;

type NormalizedLauncherInput = {
  scope: "project:augnes";
  source_execution_contract: AutohuntSupervisedExecutionContract;
  source_execution_contract_summary: AutohuntDailyLauncherRunSourceExecutionContract;
  daily_confirmation: AutohuntDailyLauncherRunConfirmation;
  handoff_packet: AutohuntDailyLauncherHandoffPacket;
  mode: AutohuntDailyLauncherRunMode;
  work_target_mode: AutohuntWorkTargetMode;
  structured_result_report_fixture_input: AutohuntStructuredResultReportInput | null;
  authority_boundary: ReturnType<typeof buildAutohuntDailyLauncherRunAuthorityBoundary>;
  persisted_material_boundary: AutohuntDailyLauncherRunPersistedMaterialBoundary;
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

const ROW_COUNT_TABLES = [
  AUTOHUNT_DAILY_LAUNCHER_RUN_TABLE,
  AUTOHUNT_RESULT_INTAKE_TABLE,
  ...NON_TARGET_ROW_COUNT_TABLES,
] as const;

const SAFE_RAW_MATERIAL_KEYS = new Set([
  "raw_confirmation_text_persisted",
  "raw_prompt_text_persisted",
  "raw_result_text_persisted",
  "raw_pr_body_persisted",
  "raw_operator_note_persisted",
  "raw_source_payload_persisted",
  "no_raw_prompt_text_persisted",
  "raw_material_absent",
  "raw_material_persisted",
  "persists_raw_confirmation_text",
  "persists_raw_copy_text",
  "persists_raw_prompt_text",
  "persists_raw_result_text",
  "persists_raw_pr_body",
  "persists_raw_operator_note",
  "persists_raw_source_payload",
  "persists_secret_or_token",
  "persists_url_or_env_value",
  "structured_result_report_fixture",
  "structured_result_report_fixture_input",
  "expected_result_report_sections",
  "persists_result_report_summary",
  "dry_run_fixture_report",
  "result_report_id",
  "result_report_fingerprint",
]);

export function writeAutohuntDailyLauncherRun(
  input: AutohuntDailyLauncherRunInput,
  options: WriteAutohuntDailyLauncherRunOptions = {},
): AutohuntDailyLauncherRunWriteResult {
  const sourceContract = input.source_execution_contract ?? null;
  const validationRefusalReasons =
    validateAutohuntDailyLauncherRunInput(input);
  if (validationRefusalReasons.length > 0 || !sourceContract) {
    return createRefusedResult(validationRefusalReasons);
  }

  const normalizedInput = normalizeLauncherInput(input, sourceContract);
  const validation = buildLauncherRunValidation({
    input: normalizedInput,
    linkedResultIntake: null,
    requireLinkedResultIntake: false,
  });
  if (!validation.passed) {
    return createRefusedResult(refusalReasonsFromValidation(validation));
  }

  const idempotencyKey = computeIdempotencyKey(normalizedInput);
  const db = options.db ?? openDatabase();
  const shouldClose = !options.db && hasClose(db);

  try {
    ensureAutohuntDailyLauncherRunSchema(db);
    ensureAutohuntResultIntakeSchema(db);
    const existingRow = db
      .prepare(
        `
          SELECT *
          FROM ${AUTOHUNT_DAILY_LAUNCHER_RUN_TABLE}
          WHERE idempotency_key = ?
        `,
      )
      .get(idempotencyKey);

    if (existingRow) {
      const existingRun = parseAutohuntDailyLauncherRunRow(
        existingRow as never,
      );
      if (
        existingRun &&
        existingRun.launcher_run_fingerprint ===
          computeAutohuntDailyLauncherRunFingerprint(existingRun)
      ) {
        return createAcceptedResult({
          result_status: "duplicate_replayed",
          launcher_run: existingRun,
          linked_result_intake: null,
          launcher_run_record_written: false,
          result_intake_record_written: false,
          duplicate_replayed: true,
        });
      }
      return createRefusedResult([
        "idempotency_conflict_existing_autohunt_daily_launcher_run_fingerprint_mismatch",
      ]);
    }

    const beforeCounts = captureRowCounts(db);
    const linkedResult = maybeWriteFixtureResultIntake({
      input: normalizedInput,
      db,
      now: options.now,
    });
    if (!linkedResult.ok) {
      return createRefusedResult(
        linkedResult.refusal_reasons.length > 0
          ? linkedResult.refusal_reasons
          : ["linked_result_intake_write_refused"],
      );
    }

    const linkedResultIntake = linkedResult.result_intake;
    const linkedSummary = linkedResultIntake
      ? summarizeLinkedResultIntake(linkedResultIntake)
      : null;
    const validationWithLinked = buildLauncherRunValidation({
      input: normalizedInput,
      linkedResultIntake: linkedResultIntake,
      requireLinkedResultIntake:
        normalizedInput.mode === "prepare_handoff_and_record_fixture_result",
    });
    if (!validationWithLinked.passed) {
      return createRefusedResult(
        refusalReasonsFromValidation(validationWithLinked),
      );
    }

    db.exec("BEGIN IMMEDIATE");
    try {
      const afterLinkedCounts = captureRowCounts(db);
      const expectedWriteSummary = buildRowCountWriteSummary({
        beforeCounts,
        afterCounts: {
          ...afterLinkedCounts,
          [AUTOHUNT_DAILY_LAUNCHER_RUN_TABLE]:
            afterLinkedCounts[AUTOHUNT_DAILY_LAUNCHER_RUN_TABLE] + 1,
        },
        expectedTargetDelta: 1,
        expectedAllowedLinkedTargetDelta:
          normalizedInput.mode ===
            "prepare_handoff_and_record_fixture_result" &&
          linkedResult.result_intake_record_written
            ? 1
            : 0,
      });
      const launcherRun = buildLauncherRunRecord({
        input: normalizedInput,
        validation: validationWithLinked,
        idempotencyKey,
        createdAt: options.now ?? new Date().toISOString(),
        rowCountWriteSummary: expectedWriteSummary,
        linkedResultIntake,
      });

      insertLauncherRunRecord(db, launcherRun);

      const afterCounts = captureRowCounts(db);
      const actualWriteSummary = buildRowCountWriteSummary({
        beforeCounts,
        afterCounts,
        expectedTargetDelta: 1,
        expectedAllowedLinkedTargetDelta:
          normalizedInput.mode ===
            "prepare_handoff_and_record_fixture_result" &&
          linkedResult.result_intake_record_written
            ? 1
            : 0,
      });
      if (!isAllowedLauncherRunRowCountWrite(actualWriteSummary)) {
        db.exec("ROLLBACK");
        return createRefusedResult([
          "autohunt_daily_launcher_run_row_count_proof_failed",
        ]);
      }

      db.exec("COMMIT");
      return createAcceptedResult({
        result_status: "written",
        launcher_run: launcherRun,
        linked_result_intake: linkedResultIntake,
        launcher_run_record_written: true,
        result_intake_record_written: linkedResult.result_intake_record_written,
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

export function validateAutohuntDailyLauncherRunInput(
  input: AutohuntDailyLauncherRunInput,
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
  const confirmation = input.daily_confirmation ?? null;
  if (!confirmation) {
    refusalReasons.push("daily_confirmation_missing");
  } else {
    refusalReasons.push(...validateDailyConfirmation(confirmation));
  }
  if (
    input.mode &&
    !AUTOHUNT_DAILY_LAUNCHER_RUN_MODES.includes(
      input.mode as AutohuntDailyLauncherRunMode,
    )
  ) {
    refusalReasons.push("launcher_run_mode_invalid");
  }
  if (input.work_target_mode && !isAutohuntWorkTargetMode(input.work_target_mode)) {
    refusalReasons.push("work_target_mode_invalid");
  }
  refusalReasons.push(...validateRawMaterialBoundary(input));
  return [...new Set(refusalReasons)];
}

function normalizeLauncherInput(
  input: AutohuntDailyLauncherRunInput,
  sourceContract: AutohuntSupervisedExecutionContract,
): NormalizedLauncherInput {
  const mode = AUTOHUNT_DAILY_LAUNCHER_RUN_MODES.includes(
    input.mode as AutohuntDailyLauncherRunMode,
  )
    ? (input.mode as AutohuntDailyLauncherRunMode)
    : "prepare_handoff_only";
  const sourceSummary = summarizeSourceExecutionContract(sourceContract);
  const workTargetMode = normalizeAutohuntWorkTargetMode(
    input.work_target_mode,
  );
  const dailyConfirmation = normalizeDailyConfirmation(
    input.daily_confirmation,
  );
  const handoffPacket = buildHandoffPacket({
    sourceContract,
    sourceSummary,
    dailyConfirmation,
    workTargetMode,
  });
  const fixtureInput =
    mode === "prepare_handoff_and_record_fixture_result"
      ? normalizeFixtureResultInput({
          sourceContract,
          dailyConfirmation,
          handoffPacket,
          input: input.structured_result_report_fixture,
        })
      : null;

  return {
    scope: "project:augnes",
    source_execution_contract: sourceContract,
    source_execution_contract_summary: sourceSummary,
    daily_confirmation: dailyConfirmation,
    handoff_packet: handoffPacket,
    mode,
    work_target_mode: workTargetMode,
    structured_result_report_fixture_input: fixtureInput,
    authority_boundary: buildAutohuntDailyLauncherRunAuthorityBoundary(),
    persisted_material_boundary: createPersistedMaterialBoundary(),
    raw_material_probe: input.raw_material_probe,
  };
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
    refusalReasons.push("launch_guard_not_passive");
  }
  if (
    assertAllFalseBoundary(
      contract.authority_boundary,
      "autohunt_daily_launcher_source_contract_authority_boundary",
    ).passed !== true
  ) {
    refusalReasons.push("source_execution_contract_authority_boundary_not_false");
  }
  if (!hasRequiredSourceContractFields(contract)) {
    refusalReasons.push("source_execution_contract_binding_missing");
  }
  return refusalReasons;
}

function validateDailyConfirmation(
  confirmation: Partial<AutohuntDailyLauncherRunConfirmation>,
) {
  const requiredFields = requiredStringFieldsPresent(
    confirmation as Record<string, unknown>,
    ["confirmation_ref", "confirmation_fingerprint"],
  );
  const refusalReasons = requiredFields.passed
    ? []
    : ["daily_confirmation_invalid"];
  if (confirmation.raw_confirmation_text_persisted !== false) {
    refusalReasons.push("daily_confirmation_raw_text_persistence_not_false");
  }
  return refusalReasons;
}

function normalizeDailyConfirmation(
  confirmation: Partial<AutohuntDailyLauncherRunConfirmation> | null | undefined,
): AutohuntDailyLauncherRunConfirmation {
  return {
    confirmation_ref: confirmation?.confirmation_ref ?? "",
    confirmed_by: confirmation?.confirmed_by ?? null,
    confirmed_at: confirmation?.confirmed_at ?? null,
    confirmation_fingerprint: confirmation?.confirmation_fingerprint ?? "",
    raw_confirmation_text_persisted: false,
  };
}

function buildHandoffPacket({
  sourceContract,
  sourceSummary,
  dailyConfirmation,
  workTargetMode,
}: {
  sourceContract: AutohuntSupervisedExecutionContract;
  sourceSummary: AutohuntDailyLauncherRunSourceExecutionContract;
  dailyConfirmation: AutohuntDailyLauncherRunConfirmation;
  workTargetMode: AutohuntWorkTargetMode;
}): AutohuntDailyLauncherHandoffPacket {
  const targetModeOption = getAutohuntWorkTargetModeOption(workTargetMode);
  const packetWithoutFingerprint = {
    handoff_packet_id: "",
    handoff_packet_status: "prepared_for_manual_codex_handoff" as const,
    title: "Daily supervised Autohunt handoff packet",
    goal_summary:
      "Prepare a manual Codex handoff using the ready supervised execution contract; do not execute Codex from this launcher.",
    work_target_mode: targetModeOption.mode,
    work_target_mode_label: targetModeOption.short_label,
    lifecycle_interpretation: targetModeOption.lifecycle_interpretation,
    result_attachment_policy: targetModeOption.result_attachment_policy,
    branch_policy: targetModeOption.branch_policy,
    durable_new_work_created: false as const,
    perspective_mutated: false as const,
    cwp_mutated: false as const,
    memory_written: false as const,
    source_refs: uniqueStrings([
      sourceSummary.contract_id,
      sourceSummary.active_grant_id,
      sourceSummary.ready_preflight_packet_id,
      sourceSummary.operator_decision_id,
      sourceContract.source_readiness_gate.latest_queued_candidate_id,
    ]),
    source_fingerprints: uniqueStrings([
      sourceSummary.contract_fingerprint,
      sourceSummary.active_grant_fingerprint,
      sourceSummary.ready_preflight_packet_fingerprint,
      sourceSummary.operator_decision_fingerprint,
      sourceSummary.copy_export_preview_fingerprint,
      sourceContract.source_readiness_gate.latest_queued_candidate_fingerprint,
    ]),
    selected_candidate_refs: uniqueStrings([
      sourceContract.source_readiness_gate.latest_queued_candidate_id,
    ]),
    constraints: uniqueStrings([
      "manual_operator_handoff_only",
      "no_live_codex_execution",
      "no_github_call",
      "no_branch_or_pr_creation",
      "no_provider_or_source_fetch",
      ...sourceContract.launch_envelope.required_stop_conditions,
    ]),
    required_checks: uniqueStrings(sourceContract.launch_envelope.required_checks),
    expected_result_report_sections: [
      "result_status",
      "checks_run",
      "checks_passed",
      "checks_failed",
      "checks_skipped",
      "changed_files",
      "budget_used",
      "blocker_reasons",
      "warning_reasons",
      "reuse_outcome_refs",
      "residual_diagnostic_summary",
    ],
    max_changed_files: sourceContract.launch_envelope.max_changed_files,
    budget_limits: {
      max_candidates: sourceContract.launch_envelope.max_candidates,
      max_iterations: sourceContract.launch_envelope.max_iterations,
      max_tool_calls: sourceContract.launch_envelope.max_tool_calls,
      max_codex_tasks: sourceContract.launch_envelope.max_codex_tasks,
      max_draft_prs: sourceContract.launch_envelope.max_draft_prs,
      max_changed_files: sourceContract.launch_envelope.max_changed_files,
    },
    blocked_actions: uniqueStrings(sourceContract.launcher_must_not),
    no_raw_prompt_text_persisted: true as const,
    raw_prompt_text_persisted: false as const,
  };
  const packetFingerprint = fingerprint({
    ...packetWithoutFingerprint,
    daily_confirmation_fingerprint: dailyConfirmation.confirmation_fingerprint,
  });
  return {
    ...packetWithoutFingerprint,
    handoff_packet_id: `autohunt-handoff-packet:${stripFingerprintPrefix(
      packetFingerprint,
    )}`,
    handoff_packet_fingerprint: packetFingerprint,
  };
}

function normalizeFixtureResultInput({
  sourceContract,
  dailyConfirmation,
  handoffPacket,
  input,
}: {
  sourceContract: AutohuntSupervisedExecutionContract;
  dailyConfirmation: AutohuntDailyLauncherRunConfirmation;
  handoffPacket: AutohuntDailyLauncherHandoffPacket;
  input: AutohuntStructuredResultReportInput | null | undefined;
}): AutohuntStructuredResultReportInput {
  const reportSeed = {
    source_execution_contract_fingerprint: sourceContract.contract_fingerprint,
    handoff_packet_fingerprint: handoffPacket.handoff_packet_fingerprint,
    confirmation_fingerprint: dailyConfirmation.confirmation_fingerprint,
  };
  const resultReportId =
    input?.result_report_id ??
    `autohunt-result-report:${stripFingerprintPrefix(fingerprint(reportSeed))}`;
  return {
    result_report_id: resultReportId,
    result_source: "dry_run_fixture_report",
    result_status: input?.result_status ?? "completed",
    branch_created: false,
    pr_created: false,
    github_called: false,
    codex_executed: false,
    checks_run:
      input?.checks_run ?? sourceContract.launch_envelope.required_checks,
    checks_passed:
      input?.checks_passed ?? sourceContract.launch_envelope.required_checks,
    checks_failed: input?.checks_failed ?? [],
    checks_skipped: input?.checks_skipped ?? [],
    changed_files: input?.changed_files ?? [],
    changed_file_count: input?.changed_file_count ?? 0,
    expected_changed_file_globs:
      input?.expected_changed_file_globs ??
      sourceContract.launch_envelope.allowed_file_globs,
    max_changed_files:
      input?.max_changed_files ??
      sourceContract.launch_envelope.max_changed_files,
    budget_used: {
      iterations: input?.budget_used?.iterations ?? 1,
      tool_calls: input?.budget_used?.tool_calls ?? 1,
      codex_tasks: input?.budget_used?.codex_tasks ?? 0,
      draft_prs: input?.budget_used?.draft_prs ?? 0,
      changed_files: input?.budget_used?.changed_files ?? 0,
    },
    useful_refs: input?.useful_refs ?? [
      sourceContract.contract_id,
      handoffPacket.handoff_packet_id,
    ],
    stale_refs: input?.stale_refs ?? [],
    missing_refs: input?.missing_refs ?? [],
    noisy_refs: input?.noisy_refs ?? [],
    blocker_reasons: input?.blocker_reasons ?? [],
    warning_reasons: input?.warning_reasons ?? [],
    raw_result_text_persisted: false,
  };
}

function maybeWriteFixtureResultIntake({
  input,
  db,
  now,
}: {
  input: NormalizedLauncherInput;
  db: AutonomyDelegationGrantDbLike;
  now?: string;
}) {
  if (input.mode !== "prepare_handoff_and_record_fixture_result") {
    return {
      ok: true,
      result_intake: null,
      result_intake_record_written: false,
      refusal_reasons: [],
    };
  }
  const result = writeAutohuntResultIntake(
    {
      scope: input.scope,
      source_execution_contract: input.source_execution_contract,
      dry_run_fixture_report: input.structured_result_report_fixture_input,
    },
    { db, now },
  );
  return {
    ok: result.ok,
    result_intake: result.result_intake,
    result_intake_record_written: result.result_intake_record_written,
    refusal_reasons: result.refusal_reasons,
  };
}

function buildLauncherRunRecord({
  input,
  validation,
  idempotencyKey,
  createdAt,
  rowCountWriteSummary,
  linkedResultIntake,
}: {
  input: NormalizedLauncherInput;
  validation: AutohuntDailyLauncherRunValidation;
  idempotencyKey: string;
  createdAt: string;
  rowCountWriteSummary: AutohuntDailyLauncherRunRowCountWriteSummary;
  linkedResultIntake: AutohuntResultIntake | null;
}): AutohuntDailyLauncherRun {
  const launcherRunId = `autohunt-daily-launcher-run:${stripFingerprintPrefix(
    idempotencyKey,
  )}`;
  const runWithoutFingerprint: Omit<
    AutohuntDailyLauncherRun,
    "launcher_run_fingerprint"
  > = {
    launcher_run_kind: AUTOHUNT_DAILY_LAUNCHER_RUN_KIND,
    launcher_run_version: AUTOHUNT_DAILY_LAUNCHER_RUN_VERSION,
    launcher_run_id: launcherRunId,
    scope: input.scope,
    created_at: createdAt,
    launcher_run_status: linkedResultIntake
      ? "result_intake_recorded"
      : "handoff_packet_prepared",
    source_execution_contract: input.source_execution_contract_summary,
    daily_confirmation: input.daily_confirmation,
    handoff_packet: input.handoff_packet,
    launcher_run_boundary: {
      launcher_started: true,
      handoff_packet_prepared: true,
      codex_executed: false,
      github_called: false,
      branch_or_pr_created: false,
      merge_or_deploy_performed: false,
      provider_openai_called: false,
      sources_fetched: false,
      retrieval_run: false,
      state_mutated_outside_launcher_run: false,
    },
    structured_result_report_fixture:
      linkedResultIntake?.structured_result_report ?? null,
    linked_result_intake: linkedResultIntake
      ? summarizeLinkedResultIntake(linkedResultIntake)
      : null,
    authority_boundary: input.authority_boundary,
    persisted_material_boundary: input.persisted_material_boundary,
    validation,
    row_count_write_summary: rowCountWriteSummary,
    idempotency_key: idempotencyKey,
  };

  return {
    ...runWithoutFingerprint,
    launcher_run_fingerprint:
      computeAutohuntDailyLauncherRunFingerprint(runWithoutFingerprint),
  };
}

function insertLauncherRunRecord(
  db: AutonomyDelegationGrantDbLike,
  launcherRun: AutohuntDailyLauncherRun,
) {
  db.prepare(
    `
      INSERT INTO ${AUTOHUNT_DAILY_LAUNCHER_RUN_TABLE} (
        launcher_run_id,
        created_at,
        scope,
        launcher_run_status,
        source_execution_contract_id,
        source_execution_contract_fingerprint,
        source_execution_contract_status,
        launch_mode,
        active_grant_id,
        active_grant_fingerprint,
        ready_preflight_packet_id,
        ready_preflight_packet_fingerprint,
        operator_decision_id,
        operator_decision_fingerprint,
        copy_export_preview_fingerprint,
        confirmation_ref,
        confirmed_by,
        confirmed_at,
        confirmation_fingerprint,
        handoff_packet_id,
        handoff_packet_fingerprint,
        idempotency_key,
        handoff_packet_json,
        launcher_run_boundary_json,
        structured_result_report_fixture_json,
        linked_result_intake_json,
        authority_boundary_json,
        persisted_material_boundary_json,
        validation_json,
        row_count_write_summary_json,
        launcher_run_fingerprint
      )
      VALUES (
        @launcher_run_id,
        @created_at,
        @scope,
        @launcher_run_status,
        @source_execution_contract_id,
        @source_execution_contract_fingerprint,
        @source_execution_contract_status,
        @launch_mode,
        @active_grant_id,
        @active_grant_fingerprint,
        @ready_preflight_packet_id,
        @ready_preflight_packet_fingerprint,
        @operator_decision_id,
        @operator_decision_fingerprint,
        @copy_export_preview_fingerprint,
        @confirmation_ref,
        @confirmed_by,
        @confirmed_at,
        @confirmation_fingerprint,
        @handoff_packet_id,
        @handoff_packet_fingerprint,
        @idempotency_key,
        @handoff_packet_json,
        @launcher_run_boundary_json,
        @structured_result_report_fixture_json,
        @linked_result_intake_json,
        @authority_boundary_json,
        @persisted_material_boundary_json,
        @validation_json,
        @row_count_write_summary_json,
        @launcher_run_fingerprint
      )
    `,
  ).run({
    launcher_run_id: launcherRun.launcher_run_id,
    created_at: launcherRun.created_at,
    scope: launcherRun.scope,
    launcher_run_status: launcherRun.launcher_run_status,
    source_execution_contract_id:
      launcherRun.source_execution_contract.contract_id,
    source_execution_contract_fingerprint:
      launcherRun.source_execution_contract.contract_fingerprint,
    source_execution_contract_status:
      launcherRun.source_execution_contract.contract_status,
    launch_mode: launcherRun.source_execution_contract.launch_mode,
    active_grant_id: launcherRun.source_execution_contract.active_grant_id,
    active_grant_fingerprint:
      launcherRun.source_execution_contract.active_grant_fingerprint,
    ready_preflight_packet_id:
      launcherRun.source_execution_contract.ready_preflight_packet_id,
    ready_preflight_packet_fingerprint:
      launcherRun.source_execution_contract.ready_preflight_packet_fingerprint,
    operator_decision_id:
      launcherRun.source_execution_contract.operator_decision_id,
    operator_decision_fingerprint:
      launcherRun.source_execution_contract.operator_decision_fingerprint,
    copy_export_preview_fingerprint:
      launcherRun.source_execution_contract.copy_export_preview_fingerprint,
    confirmation_ref: launcherRun.daily_confirmation.confirmation_ref,
    confirmed_by: launcherRun.daily_confirmation.confirmed_by,
    confirmed_at: launcherRun.daily_confirmation.confirmed_at,
    confirmation_fingerprint:
      launcherRun.daily_confirmation.confirmation_fingerprint,
    handoff_packet_id: launcherRun.handoff_packet.handoff_packet_id,
    handoff_packet_fingerprint:
      launcherRun.handoff_packet.handoff_packet_fingerprint,
    idempotency_key: launcherRun.idempotency_key,
    handoff_packet_json: stableJson(launcherRun.handoff_packet),
    launcher_run_boundary_json: stableJson(launcherRun.launcher_run_boundary),
    structured_result_report_fixture_json:
      launcherRun.structured_result_report_fixture
        ? stableJson(launcherRun.structured_result_report_fixture)
        : null,
    linked_result_intake_json: launcherRun.linked_result_intake
      ? stableJson(launcherRun.linked_result_intake)
      : null,
    authority_boundary_json: stableJson(launcherRun.authority_boundary),
    persisted_material_boundary_json: stableJson(
      launcherRun.persisted_material_boundary,
    ),
    validation_json: stableJson(launcherRun.validation),
    row_count_write_summary_json: stableJson(
      launcherRun.row_count_write_summary,
    ),
    launcher_run_fingerprint: launcherRun.launcher_run_fingerprint,
  });
}

function summarizeSourceExecutionContract(
  contract: AutohuntSupervisedExecutionContract,
): AutohuntDailyLauncherRunSourceExecutionContract {
  return {
    contract_id: contract.contract_id,
    contract_fingerprint: contract.contract_fingerprint,
    contract_status: contract.contract_status,
    launch_mode: contract.launch_envelope.launch_mode,
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

function summarizeLinkedResultIntake(
  intake: AutohuntResultIntake,
): AutohuntDailyLauncherLinkedResultIntake {
  return {
    result_intake_id: intake.result_intake_id,
    result_intake_fingerprint: intake.result_intake_fingerprint,
    result_intake_status: intake.result_intake_status,
    expected_observed_delta_fingerprint:
      intake.expected_observed_delta_candidate.delta_fingerprint,
    reuse_outcome_fingerprint:
      intake.reuse_outcome_candidate.outcome_fingerprint,
    residual_diagnostic_fingerprint:
      intake.residual_diagnostic_candidate.residual_fingerprint,
  };
}

function buildLauncherRunValidation({
  input,
  linkedResultIntake,
  requireLinkedResultIntake,
}: {
  input: NormalizedLauncherInput;
  linkedResultIntake: AutohuntResultIntake | null;
  requireLinkedResultIntake: boolean;
}): AutohuntDailyLauncherRunValidation {
  const sourceContract = input.source_execution_contract;
  const sourceExecutionContractReady =
    sourceContract.contract_status === "ready_for_future_limited_launcher" &&
    sourceContract.validation.passed === true;
  const sourceExecutionContractFingerprintVerified =
    sourceContract.contract_fingerprint ===
    computeAutohuntSupervisedExecutionContractFingerprint(sourceContract);
  const launchGuardPassive =
    sourceContract.launch_guard_result.launch_now_allowed === false &&
    sourceContract.launch_guard_result.execution_started === false &&
    sourceContract.launch_guard_result.codex_executed === false &&
    sourceContract.launch_guard_result.github_called === false &&
    sourceContract.launch_guard_result.branch_or_pr_created === false;
  const dailyConfirmationPresent = Boolean(
    input.daily_confirmation.confirmation_ref &&
      input.daily_confirmation.confirmation_fingerprint,
  );
  const dailyConfirmationValid =
    dailyConfirmationPresent &&
    input.daily_confirmation.raw_confirmation_text_persisted === false;
  const handoffPacketPrepared =
    input.handoff_packet.handoff_packet_status ===
      "prepared_for_manual_codex_handoff" &&
    Boolean(input.handoff_packet.handoff_packet_id) &&
    Boolean(input.handoff_packet.handoff_packet_fingerprint);
  const resultFixtureValid =
    input.mode === "prepare_handoff_only" ||
    Boolean(input.structured_result_report_fixture_input?.result_report_id);
  const linkedResultIntakeValid =
    !requireLinkedResultIntake ||
    Boolean(
      linkedResultIntake?.result_intake_id &&
        linkedResultIntake.result_intake_status === "result_intake_recorded" &&
        linkedResultIntake.expected_observed_delta_candidate.delta_fingerprint &&
        linkedResultIntake.reuse_outcome_candidate.outcome_fingerprint &&
        linkedResultIntake.residual_diagnostic_candidate.residual_fingerprint,
    );
  const authorityBoundaryAllFalse =
    assertAllFalseBoundary(
      input.authority_boundary,
      "autohunt_daily_launcher_run_authority_boundary",
    ).passed &&
    assertAllFalseBoundary(
      sourceContract.authority_boundary,
      "autohunt_daily_launcher_source_contract_authority_boundary",
    ).passed;
  const persistedMaterialBoundarySafe =
    input.persisted_material_boundary.persists_source_fingerprints === true &&
    input.persisted_material_boundary.persists_handoff_packet_summary === true &&
    input.persisted_material_boundary.persists_result_report_summary === true &&
    input.persisted_material_boundary.persists_raw_confirmation_text === false &&
    input.persisted_material_boundary.persists_raw_prompt_text === false &&
    input.persisted_material_boundary.persists_raw_result_text === false &&
    input.persisted_material_boundary.persists_raw_pr_body === false &&
    input.persisted_material_boundary.persists_raw_operator_note === false &&
    input.persisted_material_boundary.persists_raw_source_payload === false &&
    input.persisted_material_boundary.persists_secret_or_token === false &&
    input.persisted_material_boundary.persists_url_or_env_value === false;
  const rawMaterialAbsent =
    isRawMaterialAbsent(input.raw_material_probe) &&
    isRawMaterialAbsent(input.daily_confirmation) &&
    isRawMaterialAbsent(input.handoff_packet) &&
    isRawMaterialAbsent(input.structured_result_report_fixture_input) &&
    isRawMaterialAbsent(sourceContract);

  const passed =
    sourceExecutionContractReady &&
    sourceExecutionContractFingerprintVerified &&
    launchGuardPassive &&
    dailyConfirmationPresent &&
    dailyConfirmationValid &&
    handoffPacketPrepared &&
    resultFixtureValid &&
    linkedResultIntakeValid &&
    authorityBoundaryAllFalse &&
    persistedMaterialBoundarySafe &&
    rawMaterialAbsent;

  return {
    passed,
    fingerprint_algorithm: FINGERPRINT_ALGORITHM,
    source_execution_contract_ready: sourceExecutionContractReady,
    source_execution_contract_fingerprint_verified:
      sourceExecutionContractFingerprintVerified,
    launch_guard_passive: launchGuardPassive,
    daily_confirmation_present: dailyConfirmationPresent,
    daily_confirmation_valid: dailyConfirmationValid,
    handoff_packet_prepared: handoffPacketPrepared,
    result_fixture_valid: resultFixtureValid,
    linked_result_intake_valid: linkedResultIntakeValid,
    authority_boundary_all_false: authorityBoundaryAllFalse,
    persisted_material_boundary_safe: persistedMaterialBoundarySafe,
    raw_material_absent: rawMaterialAbsent,
    target_write_boundary_proven: true,
  };
}

function refusalReasonsFromValidation(
  validation: AutohuntDailyLauncherRunValidation,
) {
  return [
    !validation.source_execution_contract_ready
      ? "source_execution_contract_not_ready"
      : null,
    !validation.source_execution_contract_fingerprint_verified
      ? "source_execution_contract_fingerprint_mismatch"
      : null,
    !validation.launch_guard_passive ? "launch_guard_not_passive" : null,
    !validation.daily_confirmation_present
      ? "daily_confirmation_missing"
      : null,
    !validation.daily_confirmation_valid ? "daily_confirmation_invalid" : null,
    !validation.handoff_packet_prepared ? "handoff_packet_blocked" : null,
    !validation.result_fixture_valid ? "result_fixture_invalid" : null,
    !validation.linked_result_intake_valid
      ? "linked_result_intake_missing_or_invalid"
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

function computeIdempotencyKey(input: NormalizedLauncherInput) {
  return buildDeterministicIdempotencyKey({
    kind: AUTOHUNT_DAILY_LAUNCHER_RUN_KIND,
    version: AUTOHUNT_DAILY_LAUNCHER_RUN_VERSION,
    source: {
      source_execution_contract_fingerprint:
        input.source_execution_contract.contract_fingerprint,
      confirmation_ref: input.daily_confirmation.confirmation_ref,
      confirmation_fingerprint:
        input.daily_confirmation.confirmation_fingerprint,
      mode: input.mode,
      work_target_mode: input.work_target_mode,
      handoff_packet_fingerprint:
        input.handoff_packet.handoff_packet_fingerprint,
      fixture_result_seed_fingerprint: input.structured_result_report_fixture_input
        ? fingerprint(input.structured_result_report_fixture_input)
        : null,
    },
  });
}

function hasRequiredSourceContractFields(
  contract: AutohuntSupervisedExecutionContract,
) {
  return requiredStringFieldsPresent(
    {
      contract_id: contract.contract_id,
      contract_fingerprint: contract.contract_fingerprint,
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
      operator_decision_id:
        contract.source_readiness_gate.operator_decision_id,
      operator_decision_fingerprint:
        contract.source_readiness_gate.operator_decision_fingerprint,
      copy_export_preview_fingerprint:
        contract.source_readiness_gate.copy_export_preview_fingerprint,
    },
    [
      "contract_id",
      "contract_fingerprint",
      "active_grant_id",
      "active_grant_fingerprint",
      "latest_queued_candidate_id",
      "latest_queued_candidate_fingerprint",
      "ready_preflight_packet_id",
      "ready_preflight_packet_fingerprint",
      "operator_decision_id",
      "operator_decision_fingerprint",
      "copy_export_preview_fingerprint",
    ],
  ).passed;
}

function createPersistedMaterialBoundary(): AutohuntDailyLauncherRunPersistedMaterialBoundary {
  return {
    persists_source_fingerprints: true,
    persists_handoff_packet_summary: true,
    persists_result_report_summary: true,
    persists_raw_confirmation_text: false,
    persists_raw_prompt_text: false,
    persists_raw_result_text: false,
    persists_raw_pr_body: false,
    persists_raw_operator_note: false,
    persists_raw_source_payload: false,
    persists_secret_or_token: false,
    persists_url_or_env_value: false,
  };
}

function validateRawMaterialBoundary(input: AutohuntDailyLauncherRunInput) {
  const forbiddenFields = findForbiddenRawMaterialFields(
    scrubSafeRawMaterialKeys(input),
  );
  const hasForbiddenMaterial = containsForbiddenRawMaterial(
    scrubSafeRawMaterialKeys(input),
  );
  if (forbiddenFields.length > 0 || hasForbiddenMaterial) {
    return ["unsafe_material_refused"];
  }
  return [];
}

function isRawMaterialAbsent(value: unknown) {
  const scrubbed = scrubSafeRawMaterialKeys(value);
  return (
    findForbiddenRawMaterialFields(scrubbed).length === 0 &&
    !containsForbiddenRawMaterial(scrubbed)
  );
}

function scrubSafeRawMaterialKeys(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.map((entry) => scrubSafeRawMaterialKeys(entry));
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !SAFE_RAW_MATERIAL_KEYS.has(key))
      .map(([key, nestedValue]) => [key, scrubSafeRawMaterialKeys(nestedValue)]),
  );
}

function captureRowCounts(db: AutonomyDelegationGrantDbLike): RowCountSnapshot {
  return Object.fromEntries(
    ROW_COUNT_TABLES.map((tableName) => [tableName, countRows(db, tableName)]),
  );
}

function countRows(db: AutonomyDelegationGrantDbLike, tableName: string) {
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

function buildRowCountWriteSummary({
  beforeCounts,
  afterCounts,
  expectedTargetDelta,
  expectedAllowedLinkedTargetDelta,
}: {
  beforeCounts: RowCountSnapshot;
  afterCounts: RowCountSnapshot;
  expectedTargetDelta: number;
  expectedAllowedLinkedTargetDelta: number;
}): AutohuntDailyLauncherRunRowCountWriteSummary {
  const targetBefore = beforeCounts[AUTOHUNT_DAILY_LAUNCHER_RUN_TABLE] ?? 0;
  const targetAfter = afterCounts[AUTOHUNT_DAILY_LAUNCHER_RUN_TABLE] ?? 0;
  const linkedBefore = beforeCounts[AUTOHUNT_RESULT_INTAKE_TABLE] ?? 0;
  const linkedAfter = afterCounts[AUTOHUNT_RESULT_INTAKE_TABLE] ?? 0;
  const rows = ROW_COUNT_TABLES.map((tableName) => {
    const before = beforeCounts[tableName] ?? 0;
    const after = afterCounts[tableName] ?? 0;
    return {
      table_name: tableName,
      before_count: before,
      after_count: after,
      delta: after - before,
      changed: after !== before,
      allowed_target:
        tableName === AUTOHUNT_DAILY_LAUNCHER_RUN_TABLE ||
        tableName === AUTOHUNT_RESULT_INTAKE_TABLE,
    };
  });
  const nonTargetRows = rows.filter((row) => !row.allowed_target);
  const targetDelta = targetAfter - targetBefore;
  const allowedLinkedTargetDelta = linkedAfter - linkedBefore;
  return {
    target_table_name: AUTOHUNT_DAILY_LAUNCHER_RUN_TABLE,
    target_before_count: targetBefore,
    target_after_count: targetAfter,
    target_delta: targetDelta,
    target_table_changed: targetDelta !== 0,
    expected_target_delta: expectedTargetDelta,
    target_delta_matches_expected: targetDelta === expectedTargetDelta,
    allowed_linked_target_table_name:
      expectedAllowedLinkedTargetDelta > 0 ? AUTOHUNT_RESULT_INTAKE_TABLE : null,
    allowed_linked_target_delta: allowedLinkedTargetDelta,
    expected_allowed_linked_target_delta: expectedAllowedLinkedTargetDelta,
    allowed_linked_target_delta_matches_expected:
      allowedLinkedTargetDelta === expectedAllowedLinkedTargetDelta,
    non_target_table_count: nonTargetRows.length,
    non_target_changed_table_count: nonTargetRows.filter((row) => row.changed)
      .length,
    all_non_target_row_counts_unchanged: nonTargetRows.every(
      (row) => !row.changed,
    ),
    rows,
  };
}

function isAllowedLauncherRunRowCountWrite(
  summary: AutohuntDailyLauncherRunRowCountWriteSummary,
) {
  return (
    summary.target_delta_matches_expected &&
    summary.allowed_linked_target_delta_matches_expected &&
    summary.all_non_target_row_counts_unchanged
  );
}

function createAcceptedResult({
  result_status,
  launcher_run,
  linked_result_intake,
  launcher_run_record_written,
  result_intake_record_written,
  duplicate_replayed,
}: {
  result_status: "written" | "duplicate_replayed";
  launcher_run: AutohuntDailyLauncherRun;
  linked_result_intake: AutohuntResultIntake | null;
  launcher_run_record_written: boolean;
  result_intake_record_written: boolean;
  duplicate_replayed: boolean;
}): AutohuntDailyLauncherRunWriteResult {
  return {
    ok: true,
    result_status,
    refusal_reasons: [],
    launcher_run,
    linked_result_intake,
    duplicate_replayed,
    launcher_run_record_written,
    result_intake_record_written,
    row_count_write_summary: launcher_run.row_count_write_summary,
    launcher_started: true,
    codex_executed: false,
    github_called: false,
    branch_or_pr_created: false,
    merge_or_deploy_performed: false,
    provider_openai_called: false,
    sources_fetched: false,
    retrieval_run: false,
    ...buildAutohuntDailyLauncherRunAuthorityBoundary(),
    raw_material_persisted: false,
  };
}

function createRefusedResult(
  refusalReasons: string[],
): AutohuntDailyLauncherRunWriteResult {
  return {
    ok: false,
    result_status: "refused",
    refusal_reasons:
      refusalReasons.length > 0 ? [...new Set(refusalReasons)] : ["refused"],
    launcher_run: null,
    linked_result_intake: null,
    duplicate_replayed: false,
    launcher_run_record_written: false,
    result_intake_record_written: false,
    row_count_write_summary: null,
    launcher_started: false,
    codex_executed: false,
    github_called: false,
    branch_or_pr_created: false,
    merge_or_deploy_performed: false,
    provider_openai_called: false,
    sources_fetched: false,
    retrieval_run: false,
    ...buildAutohuntDailyLauncherRunAuthorityBoundary(),
    raw_material_persisted: false,
  };
}

function hasClose(
  db: AutonomyDelegationGrantDbLike,
): db is AutonomyDelegationGrantDbLike & { close: () => void } {
  return typeof (db as { close?: unknown }).close === "function";
}
