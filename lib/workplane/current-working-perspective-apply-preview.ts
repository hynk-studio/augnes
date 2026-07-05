import { createHash } from "node:crypto";

import {
  isCandidateIngressPublicSafeRefV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import {
  CURRENT_WORKING_PERSPECTIVE_VERSION,
  type CurrentWorkingPerspective,
  type CurrentWorkingPerspectiveGapSeverity,
} from "@/types/current-working-perspective";
import {
  CURRENT_WORKING_PERSPECTIVE_APPLY_PREVIEW_VERSION,
  type CurrentWorkingPerspectiveApplyAuthorityBoundary,
  type CurrentWorkingPerspectiveApplyPatchApplicationSummary,
  type CurrentWorkingPerspectiveApplyPreview,
  type CurrentWorkingPerspectiveApplyPreviewInput,
  type CurrentWorkingPerspectiveApplyPreviewStatus,
  type CurrentWorkingPerspectiveApplyReadiness,
  type CurrentWorkingPerspectiveApplyRecommendedNextAction,
} from "@/types/current-working-perspective-apply-preview";
import { CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_RECORD_REVIEW_VERSION } from "@/types/current-working-perspective-update-contract-record-review";
import {
  CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_RECORD_VERSION,
  CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_SCOPE,
  type CurrentWorkingPerspectiveUpdateContractRecord,
} from "@/types/current-working-perspective-update-contract-write";
import type { CurrentWorkingPerspectivePatchEntry } from "@/types/current-working-perspective-update-contract-preview";

const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z" as const;
const CWP_APPLY_SCOPE = "project:augnes" as const;

export function buildCurrentWorkingPerspectiveApplyPreviewV01({
  current_working_perspective_update_contract_record_review,
  current_working_perspective_update_contract_record,
  current_working_perspective_read,
  current_working_perspective,
  requested_operator_ref,
  requested_idempotency_key,
  review_confirmation_ref,
  scope,
  as_of,
  source_refs,
}: CurrentWorkingPerspectiveApplyPreviewInput = {}): CurrentWorkingPerspectiveApplyPreview {
  const cwpSource = resolveCurrentWorkingPerspectiveSource({
    current_working_perspective_read,
    current_working_perspective,
  });
  const cwp = cwpSource.currentWorkingPerspective;
  const review = isContractRecordReview(
    current_working_perspective_update_contract_record_review,
  )
    ? current_working_perspective_update_contract_record_review
    : null;
  const explicitRecord = isUpdateContractRecord(
    current_working_perspective_update_contract_record,
  )
    ? current_working_perspective_update_contract_record
    : null;
  const selectedRecord =
    explicitRecord ??
    selectContractRecordFromReview(review) ??
    null;
  const patchEntries = selectedRecord?.proposed_patch_entries ?? [];
  const currentCwpRef = cwp ? currentWorkingPerspectiveRef(cwp) : null;
  const requestedSourceRefs = uniqueCandidateIngressStringsV01(
    source_refs ?? [],
  );
  const sourceRefs = uniqueCandidateIngressStringsV01([
    ...requestedSourceRefs,
    ...safeStringArray(review?.source_refs),
    ...safeStringArray(selectedRecord?.source_refs),
    ...safeStringArray(cwp?.current_frame?.source_refs),
    ...safeStringArray(cwp?.current_thesis?.source_refs),
  ]);
  const evidenceRefs = uniqueCandidateIngressStringsV01([
    ...safeStringArray(review?.evidence_summary?.evidence_refs),
    ...safeStringArray(selectedRecord?.evidence_refs),
    ...patchEntries.flatMap((entry) => safeStringArray(entry.evidence_refs)),
  ]);
  const refsToValidate = [
    ...sourceRefs,
    ...evidenceRefs,
    ...(selectedRecord?.record_id ? [selectedRecord.record_id] : []),
    ...(selectedRecord?.record_fingerprint
      ? [selectedRecord.record_fingerprint]
      : []),
    ...(currentCwpRef ? [currentCwpRef] : []),
    ...(requested_operator_ref ? [requested_operator_ref] : []),
    ...(requested_idempotency_key ? [requested_idempotency_key] : []),
    ...(review_confirmation_ref ? [review_confirmation_ref] : []),
  ];
  const unsafeRefs = uniqueCandidateIngressStringsV01(
    refsToValidate.filter((ref) => !isCandidateIngressPublicSafeRefV01(ref)),
  );
  const applied =
    cwp && selectedRecord && patchEntries.length > 0
      ? applyPatchesToCurrentWorkingPerspective({
          cwp,
          patchEntries,
          asOf: as_of ?? cwp.as_of ?? FALLBACK_AS_OF,
          contractRecordId: selectedRecord.record_id,
          sourceRefs,
        })
      : null;
  const appliedSnapshotRef =
    applied && selectedRecord
      ? `current-working-perspective-applied-snapshot:${hashText(
          `${selectedRecord.record_id}:${selectedRecord.record_fingerprint}:${applied.as_of}:${JSON.stringify(
            patchEntries.map((entry) => entry.patch_ref),
          )}`,
        ).slice(0, 24)}`
      : null;
  const patchApplicationSummary = buildPatchApplicationSummary({
    patchEntries,
    currentCwpRef,
    selectedRecord,
  });
  const blockingReasons = uniqueCandidateIngressStringsV01([
    ...(isSupplied(current_working_perspective_update_contract_record_review) &&
    !review
      ? ["current_working_perspective_update_contract_record_review_malformed"]
      : []),
    ...(review?.review_status === "records_invalid"
      ? ["current_working_perspective_update_contract_record_review_invalid"]
      : []),
    ...(review?.evidence_summary?.has_receipt_side_effect_problem === true
      ? [
          "current_working_perspective_update_contract_record_receipt_side_effect_problem",
        ]
      : []),
    ...(review?.review_status === "selected_record_missing"
      ? ["selected_current_working_perspective_update_contract_record_missing"]
      : []),
    ...(isSupplied(current_working_perspective_update_contract_record) &&
    !explicitRecord
      ? ["current_working_perspective_update_contract_record_malformed"]
      : []),
    ...(cwpSource.malformed
      ? ["current_working_perspective_material_malformed"]
      : []),
    ...(cwp && cwp.perspective_version !== CURRENT_WORKING_PERSPECTIVE_VERSION
      ? ["current_working_perspective_version_invalid"]
      : []),
    ...(cwp && cwp.scope !== CWP_APPLY_SCOPE
      ? ["current_working_perspective_scope_invalid"]
      : []),
    ...(cwp && !hasReadOnlyCurrentWorkingPerspectiveAuthority(cwp)
      ? ["current_working_perspective_authority_boundary_invalid"]
      : []),
    ...(cwpSource.sourceStatus === "fixture_fallback"
      ? ["current_working_perspective_fixture_fallback_not_writable"]
      : []),
    ...(cwpSource.sourceStatus === "empty_fallback"
      ? ["current_working_perspective_empty_fallback_not_writable"]
      : []),
  ]);
  const missingEvidence = uniqueCandidateIngressStringsV01([
    ...(requestedSourceRefs.length === 0 ? ["source_refs_missing"] : []),
    ...(evidenceRefs.length === 0 ? ["evidence_refs_missing"] : []),
    ...safeStringArray(review?.evidence_summary?.missing_evidence),
  ]);
  const refusalReasons = uniqueCandidateIngressStringsV01([
    ...(unsafeRefs.length > 0
      ? ["current_working_perspective_apply_refs_unsafe"]
      : []),
  ]);
  const insufficientData = uniqueCandidateIngressStringsV01([
    ...(!review
      ? ["current_working_perspective_update_contract_record_review_missing"]
      : []),
    ...(!selectedRecord
      ? ["current_working_perspective_update_contract_record_missing"]
      : []),
    ...(!cwp ? ["current_working_perspective_material_missing"] : []),
    ...(patchEntries.length === 0
      ? ["current_working_perspective_apply_patch_entries_missing"]
      : []),
    ...(!requested_operator_ref ? ["operator_ref_missing"] : []),
    ...(!requested_idempotency_key ? ["idempotency_key_missing"] : []),
    ...(!review_confirmation_ref ? ["review_confirmation_ref_missing"] : []),
  ]);
  const applyReadiness = buildReadiness({
    blockingReasons,
    missingEvidence,
    refusalReasons,
    insufficientData,
  });
  const status = determineStatus({
    hasCurrentMaterial: Boolean(cwp),
    hasContractRecord: Boolean(selectedRecord),
    applyReadiness,
    blockingReasons,
    missingEvidence,
    refusalReasons,
    insufficientData,
  });

  return {
    preview_version: CURRENT_WORKING_PERSPECTIVE_APPLY_PREVIEW_VERSION,
    scope: scope ?? cwp?.scope ?? CWP_APPLY_SCOPE,
    as_of: as_of ?? cwp?.as_of ?? FALLBACK_AS_OF,
    source_refs: sourceRefs,
    apply_preview_status: status,
    recommended_next_action: determineRecommendedNextAction(status),
    input_summary: {
      has_current_working_perspective_update_contract_record_review:
        Boolean(review),
      has_current_working_perspective_update_contract_record:
        Boolean(selectedRecord),
      has_current_working_perspective_material: Boolean(cwp),
      current_working_perspective_source_status: cwpSource.sourceStatus,
      selected_contract_record_id: selectedRecord?.record_id ?? null,
      proposed_patch_entry_count: patchEntries.length,
      applied_patch_count: patchEntries.length,
      blocker_count: blockingReasons.length,
      missing_evidence_count: missingEvidence.length,
      refusal_reason_count: refusalReasons.length,
      insufficient_data_reason_count: insufficientData.length,
      review_confirmation_supplied: Boolean(review_confirmation_ref),
      requested_idempotency_key_supplied: Boolean(requested_idempotency_key),
      requested_operator_ref_supplied: Boolean(requested_operator_ref),
    },
    source_status: {
      current_working_perspective_update_contract_record_review:
        sourceStatusForReview(
          current_working_perspective_update_contract_record_review,
          review,
        ),
      current_working_perspective_update_contract_record: selectedRecord
        ? "supplied"
        : review?.review_status === "selected_record_missing"
          ? "selected_missing"
          : isSupplied(current_working_perspective_update_contract_record)
            ? "invalid"
            : "missing",
      current_working_perspective: cwpSource.status,
      review_confirmation_ref: review_confirmation_ref
        ? safeRef(review_confirmation_ref)
          ? "supplied"
          : "unsafe"
        : "missing",
      requested_idempotency_key: requested_idempotency_key
        ? safeRef(requested_idempotency_key)
          ? "supplied"
          : "unsafe"
        : "missing",
      requested_operator_ref: requested_operator_ref
        ? safeRef(requested_operator_ref)
          ? "supplied"
          : "unsafe"
        : "missing",
    },
    apply_readiness: applyReadiness,
    approval_requirements: [
      "review_valid_current_working_perspective_update_contract_record",
      "approve_only_scoped_local_current_working_perspective_apply_record_write",
      "confirm_applied_snapshot_is_local_and_not_route_replacement",
      "confirm_no_upstream_cwp_source_table_relay_handoff_memory_metric_or_external_mutation",
    ],
    blocking_reasons: blockingReasons,
    missing_evidence: missingEvidence,
    refusal_reasons: refusalReasons,
    evidence_summary: {
      has_valid_contract_record: Boolean(selectedRecord),
      has_valid_current_working_perspective_material: Boolean(cwp),
      has_source_refs: sourceRefs.length > 0,
      has_evidence_refs: evidenceRefs.length > 0,
      has_review_confirmation: Boolean(review_confirmation_ref),
      has_idempotency_key: Boolean(requested_idempotency_key),
      has_operator_ref: Boolean(requested_operator_ref),
      has_missing_evidence: missingEvidence.length > 0,
      has_refusal_reasons: refusalReasons.length > 0,
      has_unsafe_refs: unsafeRefs.length > 0,
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      missing_evidence: missingEvidence,
      unsafe_refs: unsafeRefs,
    },
    source_contract_summary: {
      record_id: selectedRecord?.record_id ?? null,
      record_fingerprint: selectedRecord?.record_fingerprint ?? null,
      proposed_patch_entry_count: patchEntries.length,
      source_current_working_perspective_ref:
        selectedRecord?.source_current_working_perspective_ref ?? null,
    },
    current_working_perspective_before_summary: summarizeCwp(
      cwp,
      currentCwpRef,
      cwpSource.sourceStatus,
    ),
    proposed_applied_current_working_perspective_summary: {
      ...summarizeCwp(applied, currentCwpRef, "local_applied_preview"),
      applied_snapshot_ref: appliedSnapshotRef,
      source_contract_record_ref: selectedRecord?.record_id ?? null,
      gap_count: applied?.gaps?.length ?? 0,
    },
    proposed_applied_current_working_perspective: applied,
    proposed_patch_application_summary: patchApplicationSummary,
    would_write_current_working_perspective_apply_record_preview: {
      proposed_record_kind: "current_working_perspective_apply_record.v0.1",
      proposed_receipt_kind: "current_working_perspective_apply_receipt.v0.1",
      proposed_store_kind: "current_working_perspective_apply_store.v0.1",
      proposed_applied_snapshot_kind:
        "current_working_perspective_applied_snapshot.v0.1",
      source_current_working_perspective_ref: currentCwpRef,
      source_current_working_perspective_update_contract_record_ref:
        selectedRecord?.record_id ?? null,
      source_current_working_perspective_update_contract_record_fingerprint:
        selectedRecord?.record_fingerprint ?? null,
      applied_snapshot_ref: appliedSnapshotRef,
      applied_current_working_perspective: applied,
      patch_application_summary: patchApplicationSummary,
      applied_patch_refs: patchEntries.map((entry) => entry.patch_ref),
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      requested_operator_ref: requested_operator_ref ?? null,
      requested_idempotency_key: requested_idempotency_key ?? null,
      review_confirmation_ref: review_confirmation_ref ?? null,
      review_summary:
        "Would write only a scoped local CurrentWorkingPerspective apply record, receipt, and applied snapshot.",
    },
    operator_review_checklist: [
      "confirm_contract_record_review_is_valid",
      "confirm_current_working_perspective_basis_is_runtime_or_explicit_material",
      "confirm_patch_application_preserves_existing_gaps_and_source_refs",
      "confirm_writer_does_not_replace_api_perspective_current",
      "confirm_handoff_memory_relay_and_external_systems_remain_untouched",
    ],
    would_not_write: [
      "does_not_write_from_preview",
      "does_not_mutate_upstream_current_working_perspective_source_tables",
      "does_not_replace_api_perspective_current_response",
      "does_not_write_perspective_unit_next_work_bias_or_continuity_relay",
      "does_not_apply_live_relay_state_handoff_or_memory",
      "does_not_write_metrics_or_upstream_ledgers",
      "does_not_call_provider_github_or_codex",
    ],
    non_goals: [
      "upstream_cwp_source_table_mutation",
      "api_perspective_current_route_replacement",
      "perspective_unit_write",
      "next_work_bias_write",
      "continuity_relay_write_or_update",
      "live_relay_apply",
      "handoff_context_apply_or_send",
      "memory_write",
      "global_metric_update",
      "external_action",
    ],
    authority_boundary: createCurrentWorkingPerspectiveApplyAuthorityBoundaryV01(),
  };
}

export function createCurrentWorkingPerspectiveApplyAuthorityBoundaryV01():
  CurrentWorkingPerspectiveApplyAuthorityBoundary {
  return {
    read_only: true,
    advisory_only: true,
    apply_preview_only: true,
    source_of_truth: false,
    derived_read_model: true,
    can_write_db: false,
    can_create_current_working_perspective_apply_record: false,
    can_create_applied_current_working_perspective_snapshot: false,
    can_update_current_working_perspective: false,
    can_mutate_current_working_perspective: false,
    can_write_current_working_perspective_live_state: false,
    can_apply_current_working_perspective_update: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_write_continuity_relay: false,
    can_update_continuity_relay: false,
    can_apply_live_relay_state: false,
    can_mutate_handoff_context: false,
    can_apply_handoff_context: false,
    can_write_selected_refs_to_live_handoff: false,
    can_send_handoff: false,
    can_write_memory: false,
    can_mutate_memory: false,
    can_promote_memory: false,
    can_update_global_dogfood_metrics: false,
    can_write_dogfood_metrics: false,
    can_write_dogfood_metric_snapshot: false,
    can_write_reuse_outcome_ledger: false,
    can_write_expected_observed_delta: false,
    can_write_work_episode: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_execute_codex: false,
    can_create_pr: false,
    can_merge_pr: false,
    can_run_autonomous_action: false,
    can_create_graph_or_vector_store: false,
    can_create_rag_stack: false,
    can_crawl_or_observe_browser: false,
    can_render_workbench_action_button: false,
    notes: [
      "Read-only apply preview for a future scoped local CWP apply record write.",
      "The preview applies contract patches only in memory and cannot write DB, replace /api/perspective/current, mutate upstream CWP source tables, relay, handoff, memory, metrics, or external systems.",
    ],
  };
}

function applyPatchesToCurrentWorkingPerspective({
  cwp,
  patchEntries,
  asOf,
  contractRecordId,
  sourceRefs,
}: {
  cwp: CurrentWorkingPerspective;
  patchEntries: CurrentWorkingPerspectivePatchEntry[];
  asOf: string;
  contractRecordId: string;
  sourceRefs: string[];
}): CurrentWorkingPerspective {
  const applied = cloneCwp(cwp);
  applied.as_of = asOf;
  applied.current_frame = {
    ...applied.current_frame,
    source_refs: uniqueCandidateIngressStringsV01([
      ...applied.current_frame.source_refs,
      ...sourceRefs,
      contractRecordId,
    ]),
    non_authority_notes: [
      ...applied.current_frame.non_authority_notes,
      ...patchEntries
        .filter((entry) =>
          ["current_frame", "continuity_relay_alignment"].includes(
            entry.patch_target,
          ),
        )
        .map((entry) => `Local applied contract note: ${entry.summary}`),
    ],
  };
  applied.current_thesis = {
    ...applied.current_thesis,
    supporting_points: uniqueCandidateIngressStringsV01([
      ...applied.current_thesis.supporting_points,
      ...patchEntries
        .filter((entry) => entry.patch_target === "current_thesis")
        .map((entry) => entry.summary),
    ]),
    source_refs: uniqueCandidateIngressStringsV01([
      ...applied.current_thesis.source_refs,
      ...sourceRefs,
      contractRecordId,
    ]),
    confidence:
      applied.current_thesis.confidence === "unknown"
        ? "partial"
        : applied.current_thesis.confidence,
    non_authority_notes: [
      ...applied.current_thesis.non_authority_notes,
      "Local applied snapshot remains non-source-of-truth.",
    ],
  };
  for (const entry of patchEntries) {
    const refs = uniqueCandidateIngressStringsV01([
      ...entry.source_refs,
      ...entry.source_record_refs,
      contractRecordId,
    ]);
    const severity = severityForPressure(entry.review_pressure);
    if (entry.patch_target === "active_goals") {
      applied.active_goals.push({
        goal_id: stableId("local-applied-goal", entry.patch_ref),
        title: compactTitle(entry.summary),
        status: "candidate_from_local_applied_contract",
        priority: entry.review_pressure,
        summary: entry.summary,
        next_action: "review_local_applied_current_working_perspective_snapshot",
        source_refs: refs,
        user_attention_required: entry.review_pressure === "high",
      });
    }
    if (entry.patch_target === "accepted_assumptions") {
      applied.accepted_assumptions.push({
        assumption_id: stableId("local-applied-assumption", entry.patch_ref),
        assumption_kind: "projection_boundary",
        summary: entry.summary,
        source_refs: refs,
        durability: "projection_metadata",
        non_authority_notes: [
          "Added only inside a scoped local applied CWP snapshot.",
        ],
      });
    }
    if (entry.patch_target === "rejected_assumptions") {
      applied.rejected_assumptions.push({
        assumption_id: stableId("local-applied-rejected", entry.patch_ref),
        assumption_kind: "delta_rejected",
        summary: entry.summary,
        source_refs: refs,
        durability: "projection_metadata",
        non_authority_notes: [
          "Rejected/deprioritized only inside a scoped local applied CWP snapshot.",
        ],
      });
    }
    if (entry.patch_target === "open_questions") {
      applied.open_questions.push({
        question_id: stableId("local-applied-question", entry.patch_ref),
        summary: entry.summary,
        severity,
        source_refs: refs,
        suggested_review_path:
          "review_current_working_perspective_apply_record_before_any_live_route_integration",
      });
    }
    if (entry.patch_target === "active_risks") {
      applied.active_risks.push({
        risk_id: stableId("local-applied-risk", entry.patch_ref),
        summary: entry.summary,
        severity,
        source_refs: refs,
        blocked_authority_notes: [
          "Local applied snapshot does not apply handoff, relay, memory, metrics, or upstream CWP source mutations.",
        ],
      });
    }
    if (entry.patch_target === "next_candidates") {
      applied.next_candidates.push({
        candidate_id: stableId("local-applied-next", entry.patch_ref),
        title: compactTitle(entry.summary),
        rationale: entry.summary,
        priority: entry.review_pressure,
        source_refs: refs,
        allowed_next_steps: [
          "review_applied_current_working_perspective_snapshot",
          "prepare_handoff_context_update_contract",
          "prepare_current_working_perspective_route_integration_contract",
        ],
        blocked_next_steps: [
          "do_not_mutate_upstream_current_working_perspective_source_tables",
          "do_not_replace_api_perspective_current_without_separate_contract",
          "do_not_apply_handoff_or_memory_from_this_slice",
        ],
        authority_required: "future_contract",
      });
    }
    if (entry.patch_target === "review_queue_hints") {
      applied.review_queue_hints.validation_required_delta_ids =
        uniqueCandidateIngressStringsV01([
          ...applied.review_queue_hints.validation_required_delta_ids,
          entry.patch_ref,
        ]);
      applied.review_queue_hints.notes.push(
        `Local applied review hint: ${entry.summary}`,
      );
    }
    if (entry.patch_target === "staleness_and_gaps") {
      applied.gaps.push({
        code: stableId("local-applied-gap", entry.patch_ref),
        severity,
        summary: entry.summary,
        source_refs: refs,
      });
      applied.staleness = {
        ...applied.staleness,
        status:
          applied.staleness.status === "fresh"
            ? "partial"
            : applied.staleness.status,
        freshness_notes: [
          ...applied.staleness.freshness_notes,
          `Local applied gap preserved or added: ${entry.summary}`,
        ],
      };
    }
    if (entry.patch_target === "continuity_relay_alignment") {
      applied.next_phase_notes.push(
        `Local continuity relay alignment from ${entry.patch_ref}: ${entry.summary}`,
      );
    }
  }
  applied.source_refs = {
    ...applied.source_refs,
    project_constellation_refs: uniqueCandidateIngressStringsV01([
      ...applied.source_refs.project_constellation_refs,
      contractRecordId,
      ...sourceRefs,
    ]),
  };
  applied.next_phase_notes = uniqueCandidateIngressStringsV01([
    ...applied.next_phase_notes,
    "Applied local CWP snapshot derived from an approved update contract record.",
    "This snapshot does not mutate upstream CWP source tables, replace /api/perspective/current, apply handoff, promote memory, or apply live relay state.",
  ]);
  return applied;
}

function buildPatchApplicationSummary({
  patchEntries,
  currentCwpRef,
  selectedRecord,
}: {
  patchEntries: CurrentWorkingPerspectivePatchEntry[];
  currentCwpRef: string | null;
  selectedRecord: CurrentWorkingPerspectiveUpdateContractRecord | null;
}): CurrentWorkingPerspectiveApplyPatchApplicationSummary {
  return {
    applied_patch_count: patchEntries.length,
    applied_patch_refs: patchEntries.map((entry) => entry.patch_ref),
    patch_target_counts: countBy(patchEntries, "patch_target"),
    patch_operation_counts: countBy(patchEntries, "patch_operation"),
    preserved_existing_cwp_ref: currentCwpRef,
    source_contract_record_ref: selectedRecord?.record_id ?? null,
    source_contract_record_fingerprint:
      selectedRecord?.record_fingerprint ?? null,
  };
}

function resolveCurrentWorkingPerspectiveSource({
  current_working_perspective_read,
  current_working_perspective,
}: {
  current_working_perspective_read: unknown;
  current_working_perspective: unknown;
}) {
  if (isRecord(current_working_perspective_read)) {
    const data = isRecord(current_working_perspective_read.data)
      ? current_working_perspective_read.data
      : null;
    const sourceStatus =
      typeof current_working_perspective_read.source_status === "string"
        ? current_working_perspective_read.source_status
        : "malformed";
    if (data) {
      return {
        currentWorkingPerspective: data as CurrentWorkingPerspective,
        sourceStatus: sourceStatus as
          | "runtime"
          | "supplied"
          | "fixture_fallback"
          | "empty_fallback"
          | "missing"
          | "malformed",
        status:
          sourceStatus === "runtime"
            ? "runtime"
            : sourceStatus === "fixture_fallback"
              ? "fixture_fallback"
              : sourceStatus === "empty_fallback"
                ? "empty_fallback"
                : "supplied",
        malformed: false,
      } as const;
    }
    return {
      currentWorkingPerspective: null,
      sourceStatus: "malformed",
      status: "malformed",
      malformed: true,
    } as const;
  }
  if (isCurrentWorkingPerspective(current_working_perspective)) {
    return {
      currentWorkingPerspective: current_working_perspective,
      sourceStatus: "supplied",
      status:
        current_working_perspective.perspective_version !==
        CURRENT_WORKING_PERSPECTIVE_VERSION
          ? "wrong_version"
          : current_working_perspective.scope !== CWP_APPLY_SCOPE
            ? "wrong_scope"
            : "supplied",
      malformed: false,
    } as const;
  }
  if (
    isSupplied(current_working_perspective_read) ||
    isSupplied(current_working_perspective)
  ) {
    return {
      currentWorkingPerspective: null,
      sourceStatus: "malformed",
      status: "malformed",
      malformed: true,
    } as const;
  }
  return {
    currentWorkingPerspective: null,
    sourceStatus: "missing",
    status: "missing",
    malformed: false,
  } as const;
}

function hasReadOnlyCurrentWorkingPerspectiveAuthority(
  cwp: CurrentWorkingPerspective,
): boolean {
  const authority = cwp.authority_boundary;
  return (
    isRecord(authority) &&
    authority.derived_view_only === true &&
    authority.can_write_db === false &&
    authority.can_add_route === false &&
    authority.can_add_ui === false &&
    authority.can_apply_project_perspective === false &&
    authority.can_mutate_memory === false &&
    authority.can_call_github === false &&
    authority.can_call_openai_or_provider === false &&
    authority.can_execute_codex === false &&
    authority.can_create_branch_or_pr === false
  );
}

function buildReadiness({
  blockingReasons,
  missingEvidence,
  refusalReasons,
  insufficientData,
}: {
  blockingReasons: string[];
  missingEvidence: string[];
  refusalReasons: string[];
  insufficientData: string[];
}): CurrentWorkingPerspectiveApplyReadiness {
  const writeReady =
    blockingReasons.length === 0 &&
    missingEvidence.length === 0 &&
    refusalReasons.length === 0 &&
    insufficientData.length === 0;
  return {
    write_ready: writeReady,
    readiness_label: writeReady
      ? "ready_for_scoped_local_current_working_perspective_apply_record"
      : "not_ready_for_current_working_perspective_apply_record",
    requires_current_working_perspective_update_contract_record: true,
    requires_current_working_perspective_material: true,
    requires_review_confirmation: true,
    requires_idempotency_key: true,
    requires_operator_ref: true,
    requires_source_refs: true,
    requires_evidence_refs: true,
    requires_no_blockers: true,
    current_blockers: blockingReasons,
    current_missing_evidence: missingEvidence,
    current_refusal_reasons: refusalReasons,
    current_insufficient_data: insufficientData,
  };
}

function determineStatus({
  hasCurrentMaterial,
  hasContractRecord,
  applyReadiness,
  blockingReasons,
  missingEvidence,
  refusalReasons,
  insufficientData,
}: {
  hasCurrentMaterial: boolean;
  hasContractRecord: boolean;
  applyReadiness: CurrentWorkingPerspectiveApplyReadiness;
  blockingReasons: string[];
  missingEvidence: string[];
  refusalReasons: string[];
  insufficientData: string[];
}): CurrentWorkingPerspectiveApplyPreviewStatus {
  if (!hasContractRecord) {
    return "no_current_working_perspective_update_contract_record";
  }
  if (!hasCurrentMaterial) return "no_current_working_perspective_material";
  if (blockingReasons.length > 0 || refusalReasons.length > 0) return "blocked";
  if (missingEvidence.length > 0) return "needs_more_evidence";
  if (insufficientData.length > 0) return "insufficient_data";
  if (applyReadiness.write_ready) {
    return "ready_for_future_current_working_perspective_apply_record_write";
  }
  return "ready_for_operator_review";
}

function determineRecommendedNextAction(
  status: CurrentWorkingPerspectiveApplyPreviewStatus,
): CurrentWorkingPerspectiveApplyRecommendedNextAction {
  if (status === "no_current_working_perspective_update_contract_record") {
    return "supply_current_working_perspective_update_contract_record";
  }
  if (status === "no_current_working_perspective_material") {
    return "supply_current_working_perspective_material";
  }
  if (status === "blocked" || status === "needs_more_evidence") {
    return "resolve_current_working_perspective_apply_blockers";
  }
  if (
    status === "ready_for_future_current_working_perspective_apply_record_write"
  ) {
    return "write_current_working_perspective_apply_record";
  }
  if (status === "keep_preview_only") return "keep_preview_only";
  return "review_current_working_perspective_apply_preview";
}

function selectContractRecordFromReview(
  review: Record<string, any> | null,
): CurrentWorkingPerspectiveUpdateContractRecord | null {
  if (!review) return null;
  const selectedId =
    typeof review.selected_record_summary?.record_id === "string"
      ? review.selected_record_summary.record_id
      : null;
  const latestId =
    typeof review.latest_record_summary?.record_id === "string"
      ? review.latest_record_summary.record_id
      : null;
  const recordId = selectedId ?? latestId;
  const records = Array.isArray(review.records) ? review.records : [];
  return (
    records.find(
      (record) => isUpdateContractRecord(record) && record.record_id === recordId,
    ) ?? null
  );
}

function sourceStatusForReview(
  suppliedValue: unknown,
  review: Record<string, any> | null,
): "supplied" | "missing" | "invalid" | "malformed" {
  if (!isSupplied(suppliedValue)) return "missing";
  if (!review) return "malformed";
  return review.review_status === "records_invalid" ? "invalid" : "supplied";
}

function isContractRecordReview(value: unknown): value is Record<string, any> {
  return (
    isRecord(value) &&
    value.review_version ===
      CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_RECORD_REVIEW_VERSION &&
    Array.isArray(value.records) &&
    isRecord(value.input_summary) &&
    isRecord(value.evidence_summary)
  );
}

function isUpdateContractRecord(
  value: unknown,
): value is CurrentWorkingPerspectiveUpdateContractRecord {
  return (
    isRecord(value) &&
    value.record_version ===
      CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_RECORD_VERSION &&
    value.scope === CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_SCOPE &&
    typeof value.record_id === "string" &&
    typeof value.record_fingerprint === "string" &&
    Array.isArray(value.proposed_patch_entries)
  );
}

function isCurrentWorkingPerspective(
  value: unknown,
): value is CurrentWorkingPerspective {
  return (
    isRecord(value) &&
    value.perspective_version === CURRENT_WORKING_PERSPECTIVE_VERSION &&
    typeof value.scope === "string" &&
    isRecord(value.current_frame) &&
    isRecord(value.current_thesis) &&
    Array.isArray(value.active_goals) &&
    Array.isArray(value.accepted_assumptions) &&
    Array.isArray(value.rejected_assumptions) &&
    Array.isArray(value.open_questions) &&
    Array.isArray(value.active_risks) &&
    Array.isArray(value.next_candidates) &&
    isRecord(value.review_queue_hints) &&
    isRecord(value.source_refs) &&
    isRecord(value.staleness) &&
    Array.isArray(value.gaps) &&
    isRecord(value.authority_boundary) &&
    Array.isArray(value.next_phase_notes)
  );
}

function summarizeCwp(
  cwp: CurrentWorkingPerspective | null,
  currentCwpRef: string | null,
  sourceStatus: string,
) {
  return {
    current_cwp_ref: currentCwpRef,
    perspective_version: cwp?.perspective_version ?? null,
    scope: cwp?.scope ?? null,
    as_of: cwp?.as_of ?? null,
    source_status: sourceStatus,
    current_frame_summary: cwp?.current_frame?.summary ?? null,
    current_thesis_summary: cwp?.current_thesis?.summary ?? null,
    active_goal_count: cwp?.active_goals?.length ?? 0,
    open_question_count: cwp?.open_questions?.length ?? 0,
    active_risk_count: cwp?.active_risks?.length ?? 0,
    next_candidate_count: cwp?.next_candidates?.length ?? 0,
    staleness_status: cwp?.staleness?.status ?? null,
  };
}

function currentWorkingPerspectiveRef(cwp: CurrentWorkingPerspective): string {
  return `current-working-perspective:${hashText(
    `${cwp.scope}:${cwp.as_of}:${cwp.perspective_version}`,
  ).slice(0, 16)}`;
}

function cloneCwp(cwp: CurrentWorkingPerspective): CurrentWorkingPerspective {
  return JSON.parse(JSON.stringify(cwp)) as CurrentWorkingPerspective;
}

function severityForPressure(
  pressure: CurrentWorkingPerspectivePatchEntry["review_pressure"],
): CurrentWorkingPerspectiveGapSeverity {
  if (pressure === "high") return "high";
  if (pressure === "medium") return "medium";
  return "low";
}

function stableId(prefix: string, seed: string): string {
  return `${prefix}:${hashText(seed).slice(0, 16)}`;
}

function compactTitle(summary: string): string {
  const trimmed = summary.trim();
  if (trimmed.length <= 80) return trimmed;
  return `${trimmed.slice(0, 77)}...`;
}

function safeRef(value: unknown): string | null {
  return isCandidateIngressPublicSafeRefV01(value) ? value : null;
}

function safeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function countBy<T extends Record<string, any>>(
  items: T[],
  field: keyof T & string,
): Record<string, number> {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = typeof item[field] === "string" ? item[field] : "unknown";
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function isSupplied(value: unknown): boolean {
  return value !== undefined && value !== null;
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function hashText(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
