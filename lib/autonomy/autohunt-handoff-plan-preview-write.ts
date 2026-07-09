import { openDatabase } from "@/lib/db";
import type { AutonomyDelegationGrantDbLike } from "@/lib/autonomy/read-autonomy-delegation-grants";
import {
  buildAutohuntHandoffPlanPreviewAuthorityBoundary,
  computeAutohuntHandoffPlanPreviewFingerprint,
  ensureAutohuntHandoffPlanPreviewSchema,
  parseAutohuntHandoffPlanPreviewRow,
} from "@/lib/autonomy/read-autohunt-handoff-plan-previews";
import { computeAutohuntPreflightPacketFingerprint } from "@/lib/autonomy/read-autohunt-preflight-packets";
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
  validateSourceBindingPairs,
} from "@/lib/research-candidate-review/shared-source-chain-guards";
import { AUTONOMY_DELEGATION_GRANT_TABLE } from "@/types/autonomy-delegation-grant";
import { AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE } from "@/types/autohunt-work-queue-candidate";
import {
  AUTOHUNT_PREFLIGHT_PACKET_TABLE,
  type AutohuntPreflightPacket,
  type AutohuntPreflightPacketReadback,
  type AutohuntPreflightPacketSelectedCandidateSummary,
} from "@/types/autohunt-preflight-packet";
import {
  AUTOHUNT_HANDOFF_PLAN_PREVIEW_BLOCKED_ACTIONS,
  AUTOHUNT_HANDOFF_PLAN_PREVIEW_FORBIDDEN_OUTPUTS,
  AUTOHUNT_HANDOFF_PLAN_PREVIEW_KIND,
  AUTOHUNT_HANDOFF_PLAN_PREVIEW_NEXT_ALLOWED_OUTPUTS,
  AUTOHUNT_HANDOFF_PLAN_PREVIEW_TABLE,
  AUTOHUNT_HANDOFF_PLAN_PREVIEW_VERSION,
  type AutohuntHandoffPlanPreview,
  type AutohuntHandoffPlanPreviewBlockedAction,
  type AutohuntHandoffPlanPreviewCandidateSummary,
  type AutohuntHandoffPlanPreviewDraftPrPlan,
  type AutohuntHandoffPlanPreviewInput,
  type AutohuntHandoffPlanPreviewOperatorReviewPacket,
  type AutohuntHandoffPlanPreviewPersistedMaterialBoundary,
  type AutohuntHandoffPlanPreviewRowCountWriteSummary,
  type AutohuntHandoffPlanPreviewSourceGrant,
  type AutohuntHandoffPlanPreviewSourcePreflight,
  type AutohuntHandoffPlanPreviewSourceWorkbenchSpine,
  type AutohuntHandoffPlanPreviewSupervisedPromptPlan,
  type AutohuntHandoffPlanPreviewValidation,
  type AutohuntHandoffPlanPreviewWriteResult,
} from "@/types/autohunt-handoff-plan-preview";
import type { AutohuntWorkbenchReadbackSpine } from "@/types/autohunt-workbench-readback-spine";
import { RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_PROTECTED_ROW_COUNT_TABLES } from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-result";

export interface WriteAutohuntHandoffPlanPreviewOptions {
  db?: AutonomyDelegationGrantDbLike;
  now?: string;
}

type RowCountSnapshot = Record<string, number>;

const NON_TARGET_ROW_COUNT_TABLES = [
  AUTONOMY_DELEGATION_GRANT_TABLE,
  AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE,
  AUTOHUNT_PREFLIGHT_PACKET_TABLE,
  ...RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_PROTECTED_ROW_COUNT_TABLES,
] as const;

const TARGET_AND_NON_TARGET_TABLES = [
  AUTOHUNT_HANDOFF_PLAN_PREVIEW_TABLE,
  ...NON_TARGET_ROW_COUNT_TABLES,
] as const;

const SAFE_RAW_MATERIAL_BOUNDARY_KEYS = new Set([
  "raw_material_absent",
  "raw_material_persisted",
  "raw_material_persistence_checked",
  "raw_approval_text_persisted",
  "raw_prompt_text_persisted",
  "raw_pr_body_persisted",
  "raw_operator_note_persisted",
  "persists_raw_user_approval_text",
  "persists_raw_prompt",
  "persists_raw_prompt_text",
  "persists_raw_pr_body",
  "persists_raw_operator_note",
  "persists_raw_source_payload",
  "persists_secret_or_token",
  "persists_url_or_env_value",
]);

export function writeAutohuntHandoffPlanPreview(
  input: AutohuntHandoffPlanPreviewInput,
  options: WriteAutohuntHandoffPlanPreviewOptions = {},
): AutohuntHandoffPlanPreviewWriteResult {
  const sourcePreflight = extractSourcePreflight(input.source_preflight);
  const sourceWorkbenchSpine = input.source_workbench_spine ?? null;
  const validationRefusalReasons = validateAutohuntHandoffPlanPreviewInput(
    input,
    sourcePreflight,
    sourceWorkbenchSpine,
  );
  if (validationRefusalReasons.length > 0 || !sourcePreflight || !sourceWorkbenchSpine) {
    return createRefusedResult(validationRefusalReasons);
  }

  const normalizedInput = normalizeHandoffPlanInput({
    input,
    sourcePreflight,
    sourceWorkbenchSpine,
  });
  const validation = buildHandoffPlanValidation(normalizedInput);
  if (!validation.passed) {
    return createRefusedResult(refusalReasonsFromValidation(validation));
  }

  const promptPlanFingerprint = fingerprint(
    normalizedInput.supervised_codex_prompt_plan,
  );
  const draftPrPlanFingerprint = fingerprint(normalizedInput.draft_pr_plan);
  const idempotencyKey = computeIdempotencyKey({
    input: normalizedInput,
    promptPlanFingerprint,
    draftPrPlanFingerprint,
  });
  const db = options.db ?? openDatabase();
  const shouldClose = !options.db && hasClose(db);

  try {
    ensureAutohuntHandoffPlanPreviewSchema(db);
    const existingRow = db
      .prepare(
        `
          SELECT *
          FROM ${AUTOHUNT_HANDOFF_PLAN_PREVIEW_TABLE}
          WHERE idempotency_key = ?
        `,
      )
      .get(idempotencyKey);

    if (existingRow) {
      const existingPlan = parseAutohuntHandoffPlanPreviewRow(
        existingRow as never,
      );
      if (
        existingPlan &&
        existingPlan.handoff_plan_fingerprint ===
          computeAutohuntHandoffPlanPreviewFingerprint(existingPlan)
      ) {
        return createAcceptedResult({
          result_status: "duplicate_replayed",
          handoff_plan: existingPlan,
          handoff_plan_record_written: false,
          duplicate_replayed: true,
        });
      }
      return createRefusedResult([
        "idempotency_conflict_existing_handoff_plan_fingerprint_mismatch",
      ]);
    }

    db.exec("BEGIN IMMEDIATE");
    try {
      const beforeCounts = captureRowCounts(db);
      const expectedWriteSummary = buildRowCountWriteSummary({
        beforeCounts,
        afterCounts: {
          ...beforeCounts,
          [AUTOHUNT_HANDOFF_PLAN_PREVIEW_TABLE]:
            beforeCounts[AUTOHUNT_HANDOFF_PLAN_PREVIEW_TABLE] + 1,
        },
      });
      const handoffPlan = buildHandoffPlanPreview({
        input: normalizedInput,
        validation,
        idempotencyKey,
        createdAt: options.now ?? new Date().toISOString(),
        rowCountWriteSummary: expectedWriteSummary,
      });

      insertHandoffPlanPreview(db, handoffPlan);

      const afterCounts = captureRowCounts(db);
      const actualWriteSummary = buildRowCountWriteSummary({
        beforeCounts,
        afterCounts,
      });
      if (!isTargetOnlyWrite(actualWriteSummary)) {
        db.exec("ROLLBACK");
        return createRefusedResult([
          "target_only_autohunt_handoff_plan_preview_row_count_proof_failed",
        ]);
      }

      db.exec("COMMIT");
      return createAcceptedResult({
        result_status: "written",
        handoff_plan: handoffPlan,
        handoff_plan_record_written: true,
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

export function validateAutohuntHandoffPlanPreviewInput(
  input: AutohuntHandoffPlanPreviewInput,
  sourcePreflight: AutohuntPreflightPacket | null = extractSourcePreflight(
    input.source_preflight,
  ),
  sourceWorkbenchSpine: AutohuntWorkbenchReadbackSpine | null =
    input.source_workbench_spine ?? null,
): string[] {
  const refusalReasons: string[] = [];
  if (input.scope !== "project:augnes") {
    refusalReasons.push("scope_invalid");
  }
  if (!sourcePreflight) {
    refusalReasons.push("source_preflight_missing_or_not_full_record");
  }
  if (!sourceWorkbenchSpine) {
    refusalReasons.push("source_workbench_spine_missing");
  }
  if (sourcePreflight) {
    refusalReasons.push(...validateSourcePreflight(sourcePreflight));
  }
  if (sourceWorkbenchSpine) {
    refusalReasons.push(...validateSourceWorkbenchSpine(sourceWorkbenchSpine));
  }
  refusalReasons.push(...validateRequiredBlockedActions(input.blocked_actions));
  refusalReasons.push(...validateRawMaterialBoundary(input));
  return [...new Set(refusalReasons)];
}

function buildHandoffPlanPreview({
  input,
  validation,
  idempotencyKey,
  createdAt,
  rowCountWriteSummary,
}: {
  input: NormalizedAutohuntHandoffPlanPreviewInput;
  validation: AutohuntHandoffPlanPreviewValidation;
  idempotencyKey: string;
  createdAt: string;
  rowCountWriteSummary: AutohuntHandoffPlanPreviewRowCountWriteSummary;
}): AutohuntHandoffPlanPreview {
  const handoffPlanId = `autohunt-handoff-plan-preview:${stripFingerprintPrefix(
    idempotencyKey,
  )}`;
  const planWithoutFingerprint: Omit<
    AutohuntHandoffPlanPreview,
    "handoff_plan_fingerprint"
  > = {
    handoff_plan_kind: AUTOHUNT_HANDOFF_PLAN_PREVIEW_KIND,
    handoff_plan_version: AUTOHUNT_HANDOFF_PLAN_PREVIEW_VERSION,
    handoff_plan_id: handoffPlanId,
    scope: input.scope,
    created_at: createdAt,
    handoff_plan_status: "ready_for_operator_review",
    source_grant: input.source_grant,
    source_preflight: input.source_preflight,
    source_workbench_spine: input.source_workbench_spine,
    selected_candidate_plan_summaries: input.selected_candidate_plan_summaries,
    supervised_codex_prompt_plan: input.supervised_codex_prompt_plan,
    draft_pr_plan: input.draft_pr_plan,
    operator_review_packet: input.operator_review_packet,
    aggregate_budget_projection: input.aggregate_budget_projection,
    blocked_actions: input.blocked_actions,
    next_allowed_outputs: [...AUTOHUNT_HANDOFF_PLAN_PREVIEW_NEXT_ALLOWED_OUTPUTS],
    forbidden_outputs: [...AUTOHUNT_HANDOFF_PLAN_PREVIEW_FORBIDDEN_OUTPUTS],
    authority_boundary: input.authority_boundary,
    persisted_material_boundary: input.persisted_material_boundary,
    validation: {
      ...validation,
      handoff_plan_fingerprint: null,
    },
    row_count_write_summary: rowCountWriteSummary,
    idempotency_key: idempotencyKey,
  };
  const handoffPlanFingerprint =
    computeAutohuntHandoffPlanPreviewFingerprint(planWithoutFingerprint);

  return {
    ...planWithoutFingerprint,
    validation: {
      ...validation,
      handoff_plan_fingerprint: handoffPlanFingerprint,
    },
    handoff_plan_fingerprint: computeAutohuntHandoffPlanPreviewFingerprint({
      ...planWithoutFingerprint,
      validation: {
        ...validation,
        handoff_plan_fingerprint: handoffPlanFingerprint,
      },
    }),
  };
}

function insertHandoffPlanPreview(
  db: AutonomyDelegationGrantDbLike,
  handoffPlan: AutohuntHandoffPlanPreview,
) {
  db.prepare(
    `
      INSERT INTO autohunt_handoff_plan_previews (
        handoff_plan_id,
        created_at,
        scope,
        handoff_plan_status,
        source_grant_id,
        source_grant_fingerprint,
        source_grant_status,
        source_grant_mode,
        source_preflight_packet_id,
        source_preflight_packet_fingerprint,
        source_workbench_spine_fingerprint,
        selected_candidate_ids_json,
        selected_candidate_fingerprints_json,
        idempotency_key,
        selected_candidate_plan_summaries_json,
        supervised_codex_prompt_plan_json,
        draft_pr_plan_json,
        operator_review_packet_json,
        aggregate_budget_projection_json,
        blocked_actions_json,
        next_allowed_outputs_json,
        forbidden_outputs_json,
        authority_boundary_json,
        persisted_material_boundary_json,
        validation_json,
        row_count_write_summary_json,
        handoff_plan_fingerprint
      )
      VALUES (
        @handoff_plan_id,
        @created_at,
        @scope,
        @handoff_plan_status,
        @source_grant_id,
        @source_grant_fingerprint,
        @source_grant_status,
        @source_grant_mode,
        @source_preflight_packet_id,
        @source_preflight_packet_fingerprint,
        @source_workbench_spine_fingerprint,
        @selected_candidate_ids_json,
        @selected_candidate_fingerprints_json,
        @idempotency_key,
        @selected_candidate_plan_summaries_json,
        @supervised_codex_prompt_plan_json,
        @draft_pr_plan_json,
        @operator_review_packet_json,
        @aggregate_budget_projection_json,
        @blocked_actions_json,
        @next_allowed_outputs_json,
        @forbidden_outputs_json,
        @authority_boundary_json,
        @persisted_material_boundary_json,
        @validation_json,
        @row_count_write_summary_json,
        @handoff_plan_fingerprint
      )
    `,
  ).run({
    handoff_plan_id: handoffPlan.handoff_plan_id,
    created_at: handoffPlan.created_at,
    scope: handoffPlan.scope,
    handoff_plan_status: handoffPlan.handoff_plan_status,
    source_grant_id: handoffPlan.source_grant.grant_id,
    source_grant_fingerprint: handoffPlan.source_grant.grant_fingerprint,
    source_grant_status: handoffPlan.source_grant.grant_status,
    source_grant_mode: handoffPlan.source_grant.grant_mode,
    source_preflight_packet_id:
      handoffPlan.source_preflight.preflight_packet_id,
    source_preflight_packet_fingerprint:
      handoffPlan.source_preflight.preflight_packet_fingerprint,
    source_workbench_spine_fingerprint:
      handoffPlan.source_workbench_spine.spine_fingerprint,
    selected_candidate_ids_json: stableJson(
      handoffPlan.source_preflight.selected_candidate_ids,
    ),
    selected_candidate_fingerprints_json: stableJson(
      handoffPlan.source_preflight.selected_candidate_fingerprints,
    ),
    idempotency_key: handoffPlan.idempotency_key,
    selected_candidate_plan_summaries_json: stableJson(
      handoffPlan.selected_candidate_plan_summaries,
    ),
    supervised_codex_prompt_plan_json: stableJson(
      handoffPlan.supervised_codex_prompt_plan,
    ),
    draft_pr_plan_json: stableJson(handoffPlan.draft_pr_plan),
    operator_review_packet_json: stableJson(
      handoffPlan.operator_review_packet,
    ),
    aggregate_budget_projection_json: stableJson(
      handoffPlan.aggregate_budget_projection,
    ),
    blocked_actions_json: stableJson(handoffPlan.blocked_actions),
    next_allowed_outputs_json: stableJson(handoffPlan.next_allowed_outputs),
    forbidden_outputs_json: stableJson(handoffPlan.forbidden_outputs),
    authority_boundary_json: stableJson(handoffPlan.authority_boundary),
    persisted_material_boundary_json: stableJson(
      handoffPlan.persisted_material_boundary,
    ),
    validation_json: stableJson(handoffPlan.validation),
    row_count_write_summary_json: stableJson(
      handoffPlan.row_count_write_summary,
    ),
    handoff_plan_fingerprint: handoffPlan.handoff_plan_fingerprint,
  });
}

type NormalizedAutohuntHandoffPlanPreviewInput = Omit<
  AutohuntHandoffPlanPreview,
  | "handoff_plan_kind"
  | "handoff_plan_version"
  | "handoff_plan_id"
  | "created_at"
  | "handoff_plan_status"
  | "next_allowed_outputs"
  | "forbidden_outputs"
  | "validation"
  | "row_count_write_summary"
  | "idempotency_key"
  | "handoff_plan_fingerprint"
> & {
  source_packet: AutohuntPreflightPacket;
  source_spine: AutohuntWorkbenchReadbackSpine;
};

function normalizeHandoffPlanInput({
  input,
  sourcePreflight,
  sourceWorkbenchSpine,
}: {
  input: AutohuntHandoffPlanPreviewInput;
  sourcePreflight: AutohuntPreflightPacket;
  sourceWorkbenchSpine: AutohuntWorkbenchReadbackSpine;
}): NormalizedAutohuntHandoffPlanPreviewInput {
  const selectedCandidateSummaries = sourcePreflight.selected_candidates.map(
    summarizeSelectedCandidate,
  );
  const requiredChecks = uniqueStrings(sourcePreflight.required_checks);
  const selectedSourceRefs = uniqueStrings([
    ...(input.selected_source_refs ?? []),
    ...sourcePreflight.selected_candidates.flatMap(
      (candidate) => candidate.source_refs,
    ),
  ]);
  const selectedSourceFingerprints = uniqueStrings([
    sourcePreflight.preflight_packet_fingerprint,
    sourceWorkbenchSpine.spine_fingerprint,
    ...sourcePreflight.selected_candidates.flatMap(
      (candidate) => candidate.source_fingerprints,
    ),
    ...sourcePreflight.source_queue_readback.selected_candidate_fingerprints,
  ]);
  const requiredContextRefs = uniqueStrings([
    ...(input.required_context_refs ?? []),
    `autohunt_preflight_packet:${sourcePreflight.preflight_packet_id}`,
    `autohunt_workbench_readback_spine:${stripFingerprintPrefix(
      sourceWorkbenchSpine.spine_fingerprint,
    )}`,
  ]);
  const promptPlan = buildSupervisedPromptPlan({
    input,
    sourcePreflight,
    sourceWorkbenchSpine,
    requiredContextRefs,
    selectedSourceRefs,
    selectedSourceFingerprints,
    requiredChecks,
  });
  const draftPrPlan = buildDraftPrPlan({
    input,
    sourcePreflight,
    selectedCandidateSummaries,
    requiredChecks,
  });
  const operatorReviewPacket = buildOperatorReviewPacket({
    sourcePreflight,
    sourceWorkbenchSpine,
  });

  return {
    scope: input.scope,
    source_grant: {
      grant_id: sourcePreflight.source_grant.grant_id,
      grant_fingerprint: sourcePreflight.source_grant.grant_fingerprint,
      grant_status: sourcePreflight.source_grant.grant_status,
      grant_mode: sourcePreflight.source_grant.grant_mode,
    },
    source_preflight: {
      preflight_packet_id: sourcePreflight.preflight_packet_id,
      preflight_packet_fingerprint: sourcePreflight.preflight_packet_fingerprint,
      preflight_status: sourcePreflight.preflight_status,
      selected_candidate_ids:
        sourcePreflight.source_queue_readback.selected_candidate_ids,
      selected_candidate_fingerprints:
        sourcePreflight.source_queue_readback.selected_candidate_fingerprints,
    },
    source_workbench_spine: {
      spine_fingerprint: sourceWorkbenchSpine.spine_fingerprint,
      spine_status: sourceWorkbenchSpine.spine_status,
      chain_binding_summary: sourceWorkbenchSpine.chain_binding,
    },
    selected_candidate_plan_summaries: selectedCandidateSummaries,
    supervised_codex_prompt_plan: promptPlan,
    draft_pr_plan: draftPrPlan,
    operator_review_packet: operatorReviewPacket,
    aggregate_budget_projection: sourcePreflight.aggregate_budget_projection,
    blocked_actions: normalizeBlockedActions(input.blocked_actions),
    authority_boundary: buildAutohuntHandoffPlanPreviewAuthorityBoundary(),
    persisted_material_boundary: createPersistedMaterialBoundary(),
    source_packet: sourcePreflight,
    source_spine: sourceWorkbenchSpine,
  };
}

function summarizeSelectedCandidate(
  candidate: AutohuntPreflightPacketSelectedCandidateSummary,
): AutohuntHandoffPlanPreviewCandidateSummary {
  return {
    candidate_id: candidate.candidate_id,
    candidate_fingerprint: candidate.candidate_fingerprint,
    candidate_origin: candidate.candidate_origin,
    work_class: candidate.work_class,
    title_summary_fingerprint: candidate.title_summary_fingerprint,
    proposed_files_or_globs: uniqueStrings(candidate.proposed_files_or_globs),
    expected_outputs: uniqueStrings(candidate.expected_outputs),
    required_checks: uniqueStrings(candidate.required_checks),
    budget_projection: {
      estimated_iterations: normalizeInteger(
        candidate.budget_projection.estimated_iterations,
      ),
      estimated_tool_calls: normalizeInteger(
        candidate.budget_projection.estimated_tool_calls,
      ),
      estimated_codex_tasks: normalizeInteger(
        candidate.budget_projection.estimated_codex_tasks,
      ),
      estimated_file_changes: normalizeInteger(
        candidate.budget_projection.estimated_file_changes,
      ),
      estimated_draft_prs: normalizeInteger(
        candidate.budget_projection.estimated_draft_prs,
      ),
    },
  };
}

function buildSupervisedPromptPlan({
  input,
  sourcePreflight,
  sourceWorkbenchSpine,
  requiredContextRefs,
  selectedSourceRefs,
  selectedSourceFingerprints,
  requiredChecks,
}: {
  input: AutohuntHandoffPlanPreviewInput;
  sourcePreflight: AutohuntPreflightPacket;
  sourceWorkbenchSpine: AutohuntWorkbenchReadbackSpine;
  requiredContextRefs: string[];
  selectedSourceRefs: string[];
  selectedSourceFingerprints: string[];
  requiredChecks: string[];
}): AutohuntHandoffPlanPreviewSupervisedPromptPlan {
  const promptTitle =
    input.handoff_title?.trim() ||
    "Supervised Autohunt handoff plan preview";
  const promptGoalSummary =
    input.handoff_goal_summary?.trim() ||
    "Prepare a supervised implementation plan from a ready Autohunt preflight packet without executing work.";
  const implementationConstraints = uniqueStrings([
    ...(input.implementation_constraints ?? []),
    "no runner",
    "no scheduler",
    "no daemon",
    "no background work",
    "no Codex execution",
    "no GitHub automation",
    "no branch or PR creation",
    "no provider or source or retrieval call",
    "no Perspective, memory, CWP, work, proof, evidence, product, or delivery mutation",
  ]);
  const acceptanceCriteria = uniqueStrings([
    ...(input.acceptance_criteria ?? []),
    "handoff plan remains preview-only",
    "source preflight and Workbench spine bindings remain verified",
    "operator approval is required before any execution, branch, PR, merge, or external call",
    "authority boundary flags remain false",
  ]);
  const expectedResultReportSections = uniqueStrings([
    ...(input.expected_result_report_sections ?? []),
    "Summary",
    "Requirement progress",
    "Checks run",
    "Authority boundary statement",
    "Non-goals preserved",
    "Remaining risks",
  ]);
  const promptPlanId = `autohunt-prompt-plan:${stripFingerprintPrefix(
    fingerprint({
      source_preflight_packet_fingerprint:
        sourcePreflight.preflight_packet_fingerprint,
      source_workbench_spine_fingerprint: sourceWorkbenchSpine.spine_fingerprint,
      selected_candidate_fingerprints:
        sourcePreflight.source_queue_readback.selected_candidate_fingerprints,
      prompt_title: promptTitle,
      prompt_goal_summary: promptGoalSummary,
    }),
  )}`;
  const promptPlanMaterial = {
    prompt_plan_id: promptPlanId,
    prompt_title: promptTitle,
    prompt_goal_summary: promptGoalSummary,
    required_context_refs: requiredContextRefs,
    selected_source_refs: selectedSourceRefs,
    selected_source_fingerprints: selectedSourceFingerprints,
    implementation_constraints: implementationConstraints,
    acceptance_criteria: acceptanceCriteria,
    required_checks: requiredChecks,
    expected_result_report_sections: expectedResultReportSections,
    raw_prompt_text_persisted: false as const,
  };

  return {
    ...promptPlanMaterial,
    prompt_text_fingerprint: fingerprint(promptPlanMaterial),
  };
}

function buildDraftPrPlan({
  input,
  sourcePreflight,
  selectedCandidateSummaries,
  requiredChecks,
}: {
  input: AutohuntHandoffPlanPreviewInput;
  sourcePreflight: AutohuntPreflightPacket;
  selectedCandidateSummaries: AutohuntHandoffPlanPreviewCandidateSummary[];
  requiredChecks: string[];
}): AutohuntHandoffPlanPreviewDraftPrPlan {
  const expectedChangedFileGlobs = uniqueStrings(
    selectedCandidateSummaries.flatMap(
      (candidate) => candidate.proposed_files_or_globs,
    ),
  );
  return {
    branch_name_preview: `codex/autohunt-preview-${stripFingerprintPrefix(
      sourcePreflight.preflight_packet_fingerprint,
    ).slice(0, 12)}`,
    pr_title_preview: "Supervised Autohunt handoff plan preview",
    pr_body_sections: uniqueStrings([
      ...(input.pr_body_sections ?? []),
      "Summary",
      "Requirement progress",
      "Checks run",
      "Authority boundary statement",
      "Non-goals preserved",
      "Remaining risks",
      "Next recommended follow-up",
    ]),
    expected_changed_file_globs: expectedChangedFileGlobs,
    max_changed_files:
      sourcePreflight.aggregate_budget_projection.estimated_file_changes,
    checks_to_run: requiredChecks,
    reviewer_focus: uniqueStrings([
      ...(input.reviewer_focus ?? []),
      "source chain validation",
      "preview-only authority boundary",
      "raw material absence",
      "required checks and budget projection",
    ]),
    raw_pr_body_persisted: false,
  };
}

function buildOperatorReviewPacket({
  sourcePreflight,
  sourceWorkbenchSpine,
}: {
  sourcePreflight: AutohuntPreflightPacket;
  sourceWorkbenchSpine: AutohuntWorkbenchReadbackSpine;
}): AutohuntHandoffPlanPreviewOperatorReviewPacket {
  return {
    review_packet_id: `autohunt-operator-review:${stripFingerprintPrefix(
      fingerprint({
        preflight_packet_fingerprint:
          sourcePreflight.preflight_packet_fingerprint,
        spine_fingerprint: sourceWorkbenchSpine.spine_fingerprint,
        selected_candidate_fingerprints:
          sourcePreflight.source_queue_readback.selected_candidate_fingerprints,
      }),
    )}`,
    review_status: "requires_explicit_operator_approval",
    review_questions: [
      "Do the selected candidate summaries match the intended supervised work scope?",
      "Are the required checks sufficient before any future execution authority is requested?",
      "Should any file glob, budget, or source-chain blocker stop future handoff?",
    ],
    approval_required_before_execution: true,
    approval_required_before_branch_or_pr: true,
    approval_required_before_merge: true,
    approval_required_before_external_call: true,
    raw_operator_note_persisted: false,
  };
}

function buildHandoffPlanValidation(
  input: NormalizedAutohuntHandoffPlanPreviewInput,
): AutohuntHandoffPlanPreviewValidation {
  const preflightReady =
    input.source_packet.preflight_status ===
    "ready_for_supervised_handoff_planning";
  const preflightFingerprintVerified =
    input.source_packet.preflight_packet_fingerprint ===
    computeAutohuntPreflightPacketFingerprint(input.source_packet);
  const workbenchSpineReady =
    input.source_spine.spine_status ===
    "ready_for_supervised_handoff_planning";
  const workbenchSpineFingerprintVerified =
    input.source_spine.spine_fingerprint ===
    computeWorkbenchSpineFingerprint(input.source_spine);
  const chainBindingPassed =
    input.source_spine.chain_binding.grant_to_candidates_bound &&
    input.source_spine.chain_binding.candidates_to_preflight_bound &&
    input.source_spine.chain_binding.grant_fingerprint_matches &&
    input.source_spine.chain_binding.candidate_fingerprints_match;
  const selectedCandidateBindingVerified = validateSourceBindingPairs([
    {
      field: "selected_candidate_ids",
      expected: stableJson(input.source_packet.source_queue_readback.selected_candidate_ids),
      actual: stableJson(input.source_spine.chain_binding.selected_candidate_ids),
      reason: "selected_candidate_ids_mismatch",
    },
    {
      field: "selected_candidate_fingerprints",
      expected: stableJson(
        input.source_packet.source_queue_readback.selected_candidate_fingerprints,
      ),
      actual: stableJson(
        input.source_spine.chain_binding.selected_candidate_fingerprints,
      ),
      reason: "selected_candidate_fingerprints_mismatch",
    },
  ]).passed;
  const sourceGrantBindingVerified = validateSourceBindingPairs([
    {
      field: "source_grant_id",
      expected: input.source_packet.source_grant.grant_id,
      actual: input.source_spine.latest_active_grant_summary.grant_id,
      reason: "source_grant_id_mismatch",
    },
    {
      field: "source_grant_fingerprint",
      expected: input.source_packet.source_grant.grant_fingerprint,
      actual: input.source_spine.latest_active_grant_summary.grant_fingerprint,
      reason: "source_grant_fingerprint_mismatch",
    },
  ]).passed;
  const aggregateBudgetMatchesPreflight =
    stableJson(input.aggregate_budget_projection) ===
    stableJson(input.source_packet.aggregate_budget_projection);
  const requiredChecksPresent =
    input.source_packet.required_checks.length > 0 &&
    input.source_packet.selected_candidates.every(
      (candidate) => candidate.required_checks.length > 0,
    );
  const requiredBlockedActionsPresent =
    validateRequiredBlockedActions(input.blocked_actions).length === 0;
  const authorityBoundaryAllFalse = assertAllFalseBoundary(
    input.authority_boundary,
    "autohunt_handoff_plan_preview_authority_boundary",
  ).passed;
  const persistedMaterialBoundarySafe =
    input.persisted_material_boundary.persists_source_fingerprints === true &&
    input.persisted_material_boundary.persists_handoff_plan_policy === true &&
    input.persisted_material_boundary.persists_raw_prompt_text === false &&
    input.persisted_material_boundary.persists_raw_pr_body === false &&
    input.persisted_material_boundary.persists_raw_operator_note === false &&
    input.persisted_material_boundary.persists_raw_source_payload === false &&
    input.persisted_material_boundary.persists_secret_or_token === false &&
    input.persisted_material_boundary.persists_url_or_env_value === false &&
    input.supervised_codex_prompt_plan.raw_prompt_text_persisted === false &&
    input.draft_pr_plan.raw_pr_body_persisted === false &&
    input.operator_review_packet.raw_operator_note_persisted === false;
  const rawMaterialAbsent = true;
  const passed =
    preflightReady &&
    preflightFingerprintVerified &&
    workbenchSpineReady &&
    workbenchSpineFingerprintVerified &&
    chainBindingPassed &&
    selectedCandidateBindingVerified &&
    sourceGrantBindingVerified &&
    aggregateBudgetMatchesPreflight &&
    requiredChecksPresent &&
    requiredBlockedActionsPresent &&
    authorityBoundaryAllFalse &&
    persistedMaterialBoundarySafe &&
    rawMaterialAbsent;

  return {
    passed,
    fingerprint_algorithm: FINGERPRINT_ALGORITHM,
    preflight_ready: preflightReady,
    preflight_fingerprint_verified: preflightFingerprintVerified,
    workbench_spine_ready: workbenchSpineReady,
    workbench_spine_fingerprint_verified: workbenchSpineFingerprintVerified,
    chain_binding_passed: chainBindingPassed,
    selected_candidate_binding_verified: selectedCandidateBindingVerified,
    source_grant_binding_verified: sourceGrantBindingVerified,
    aggregate_budget_matches_preflight: aggregateBudgetMatchesPreflight,
    required_checks_present: requiredChecksPresent,
    required_blocked_actions_present: requiredBlockedActionsPresent,
    authority_boundary_all_false: authorityBoundaryAllFalse,
    persisted_material_boundary_safe: persistedMaterialBoundarySafe,
    raw_material_absent: rawMaterialAbsent,
    target_only_write_proven: true,
    handoff_plan_fingerprint: null,
  };
}

function refusalReasonsFromValidation(
  validation: AutohuntHandoffPlanPreviewValidation,
) {
  return [
    !validation.preflight_ready ? "preflight_not_ready" : null,
    !validation.preflight_fingerprint_verified
      ? "preflight_fingerprint_mismatch"
      : null,
    !validation.workbench_spine_ready ? "workbench_spine_not_ready" : null,
    !validation.workbench_spine_fingerprint_verified
      ? "workbench_spine_fingerprint_mismatch"
      : null,
    !validation.chain_binding_passed ? "source_chain_mismatch" : null,
    !validation.selected_candidate_binding_verified
      ? "selected_candidate_binding_mismatch"
      : null,
    !validation.source_grant_binding_verified
      ? "source_grant_binding_mismatch"
      : null,
    !validation.aggregate_budget_matches_preflight
      ? "aggregate_budget_mismatch"
      : null,
    !validation.required_checks_present ? "required_checks_missing" : null,
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

function validateSourcePreflight(packet: AutohuntPreflightPacket) {
  const refusalReasons: string[] = [];
  if (packet.preflight_status !== "ready_for_supervised_handoff_planning") {
    refusalReasons.push("preflight_not_ready");
  }
  if (
    packet.preflight_packet_fingerprint !==
    computeAutohuntPreflightPacketFingerprint(packet)
  ) {
    refusalReasons.push("preflight_fingerprint_mismatch");
  }
  if (packet.validation?.passed !== true) {
    refusalReasons.push("preflight_validation_not_passed");
  }
  if (!Array.isArray(packet.required_checks) || packet.required_checks.length === 0) {
    refusalReasons.push("required_checks_missing");
  }
  const required = requiredStringFieldsPresent(
    {
      source_grant_id: packet.source_grant.grant_id,
      source_grant_fingerprint: packet.source_grant.grant_fingerprint,
      preflight_packet_id: packet.preflight_packet_id,
      preflight_packet_fingerprint: packet.preflight_packet_fingerprint,
    },
    [
      "source_grant_id",
      "source_grant_fingerprint",
      "preflight_packet_id",
      "preflight_packet_fingerprint",
    ],
  );
  for (const field of required.missing_fields) {
    refusalReasons.push(`${field}_missing`);
  }
  return refusalReasons;
}

function validateSourceWorkbenchSpine(spine: AutohuntWorkbenchReadbackSpine) {
  const refusalReasons: string[] = [];
  if (spine.spine_status !== "ready_for_supervised_handoff_planning") {
    refusalReasons.push("workbench_spine_not_ready");
  }
  if (spine.spine_fingerprint !== computeWorkbenchSpineFingerprint(spine)) {
    refusalReasons.push("workbench_spine_fingerprint_mismatch");
  }
  const chainBindingPassed =
    spine.chain_binding.grant_to_candidates_bound &&
    spine.chain_binding.candidates_to_preflight_bound &&
    spine.chain_binding.grant_fingerprint_matches &&
    spine.chain_binding.candidate_fingerprints_match;
  if (!chainBindingPassed) {
    refusalReasons.push("source_chain_mismatch");
  }
  const boundaryCheck = assertAllFalseBoundary(
    spine.authority_boundary,
    "autohunt_workbench_readback_spine_authority_boundary",
  );
  if (!boundaryCheck.passed) {
    refusalReasons.push("workbench_spine_authority_boundary_not_all_false");
  }
  if (spine.raw_material_persisted !== false) {
    refusalReasons.push("workbench_spine_raw_material_persisted");
  }
  return refusalReasons;
}

function validateRequiredBlockedActions(blockedActionsInput?: readonly string[]) {
  const blockedActions = normalizeStringArray(
    blockedActionsInput ?? AUTOHUNT_HANDOFF_PLAN_PREVIEW_BLOCKED_ACTIONS,
  );
  return AUTOHUNT_HANDOFF_PLAN_PREVIEW_BLOCKED_ACTIONS.filter(
    (action) => !blockedActions.includes(action),
  ).map((action) => `blocked_action_missing_${action}`);
}

function computeIdempotencyKey({
  input,
  promptPlanFingerprint,
  draftPrPlanFingerprint,
}: {
  input: NormalizedAutohuntHandoffPlanPreviewInput;
  promptPlanFingerprint: string;
  draftPrPlanFingerprint: string;
}) {
  return buildDeterministicIdempotencyKey({
    kind: AUTOHUNT_HANDOFF_PLAN_PREVIEW_KIND,
    version: AUTOHUNT_HANDOFF_PLAN_PREVIEW_VERSION,
    source: {
      source_preflight_packet_fingerprint:
        input.source_preflight.preflight_packet_fingerprint,
      source_workbench_spine_fingerprint:
        input.source_workbench_spine.spine_fingerprint,
      selected_candidate_fingerprints:
        input.source_preflight.selected_candidate_fingerprints,
      prompt_plan_fingerprint: promptPlanFingerprint,
      draft_pr_plan_preview_fingerprint: draftPrPlanFingerprint,
    },
  });
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
}): AutohuntHandoffPlanPreviewRowCountWriteSummary {
  const writeSummary = summarizeTargetOnlyRowCountWrite({
    targetTable: AUTOHUNT_HANDOFF_PLAN_PREVIEW_TABLE,
    tableNames: TARGET_AND_NON_TARGET_TABLES,
    beforeCounts,
    afterCounts,
  });
  return {
    target_table_name: AUTOHUNT_HANDOFF_PLAN_PREVIEW_TABLE,
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
  summary: AutohuntHandoffPlanPreviewRowCountWriteSummary,
) {
  return (
    summary.target_table_name === AUTOHUNT_HANDOFF_PLAN_PREVIEW_TABLE &&
    isTargetOnlyRowCountWrite(summary)
  );
}

function createAcceptedResult({
  result_status,
  handoff_plan,
  handoff_plan_record_written,
  duplicate_replayed,
}: {
  result_status: "written" | "duplicate_replayed";
  handoff_plan: AutohuntHandoffPlanPreview;
  handoff_plan_record_written: boolean;
  duplicate_replayed: boolean;
}): AutohuntHandoffPlanPreviewWriteResult {
  return {
    ok: true,
    result_status,
    refusal_reasons: [],
    handoff_plan,
    duplicate_replayed,
    handoff_plan_record_written,
    row_count_write_summary: handoff_plan.row_count_write_summary,
    ...createNoRunAuthorityFlags(),
    raw_material_persisted: false,
  };
}

function createRefusedResult(
  refusalReasons: string[],
): AutohuntHandoffPlanPreviewWriteResult {
  return {
    ok: false,
    result_status: "refused",
    refusal_reasons: [...new Set(refusalReasons)],
    handoff_plan: null,
    duplicate_replayed: false,
    handoff_plan_record_written: false,
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

function validateRawMaterialBoundary(input: AutohuntHandoffPlanPreviewInput) {
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

function extractSourcePreflight(
  source: AutohuntHandoffPlanPreviewInput["source_preflight"],
): AutohuntPreflightPacket | null {
  if (!source || typeof source !== "object") return null;
  if (
    "preflight_packet_kind" in source &&
    source.preflight_packet_kind === "autohunt_preflight_packet"
  ) {
    return source as AutohuntPreflightPacket;
  }
  if (
    "selected_preflight_packet" in source ||
    "latest_ready_preflight_packet" in source
  ) {
    const readback = source as AutohuntPreflightPacketReadback;
    if (
      readback.selected_preflight_packet?.preflight_status ===
      "ready_for_supervised_handoff_planning"
    ) {
      return readback.selected_preflight_packet;
    }
    return readback.latest_ready_preflight_packet ?? null;
  }
  return null;
}

function computeWorkbenchSpineFingerprint(
  spine: AutohuntWorkbenchReadbackSpine,
) {
  const { spine_fingerprint: _spineFingerprint, ...fingerprintSource } = spine;
  return fingerprint(fingerprintSource);
}

function createPersistedMaterialBoundary(): AutohuntHandoffPlanPreviewPersistedMaterialBoundary {
  return {
    persists_source_fingerprints: true,
    persists_handoff_plan_policy: true,
    persists_raw_prompt_text: false,
    persists_raw_pr_body: false,
    persists_raw_operator_note: false,
    persists_raw_source_payload: false,
    persists_secret_or_token: false,
    persists_url_or_env_value: false,
  };
}

function normalizeBlockedActions(
  blockedActionsInput?: readonly string[],
): AutohuntHandoffPlanPreviewBlockedAction[] {
  return normalizeStringArray(
    blockedActionsInput ?? AUTOHUNT_HANDOFF_PLAN_PREVIEW_BLOCKED_ACTIONS,
  ) as AutohuntHandoffPlanPreviewBlockedAction[];
}

function normalizeStringArray(values: readonly string[] | undefined) {
  return [
    ...new Set((values ?? []).map((value) => value.trim()).filter(Boolean)),
  ].sort();
}

function uniqueStrings(values: readonly string[]) {
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
