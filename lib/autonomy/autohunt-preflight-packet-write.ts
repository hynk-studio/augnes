import { openDatabase } from "@/lib/db";
import {
  computeAutonomyDelegationGrantFingerprint,
  type AutonomyDelegationGrantDbLike,
} from "@/lib/autonomy/read-autonomy-delegation-grants";
import { computeAutohuntWorkQueueCandidateFingerprint } from "@/lib/autonomy/read-autohunt-work-queue-candidates";
import {
  buildAutohuntPreflightPacketAuthorityBoundary,
  computeAutohuntPreflightPacketFingerprint,
  ensureAutohuntPreflightPacketSchema,
  parseAutohuntPreflightPacketRow,
} from "@/lib/autonomy/read-autohunt-preflight-packets";
import {
  assertAllFalseBoundary,
  buildDeterministicIdempotencyKey,
  containsForbiddenRawMaterial,
  findForbiddenRawMaterialFields,
  isTargetOnlyRowCountWrite,
  requiredStringFieldsPresent,
  stableJson,
  STABLE_FINGERPRINT_ALGORITHM as FINGERPRINT_ALGORITHM,
  stripFingerprintPrefix,
  summarizeTargetOnlyRowCountWrite,
  validateSourceBindingPairs,
} from "@/lib/research-candidate-review/shared-source-chain-guards";
import { RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_PROTECTED_ROW_COUNT_TABLES } from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-result";
import type {
  AutonomyDelegationGrant,
  AutonomyDelegationGrantReadback,
} from "@/types/autonomy-delegation-grant";
import { AUTONOMY_DELEGATION_GRANT_TABLE } from "@/types/autonomy-delegation-grant";
import type {
  AutohuntWorkQueueCandidate,
  AutohuntWorkQueueCandidateBudgetProjection,
  AutohuntWorkQueueCandidateReadback,
} from "@/types/autohunt-work-queue-candidate";
import { AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE } from "@/types/autohunt-work-queue-candidate";
import type {
  AutohuntPreflightPacket,
  AutohuntPreflightPacketAggregateBudgetProjection,
  AutohuntPreflightPacketChecks,
  AutohuntPreflightPacketGrantBudgetRemainingProjection,
  AutohuntPreflightPacketInput,
  AutohuntPreflightPacketPersistedMaterialBoundary,
  AutohuntPreflightPacketRowCountWriteSummary,
  AutohuntPreflightPacketSelectedCandidateSummary,
  AutohuntPreflightPacketSourceGrant,
  AutohuntPreflightPacketSourceQueueReadback,
  AutohuntPreflightPacketStatus,
  AutohuntPreflightPacketValidation,
  AutohuntPreflightPacketWriteResult,
} from "@/types/autohunt-preflight-packet";
import {
  AUTOHUNT_PREFLIGHT_PACKET_FORBIDDEN_OUTPUTS,
  AUTOHUNT_PREFLIGHT_PACKET_KIND,
  AUTOHUNT_PREFLIGHT_PACKET_NEXT_ALLOWED_OUTPUTS,
  AUTOHUNT_PREFLIGHT_PACKET_REQUIRED_STOP_CONDITIONS,
  AUTOHUNT_PREFLIGHT_PACKET_TABLE,
  AUTOHUNT_PREFLIGHT_PACKET_VERSION,
} from "@/types/autohunt-preflight-packet";

export interface WriteAutohuntPreflightPacketOptions {
  db?: AutonomyDelegationGrantDbLike;
  now?: string;
}

type RowCountSnapshot = Record<string, number>;

const NON_TARGET_ROW_COUNT_TABLES = [
  AUTONOMY_DELEGATION_GRANT_TABLE,
  AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE,
  ...RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_PROTECTED_ROW_COUNT_TABLES,
] as const;

const TARGET_AND_NON_TARGET_TABLES = [
  AUTOHUNT_PREFLIGHT_PACKET_TABLE,
  ...NON_TARGET_ROW_COUNT_TABLES,
] as const;

const SAFE_RAW_MATERIAL_BOUNDARY_KEYS = new Set([
  "raw_material_absent",
  "raw_material_persisted",
  "raw_material_persistence_checked",
  "raw_approval_text_persisted",
  "persists_raw_user_approval_text",
  "persists_raw_prompt",
  "persists_raw_operator_note",
  "persists_raw_source_payload",
  "persists_secret_or_token",
  "persists_url_or_env_value",
]);

export function writeAutohuntPreflightPacket(
  input: AutohuntPreflightPacketInput,
  options: WriteAutohuntPreflightPacketOptions = {},
): AutohuntPreflightPacketWriteResult {
  const sourceGrant = extractSourceGrant(input.source_grant);
  const sourceQueue = extractSourceQueue(input);
  const validationRefusalReasons = validateAutohuntPreflightPacketInput(
    input,
    sourceGrant,
    sourceQueue.candidates,
  );
  if (validationRefusalReasons.length > 0 || !sourceGrant) {
    return createRefusedResult(validationRefusalReasons);
  }

  const normalizedInput = normalizePreflightInput({
    input,
    sourceGrant,
    sourceQueue,
  });
  const preflightChecks = buildPreflightChecks(normalizedInput, sourceGrant);
  if (!preflightChecks.passed) {
    return createRefusedResult(preflightChecks.blocker_reasons);
  }

  const idempotencyKey = computeIdempotencyKey(normalizedInput);
  const db = options.db ?? openDatabase();
  const shouldClose = !options.db && hasClose(db);

  try {
    ensureAutohuntPreflightPacketSchema(db);
    const existingRow = db
      .prepare(
        `
          SELECT *
          FROM ${AUTOHUNT_PREFLIGHT_PACKET_TABLE}
          WHERE idempotency_key = ?
        `,
      )
      .get(idempotencyKey);

    if (existingRow) {
      const existingPacket = parseAutohuntPreflightPacketRow(
        existingRow as never,
      );
      if (
        existingPacket &&
        existingPacket.preflight_packet_fingerprint ===
          computeAutohuntPreflightPacketFingerprint(existingPacket)
      ) {
        return createAcceptedResult({
          result_status: "duplicate_replayed",
          preflight_packet: existingPacket,
          preflight_packet_record_written: false,
          duplicate_replayed: true,
        });
      }
      return createRefusedResult([
        "idempotency_conflict_existing_preflight_packet_fingerprint_mismatch",
      ]);
    }

    db.exec("BEGIN IMMEDIATE");
    try {
      const beforeCounts = captureRowCounts(db);
      const expectedWriteSummary = buildRowCountWriteSummary({
        beforeCounts,
        afterCounts: {
          ...beforeCounts,
          [AUTOHUNT_PREFLIGHT_PACKET_TABLE]:
            beforeCounts[AUTOHUNT_PREFLIGHT_PACKET_TABLE] + 1,
        },
      });
      const preflightPacket = buildPreflightPacket({
        input: normalizedInput,
        preflightChecks,
        idempotencyKey,
        createdAt: options.now ?? new Date().toISOString(),
        rowCountWriteSummary: expectedWriteSummary,
      });

      insertPreflightPacket(db, preflightPacket);

      const afterCounts = captureRowCounts(db);
      const actualWriteSummary = buildRowCountWriteSummary({
        beforeCounts,
        afterCounts,
      });
      if (!isTargetOnlyWrite(actualWriteSummary)) {
        db.exec("ROLLBACK");
        return createRefusedResult([
          "target_only_autohunt_preflight_packet_row_count_proof_failed",
        ]);
      }

      db.exec("COMMIT");
      return createAcceptedResult({
        result_status: "written",
        preflight_packet: preflightPacket,
        preflight_packet_record_written: true,
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

export function validateAutohuntPreflightPacketInput(
  input: AutohuntPreflightPacketInput,
  sourceGrant: AutonomyDelegationGrant | null = extractSourceGrant(
    input.source_grant,
  ),
  candidates: AutohuntWorkQueueCandidate[] = extractSourceQueue(input).candidates,
): string[] {
  const refusalReasons: string[] = [];
  if (!sourceGrant) {
    refusalReasons.push("source_grant_missing_or_not_full_record");
  }
  if (input.scope !== "project:augnes") {
    refusalReasons.push("scope_invalid");
  }
  if (sourceGrant) {
    refusalReasons.push(...validateSourceGrant(sourceGrant));
  }
  if (candidates.length === 0) {
    refusalReasons.push("no_queued_candidates");
  }
  refusalReasons.push(...validateRawMaterialBoundary(input));
  return [...new Set(refusalReasons)];
}

function buildPreflightPacket({
  input,
  preflightChecks,
  idempotencyKey,
  createdAt,
  rowCountWriteSummary,
}: {
  input: NormalizedAutohuntPreflightPacketInput;
  preflightChecks: AutohuntPreflightPacketChecks;
  idempotencyKey: string;
  createdAt: string;
  rowCountWriteSummary: AutohuntPreflightPacketRowCountWriteSummary;
}): AutohuntPreflightPacket {
  const preflightPacketId = `autohunt-preflight-packet:${stripFingerprintPrefix(
    idempotencyKey,
  )}`;
  const authorityBoundaryAllFalse = assertAllFalseBoundary(
    input.authority_boundary,
    "autohunt_preflight_packet_authority_boundary",
  ).passed;
  const validation: AutohuntPreflightPacketValidation = {
    passed: true,
    fingerprint_algorithm: FINGERPRINT_ALGORITHM,
    source_grant_active: preflightChecks.source_grant_active,
    source_grant_fingerprint_verified:
      preflightChecks.source_grant_fingerprint_verified,
    source_grant_validation_passed: true,
    candidate_count_positive:
      input.source_queue_readback.selected_candidate_ids.length > 0,
    candidate_fingerprints_verified:
      preflightChecks.candidate_fingerprints_verified,
    candidate_status_all_queued: preflightChecks.candidate_status_all_queued,
    candidate_grant_binding_verified: true,
    candidate_grant_fit_passed: true,
    candidate_validation_passed: true,
    aggregate_budget_within_grant: preflightChecks.budget_within_grant,
    file_scope_allowed: preflightChecks.file_scope_allowed,
    forbidden_actions_absent: preflightChecks.forbidden_actions_absent,
    required_checks_present: preflightChecks.required_checks_present,
    required_stop_conditions_present: preflightChecks.stop_conditions_present,
    source_freshness_ok: preflightChecks.source_freshness_ok,
    authority_boundary_all_false: authorityBoundaryAllFalse,
    persisted_material_boundary_safe: true,
    raw_material_absent: preflightChecks.raw_material_absent,
    target_only_write_proven: true,
    preflight_packet_fingerprint: null,
  };
  const packetWithoutFingerprint: Omit<
    AutohuntPreflightPacket,
    "preflight_packet_fingerprint"
  > = {
    preflight_packet_kind: AUTOHUNT_PREFLIGHT_PACKET_KIND,
    preflight_packet_version: AUTOHUNT_PREFLIGHT_PACKET_VERSION,
    preflight_packet_id: preflightPacketId,
    scope: input.scope,
    created_at: createdAt,
    preflight_status: derivePreflightStatus(preflightChecks),
    source_grant: input.source_grant,
    source_queue_readback: input.source_queue_readback,
    selected_candidates: input.selected_candidates,
    aggregate_budget_projection: input.aggregate_budget_projection,
    grant_budget_remaining_projection:
      input.grant_budget_remaining_projection,
    preflight_checks: preflightChecks,
    blocked_actions: input.blocked_actions,
    stop_conditions: input.stop_conditions,
    required_checks: input.required_checks,
    next_allowed_outputs: [...AUTOHUNT_PREFLIGHT_PACKET_NEXT_ALLOWED_OUTPUTS],
    forbidden_outputs: [...AUTOHUNT_PREFLIGHT_PACKET_FORBIDDEN_OUTPUTS],
    authority_boundary: input.authority_boundary,
    persisted_material_boundary: input.persisted_material_boundary,
    validation,
    row_count_write_summary: rowCountWriteSummary,
    idempotency_key: idempotencyKey,
  };
  const preflightPacketFingerprint =
    computeAutohuntPreflightPacketFingerprint(packetWithoutFingerprint);

  return {
    ...packetWithoutFingerprint,
    validation: {
      ...validation,
      preflight_packet_fingerprint: preflightPacketFingerprint,
    },
    preflight_packet_fingerprint: computeAutohuntPreflightPacketFingerprint({
      ...packetWithoutFingerprint,
      validation: {
        ...validation,
        preflight_packet_fingerprint: preflightPacketFingerprint,
      },
    }),
  };
}

function insertPreflightPacket(
  db: AutonomyDelegationGrantDbLike,
  packet: AutohuntPreflightPacket,
) {
  db.prepare(
    `
      INSERT INTO autohunt_preflight_packets (
        preflight_packet_id,
        created_at,
        scope,
        preflight_status,
        source_grant_id,
        source_grant_fingerprint,
        source_grant_status,
        source_grant_mode,
        selected_candidate_ids_json,
        selected_candidate_fingerprints_json,
        idempotency_key,
        source_queue_readback_json,
        selected_candidates_json,
        aggregate_budget_projection_json,
        grant_budget_remaining_projection_json,
        preflight_checks_json,
        blocked_actions_json,
        stop_conditions_json,
        required_checks_json,
        next_allowed_outputs_json,
        forbidden_outputs_json,
        authority_boundary_json,
        persisted_material_boundary_json,
        validation_json,
        row_count_write_summary_json,
        preflight_packet_fingerprint
      )
      VALUES (
        @preflight_packet_id,
        @created_at,
        @scope,
        @preflight_status,
        @source_grant_id,
        @source_grant_fingerprint,
        @source_grant_status,
        @source_grant_mode,
        @selected_candidate_ids_json,
        @selected_candidate_fingerprints_json,
        @idempotency_key,
        @source_queue_readback_json,
        @selected_candidates_json,
        @aggregate_budget_projection_json,
        @grant_budget_remaining_projection_json,
        @preflight_checks_json,
        @blocked_actions_json,
        @stop_conditions_json,
        @required_checks_json,
        @next_allowed_outputs_json,
        @forbidden_outputs_json,
        @authority_boundary_json,
        @persisted_material_boundary_json,
        @validation_json,
        @row_count_write_summary_json,
        @preflight_packet_fingerprint
      )
    `,
  ).run({
    preflight_packet_id: packet.preflight_packet_id,
    created_at: packet.created_at,
    scope: packet.scope,
    preflight_status: packet.preflight_status,
    source_grant_id: packet.source_grant.grant_id,
    source_grant_fingerprint: packet.source_grant.grant_fingerprint,
    source_grant_status: packet.source_grant.grant_status,
    source_grant_mode: packet.source_grant.grant_mode,
    selected_candidate_ids_json: stableJson(
      packet.source_queue_readback.selected_candidate_ids,
    ),
    selected_candidate_fingerprints_json: stableJson(
      packet.source_queue_readback.selected_candidate_fingerprints,
    ),
    idempotency_key: packet.idempotency_key,
    source_queue_readback_json: stableJson(packet.source_queue_readback),
    selected_candidates_json: stableJson(packet.selected_candidates),
    aggregate_budget_projection_json: stableJson(
      packet.aggregate_budget_projection,
    ),
    grant_budget_remaining_projection_json: stableJson(
      packet.grant_budget_remaining_projection,
    ),
    preflight_checks_json: stableJson(packet.preflight_checks),
    blocked_actions_json: stableJson(packet.blocked_actions),
    stop_conditions_json: stableJson(packet.stop_conditions),
    required_checks_json: stableJson(packet.required_checks),
    next_allowed_outputs_json: stableJson(packet.next_allowed_outputs),
    forbidden_outputs_json: stableJson(packet.forbidden_outputs),
    authority_boundary_json: stableJson(packet.authority_boundary),
    persisted_material_boundary_json: stableJson(
      packet.persisted_material_boundary,
    ),
    validation_json: stableJson(packet.validation),
    row_count_write_summary_json: stableJson(packet.row_count_write_summary),
    preflight_packet_fingerprint: packet.preflight_packet_fingerprint,
  });
}

type NormalizedAutohuntPreflightPacketInput = Omit<
  AutohuntPreflightPacket,
  | "preflight_packet_kind"
  | "preflight_packet_version"
  | "preflight_packet_id"
  | "created_at"
  | "preflight_status"
  | "preflight_checks"
  | "next_allowed_outputs"
  | "forbidden_outputs"
  | "validation"
  | "row_count_write_summary"
  | "idempotency_key"
  | "preflight_packet_fingerprint"
> & {
  source_candidates: AutohuntWorkQueueCandidate[];
};

function normalizePreflightInput({
  input,
  sourceGrant,
  sourceQueue,
}: {
  input: AutohuntPreflightPacketInput;
  sourceGrant: AutonomyDelegationGrant;
  sourceQueue: SourceQueueMaterial;
}): NormalizedAutohuntPreflightPacketInput {
  const sourceCandidates = [...sourceQueue.candidates].sort((left, right) =>
    left.candidate_id.localeCompare(right.candidate_id),
  );
  const selectedCandidates = sourceCandidates.map(summarizeCandidate);
  const aggregateBudgetProjection =
    aggregateBudgetProjectionFromCandidates(sourceCandidates);
  return {
    scope: input.scope,
    source_grant: normalizeSourceGrant(sourceGrant),
    source_queue_readback: {
      queued_candidate_count: sourceQueue.queued_candidate_count,
      selected_candidate_ids: sourceCandidates.map(
        (candidate) => candidate.candidate_id,
      ),
      selected_candidate_fingerprints: sourceCandidates.map(
        (candidate) => candidate.candidate_fingerprint,
      ),
      invalid_candidate_count: sourceQueue.invalid_candidate_count,
    },
    selected_candidates: selectedCandidates,
    aggregate_budget_projection: aggregateBudgetProjection,
    grant_budget_remaining_projection: buildRemainingBudgetProjection({
      sourceGrant,
      aggregateBudgetProjection,
    }),
    blocked_actions: uniqueStrings(
      sourceCandidates.flatMap((candidate) => candidate.blocked_actions),
    ),
    stop_conditions: uniqueStrings(
      sourceCandidates.flatMap((candidate) => candidate.stop_conditions),
    ),
    required_checks: uniqueStrings(
      sourceCandidates.flatMap((candidate) => candidate.required_checks),
    ),
    authority_boundary: buildAutohuntPreflightPacketAuthorityBoundary(),
    persisted_material_boundary: createPersistedMaterialBoundary(),
    source_candidates: sourceCandidates,
  };
}

function normalizeSourceGrant(
  sourceGrant: AutonomyDelegationGrant,
): AutohuntPreflightPacketSourceGrant {
  return {
    grant_id: sourceGrant.grant_id,
    grant_fingerprint: sourceGrant.grant_fingerprint,
    grant_status: sourceGrant.grant_status,
    grant_mode: sourceGrant.grant_mode,
  };
}

function summarizeCandidate(
  candidate: AutohuntWorkQueueCandidate,
): AutohuntPreflightPacketSelectedCandidateSummary {
  return {
    candidate_id: candidate.candidate_id,
    candidate_fingerprint: candidate.candidate_fingerprint,
    candidate_origin: candidate.candidate_origin,
    work_class: candidate.work_class,
    title_summary_fingerprint: candidate.title_summary_fingerprint,
    source_refs: normalizeStringArray(candidate.source_refs),
    source_fingerprints: normalizeStringArray(candidate.source_fingerprints),
    proposed_files_or_globs: normalizeStringArray(
      candidate.proposed_files_or_globs,
    ),
    expected_outputs: normalizeStringArray(candidate.expected_outputs),
    required_checks: normalizeStringArray(candidate.required_checks),
    budget_projection: normalizeBudgetProjection(candidate.budget_projection),
    grant_fit: {
      ...candidate.grant_fit,
      blocker_reasons: normalizeStringArray(candidate.grant_fit.blocker_reasons),
      warning_reasons: normalizeStringArray(candidate.grant_fit.warning_reasons),
    },
  };
}

function buildPreflightChecks(
  input: NormalizedAutohuntPreflightPacketInput,
  sourceGrant: AutonomyDelegationGrant,
): AutohuntPreflightPacketChecks {
  const sourceGrantActive = sourceGrant.grant_status === "active";
  const sourceGrantFingerprintVerified =
    sourceGrant.grant_fingerprint ===
    computeAutonomyDelegationGrantFingerprint(sourceGrant);
  const candidateFingerprintsVerified = input.source_candidates.every(
    (candidate) =>
      candidate.candidate_fingerprint ===
      computeAutohuntWorkQueueCandidateFingerprint(candidate),
  );
  const candidateStatusAllQueued = input.source_candidates.every(
    (candidate) => candidate.candidate_status === "queued",
  );
  const candidateGrantBindingVerified = input.source_candidates.every(
    (candidate) =>
      candidate.source_grant.grant_id === sourceGrant.grant_id &&
      candidate.source_grant.grant_fingerprint === sourceGrant.grant_fingerprint,
  );
  const candidateGrantFitPassed = input.source_candidates.every(
    (candidate) => candidate.grant_fit.passed === true,
  );
  const candidateValidationPassed = input.source_candidates.every(
    (candidate) => candidate.validation?.passed === true,
  );
  const workClassesAllowed = input.source_candidates.every((candidate) =>
    sourceGrant.allowed_work_classes.includes(candidate.work_class),
  );
  const fileScopeAllowed =
    input.source_candidates.length > 0 &&
    input.source_candidates.every(
      (candidate) =>
        allProposedFilesAllowed({
          proposed: candidate.proposed_files_or_globs,
          allowed: sourceGrant.budget.allowed_file_globs,
        }) &&
        noProposedFilesForbidden({
          proposed: candidate.proposed_files_or_globs,
          forbidden: sourceGrant.budget.forbidden_file_globs,
        }),
    );
  const forbiddenActionsAbsent = input.source_candidates.every((candidate) =>
    candidate.blocked_actions.every(
      (action) => !sourceGrant.forbidden_actions.includes(action),
    ),
  );
  const budgetWithinGrant = isAggregateBudgetWithinGrant(
    input.aggregate_budget_projection,
    sourceGrant,
  );
  const requiredChecksPresent = input.source_candidates.every(
    (candidate) => candidate.required_checks.length > 0,
  );
  const stopConditionsPresent = input.source_candidates.every((candidate) =>
    AUTOHUNT_PREFLIGHT_PACKET_REQUIRED_STOP_CONDITIONS.every((condition) =>
      candidate.stop_conditions.includes(condition),
    ),
  );
  const sourceFreshnessOk = input.source_candidates.every(
    (candidate) => candidate.source_fingerprints.length > 0,
  );
  const rawMaterialAbsent = true;
  const blockerReasons = [
    !sourceGrantActive ? "source_grant_inactive" : null,
    !sourceGrantFingerprintVerified ? "source_grant_fingerprint_mismatch" : null,
    sourceGrant.validation?.passed !== true
      ? "source_grant_validation_not_passed"
      : null,
    input.source_candidates.length === 0 ? "no_queued_candidates" : null,
    !candidateFingerprintsVerified ? "candidate_fingerprint_mismatch" : null,
    !candidateStatusAllQueued ? "candidate_status_not_queued" : null,
    !candidateGrantBindingVerified ? "candidate_source_grant_mismatch" : null,
    !candidateGrantFitPassed ? "candidate_grant_fit_failed" : null,
    !candidateValidationPassed ? "candidate_validation_failed" : null,
    !workClassesAllowed ? "work_class_not_allowed_by_grant" : null,
    !fileScopeAllowed ? "file_scope_blocked" : null,
    !forbiddenActionsAbsent ? "forbidden_action_detected" : null,
    !budgetWithinGrant ? "budget_exceeded" : null,
    !requiredChecksPresent ? "required_check_missing" : null,
    !stopConditionsPresent ? "stop_condition_missing" : null,
    !sourceFreshnessOk ? "stale_or_missing_source" : null,
  ].filter((reason): reason is string => Boolean(reason));
  const warningReasons =
    input.source_queue_readback.invalid_candidate_count > 0
      ? ["invalid_candidates_present_in_source_readback"]
      : [];

  return {
    source_grant_active: sourceGrantActive,
    source_grant_fingerprint_verified: sourceGrantFingerprintVerified,
    candidate_fingerprints_verified: candidateFingerprintsVerified,
    candidate_status_all_queued: candidateStatusAllQueued,
    work_classes_allowed: workClassesAllowed,
    file_scope_allowed: fileScopeAllowed,
    forbidden_actions_absent: forbiddenActionsAbsent,
    budget_within_grant: budgetWithinGrant,
    required_checks_present: requiredChecksPresent,
    stop_conditions_present: stopConditionsPresent,
    source_freshness_ok: sourceFreshnessOk,
    raw_material_absent: rawMaterialAbsent,
    passed: blockerReasons.length === 0,
    blocker_reasons: blockerReasons,
    warning_reasons: warningReasons,
  };
}

function validateSourceGrant(sourceGrant: AutonomyDelegationGrant) {
  const refusalReasons: string[] = [];
  if (sourceGrant.grant_status !== "active") {
    refusalReasons.push("source_grant_not_active");
  }
  if (!sourceGrant.grant_fingerprint) {
    refusalReasons.push("source_grant_fingerprint_missing");
  } else if (
    sourceGrant.grant_fingerprint !==
    computeAutonomyDelegationGrantFingerprint(sourceGrant)
  ) {
    refusalReasons.push("source_grant_fingerprint_mismatch");
  }
  if (sourceGrant.validation?.passed !== true) {
    refusalReasons.push("source_grant_validation_not_passed");
  }
  const required = requiredStringFieldsPresent(
    {
      source_grant_id: sourceGrant.grant_id,
      source_grant_fingerprint: sourceGrant.grant_fingerprint,
      source_grant_status: sourceGrant.grant_status,
      source_grant_mode: sourceGrant.grant_mode,
    },
    [
      "source_grant_id",
      "source_grant_fingerprint",
      "source_grant_status",
      "source_grant_mode",
    ],
  );
  for (const field of required.missing_fields) {
    refusalReasons.push(`${field}_missing`);
  }
  const sourceBinding = validateSourceBindingPairs([
    {
      field: "source_grant_id",
      expected: sourceGrant.grant_id,
      actual: sourceGrant.grant_id,
      reason: "source_grant_id_missing",
    },
    {
      field: "source_grant_fingerprint",
      expected: sourceGrant.grant_fingerprint,
      actual: sourceGrant.grant_fingerprint,
      reason: "source_grant_fingerprint_missing",
    },
  ]);
  if (!sourceBinding.passed) {
    refusalReasons.push("source_grant_binding_incomplete");
  }
  return refusalReasons;
}

function derivePreflightStatus(
  checks: AutohuntPreflightPacketChecks,
): AutohuntPreflightPacketStatus {
  if (checks.passed) return "ready_for_supervised_handoff_planning";
  if (checks.blocker_reasons.includes("source_grant_inactive")) {
    return "source_grant_inactive";
  }
  if (checks.blocker_reasons.includes("no_queued_candidates")) {
    return "no_queued_candidates";
  }
  if (checks.blocker_reasons.includes("budget_exceeded")) {
    return "budget_exceeded";
  }
  if (checks.blocker_reasons.includes("forbidden_action_detected")) {
    return "forbidden_action_detected";
  }
  if (checks.blocker_reasons.includes("file_scope_blocked")) {
    return "file_scope_blocked";
  }
  if (checks.blocker_reasons.includes("required_check_missing")) {
    return "required_check_missing";
  }
  if (checks.blocker_reasons.includes("stop_condition_missing")) {
    return "stop_condition_missing";
  }
  if (checks.blocker_reasons.includes("stale_or_missing_source")) {
    return "stale_or_missing_source";
  }
  return "blocked";
}

function computeIdempotencyKey(
  input: NormalizedAutohuntPreflightPacketInput,
) {
  return buildDeterministicIdempotencyKey({
    kind: AUTOHUNT_PREFLIGHT_PACKET_KIND,
    version: AUTOHUNT_PREFLIGHT_PACKET_VERSION,
    source: {
      source_grant_fingerprint: input.source_grant.grant_fingerprint,
      selected_candidate_fingerprints:
        input.source_queue_readback.selected_candidate_fingerprints,
      aggregate_budget_projection: input.aggregate_budget_projection,
    },
  });
}

function aggregateBudgetProjectionFromCandidates(
  candidates: AutohuntWorkQueueCandidate[],
): AutohuntPreflightPacketAggregateBudgetProjection {
  return candidates.reduce(
    (aggregate, candidate) => ({
      estimated_iterations:
        aggregate.estimated_iterations +
        normalizeBudgetProjection(candidate.budget_projection).estimated_iterations,
      estimated_tool_calls:
        aggregate.estimated_tool_calls +
        normalizeBudgetProjection(candidate.budget_projection).estimated_tool_calls,
      estimated_codex_tasks:
        aggregate.estimated_codex_tasks +
        normalizeBudgetProjection(candidate.budget_projection).estimated_codex_tasks,
      estimated_file_changes:
        aggregate.estimated_file_changes +
        normalizeBudgetProjection(candidate.budget_projection).estimated_file_changes,
      estimated_draft_prs:
        aggregate.estimated_draft_prs +
        normalizeBudgetProjection(candidate.budget_projection).estimated_draft_prs,
    }),
    {
      estimated_iterations: 0,
      estimated_tool_calls: 0,
      estimated_codex_tasks: 0,
      estimated_file_changes: 0,
      estimated_draft_prs: 0,
    },
  );
}

function buildRemainingBudgetProjection({
  sourceGrant,
  aggregateBudgetProjection,
}: {
  sourceGrant: AutonomyDelegationGrant;
  aggregateBudgetProjection: AutohuntPreflightPacketAggregateBudgetProjection;
}): AutohuntPreflightPacketGrantBudgetRemainingProjection {
  return {
    remaining_iterations: Math.max(
      0,
      sourceGrant.budget.max_iterations -
        aggregateBudgetProjection.estimated_iterations,
    ),
    remaining_tool_calls: Math.max(
      0,
      sourceGrant.budget.max_tool_calls -
        aggregateBudgetProjection.estimated_tool_calls,
    ),
    remaining_codex_tasks: Math.max(
      0,
      sourceGrant.budget.max_codex_tasks -
        aggregateBudgetProjection.estimated_codex_tasks,
    ),
    remaining_file_changes: Math.max(
      0,
      sourceGrant.budget.max_file_changes -
        aggregateBudgetProjection.estimated_file_changes,
    ),
    remaining_draft_prs: Math.max(
      0,
      sourceGrant.budget.max_draft_prs -
        aggregateBudgetProjection.estimated_draft_prs,
    ),
  };
}

function isAggregateBudgetWithinGrant(
  aggregate: AutohuntPreflightPacketAggregateBudgetProjection,
  sourceGrant: AutonomyDelegationGrant,
) {
  return (
    aggregate.estimated_iterations <= sourceGrant.budget.max_iterations &&
    aggregate.estimated_tool_calls <= sourceGrant.budget.max_tool_calls &&
    aggregate.estimated_codex_tasks <= sourceGrant.budget.max_codex_tasks &&
    aggregate.estimated_file_changes <= sourceGrant.budget.max_file_changes &&
    aggregate.estimated_draft_prs <= sourceGrant.budget.max_draft_prs
  );
}

function normalizeBudgetProjection(
  budgetProjection: AutohuntWorkQueueCandidateBudgetProjection,
): AutohuntWorkQueueCandidateBudgetProjection {
  return {
    estimated_iterations: normalizeInteger(budgetProjection?.estimated_iterations),
    estimated_tool_calls: normalizeInteger(budgetProjection?.estimated_tool_calls),
    estimated_codex_tasks: normalizeInteger(budgetProjection?.estimated_codex_tasks),
    estimated_file_changes: normalizeInteger(budgetProjection?.estimated_file_changes),
    estimated_draft_prs: normalizeInteger(budgetProjection?.estimated_draft_prs),
  };
}

function allProposedFilesAllowed({
  proposed,
  allowed,
}: {
  proposed: string[];
  allowed: string[];
}) {
  if (proposed.length === 0 || allowed.length === 0) return false;
  return proposed.every((item) =>
    allowed.some((allowedGlob) => globMatches(allowedGlob, item)),
  );
}

function noProposedFilesForbidden({
  proposed,
  forbidden,
}: {
  proposed: string[];
  forbidden: string[];
}) {
  return proposed.every(
    (item) => !forbidden.some((forbiddenGlob) => globMatches(forbiddenGlob, item)),
  );
}

function globMatches(glob: string, value: string) {
  const normalizedGlob = glob.trim();
  const normalizedValue = value.trim();
  if (!normalizedGlob || !normalizedValue) return false;
  if (normalizedGlob === normalizedValue) return true;
  const escaped = normalizedGlob
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "\u0000")
    .replace(/\*/g, "[^/]*")
    .replace(/\u0000/g, ".*");
  return new RegExp(`^${escaped}$`).test(normalizedValue);
}

function captureRowCounts(db: AutonomyDelegationGrantDbLike): RowCountSnapshot {
  return Object.fromEntries(
    TARGET_AND_NON_TARGET_TABLES.map((tableName) => [
      tableName,
      countRowsIfTableExists(db, tableName),
    ]),
  );
}

function countRowsIfTableExists(
  db: AutonomyDelegationGrantDbLike,
  tableName: string,
) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
    throw new Error(`Unsafe table name: ${tableName}`);
  }
  const table = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(tableName) as { name?: string } | undefined;
  if (!table?.name) return 0;
  const row = db
    .prepare(`SELECT COUNT(*) as count FROM ${tableName}`)
    .get() as { count: number };
  return Number(row.count);
}

function buildRowCountWriteSummary({
  beforeCounts,
  afterCounts,
}: {
  beforeCounts: RowCountSnapshot;
  afterCounts: RowCountSnapshot;
}): AutohuntPreflightPacketRowCountWriteSummary {
  const writeSummary = summarizeTargetOnlyRowCountWrite({
    targetTable: AUTOHUNT_PREFLIGHT_PACKET_TABLE,
    tableNames: TARGET_AND_NON_TARGET_TABLES,
    beforeCounts,
    afterCounts,
  });
  return {
    target_table_name: AUTOHUNT_PREFLIGHT_PACKET_TABLE,
    target_before_count: writeSummary.target_before_count,
    target_after_count: writeSummary.target_after_count,
    target_delta: writeSummary.target_delta,
    target_table_changed: writeSummary.target_table_changed,
    expected_target_delta: writeSummary.expected_target_delta,
    target_delta_matches_expected: writeSummary.target_delta_matches_expected,
    non_target_table_count: writeSummary.non_target_table_count,
    non_target_changed_table_count:
      writeSummary.non_target_changed_table_count,
    all_non_target_row_counts_unchanged:
      writeSummary.all_non_target_row_counts_unchanged,
    rows: writeSummary.rows,
  };
}

function isTargetOnlyWrite(
  summary: AutohuntPreflightPacketRowCountWriteSummary,
) {
  return (
    summary.target_table_name === AUTOHUNT_PREFLIGHT_PACKET_TABLE &&
    isTargetOnlyRowCountWrite(summary)
  );
}

function createAcceptedResult({
  result_status,
  preflight_packet,
  preflight_packet_record_written,
  duplicate_replayed,
}: {
  result_status: "written" | "duplicate_replayed";
  preflight_packet: AutohuntPreflightPacket;
  preflight_packet_record_written: boolean;
  duplicate_replayed: boolean;
}): AutohuntPreflightPacketWriteResult {
  return {
    ok: true,
    result_status,
    refusal_reasons: [],
    preflight_packet,
    duplicate_replayed,
    preflight_packet_record_written,
    row_count_write_summary: preflight_packet.row_count_write_summary,
    ...createNoRunAuthorityFlags(),
    raw_material_persisted: false,
  };
}

function createRefusedResult(
  refusalReasons: string[],
): AutohuntPreflightPacketWriteResult {
  return {
    ok: false,
    result_status: "refused",
    refusal_reasons: [...new Set(refusalReasons)],
    preflight_packet: null,
    duplicate_replayed: false,
    preflight_packet_record_written: false,
    row_count_write_summary: null,
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

function validateRawMaterialBoundary(input: AutohuntPreflightPacketInput) {
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

function stripAllowedBoundaryFlagKeys(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(stripAllowedBoundaryFlagKeys);
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !SAFE_RAW_MATERIAL_BOUNDARY_KEYS.has(key))
      .map(([key, nestedValue]) => [key, stripAllowedBoundaryFlagKeys(nestedValue)]),
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

function extractSourceGrant(
  source:
    | AutohuntPreflightPacketInput["source_grant"]
    | AutonomyDelegationGrantReadback,
): AutonomyDelegationGrant | null {
  if (!source || typeof source !== "object") return null;
  if ("grant_kind" in source && source.grant_kind === "autonomy_delegation_grant") {
    return source as AutonomyDelegationGrant;
  }
  if ("selected_grant" in source || "latest_active_grant" in source) {
    const readback = source as AutonomyDelegationGrantReadback;
    if (readback.selected_grant?.grant_status === "active") {
      return readback.selected_grant;
    }
    return readback.latest_active_grant ?? null;
  }
  return null;
}

type SourceQueueMaterial = {
  candidates: AutohuntWorkQueueCandidate[];
  queued_candidate_count: number;
  invalid_candidate_count: number;
};

function extractSourceQueue(
  input: AutohuntPreflightPacketInput,
): SourceQueueMaterial {
  if (Array.isArray(input.candidates)) {
    return {
      candidates: input.candidates,
      queued_candidate_count: input.candidates.filter(
        (candidate) => candidate.candidate_status === "queued",
      ).length,
      invalid_candidate_count: 0,
    };
  }
  if (Array.isArray(input.source_queue)) {
    return {
      candidates: input.source_queue,
      queued_candidate_count: input.source_queue.filter(
        (candidate) => candidate.candidate_status === "queued",
      ).length,
      invalid_candidate_count: 0,
    };
  }
  if (input.source_queue && typeof input.source_queue === "object") {
    const readback = input.source_queue as AutohuntWorkQueueCandidateReadback;
    return {
      candidates: readback.selected_queued_candidates ?? [],
      queued_candidate_count: readback.selected_queued_candidates?.length ?? 0,
      invalid_candidate_count: readback.invalid_record_count ?? 0,
    };
  }
  return {
    candidates: [],
    queued_candidate_count: 0,
    invalid_candidate_count: 0,
  };
}

function createPersistedMaterialBoundary(): AutohuntPreflightPacketPersistedMaterialBoundary {
  return {
    persists_source_fingerprints: true,
    persists_preflight_policy: true,
    persists_raw_prompt: false,
    persists_raw_operator_note: false,
    persists_raw_source_payload: false,
    persists_secret_or_token: false,
    persists_url_or_env_value: false,
  };
}

function normalizeStringArray(values: string[] | readonly string[] | undefined) {
  return [
    ...new Set((values ?? []).map((value) => value.trim()).filter(Boolean)),
  ].sort();
}

function uniqueStrings(values: string[]) {
  return normalizeStringArray(values);
}

function normalizeInteger(value: number | undefined) {
  return Number.isFinite(value) ? Math.trunc(value as number) : 0;
}

function hasClose(
  db: AutonomyDelegationGrantDbLike,
): db is AutonomyDelegationGrantDbLike & { close(): void } {
  return typeof (db as { close?: unknown }).close === "function";
}
