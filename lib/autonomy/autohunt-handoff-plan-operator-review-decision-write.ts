import { openDatabase } from "@/lib/db";
import type { AutonomyDelegationGrantDbLike } from "@/lib/autonomy/read-autonomy-delegation-grants";
import {
  buildAutohuntHandoffPlanPreviewAuthorityBoundary,
  computeAutohuntHandoffPlanPreviewFingerprint,
} from "@/lib/autonomy/read-autohunt-handoff-plan-previews";
import {
  computeAutohuntHandoffPlanOperatorReviewDecisionFingerprint,
  ensureAutohuntHandoffPlanOperatorReviewDecisionSchema,
  parseAutohuntHandoffPlanOperatorReviewDecisionRow,
} from "@/lib/autonomy/read-autohunt-handoff-plan-operator-review-decisions";
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
import { AUTONOMY_DELEGATION_GRANT_TABLE } from "@/types/autonomy-delegation-grant";
import {
  AUTOHUNT_HANDOFF_PLAN_PREVIEW_TABLE,
  type AutohuntHandoffPlanPreview,
  type AutohuntHandoffPlanPreviewReadback,
} from "@/types/autohunt-handoff-plan-preview";
import { AUTOHUNT_PREFLIGHT_PACKET_TABLE } from "@/types/autohunt-preflight-packet";
import { AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE } from "@/types/autohunt-work-queue-candidate";
import {
  AUTOHUNT_HANDOFF_PLAN_OPERATOR_DECISIONS,
  AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_BLOCKED_ACTIONS,
  AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_FORBIDDEN_OUTPUTS,
  AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_KIND,
  AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_NEXT_ALLOWED_OUTPUTS,
  AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_TABLE,
  AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_VERSION,
  type AutohuntHandoffPlanOperatorDecision,
  type AutohuntHandoffPlanOperatorReviewDecision,
  type AutohuntHandoffPlanOperatorReviewDecisionAcceptedSummary,
  type AutohuntHandoffPlanOperatorReviewDecisionDeferOrRejectSummary,
  type AutohuntHandoffPlanOperatorReviewDecisionInput,
  type AutohuntHandoffPlanOperatorReviewDecisionPersistedMaterialBoundary,
  type AutohuntHandoffPlanOperatorReviewDecisionReviewBasis,
  type AutohuntHandoffPlanOperatorReviewDecisionRowCountWriteSummary,
  type AutohuntHandoffPlanOperatorReviewDecisionSourceChainValidation,
  type AutohuntHandoffPlanOperatorReviewDecisionSourceHandoffPlan,
  type AutohuntHandoffPlanOperatorReviewDecisionValidation,
  type AutohuntHandoffPlanOperatorReviewDecisionWriteResult,
} from "@/types/autohunt-handoff-plan-operator-review-decision";
import { RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_PROTECTED_ROW_COUNT_TABLES } from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-result";

export interface WriteAutohuntHandoffPlanOperatorReviewDecisionOptions {
  db?: AutonomyDelegationGrantDbLike;
  now?: string;
}

type RowCountSnapshot = Record<string, number>;

const NON_TARGET_ROW_COUNT_TABLES = [
  AUTONOMY_DELEGATION_GRANT_TABLE,
  AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE,
  AUTOHUNT_PREFLIGHT_PACKET_TABLE,
  AUTOHUNT_HANDOFF_PLAN_PREVIEW_TABLE,
  ...RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_PROTECTED_ROW_COUNT_TABLES,
] as const;

const TARGET_AND_NON_TARGET_TABLES = [
  AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_TABLE,
  ...NON_TARGET_ROW_COUNT_TABLES,
] as const;

const SAFE_RAW_MATERIAL_BOUNDARY_KEYS = new Set([
  "raw_material_absent",
  "raw_material_persisted",
  "raw_material_persistence_checked",
  "raw_review_note_persisted",
  "raw_reason_text_persisted",
  "raw_prompt_text_persisted",
  "raw_pr_body_persisted",
  "raw_operator_note_persisted",
  "expected_result_report_sections",
  "persists_raw_review_note",
  "persists_raw_reason_text",
  "persists_raw_prompt_text",
  "persists_raw_pr_body",
  "persists_raw_operator_note",
  "persists_raw_source_payload",
  "persists_secret_or_token",
  "persists_url_or_env_value",
]);

export function writeAutohuntHandoffPlanOperatorReviewDecision(
  input: AutohuntHandoffPlanOperatorReviewDecisionInput,
  options: WriteAutohuntHandoffPlanOperatorReviewDecisionOptions = {},
): AutohuntHandoffPlanOperatorReviewDecisionWriteResult {
  const sourceHandoffPlan = extractSourceHandoffPlan(input.source_handoff_plan);
  const validationRefusalReasons =
    validateAutohuntHandoffPlanOperatorReviewDecisionInput(
      input,
      sourceHandoffPlan,
    );
  if (validationRefusalReasons.length > 0 || !sourceHandoffPlan) {
    return createRefusedResult(validationRefusalReasons);
  }

  const normalizedInput = normalizeDecisionInput(input, sourceHandoffPlan);
  const validation = buildDecisionValidation(normalizedInput);
  if (!validation.passed) {
    return createRefusedResult(refusalReasonsFromValidation(validation));
  }

  const idempotencyKey = computeIdempotencyKey(normalizedInput);
  const db = options.db ?? openDatabase();
  const shouldClose = !options.db && hasClose(db);

  try {
    ensureAutohuntHandoffPlanOperatorReviewDecisionSchema(db);
    const existingRow = db
      .prepare(
        `
          SELECT *
          FROM ${AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_TABLE}
          WHERE idempotency_key = ?
        `,
      )
      .get(idempotencyKey);

    if (existingRow) {
      const existingDecision =
        parseAutohuntHandoffPlanOperatorReviewDecisionRow(existingRow as never);
      if (
        existingDecision &&
        existingDecision.decision_fingerprint ===
          computeAutohuntHandoffPlanOperatorReviewDecisionFingerprint(
            existingDecision,
          )
      ) {
        return createAcceptedResult({
          result_status: "duplicate_replayed",
          decision: existingDecision,
          decision_record_written: false,
          duplicate_replayed: true,
        });
      }
      return createRefusedResult([
        "idempotency_conflict_existing_operator_review_decision_fingerprint_mismatch",
      ]);
    }

    db.exec("BEGIN IMMEDIATE");
    try {
      const beforeCounts = captureRowCounts(db);
      const expectedWriteSummary = buildRowCountWriteSummary({
        beforeCounts,
        afterCounts: {
          ...beforeCounts,
          [AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_TABLE]:
            beforeCounts[AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_TABLE] +
            1,
        },
      });
      const decision = buildDecisionRecord({
        input: normalizedInput,
        validation,
        idempotencyKey,
        createdAt: options.now ?? new Date().toISOString(),
        rowCountWriteSummary: expectedWriteSummary,
      });

      insertDecisionRecord(db, decision);

      const afterCounts = captureRowCounts(db);
      const actualWriteSummary = buildRowCountWriteSummary({
        beforeCounts,
        afterCounts,
      });
      if (!isTargetOnlyRowCountWrite(actualWriteSummary)) {
        db.exec("ROLLBACK");
        return createRefusedResult([
          "target_only_autohunt_handoff_plan_operator_review_decision_row_count_proof_failed",
        ]);
      }

      db.exec("COMMIT");
      return createAcceptedResult({
        result_status: "written",
        decision,
        decision_record_written: true,
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

export function validateAutohuntHandoffPlanOperatorReviewDecisionInput(
  input: AutohuntHandoffPlanOperatorReviewDecisionInput,
  sourceHandoffPlan: AutohuntHandoffPlanPreview | null =
    extractSourceHandoffPlan(input.source_handoff_plan),
): string[] {
  const refusalReasons: string[] = [];
  if (input.scope !== "project:augnes") {
    refusalReasons.push("scope_invalid");
  }
  if (!sourceHandoffPlan) {
    refusalReasons.push("source_handoff_plan_missing");
  } else {
    refusalReasons.push(...validateSourceHandoffPlan(sourceHandoffPlan));
  }
  if (!input.operator_decision) {
    refusalReasons.push("operator_decision_missing");
  } else if (!isValidOperatorDecision(input.operator_decision)) {
    refusalReasons.push("operator_decision_invalid");
  }
  refusalReasons.push(...validateReviewBasis(input.review_basis));
  refusalReasons.push(...validateDecisionShape(input, sourceHandoffPlan));
  refusalReasons.push(...validateRequiredBlockedActions(input.blocked_actions));
  refusalReasons.push(...validateRawMaterialBoundary(input));
  return [...new Set(refusalReasons)];
}

type NormalizedDecisionInput = {
  scope: "project:augnes";
  source_plan: AutohuntHandoffPlanPreview;
  source_handoff_plan: AutohuntHandoffPlanOperatorReviewDecisionSourceHandoffPlan;
  operator_decision: AutohuntHandoffPlanOperatorDecision;
  decision_status:
    | "accepted_for_future_supervised_handoff_copy_export_planning"
    | "deferred"
    | "rejected";
  review_basis: AutohuntHandoffPlanOperatorReviewDecisionReviewBasis;
  accepted_summary: AutohuntHandoffPlanOperatorReviewDecisionAcceptedSummary | null;
  defer_or_reject_summary:
    | AutohuntHandoffPlanOperatorReviewDecisionDeferOrRejectSummary
    | null;
  source_chain_validation: AutohuntHandoffPlanOperatorReviewDecisionSourceChainValidation;
  blocked_actions: string[];
  authority_boundary: ReturnType<
    typeof buildAutohuntHandoffPlanPreviewAuthorityBoundary
  >;
  persisted_material_boundary: AutohuntHandoffPlanOperatorReviewDecisionPersistedMaterialBoundary;
};

function normalizeDecisionInput(
  input: AutohuntHandoffPlanOperatorReviewDecisionInput,
  sourceHandoffPlan: AutohuntHandoffPlanPreview,
): NormalizedDecisionInput {
  const operatorDecision =
    input.operator_decision as AutohuntHandoffPlanOperatorDecision;
  const acceptedSummary =
    operatorDecision ===
    "accept_handoff_plan_for_future_supervised_copy_export_planning"
      ? normalizeAcceptedSummary(input.accepted_summary)
      : null;
  const deferOrRejectSummary =
    operatorDecision === "defer_handoff_plan_review" ||
    operatorDecision === "reject_handoff_plan_review"
      ? normalizeDeferOrRejectSummary(input.defer_or_reject_summary)
      : null;

  return {
    scope: "project:augnes",
    source_plan: sourceHandoffPlan,
    source_handoff_plan: summarizeSourceHandoffPlan(sourceHandoffPlan),
    operator_decision: operatorDecision,
    decision_status: decisionStatusForOperatorDecision(operatorDecision),
    review_basis:
      input.review_basis as AutohuntHandoffPlanOperatorReviewDecisionReviewBasis,
    accepted_summary: acceptedSummary,
    defer_or_reject_summary: deferOrRejectSummary,
    source_chain_validation: buildSourceChainValidation({
      sourceHandoffPlan,
      operatorDecision,
    }),
    blocked_actions: normalizeBlockedActions(input.blocked_actions),
    authority_boundary: buildAutohuntHandoffPlanPreviewAuthorityBoundary(),
    persisted_material_boundary: createPersistedMaterialBoundary(),
  };
}

function buildDecisionRecord({
  input,
  validation,
  idempotencyKey,
  createdAt,
  rowCountWriteSummary,
}: {
  input: NormalizedDecisionInput;
  validation: AutohuntHandoffPlanOperatorReviewDecisionValidation;
  idempotencyKey: string;
  createdAt: string;
  rowCountWriteSummary: AutohuntHandoffPlanOperatorReviewDecisionRowCountWriteSummary;
}): AutohuntHandoffPlanOperatorReviewDecision {
  const decisionId = `autohunt-handoff-plan-operator-review-decision:${stripFingerprintPrefix(
    idempotencyKey,
  )}`;
  const decisionWithoutFingerprint: Omit<
    AutohuntHandoffPlanOperatorReviewDecision,
    "decision_fingerprint"
  > = {
    decision_kind: AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_KIND,
    decision_version: AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_VERSION,
    decision_id: decisionId,
    scope: input.scope,
    created_at: createdAt,
    decision_status: input.decision_status,
    operator_decision: input.operator_decision,
    source_handoff_plan: input.source_handoff_plan,
    review_basis: input.review_basis,
    accepted_summary: input.accepted_summary,
    defer_or_reject_summary: input.defer_or_reject_summary,
    source_chain_validation: input.source_chain_validation,
    blocked_actions: [
      ...AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_BLOCKED_ACTIONS,
    ],
    next_allowed_outputs: [
      ...AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_NEXT_ALLOWED_OUTPUTS,
    ],
    forbidden_outputs: [
      ...AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_FORBIDDEN_OUTPUTS,
    ],
    authority_boundary: input.authority_boundary,
    persisted_material_boundary: input.persisted_material_boundary,
    validation,
    row_count_write_summary: rowCountWriteSummary,
    idempotency_key: idempotencyKey,
  };

  return {
    ...decisionWithoutFingerprint,
    decision_fingerprint:
      computeAutohuntHandoffPlanOperatorReviewDecisionFingerprint(
        decisionWithoutFingerprint,
      ),
  };
}

function insertDecisionRecord(
  db: AutonomyDelegationGrantDbLike,
  decision: AutohuntHandoffPlanOperatorReviewDecision,
) {
  db.prepare(
    `
      INSERT INTO ${AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_TABLE} (
        decision_id,
        created_at,
        scope,
        decision_status,
        operator_decision,
        source_handoff_plan_id,
        source_handoff_plan_fingerprint,
        source_handoff_plan_status,
        source_grant_id,
        source_grant_fingerprint,
        source_preflight_packet_id,
        source_preflight_packet_fingerprint,
        source_workbench_spine_fingerprint,
        selected_candidate_ids_json,
        selected_candidate_fingerprints_json,
        review_basis_ref,
        reviewed_by,
        reviewed_at,
        review_basis_fingerprint,
        idempotency_key,
        accepted_summary_json,
        defer_or_reject_summary_json,
        source_chain_validation_json,
        blocked_actions_json,
        next_allowed_outputs_json,
        forbidden_outputs_json,
        authority_boundary_json,
        persisted_material_boundary_json,
        validation_json,
        row_count_write_summary_json,
        decision_fingerprint
      )
      VALUES (
        @decision_id,
        @created_at,
        @scope,
        @decision_status,
        @operator_decision,
        @source_handoff_plan_id,
        @source_handoff_plan_fingerprint,
        @source_handoff_plan_status,
        @source_grant_id,
        @source_grant_fingerprint,
        @source_preflight_packet_id,
        @source_preflight_packet_fingerprint,
        @source_workbench_spine_fingerprint,
        @selected_candidate_ids_json,
        @selected_candidate_fingerprints_json,
        @review_basis_ref,
        @reviewed_by,
        @reviewed_at,
        @review_basis_fingerprint,
        @idempotency_key,
        @accepted_summary_json,
        @defer_or_reject_summary_json,
        @source_chain_validation_json,
        @blocked_actions_json,
        @next_allowed_outputs_json,
        @forbidden_outputs_json,
        @authority_boundary_json,
        @persisted_material_boundary_json,
        @validation_json,
        @row_count_write_summary_json,
        @decision_fingerprint
      )
    `,
  ).run({
    decision_id: decision.decision_id,
    created_at: decision.created_at,
    scope: decision.scope,
    decision_status: decision.decision_status,
    operator_decision: decision.operator_decision,
    source_handoff_plan_id:
      decision.source_handoff_plan.handoff_plan_id,
    source_handoff_plan_fingerprint:
      decision.source_handoff_plan.handoff_plan_fingerprint,
    source_handoff_plan_status:
      decision.source_handoff_plan.handoff_plan_status,
    source_grant_id: decision.source_handoff_plan.source_grant_id,
    source_grant_fingerprint:
      decision.source_handoff_plan.source_grant_fingerprint,
    source_preflight_packet_id:
      decision.source_handoff_plan.source_preflight_packet_id,
    source_preflight_packet_fingerprint:
      decision.source_handoff_plan.source_preflight_packet_fingerprint,
    source_workbench_spine_fingerprint:
      decision.source_handoff_plan.source_workbench_spine_fingerprint,
    selected_candidate_ids_json: stableJson(
      decision.source_handoff_plan.selected_candidate_ids,
    ),
    selected_candidate_fingerprints_json: stableJson(
      decision.source_handoff_plan.selected_candidate_fingerprints,
    ),
    review_basis_ref: decision.review_basis.review_basis_ref,
    reviewed_by: decision.review_basis.reviewed_by ?? null,
    reviewed_at: decision.review_basis.reviewed_at ?? null,
    review_basis_fingerprint: decision.review_basis.review_basis_fingerprint,
    idempotency_key: decision.idempotency_key,
    accepted_summary_json: decision.accepted_summary
      ? stableJson(decision.accepted_summary)
      : null,
    defer_or_reject_summary_json: decision.defer_or_reject_summary
      ? stableJson(decision.defer_or_reject_summary)
      : null,
    source_chain_validation_json: stableJson(
      decision.source_chain_validation,
    ),
    blocked_actions_json: stableJson(decision.blocked_actions),
    next_allowed_outputs_json: stableJson(decision.next_allowed_outputs),
    forbidden_outputs_json: stableJson(decision.forbidden_outputs),
    authority_boundary_json: stableJson(decision.authority_boundary),
    persisted_material_boundary_json: stableJson(
      decision.persisted_material_boundary,
    ),
    validation_json: stableJson(decision.validation),
    row_count_write_summary_json: stableJson(
      decision.row_count_write_summary,
    ),
    decision_fingerprint: decision.decision_fingerprint,
  });
}

function buildDecisionValidation(
  input: NormalizedDecisionInput,
): AutohuntHandoffPlanOperatorReviewDecisionValidation {
  const reviewBasisPresent = validateReviewBasis(input.review_basis).length === 0;
  const reviewBasisSafe = input.review_basis.raw_review_note_persisted === false;
  const acceptedSummaryValid =
    input.operator_decision ===
    "accept_handoff_plan_for_future_supervised_copy_export_planning"
      ? validateAcceptedSummary(input.accepted_summary, input.source_plan)
          .length === 0
      : input.accepted_summary === null;
  const deferOrRejectSummaryValid =
    input.operator_decision === "defer_handoff_plan_review" ||
    input.operator_decision === "reject_handoff_plan_review"
      ? validateDeferOrRejectSummary(input.defer_or_reject_summary).length === 0
      : input.defer_or_reject_summary === null;
  const requiredBlockedActionsPresent =
    validateRequiredBlockedActions(input.blocked_actions).length === 0;
  const authorityBoundaryAllFalse = assertAllFalseBoundary(
    input.authority_boundary,
    "autohunt_handoff_plan_operator_review_decision_authority_boundary",
  ).passed;
  const persistedMaterialBoundarySafe =
    input.persisted_material_boundary.persists_source_fingerprints === true &&
    input.persisted_material_boundary.persists_operator_decision === true &&
    input.persisted_material_boundary.persists_raw_review_note === false &&
    input.persisted_material_boundary.persists_raw_reason_text === false &&
    input.persisted_material_boundary.persists_raw_prompt_text === false &&
    input.persisted_material_boundary.persists_raw_pr_body === false &&
    input.persisted_material_boundary.persists_raw_source_payload === false &&
    input.persisted_material_boundary.persists_secret_or_token === false &&
    input.persisted_material_boundary.persists_url_or_env_value === false;
  const rawMaterialAbsent = true;
  const passed =
    input.source_chain_validation.passed &&
    reviewBasisPresent &&
    reviewBasisSafe &&
    acceptedSummaryValid &&
    deferOrRejectSummaryValid &&
    requiredBlockedActionsPresent &&
    authorityBoundaryAllFalse &&
    persistedMaterialBoundarySafe &&
    rawMaterialAbsent;

  return {
    passed,
    fingerprint_algorithm: FINGERPRINT_ALGORITHM,
    source_chain_validation_passed: input.source_chain_validation.passed,
    review_basis_present: reviewBasisPresent,
    review_basis_safe: reviewBasisSafe,
    accepted_summary_valid: acceptedSummaryValid,
    defer_or_reject_summary_valid: deferOrRejectSummaryValid,
    required_blocked_actions_present: requiredBlockedActionsPresent,
    authority_boundary_all_false: authorityBoundaryAllFalse,
    persisted_material_boundary_safe: persistedMaterialBoundarySafe,
    raw_material_absent: rawMaterialAbsent,
    target_only_write_proven: true,
  };
}

function buildSourceChainValidation({
  sourceHandoffPlan,
  operatorDecision,
}: {
  sourceHandoffPlan: AutohuntHandoffPlanPreview;
  operatorDecision: AutohuntHandoffPlanOperatorDecision;
}): AutohuntHandoffPlanOperatorReviewDecisionSourceChainValidation {
  const handoffPlanReady =
    sourceHandoffPlan.handoff_plan_status === "ready_for_operator_review";
  const handoffPlanFingerprintVerified =
    sourceHandoffPlan.handoff_plan_fingerprint ===
    computeAutohuntHandoffPlanPreviewFingerprint(sourceHandoffPlan);
  const sourceGrantBindingPresent = requiredStringFieldsPresent(
    {
      source_grant_id: sourceHandoffPlan.source_grant.grant_id,
      source_grant_fingerprint:
        sourceHandoffPlan.source_grant.grant_fingerprint,
    },
    ["source_grant_id", "source_grant_fingerprint"],
  ).passed;
  const sourcePreflightBindingPresent = requiredStringFieldsPresent(
    {
      source_preflight_packet_id:
        sourceHandoffPlan.source_preflight.preflight_packet_id,
      source_preflight_packet_fingerprint:
        sourceHandoffPlan.source_preflight.preflight_packet_fingerprint,
    },
    ["source_preflight_packet_id", "source_preflight_packet_fingerprint"],
  ).passed;
  const sourceWorkbenchSpineBindingPresent = requiredStringFieldsPresent(
    {
      source_workbench_spine_fingerprint:
        sourceHandoffPlan.source_workbench_spine.spine_fingerprint,
    },
    ["source_workbench_spine_fingerprint"],
  ).passed;
  const selectedCandidateBindingPresent =
    validateSourceBindingPairs([
      {
        field: "selected_candidate_ids",
        expected: stableJson(
          sourceHandoffPlan.source_preflight.selected_candidate_ids,
        ),
        actual: stableJson(
          sourceHandoffPlan.source_workbench_spine.chain_binding_summary
            .selected_candidate_ids,
        ),
        reason: "selected_candidate_ids_mismatch",
      },
      {
        field: "selected_candidate_fingerprints",
        expected: stableJson(
          sourceHandoffPlan.source_preflight.selected_candidate_fingerprints,
        ),
        actual: stableJson(
          sourceHandoffPlan.source_workbench_spine.chain_binding_summary
            .selected_candidate_fingerprints,
        ),
        reason: "selected_candidate_fingerprints_mismatch",
      },
    ]).passed &&
    sourceHandoffPlan.source_preflight.selected_candidate_ids.length > 0 &&
    sourceHandoffPlan.source_preflight.selected_candidate_fingerprints.length > 0;
  const operatorDecisionPresent = isValidOperatorDecision(operatorDecision);

  const blockerReasons = [
    !handoffPlanReady ? "source_handoff_plan_not_ready" : null,
    !handoffPlanFingerprintVerified
      ? "source_handoff_plan_fingerprint_mismatch"
      : null,
    !sourceGrantBindingPresent ? "source_grant_binding_missing" : null,
    !sourcePreflightBindingPresent ? "source_preflight_binding_missing" : null,
    !sourceWorkbenchSpineBindingPresent
      ? "source_workbench_spine_binding_missing"
      : null,
    !selectedCandidateBindingPresent
      ? "selected_candidate_binding_missing_or_mismatch"
      : null,
    !operatorDecisionPresent ? "operator_decision_missing" : null,
  ].filter((reason): reason is string => Boolean(reason));

  return {
    handoff_plan_ready: handoffPlanReady,
    handoff_plan_fingerprint_verified: handoffPlanFingerprintVerified,
    source_grant_binding_present: sourceGrantBindingPresent,
    source_preflight_binding_present: sourcePreflightBindingPresent,
    source_workbench_spine_binding_present: sourceWorkbenchSpineBindingPresent,
    selected_candidate_binding_present: selectedCandidateBindingPresent,
    operator_decision_present: operatorDecisionPresent,
    passed: blockerReasons.length === 0,
    blocker_reasons: blockerReasons,
    warning_reasons: [],
  };
}

function validateSourceHandoffPlan(plan: AutohuntHandoffPlanPreview) {
  const validation = buildSourceChainValidation({
    sourceHandoffPlan: plan,
    operatorDecision:
      "accept_handoff_plan_for_future_supervised_copy_export_planning",
  });
  return validation.blocker_reasons.filter(
    (reason) => reason !== "operator_decision_missing",
  );
}

function validateReviewBasis(
  reviewBasis:
    | AutohuntHandoffPlanOperatorReviewDecisionReviewBasis
    | null
    | undefined,
) {
  const refusalReasons: string[] = [];
  if (!reviewBasis || typeof reviewBasis !== "object") {
    return ["review_basis_missing"];
  }
  const required = requiredStringFieldsPresent(
    {
      review_basis_ref: reviewBasis.review_basis_ref,
      review_basis_fingerprint: reviewBasis.review_basis_fingerprint,
    },
    ["review_basis_ref", "review_basis_fingerprint"],
  );
  for (const field of required.missing_fields) {
    refusalReasons.push(`${field}_missing`);
  }
  if (reviewBasis.raw_review_note_persisted !== false) {
    refusalReasons.push("raw_review_note_persisted_must_be_false");
  }
  return refusalReasons;
}

function validateDecisionShape(
  input: AutohuntHandoffPlanOperatorReviewDecisionInput,
  sourcePlan: AutohuntHandoffPlanPreview | null,
) {
  if (!isValidOperatorDecision(input.operator_decision)) return [];
  if (
    input.operator_decision ===
    "accept_handoff_plan_for_future_supervised_copy_export_planning"
  ) {
    return [
      ...validateAcceptedSummary(input.accepted_summary, sourcePlan),
      ...(input.defer_or_reject_summary
        ? ["accept_decision_must_not_include_defer_or_reject_summary"]
        : []),
    ];
  }
  if (
    input.operator_decision === "defer_handoff_plan_review" ||
    input.operator_decision === "reject_handoff_plan_review"
  ) {
    return [
      ...validateDeferOrRejectSummary(input.defer_or_reject_summary),
      ...(input.accepted_summary
        ? ["defer_or_reject_decision_must_not_include_accepted_summary"]
        : []),
    ];
  }
  return [];
}

function validateAcceptedSummary(
  acceptedSummary:
    | AutohuntHandoffPlanOperatorReviewDecisionAcceptedSummary
    | null
    | undefined,
  sourcePlan: AutohuntHandoffPlanPreview | null,
) {
  if (!acceptedSummary || typeof acceptedSummary !== "object") {
    return ["accepted_summary_missing"];
  }
  const refusalReasons: string[] = [];
  if (
    acceptedSummary.approval_scope !==
    "future_supervised_handoff_copy_export_planning_only"
  ) {
    refusalReasons.push("accepted_summary_approval_scope_invalid");
  }
  if (!sourcePlan) return refusalReasons;
  if (acceptedSummary.handoff_plan_id !== sourcePlan.handoff_plan_id) {
    refusalReasons.push("accepted_summary_handoff_plan_id_mismatch");
  }
  if (
    acceptedSummary.handoff_plan_fingerprint !==
    sourcePlan.handoff_plan_fingerprint
  ) {
    refusalReasons.push("accepted_summary_handoff_plan_fingerprint_mismatch");
  }
  if (
    acceptedSummary.prompt_plan_id !==
    sourcePlan.supervised_codex_prompt_plan.prompt_plan_id
  ) {
    refusalReasons.push("accepted_summary_prompt_plan_id_mismatch");
  }
  if (
    acceptedSummary.review_packet_id !==
    sourcePlan.operator_review_packet.review_packet_id
  ) {
    refusalReasons.push("accepted_summary_review_packet_id_mismatch");
  }
  if (
    acceptedSummary.selected_candidate_count !==
    sourcePlan.selected_candidate_plan_summaries.length
  ) {
    refusalReasons.push("accepted_summary_selected_candidate_count_mismatch");
  }
  if (!Array.isArray(acceptedSummary.required_checks) || acceptedSummary.required_checks.length === 0) {
    refusalReasons.push("accepted_summary_required_checks_missing");
  }
  if (
    stableJson(uniqueStrings(acceptedSummary.required_checks)) !==
    stableJson(uniqueStrings(sourcePlan.draft_pr_plan.checks_to_run))
  ) {
    refusalReasons.push("accepted_summary_required_checks_mismatch");
  }
  if (
    stableJson(uniqueStrings(acceptedSummary.expected_changed_file_globs)) !==
    stableJson(uniqueStrings(sourcePlan.draft_pr_plan.expected_changed_file_globs))
  ) {
    refusalReasons.push("accepted_summary_expected_changed_file_globs_mismatch");
  }
  if (acceptedSummary.max_changed_files !== sourcePlan.draft_pr_plan.max_changed_files) {
    refusalReasons.push("accepted_summary_max_changed_files_mismatch");
  }
  return refusalReasons;
}

function validateDeferOrRejectSummary(
  summary:
    | AutohuntHandoffPlanOperatorReviewDecisionDeferOrRejectSummary
    | null
    | undefined,
) {
  if (!summary || typeof summary !== "object") {
    return ["defer_or_reject_summary_missing"];
  }
  const refusalReasons: string[] = [];
  const required = requiredStringFieldsPresent(
    {
      reason_code: summary.reason_code,
      reason_fingerprint: summary.reason_fingerprint,
    },
    ["reason_code", "reason_fingerprint"],
  );
  for (const field of required.missing_fields) {
    refusalReasons.push(`${field}_missing`);
  }
  if (summary.raw_reason_text_persisted !== false) {
    refusalReasons.push("raw_reason_text_persisted_must_be_false");
  }
  return refusalReasons;
}

function validateRequiredBlockedActions(blockedActionsInput?: readonly string[]) {
  const blockedActions = normalizeStringArray(
    blockedActionsInput ??
      AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_BLOCKED_ACTIONS,
  );
  return AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_BLOCKED_ACTIONS.filter(
    (action) => !blockedActions.includes(action),
  ).map((action) => `blocked_action_missing_${action}`);
}

function validateRawMaterialBoundary(
  input: AutohuntHandoffPlanOperatorReviewDecisionInput,
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

function computeIdempotencyKey(input: NormalizedDecisionInput) {
  return buildDeterministicIdempotencyKey({
    kind: AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_KIND,
    version: AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_VERSION,
    source: {
      source_handoff_plan_fingerprint:
        input.source_handoff_plan.handoff_plan_fingerprint,
      operator_decision: input.operator_decision,
      review_basis_ref: input.review_basis.review_basis_ref,
      review_basis_fingerprint: input.review_basis.review_basis_fingerprint,
      reason_fingerprint:
        input.defer_or_reject_summary?.reason_fingerprint ?? null,
    },
  });
}

function refusalReasonsFromValidation(
  validation: AutohuntHandoffPlanOperatorReviewDecisionValidation,
) {
  return [
    !validation.source_chain_validation_passed ? "source_chain_mismatch" : null,
    !validation.review_basis_present ? "review_basis_missing" : null,
    !validation.review_basis_safe ? "review_basis_unsafe" : null,
    !validation.accepted_summary_valid ? "accepted_summary_invalid" : null,
    !validation.defer_or_reject_summary_valid
      ? "defer_or_reject_summary_invalid"
      : null,
    !validation.required_blocked_actions_present
      ? "required_blocked_actions_missing"
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

function summarizeSourceHandoffPlan(
  plan: AutohuntHandoffPlanPreview,
): AutohuntHandoffPlanOperatorReviewDecisionSourceHandoffPlan {
  return {
    handoff_plan_id: plan.handoff_plan_id,
    handoff_plan_fingerprint: plan.handoff_plan_fingerprint,
    handoff_plan_status: plan.handoff_plan_status,
    source_grant_id: plan.source_grant.grant_id,
    source_grant_fingerprint: plan.source_grant.grant_fingerprint,
    source_preflight_packet_id: plan.source_preflight.preflight_packet_id,
    source_preflight_packet_fingerprint:
      plan.source_preflight.preflight_packet_fingerprint,
    source_workbench_spine_fingerprint:
      plan.source_workbench_spine.spine_fingerprint,
    selected_candidate_ids: uniqueStrings(
      plan.source_preflight.selected_candidate_ids,
    ),
    selected_candidate_fingerprints: uniqueStrings(
      plan.source_preflight.selected_candidate_fingerprints,
    ),
  };
}

function normalizeAcceptedSummary(
  acceptedSummary:
    | AutohuntHandoffPlanOperatorReviewDecisionAcceptedSummary
    | null
    | undefined,
) {
  if (!acceptedSummary) return null;
  return {
    ...acceptedSummary,
    required_checks: uniqueStrings(acceptedSummary.required_checks),
    expected_changed_file_globs: uniqueStrings(
      acceptedSummary.expected_changed_file_globs,
    ),
  };
}

function normalizeDeferOrRejectSummary(
  summary:
    | AutohuntHandoffPlanOperatorReviewDecisionDeferOrRejectSummary
    | null
    | undefined,
) {
  if (!summary) return null;
  return {
    reason_code: summary.reason_code,
    reason_fingerprint: summary.reason_fingerprint,
    raw_reason_text_persisted: false as const,
  };
}

function decisionStatusForOperatorDecision(
  operatorDecision: AutohuntHandoffPlanOperatorDecision,
) {
  if (
    operatorDecision ===
    "accept_handoff_plan_for_future_supervised_copy_export_planning"
  ) {
    return "accepted_for_future_supervised_handoff_copy_export_planning";
  }
  if (operatorDecision === "defer_handoff_plan_review") return "deferred";
  return "rejected";
}

function createPersistedMaterialBoundary(): AutohuntHandoffPlanOperatorReviewDecisionPersistedMaterialBoundary {
  return {
    persists_source_fingerprints: true,
    persists_operator_decision: true,
    persists_raw_review_note: false,
    persists_raw_reason_text: false,
    persists_raw_prompt_text: false,
    persists_raw_pr_body: false,
    persists_raw_source_payload: false,
    persists_secret_or_token: false,
    persists_url_or_env_value: false,
  };
}

function normalizeBlockedActions(actions?: readonly string[]) {
  return uniqueStrings([
    ...(actions ?? []),
    ...AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_BLOCKED_ACTIONS,
  ]);
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
}): AutohuntHandoffPlanOperatorReviewDecisionRowCountWriteSummary {
  return summarizeTargetOnlyRowCountWrite({
    targetTable: AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_TABLE,
    tableNames: TARGET_AND_NON_TARGET_TABLES,
    beforeCounts,
    afterCounts,
    expectedTargetDelta: 1,
  }) as AutohuntHandoffPlanOperatorReviewDecisionRowCountWriteSummary;
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

function isValidOperatorDecision(
  value: unknown,
): value is AutohuntHandoffPlanOperatorDecision {
  return (
    typeof value === "string" &&
    (AUTOHUNT_HANDOFF_PLAN_OPERATOR_DECISIONS as readonly string[]).includes(
      value,
    )
  );
}

function extractSourceHandoffPlan(
  source: AutohuntHandoffPlanOperatorReviewDecisionInput["source_handoff_plan"],
): AutohuntHandoffPlanPreview | null {
  if (!source || typeof source !== "object") return null;
  if (
    "handoff_plan_kind" in source &&
    source.handoff_plan_kind === "autohunt_handoff_plan_preview"
  ) {
    return source as AutohuntHandoffPlanPreview;
  }
  if ("selected_handoff_plan" in source || "latest_ready_handoff_plan" in source) {
    const readback = source as AutohuntHandoffPlanPreviewReadback;
    if (
      readback.selected_handoff_plan?.handoff_plan_status ===
      "ready_for_operator_review"
    ) {
      return readback.selected_handoff_plan;
    }
    return readback.latest_ready_handoff_plan ?? null;
  }
  return null;
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
  decision,
  decision_record_written,
  duplicate_replayed,
}: {
  result_status: "written" | "duplicate_replayed";
  decision: AutohuntHandoffPlanOperatorReviewDecision;
  decision_record_written: boolean;
  duplicate_replayed: boolean;
}): AutohuntHandoffPlanOperatorReviewDecisionWriteResult {
  return {
    ok: true,
    result_status,
    refusal_reasons: [],
    decision,
    duplicate_replayed,
    decision_record_written,
    row_count_write_summary: decision.row_count_write_summary,
    ...createNoRunAuthorityFlags(),
    raw_material_persisted: false,
  };
}

function createRefusedResult(
  refusalReasons: string[],
): AutohuntHandoffPlanOperatorReviewDecisionWriteResult {
  return {
    ok: false,
    result_status: "refused",
    refusal_reasons: [...new Set(refusalReasons.length > 0 ? refusalReasons : ["refused"])],
    decision: null,
    duplicate_replayed: false,
    decision_record_written: false,
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
